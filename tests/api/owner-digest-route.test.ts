// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { putJson, getJson, resetS3, s3Faults } from './helpers/aws-s3-mock';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }),
}));
const sendEmail = vi.hoisted(() => vi.fn());
vi.mock('@/lib/idempotent-email', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/idempotent-email')>()),
  sendEmail,
}));

import { GET } from '@/app/api/admin/owner-digest/route';
import { EmailNotSentError } from '@/lib/idempotent-email';

const CRON = 'qa-cron-secret-value';
const req = (query = '', headers: Record<string, string> = { authorization: `Bearer ${CRON}` }) =>
  new NextRequest(`https://www.ledgerhound.vip/api/admin/owner-digest${query}`, { headers });
const NOW = new Date('2026-11-12T14:00:00Z'); // 09:00 New York; the digest covers 2026-11-11

function seedReports() {
  const reports = [
    { id: 'QA1', createdAt: '2026-11-11T05:00:00.000Z', status: 'pending', platformType: 'ponzi' },
    { id: 'QA2', createdAt: '2026-11-11T23:30:00.000Z', status: 'verified', platformType: 'phishing' },
    { id: 'QA3', createdAt: '2026-11-12T04:59:59.000Z', status: 'rejected', platformType: 'phishing' },
    { id: 'QA4', createdAt: '2026-11-12T05:00:00.000Z', status: 'pending', platformType: 'other' }, // today: out
  ];
  for (const r of reports) {
    putJson(`scam-database/reports/${r.id}.json`, { ...r, platformName: 'QA Platform', verified: false, blockchainConfirmed: false, trustTier: 1,
      reporterEmail: `${r.id.toLowerCase()}@qa-mail.invalid`, scamAddress: `0xqa${r.id}`, description: `private text ${r.id}` });
  }
}

beforeEach(() => {
  resetS3();
  sendEmail.mockReset();
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  process.env.CRON_SECRET = CRON;
  process.env.ADMIN_PASSWORD = 'qa-admin-password';
  process.env.AWS_S3_BUCKET = 'qa-bucket';
  delete process.env.OWNER_DIGEST_ENABLED;
  delete process.env.OWNER_DIGEST_TO;
});
afterEach(() => {
  vi.useRealTimers();
  delete process.env.OWNER_DIGEST_ENABLED;
  delete process.env.OWNER_DIGEST_TO;
});

const enable = () => { process.env.OWNER_DIGEST_ENABLED = 'true'; process.env.OWNER_DIGEST_TO = 'owner@qa.invalid'; };

describe('GET /api/admin/owner-digest', () => {
  it('requires the cron secret or the admin key', async () => {
    const res = await GET(req('', {}));
    expect(res.status).toBe(401);
  });

  it('is disabled by default: no storage read, no e-mail', async () => {
    seedReports();
    const res = await GET(req());
    expect(await res.json()).toEqual({ status: 'disabled' });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(getJson('scam-database/digests/owner-2026-11-11.json')).toBeNull();
  });

  it('enabled without a recipient is a configuration error, nothing is sent', async () => {
    process.env.OWNER_DIGEST_ENABLED = 'true';
    const res = await GET(req());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ status: 'error', code: 'config' });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('sends the previous New York day once, records it, and does not resend on a repeated run', async () => {
    enable();
    seedReports();
    sendEmail.mockResolvedValue('sent');
    const first = await GET(req());
    const body = await first.json();
    expect(first.status).toBe(200);
    expect(body).toMatchObject({ status: 'sent', day: '2026-11-11', digest: { total: 3, byStatus: { pending: 1, verified: 1, rejected: 1 } } });
    expect(body.digest.byCategory).toEqual({ fake_exchange: 0, pig_butchering: 0, rug_pull: 0, phishing: 2, ponzi: 1, other: 0 });
    const [payload, key] = sendEmail.mock.calls[0];
    expect(key).toMatch(/^owner-digest:2026-11-11:[0-9a-f]{16}$/);
    expect(payload.to).toEqual(['owner@qa.invalid']);
    for (const secret of ['qa1@qa-mail.invalid', '0xqaQA1', 'private text']) expect(`${payload.html}${payload.text}`).not.toContain(secret);
    expect(getJson('scam-database/digests/owner-2026-11-11.json')).toMatchObject({ state: 'delivered', result: 'sent', idempotencyKey: key, email: payload, digest: { total: 3 } });

    const second = await GET(req());
    expect(await second.json()).toMatchObject({ status: 'already-sent', day: '2026-11-11' });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('an unreadable report object fails the run: 503, no e-mail, no record', async () => {
    enable();
    seedReports();
    s3Faults.push((command, input) => (command === 'GetObjectCommand' && String(input.Key).endsWith('QA2.json') ? Object.assign(new Error('SlowDown'), { name: 'SlowDown', $metadata: { httpStatusCode: 503 } }) : null));
    const res = await GET(req());
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'error', code: 'storage_unavailable' });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(getJson('scam-database/digests/owner-2026-11-11.json')).toBeNull();
  });

  it('a failed listing fails the run the same way', async () => {
    enable();
    seedReports();
    s3Faults.push((command) => (command === 'ListObjectsV2Command' ? new Error('InternalError') : null));
    const res = await GET(req());
    expect(res.status).toBe(503);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('a send failure answers 502 and is not marked delivered; the next run resends the frozen e-mail', async () => {
    enable();
    seedReports();
    sendEmail.mockRejectedValueOnce(new EmailNotSentError('mailhub_timeout', 'MailHub request timed out')).mockResolvedValueOnce('sent');
    const failed = await GET(req());
    expect(failed.status).toBe(502);
    expect(await failed.json()).toEqual({ status: 'error', code: 'send_failed', reason: 'mailhub_timeout' });
    expect(getJson('scam-database/digests/owner-2026-11-11.json')).toMatchObject({ state: 'pending' });
    const retry = await GET(req());
    expect(await retry.json()).toMatchObject({ status: 'sent', day: '2026-11-11', resent: true });
    expect(sendEmail.mock.calls[1]).toEqual(sendEmail.mock.calls[0]);
  });

  it('regression (Codex round 3): a retry 15 minutes later sends the identical e-mail to the original recipient, although data and settings changed', async () => {
    enable();
    seedReports();
    sendEmail.mockRejectedValueOnce(new EmailNotSentError('mailhub_network_error', 'down')).mockResolvedValueOnce('sent');
    expect((await GET(req())).status).toBe(502);
    // meanwhile: one more complaint for 2026-11-11, a status change, a different recipient setting
    putJson('scam-database/reports/QA5.json', { id: 'QA5', createdAt: '2026-11-11T15:00:00.000Z', status: 'pending', platformType: 'other', platformName: 'QA Platform',
      verified: false, blockchainConfirmed: false, trustTier: 1 });
    putJson('scam-database/reports/QA1.json', { ...getJson<Record<string, unknown>>('scam-database/reports/QA1.json')!, status: 'rejected' });
    process.env.OWNER_DIGEST_TO = 'changed@qa.invalid';
    vi.setSystemTime(new Date('2026-11-12T14:15:00Z'));
    const retry = await GET(req());
    expect(await retry.json()).toMatchObject({ status: 'sent', resent: true, digest: { total: 3 } });
    const [[firstPayload, firstKey], [secondPayload, secondKey]] = sendEmail.mock.calls;
    expect(secondPayload).toEqual(firstPayload);
    expect(secondPayload.to).toEqual(['owner@qa.invalid']);
    expect(secondKey).toBe(firstKey);
  });

  it('a suppressed recipient or log-only transport answers 502 and records nothing', async () => {
    enable();
    seedReports();
    for (const result of ['suppressed', 'logged']) {
      sendEmail.mockResolvedValueOnce(result);
      const res = await GET(req());
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ status: 'error', code: 'not_delivered', reason: result });
      expect(getJson('scam-database/digests/owner-2026-11-11.json')).toMatchObject({ state: 'pending' });
    }
  });

  it('dryRun returns the counts without sending, even when disabled', async () => {
    seedReports();
    const res = await GET(req('?dryRun=1'));
    expect(await res.json()).toMatchObject({ status: 'dry-run', digest: { total: 3 } });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('zero complaints is a digest of 0, not an error', async () => {
    enable();
    sendEmail.mockResolvedValue('sent');
    const res = await GET(req());
    expect(await res.json()).toMatchObject({ status: 'sent', digest: { total: 0 } });
  });
});

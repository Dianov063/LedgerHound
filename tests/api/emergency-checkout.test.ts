// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getJson, putJson, resetS3, s3Calls, s3Faults, s3Store } from './helpers/aws-s3-mock';
import { createSession, expireSession, resetStripe, stripeSessions } from './helpers/stripe-mock';
import { CASE_ID_RE, createCaseSecret, verifyCaseSecret } from '@/lib/emergency-case-access';
import { POST as checkout } from '@/app/api/emergency/checkout/route';
import { POST as analyze } from '@/app/api/emergency/analyze/route';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('stripe', () => import('./helpers/stripe-mock'));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }),
}));
vi.mock('@/lib/scam-db', () => ({
  getPlatformIndex: async () => [],
  slugify: (s: string) => s.toLowerCase(),
}));


const CASE = 'ER-MGK1Z2AB-0123456789abcdef';
let ownerSecret = '';

function post(handler: (r: NextRequest) => Promise<Response>, body: unknown) {
  return handler(
    new NextRequest('https://www.ledgerhound.vip/api/emergency/x', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

const validBody = (overrides: Record<string, unknown> = {}) => ({
  product: 'emergency_pack',
  caseId: CASE,
  caseSecret: ownerSecret,
  email: 'victim@example.com',
  description: 'victim description',
  ...overrides,
});

beforeEach(() => {
  resetS3();
  resetStripe();
  const owner = createCaseSecret();
  ownerSecret = owner.secret;
  putJson(`emergency-cases/${CASE}.json`, {
    caseId: CASE,
    ownerSecretHash: owner.hash,
    email: 'victim@example.com',
    analysis: { recoveryScore: 80 },
  });
});

const caseBody = () => s3Store.get(`emergency-cases/${CASE}.json`)?.body;

describe('POST /api/emergency/checkout ownership', () => {
  it('rejects a request without the owner secret and leaves the case untouched', async () => {
    const before = caseBody();
    const res = await post(checkout, validBody({ caseSecret: undefined, email: 'attacker@example.com' }));
    expect(res.status).toBe(403);
    expect(caseBody()).toBe(before);
    expect(createSession).not.toHaveBeenCalled();
  });

  it('rejects a wrong owner secret and leaves the case untouched', async () => {
    const before = caseBody();
    const res = await post(checkout, validBody({ caseSecret: createCaseSecret().secret, description: 'tampered' }));
    expect(res.status).toBe(403);
    expect(caseBody()).toBe(before);
  });

  it('rejects legacy timestamp-only case ids outright', async () => {
    const res = await post(checkout, validBody({ caseId: 'ER-MGK1Z2AB' }));
    expect(res.status).toBe(400);
    expect(s3Calls.some((c) => c.command === 'PutObjectCommand')).toBe(false);
  });

  it('does not create a case that analyze never created', async () => {
    const res = await post(checkout, validBody({ caseId: 'ER-MGK1Z2AC-fedcba9876543210' }));
    expect(res.status).toBe(403);
    expect(s3Store.has('emergency-cases/ER-MGK1Z2AC-fedcba9876543210.json')).toBe(false);
  });

  it('refuses to rewrite a case whose pack was already generated (paid)', async () => {
    s3Store.set(`legal-packs/cases/${CASE}/police-complaint.pdf`, { body: '%PDF', modified: new Date(), input: {} });
    const before = caseBody();
    const res = await post(checkout, validBody({ description: 'changed after payment' }));
    expect(res.status).toBe(409);
    expect(caseBody()).toBe(before);
  });

  it('lets the owner check out, keeping analyze data and the owner hash', async () => {
    const res = await post(checkout, validBody());
    expect(res.status).toBe(200);
    const saved = getJson<Record<string, unknown>>(`emergency-cases/${CASE}.json`)!;
    expect(saved.description).toBe('victim description');
    expect(saved.analysis).toEqual({ recoveryScore: 80 });
    expect(verifyCaseSecret(ownerSecret, saved.ownerSecretHash)).toBe(true);
    expect(createSession.mock.calls[0][0].metadata?.caseId).toBe(CASE);
  });

  it('does not leak internal error messages', async () => {
    createSession.mockRejectedValueOnce(new Error('sk_live_secret internal detail'));
    const res = await post(checkout, validBody());
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('internal detail');
  });
});

describe('POST /api/emergency/checkout once the case is paid', () => {
  const recordSession = (id: string, paid: boolean) => {
    stripeSessions.set(id, { id, payment_status: paid ? 'paid' : 'unpaid', metadata: { caseId: CASE } });
    putJson(`emergency-case-sessions/${CASE}/${id}.json`, { sessionId: id });
  };

  it.each(['emergency_pack', 'summary_report'])('refuses to rewrite a paid %s case before any document exists', async (product) => {
    recordSession('cs_test_paid000000001', true);
    const before = caseBody();
    const res = await post(checkout, validBody({ product, description: 'changed after payment' }));
    expect(res.status).toBe(409);
    expect(caseBody()).toBe(before);
    expect(createSession).not.toHaveBeenCalled();
  });

  it('still lets the owner retry while earlier sessions are unpaid, and records every session', async () => {
    recordSession('cs_test_abandoned0001', false);
    const res = await post(checkout, validBody({ description: 'edited before paying' }));
    expect(res.status).toBe(200);
    expect(getJson<Record<string, unknown>>(`emergency-cases/${CASE}.json`)!.description).toBe('edited before paying');
    const created = createSession.mock.results[0].value as Promise<{ id: string }>;
    expect(s3Store.has(`emergency-case-sessions/${CASE}/${(await created).id}.json`)).toBe(true);
  });

  it('does not hand out a payment link it could not record, and expires it', async () => {
    s3Faults.push((cmd, input) => (cmd === 'PutObjectCommand' && String(input.Key).startsWith('emergency-case-sessions/')
      ? new Error('S3 down') : null));
    const res = await post(checkout, validBody());
    expect(res.status).toBe(500);
    expect((await res.json()).url).toBeUndefined();
    expect(expireSession).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/emergency/analyze issues an owner secret', () => {
  it('returns a new-format id plus secret, stores only the hash, never overwrites', async () => {
    const res = await post(analyze, { country: 'US', email: 'victim@example.com', lossAmount: 100 });
    const data = await res.json();
    expect(data.caseId).toMatch(CASE_ID_RE);
    expect(data.caseSecret).toMatch(/^[0-9a-f]{32}$/);
    const stored = getJson<Record<string, unknown>>(`emergency-cases/${data.caseId}.json`)!;
    expect(stored.caseSecret).toBeUndefined();
    expect(JSON.stringify(stored)).not.toContain(data.caseSecret);
    expect(verifyCaseSecret(data.caseSecret, stored.ownerSecretHash)).toBe(true);
    const put = s3Calls.find((c) => c.command === 'PutObjectCommand');
    expect(put?.input.IfNoneMatch).toBe('*');
  });
});

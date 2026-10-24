// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetResend, sentEmails } from '../api/helpers/resend-mock';
import { EmailNotSentError, sendEmail } from '@/lib/idempotent-email';

vi.mock('resend', () => import('../api/helpers/resend-mock'));

const message = {
  from: 'LedgerHound <noreply@ledgerhound.vip>',
  to: 'buyer@example.com',
  subject: 'Report ready',
  html: '<p>Download: https://signed.example/report.pdf</p>',
};

function mailHubResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  resetResend();
  process.env.EMAIL_TRANSPORT = 'mailhub';
  process.env.MAILHUB_API_URL = 'https://mailhub.example';
  process.env.MAILHUB_API_KEY = 'mh_test_secret';
  process.env.MAILHUB_TIMEOUT_MS = '1000';
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.MAILHUB_API_URL;
  delete process.env.MAILHUB_API_KEY;
  delete process.env.MAILHUB_TIMEOUT_MS;
  process.env.EMAIL_TRANSPORT = 'resend';
});

describe('MailHub transport', () => {
  it('maps the payload, key, sender and attachment content to MailHub', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mailHubResponse(202, { id: 'email_1', status: 'QUEUED' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendEmail({
      ...message,
      replyTo: 'contact@ledgerhound.vip',
      attachments: [{ filename: 'instructions.md', content: Buffer.from('# Steps') }],
    }, 'ledgerhound:report:one')).resolves.toBe('sent');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://mailhub.example/api/v1/emails');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer mh_test_secret',
      'Idempotency-Key': 'ledgerhound:report:one',
    });
    expect(JSON.parse(String(init.body))).toMatchObject({
      from: 'noreply@ledgerhound.vip',
      to: ['buyer@example.com'],
      replyTo: 'contact@ledgerhound.vip',
      messageCategory: 'transactional',
      attachments: [{
        filename: 'instructions.md',
        contentType: 'text/markdown',
        content: Buffer.from('# Steps').toString('base64'),
      }],
    });
  });

  it('sends a link-only email when attachments exceed 10 MB', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mailHubResponse(202, { id: 'email_2', status: 'QUEUED' }));
    vi.stubGlobal('fetch', fetchMock);

    await sendEmail({
      ...message,
      attachments: [{ filename: 'large.pdf', content: Buffer.alloc(10 * 1024 * 1024 + 1), contentType: 'application/pdf' }],
    }, 'ledgerhound:report:large');

    const body = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(body.attachments).toBeUndefined();
    expect(body.html).toContain('https://signed.example/report.pdf');
  });

  it('treats a suppressed recipient as terminal without a provider fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mailHubResponse(422, {
      code: 'suppressed_recipient',
      message: 'Recipient is suppressed',
    })));

    await expect(sendEmail(message, 'ledgerhound:report:suppressed')).resolves.toBe('suppressed');
    expect(sentEmails).toHaveLength(0);
  });

  it('rejects a reused key with a different body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mailHubResponse(409, {
      code: 'idempotency_key_conflict',
      message: 'Idempotency-Key was already used with a different request body',
    })));

    await expect(sendEmail(message, 'ledgerhound:report:conflict')).rejects.toMatchObject({
      code: 'idempotency_key_conflict',
    });
    expect(sentEmails).toHaveLength(0);
  });

  it('does not fall back to Resend after a MailHub 5xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mailHubResponse(503, { code: 'temporarily_unavailable' })));

    await expect(sendEmail(message, 'ledgerhound:report:retry')).rejects.toBeInstanceOf(EmailNotSentError);
    expect(sentEmails).toHaveLength(0);
  });

  it('aborts a timed-out MailHub request and does not fall back', async () => {
    process.env.MAILHUB_TIMEOUT_MS = '5';
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    })));

    await expect(sendEmail(message, 'ledgerhound:report:timeout')).rejects.toMatchObject({ code: 'mailhub_timeout' });
    expect(sentEmails).toHaveLength(0);
  });
});

describe('transport selection', () => {
  it('keeps Resend as the default', async () => {
    delete process.env.EMAIL_TRANSPORT;
    await expect(sendEmail(message, 'ledgerhound:report:resend')).resolves.toBe('sent');
    expect(sentEmails).toHaveLength(1);
  });

  it('log mode makes no external request', async () => {
    process.env.EMAIL_TRANSPORT = 'log';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(sendEmail(message, 'ledgerhound:report:log')).resolves.toBe('logged');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sentEmails).toHaveLength(0);
  });
});

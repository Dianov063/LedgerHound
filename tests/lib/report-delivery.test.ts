// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getJson, resetS3, s3Faults, s3Store } from '../api/helpers/aws-s3-mock';
import { resendFailures, resetResend, sentEmails } from '../api/helpers/resend-mock';
import { ReportDeliveryError, createReportCaseId, deliverReport, type DeliverReportInput } from '@/lib/report-delivery';
import { EmailNotSentError, sendEmailOnce } from '@/lib/idempotent-email';
import type { ReportLogEntry } from '@/lib/reports-log';

vi.mock('@aws-sdk/client-s3', () => import('../api/helpers/aws-s3-mock'));
vi.mock('resend', () => import('../api/helpers/resend-mock'));
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: async (_c: unknown, cmd: { input: { Key: string } }) => `https://signed.example/${cmd.input.Key}`,
}));

const LOG = 'logs/reports.json';
const entries = () => getJson<{ reports: ReportLogEntry[] }>(LOG)?.reports ?? [];

function input(over: Partial<DeliverReportInput> = {}): DeliverReportInput {
  return {
    buf: Buffer.from('%PDF-1.7 test'),
    caseId: 'LH-MGK1Z2AB-0123456789abcdef',
    email: 'buyer@example.com',
    walletAddress: '0xbc8996a9a5ff12ebf8702e857cc0faa451dc9569',
    network: 'eth',
    locale: 'en',
    country: '',
    pdfSha256: 'abc',
    stripePaymentId: 'pi_test_0001',
    amount: 4900,
    idempotencyKey: 'ledgerhound:report:pi_test_0001',
    ...over,
  };
}

const failUpload = () => s3Faults.push((cmd, i) => (cmd === 'PutObjectCommand' && String(i.Key).startsWith('reports/') ? new Error('S3 down') : null));
const failLogOnce = () => {
  let failed = false;
  s3Faults.push((cmd, i) => {
    if (failed || cmd !== 'PutObjectCommand' || i.Key !== LOG) return null;
    failed = true;
    return Object.assign(new Error('S3 503'), { $metadata: { httpStatusCode: 503 } });
  });
};

beforeEach(() => {
  resetS3();
  resetResend();
  process.env.EMAIL_TRANSPORT = 'resend';
  process.env.RESEND_API_KEY = 're_test';
  process.env.MAILHUB_API_KEY = 'mh_test';
});

afterEach(() => {
  vi.unstubAllGlobals();
  process.env.EMAIL_TRANSPORT = 'resend';
  delete process.env.MAILHUB_API_URL;
});

describe('deliverReport success criterion', () => {
  it('never reports success when both channels fail, and logs nothing', async () => {
    failUpload();
    resendFailures.push({ name: 'application_error', message: 'down' });
    const err = await deliverReport(input()).catch((e) => e);
    expect(err).toBeInstanceOf(ReportDeliveryError);
    expect(err).toMatchObject({ uploaded: false, emailed: false });
    expect(entries()).toHaveLength(0);
    expect(sentEmails).toHaveLength(0);
  });

  it('a Resend error object (not an exception) counts as not delivered', async () => {
    resendFailures.push({ name: 'validation_error', message: 'Invalid `to` field' });
    const err = await deliverReport(input()).catch((e) => e);
    expect(err).toMatchObject({ uploaded: true, emailed: false });
    expect(entries()).toEqual([expect.objectContaining({ caseId: input().caseId, emailed: false })]);
  });

  it('upload ok but email failed: retry sends once and updates the same log entry', async () => {
    resendFailures.push({ name: 'rate_limit_exceeded', message: 'slow down' });
    await expect(deliverReport(input())).rejects.toBeInstanceOf(ReportDeliveryError);
    await deliverReport(input());
    expect(sentEmails).toHaveLength(1);
    expect(entries()).toHaveLength(1);
    expect(entries()[0].emailed).toBe(true);
  });

  it('storage down: nothing is sent; the retry stores and sends exactly once', async () => {
    failUpload();
    await expect(deliverReport(input())).rejects.toMatchObject({ uploaded: false, emailed: false });
    expect(sentEmails).toHaveLength(0);
    expect(entries()).toHaveLength(0);
    s3Faults.length = 0;
    await deliverReport(input());
    expect(sentEmails).toHaveLength(1);
    expect(s3Store.has(`reports/${input().caseId}.pdf`)).toBe(true);
    expect(entries()).toHaveLength(1);
  });

  it('a retry never replaces the stored PDF, hash or email with a new rendering', async () => {
    resendFailures.push({ name: 'application_error', message: 'down' });
    await expect(deliverReport(input({ buf: Buffer.from('%PDF-FIRST'), pdfSha256: 'sha-first' }))).rejects.toBeInstanceOf(ReportDeliveryError);
    await deliverReport(input({ buf: Buffer.from('%PDF-SECOND'), pdfSha256: 'sha-second' }));
    expect(s3Store.get(`reports/${input().caseId}.pdf`)?.body).toBe('%PDF-FIRST');
    const sent = sentEmails[0] as { attachments: { content: Buffer }[]; html: string };
    expect(sent.attachments[0].content.toString()).toBe('%PDF-FIRST');
    expect(sent.html).toContain('sha-first');
    expect(sent.html).not.toContain('sha-second');
  });

  it('a crash between storing the PDF and freezing keeps that PDF', async () => {
    let failed = false;
    s3Faults.push((cmd, i) => {
      if (failed || cmd !== 'PutObjectCommand' || !String(i.Key).endsWith('.delivery.json')) return null;
      failed = true;
      return new Error('crash');
    });
    await expect(deliverReport(input({ buf: Buffer.from('%PDF-STORED') }))).rejects.toBeInstanceOf(ReportDeliveryError);
    expect(sentEmails).toHaveLength(0);
    await deliverReport(input({ buf: Buffer.from('%PDF-RERENDERED') }));
    expect((sentEmails[0] as { attachments: { content: Buffer }[] }).attachments[0].content.toString()).toBe('%PDF-STORED');
  });

  it('email sent but the result record not saved: the retry neither re-sends nor duplicates the record', async () => {
    failLogOnce();
    await expect(deliverReport(input())).rejects.toThrow('S3 503');
    expect(sentEmails).toHaveLength(1);
    expect(entries()).toHaveLength(0);

    await deliverReport(input());
    expect(sentEmails).toHaveLength(1);
    expect(entries()).toEqual([expect.objectContaining({ caseId: input().caseId, emailed: true })]);
  });

  it('re-running a finished delivery changes nothing visible', async () => {
    await deliverReport(input());
    await deliverReport(input());
    expect(sentEmails).toHaveLength(1);
    expect(entries()).toHaveLength(1);
  });

  it('concurrent deliveries of different reports do not overwrite each other in the log', async () => {
    const a = input();
    const b = input({ caseId: createReportCaseId(), stripePaymentId: 'pi_test_0002', idempotencyKey: 'ledgerhound:report:pi_test_0002' });
    const c = input({ caseId: createReportCaseId(), stripePaymentId: 'pi_test_0003', idempotencyKey: 'ledgerhound:report:pi_test_0003' });
    await Promise.all([deliverReport(a), deliverReport(b), deliverReport(c)]);
    expect(entries().map((e) => e.stripePaymentId).sort()).toEqual(['pi_test_0001', 'pi_test_0002', 'pi_test_0003']);
  });

  it('skipEmail (regeneration tools) sends nothing and succeeds once uploaded', async () => {
    await deliverReport(input({ skipEmail: true }));
    expect(sentEmails).toHaveLength(0);
    expect(entries()[0].emailed).toBe(false);
  });
});

describe('sendEmailOnce', () => {
  const mail = (subject: string) => ({ from: 'a@x.test', to: 'b@x.test', subject, text: 'x' });

  it('treats a reused key with a different body as already sent, without sending', async () => {
    expect(await sendEmailOnce(mail('first'), 'k1')).toBe('sent');
    expect(await sendEmailOnce(mail('regenerated links'), 'k1')).toBe('already-sent');
    expect(sentEmails).toHaveLength(1);
  });

  it('throws on any other Resend error', async () => {
    resendFailures.push({ name: 'invalid_from_address', message: 'bad from' });
    await expect(sendEmailOnce(mail('x'), 'k2')).rejects.toBeInstanceOf(EmailNotSentError);
  });

  it('does not treat a reused key as sent when no key is given', async () => {
    await sendEmailOnce(mail('same'));
    await sendEmailOnce(mail('same'));
    expect(sentEmails).toHaveLength(2);
  });
});

describe('frozen email transport', () => {
  it('keeps a report on Resend when env switches to MailHub before retry', async () => {
    resendFailures.push({ name: 'application_error', message: 'temporary failure' });
    await expect(deliverReport(input())).rejects.toBeInstanceOf(ReportDeliveryError);

    process.env.EMAIL_TRANSPORT = 'mailhub';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await deliverReport(input());

    expect(sentEmails).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getJson<{ email: { transport?: string } }>(`reports/${input().caseId}.delivery.json`)?.email.transport).toBe('resend');
  });

  it('keeps a report on MailHub when env switches to Resend before retry', async () => {
    process.env.EMAIL_TRANSPORT = 'mailhub';
    process.env.MAILHUB_API_URL = 'https://mailhub.example';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'temporarily_unavailable' }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'email_retry', status: 'QUEUED' }), { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(deliverReport(input())).rejects.toBeInstanceOf(ReportDeliveryError);
    process.env.EMAIL_TRANSPORT = 'resend';
    await deliverReport(input());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentEmails).toHaveLength(0);
    expect(getJson<{ email: { transport?: string } }>(`reports/${input().caseId}.delivery.json`)?.email.transport).toBe('mailhub');
  });
});

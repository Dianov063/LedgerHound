// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getJson, putJson, resetS3, s3Faults, s3Store } from './helpers/aws-s3-mock';
import { resetResend, sentEmails } from './helpers/resend-mock';
import { resetStripe } from './helpers/stripe-mock';
import { POST as webhook } from '@/app/api/webhook/route';
import { GET as sweep } from '@/app/api/admin/resume-webhook-jobs/route';
import { GET as health } from '@/app/api/health/route';
import { __resetBackgroundTasksForTests, beginDrain, drainBackgroundTasks, runInBackground } from '@/lib/background-tasks';
import { MAX_ATTEMPTS, RETRY_BACKOFF_MS, STALE_RUNNING_MS, jobFromEvent, type WebhookJob } from '@/lib/webhook-jobs';
import { resumeStaleJobs } from '@/lib/webhook-job-runner';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('stripe', () => import('./helpers/stripe-mock'));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }),
  hasUpstash: false,
}));
const gen = vi.hoisted(() => ({
  report: vi.fn(async (..._args: unknown[]) => ({ caseId: 'LH-TEST', identifiedEntities: [] as unknown[] })),
  pack: vi.fn(async (_input: Record<string, unknown>) => ({ templates: [] as { type: string; label: string; url: string }[] })),
  reports: vi.fn(async () => [] as { stripePaymentId: string; emailed?: boolean }[]),
}));
vi.mock('@/lib/generateReport', () => ({ generateReport: gen.report }));
vi.mock('@/lib/generateEmergencyPack', () => ({ generateEmergencyPack: gen.pack }));
vi.mock('@/lib/reports-log', () => ({ getReports: gen.reports, logReport: vi.fn() }));
vi.mock('resend', () => import('./helpers/resend-mock'));
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: async () => 'https://signed.example/x' }));

const EVENT_ID = 'evt_test_0001';
const PAYMENT = 'pi_test_0001';

function event(id = EVENT_ID, payment = PAYMENT) {
  return {
    id,
    type: 'checkout.session.completed',
    data: { object: {
      id: 'cs_test_session0001',
      payment_intent: payment,
      amount_total: 4900,
      metadata: { email: 'buyer@example.com', walletAddress: '0xabc', network: 'eth' },
      customer_details: { name: 'Buyer' },
    } },
  };
}

function deliver(evt = event()) {
  return webhook(new Request('https://www.ledgerhound.vip/api/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'valid-signature' },
    body: JSON.stringify(evt),
  }));
}

const jobKey = (id = EVENT_ID) => `webhook-jobs/pending/${id}.json`;
const failedKey = (id = EVENT_ID) => `webhook-jobs/failed/${id}.json`;
const locks = () => [`webhook-events/${EVENT_ID}`, `webhook-payment-locks/${PAYMENT}`];

function seedJob(over: Partial<WebhookJob>) {
  const job: WebhookJob = {
    eventId: EVENT_ID,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: 'pending',
    attempts: 0,
    session: {
      id: 'cs_test_session0001', payment_intent: PAYMENT, amount_total: 4900,
      metadata: { email: 'buyer@example.com', walletAddress: '0xabc', network: 'eth' },
      customer_details: { name: 'Buyer' },
    },
    ...over,
  };
  putJson(jobKey(job.eventId), job);
  return job;
}

const REPORT_CASE = 'LH-MGK1Z2AB-0123456789abcdef';
/** What lib/report-delivery.ts writes before the first email of a report. */
function seedFrozenReport(caseId: string, summary: Record<string, unknown> = { identifiedEntities: [], hops: 0, keyFindings: [] }) {
  s3Store.set(`reports/${caseId}.pdf`, { body: '%PDF-FROZEN', bytes: Buffer.from('%PDF-FROZEN'), modified: new Date(), input: { Metadata: { sha256: 'sha' } } });
  putJson(`reports/${caseId}.delivery.json`, {
    caseId, pdfKey: `reports/${caseId}.pdf`, pdfSha256: 'sha', downloadUrl: 'https://signed.example/x', frozenAt: 'earlier',
    email: { payload: { from: 'a@x.test', to: 'buyer@example.com', subject: 'Report', html: '<p>r</p>' }, attachments: [{ filename: 'r.pdf', pdf: true }], idempotencyKey: `ledgerhound:report:${PAYMENT}` },
    log: { walletAddress: '0xabc', email: 'buyer@example.com', network: 'eth', stripePaymentId: PAYMENT, amount: 4900 },
    summary,
  });
}

beforeEach(() => {
  resetS3();
  resetStripe();
  resetResend();
  __resetBackgroundTasksForTests();
  gen.report.mockReset().mockResolvedValue({ caseId: 'LH-TEST', identifiedEntities: [] });
  gen.pack.mockReset().mockResolvedValue({ templates: [] });
  gen.reports.mockReset().mockResolvedValue([]);
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  process.env.CRON_SECRET = 'cron-secret-for-tests';
  for (const k of ['STRIPE_SECRET_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET', 'RESEND_API_KEY', 'ADMIN_PASSWORD']) process.env[k] = 'test';
});

const settle = () => drainBackgroundTasks(5_000);

describe('Stripe webhook outside Vercel', () => {
  it('records the job before claiming, generates once, then removes the job', async () => {
    const res = await deliver();
    expect(res.status).toBe(200);
    expect(s3Store.has(jobKey())).toBe(true); // durable before the response
    for (const k of locks()) expect(s3Store.has(k)).toBe(true);
    await settle();
    expect(gen.report).toHaveBeenCalledTimes(1);
    expect(s3Store.has(jobKey())).toBe(false);
  });

  it('answers 500 and takes no lock when the job record cannot be written', async () => {
    s3Faults.push((cmd, input) => (cmd === 'PutObjectCommand' && String(input.Key).startsWith('webhook-jobs/')
      ? Object.assign(new Error('S3 down'), { $metadata: { httpStatusCode: 503 } }) : null));
    const res = await deliver();
    expect(res.status).toBe(500); // Stripe will redeliver
    for (const k of locks()) expect(s3Store.has(k)).toBe(false);
    expect(gen.report).not.toHaveBeenCalled();
  });

  it('a redelivery of a completed event leaves no orphan job and does not regenerate', async () => {
    await deliver();
    await settle();
    const res = await deliver(); // Stripe redelivers (e.g. our 200 was lost)
    expect(res.status).toBe(200);
    await settle();
    expect(s3Store.has(jobKey())).toBe(false);
    expect(gen.report).toHaveBeenCalledTimes(1);
  });

  it('a different event for an already-claimed payment is dropped', async () => {
    await deliver();
    await settle();
    await deliver(event('evt_test_0002', PAYMENT));
    await settle();
    expect(s3Store.has(jobKey('evt_test_0002'))).toBe(false);
    expect(gen.report).toHaveBeenCalledTimes(1);
  });

  it('a redelivery after a crash before claiming runs the existing job', async () => {
    seedJob({ createdAt: new Date().toISOString() }); // written, never claimed
    const res = await deliver();
    expect(res.status).toBe(200);
    await settle();
    expect(gen.report).toHaveBeenCalledTimes(1);
    expect(s3Store.has(jobKey())).toBe(false);
  });
});

describe('recovery sweep', () => {
  it('requires the cron secret or admin key', async () => {
    const res = await sweep(new Request('https://x/api/admin/resume-webhook-jobs') as never);
    expect(res.status).toBe(401);
  });

  it('resumes a job whose runner died after claiming (locks already written)', async () => {
    for (const k of locks()) putJson(k, { claimedAt: 'earlier' });
    seedJob({ status: 'running', attempts: 1, startedAt: new Date(Date.now() - STALE_RUNNING_MS - 60_000).toISOString() });
    const res = await sweep(new Request('https://x/api/admin/resume-webhook-jobs', {
      headers: { authorization: 'Bearer cron-secret-for-tests' },
    }) as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.resumed).toBe(1);
    expect(gen.report).toHaveBeenCalledTimes(1);
    expect(s3Store.has(jobKey())).toBe(false);
  });

  it('an interrupted run that already froze its report: the frozen report is delivered, not regenerated', async () => {
    seedFrozenReport(REPORT_CASE);
    seedJob({ reportCaseId: REPORT_CASE, status: 'running', attempts: 1, startedAt: new Date(Date.now() - STALE_RUNNING_MS - 60_000).toISOString() });
    const summary = await resumeStaleJobs();
    expect(summary.succeeded).toBe(1);
    expect(gen.report).not.toHaveBeenCalled();
    expect(sentEmails).toHaveLength(1);
    expect((sentEmails[0] as { attachments: { content: Buffer }[] }).attachments[0].content.toString()).toBe('%PDF-FROZEN');
    expect(s3Store.has(jobKey())).toBe(false);
  });

  it('leaves a just-written, unclaimed job alone (its delivery may still be running)', async () => {
    seedJob({ createdAt: new Date().toISOString() });
    const summary = await resumeStaleJobs();
    expect(summary.waiting).toBe(1);
    expect(gen.report).not.toHaveBeenCalled();
  });

  it('resumes a never-started job whose event already owns the payment', async () => {
    putJson(`webhook-payment-locks/${PAYMENT}`, { claimedAt: 'earlier', eventId: EVENT_ID });
    seedJob({});
    const summary = await resumeStaleJobs();
    expect(summary.resumed).toBe(1);
    expect(gen.report).toHaveBeenCalledTimes(1);
  });

  it('removes a never-started job whose payment is owned by a different event', async () => {
    putJson(`webhook-payment-locks/${PAYMENT}`, { claimedAt: 'earlier', eventId: 'evt_other' });
    seedJob({});
    const summary = await resumeStaleJobs();
    expect(summary.duplicates).toBe(1);
    expect(gen.report).not.toHaveBeenCalled();
    expect(s3Store.has(jobKey())).toBe(false);
  });

  it('does not touch a job that is running in this process', async () => {
    let release: () => void = () => {};
    gen.report.mockImplementationOnce(() => new Promise((r) => { release = () => r({ caseId: 'LH', identifiedEntities: [] }); }));
    await deliver();
    // Make the record look stale, as if the sweep ran much later.
    const job = getJson<WebhookJob>(jobKey())!;
    putJson(jobKey(), { ...job, startedAt: new Date(Date.now() - STALE_RUNNING_MS - 60_000).toISOString() });
    const summary = await resumeStaleJobs();
    expect(summary.skippedInFlight).toBe(1);
    release();
    await settle();
    expect(gen.report).toHaveBeenCalledTimes(1);
  });
});

describe('crash between the event lock and the payment lock', () => {
  const eventLock = () => putJson(`webhook-events/${EVENT_ID}`, { claimedAt: 'earlier' });
  const paymentLock = `webhook-payment-locks/${PAYMENT}`;

  it('the Stripe redelivery completes it once', async () => {
    seedJob({ createdAt: new Date().toISOString() });
    eventLock(); // payment lock missing: the first delivery died in between
    const res = await deliver();
    expect(res.status).toBe(200);
    await settle();
    expect(gen.report).toHaveBeenCalledTimes(1);
    expect(s3Store.has(jobKey())).toBe(false);
    expect(s3Store.has(paymentLock)).toBe(true);
  });

  it('without a redelivery, the sweep takes the payment lock and completes it once', async () => {
    seedJob({}); // written an hour ago, never started
    eventLock();
    const summary = await resumeStaleJobs();
    expect(summary.resumed).toBe(1);
    expect(gen.report).toHaveBeenCalledTimes(1);
    expect(getJson<{ by?: string }>(paymentLock)?.by).toBe('recovery-sweep');
    expect(s3Store.has(jobKey())).toBe(false);

    // A late Stripe redelivery afterwards changes nothing.
    expect((await deliver()).status).toBe(200);
    await settle();
    expect(gen.report).toHaveBeenCalledTimes(1);
    expect(s3Store.has(jobKey())).toBe(false);
  });

  it('a sweep and a redelivery racing for it run it exactly once', async () => {
    seedJob({});
    eventLock();
    let release: () => void = () => {};
    gen.report.mockImplementationOnce(() => new Promise((r) => { release = () => r({ caseId: 'LH', identifiedEntities: [] }); }));
    const sweeping = resumeStaleJobs();
    await vi.waitFor(() => expect(gen.report).toHaveBeenCalledTimes(1));
    expect((await deliver()).status).toBe(200); // loses the payment lock
    release();
    await sweeping;
    await settle();
    expect(gen.report).toHaveBeenCalledTimes(1);
  });
});

describe('emergency pack completeness', () => {
  const CASE = 'ER-MGK1Z2AB-0123456789abcdef';
  const DOCS = ['police-complaint', 'regulator-complaint', 'action-guide', 'preservation-letter'];
  const pdf = (doc: string) => `legal-packs/cases/${CASE}/${doc}.pdf`;
  const marker = `legal-packs/cases/${CASE}/complete.json`;
  const packEvent = () => {
    const e = event();
    e.data.object.metadata = { product: 'emergency_pack', email: 'buyer@example.com', caseId: CASE, country: 'US' } as never;
    return e;
  };
  const writeAll = async () => {
    for (const d of DOCS) putJson(pdf(d), { pdf: d });
    return { templates: DOCS.map((type) => ({ type, label: type, url: `https://signed/${type}` })) };
  };
  const staleRunning = () => ({
    status: 'running' as const,
    attempts: 1,
    startedAt: new Date(Date.now() - STALE_RUNNING_MS - 60_000).toISOString(),
    session: { ...jobFromEvent(packEvent()).session },
  });

  it('an interruption after the first PDF keeps the job until every document exists', async () => {
    gen.pack
      .mockImplementationOnce(async () => { putJson(pdf(DOCS[0]), { pdf: DOCS[0] }); throw new Error('renderer crashed'); })
      .mockImplementationOnce(writeAll);
    await deliver(packEvent());
    await settle();
    expect(s3Store.has(pdf(DOCS[0]))).toBe(true);
    expect(s3Store.has(marker)).toBe(false);
    const job = getJson<WebhookJob>(jobKey())!;
    expect(job.attempts).toBe(1); // kept, not deleted

    putJson(jobKey(), { ...job, lastAttemptAt: new Date(Date.now() - RETRY_BACKOFF_MS - 60_000).toISOString() });
    await resumeStaleJobs();
    expect(gen.pack).toHaveBeenCalledTimes(2);
    for (const d of DOCS) expect(s3Store.has(pdf(d))).toBe(true);
    expect(getJson<{ templates: string[] }>(marker)?.templates).toEqual(DOCS);
    expect(s3Store.has(jobKey())).toBe(false);
  });

  it('a stray PDF without the completion marker is not taken for a delivered pack', async () => {
    putJson(pdf(DOCS[0]), { pdf: DOCS[0] });
    gen.pack.mockImplementationOnce(writeAll);
    seedJob(staleRunning());
    await resumeStaleJobs();
    expect(gen.pack).toHaveBeenCalledTimes(1);
    expect(s3Store.has(marker)).toBe(true);
  });

  it('a completed pack is not regenerated', async () => {
    putJson(marker, { completedAt: 'earlier' });
    seedJob(staleRunning());
    await resumeStaleJobs();
    expect(gen.pack).not.toHaveBeenCalled();
    expect(s3Store.has(jobKey())).toBe(false);
  });

  it('passes a per-payment idempotency key, so a retry cannot email twice', async () => {
    gen.pack.mockImplementationOnce(writeAll);
    await deliver(packEvent());
    await settle();
    expect(gen.pack.mock.calls[0][0]).toMatchObject({ idempotencyKey: `ledgerhound:pack:${PAYMENT}` });
  });
});

describe('emergency pack with its mandatory forensic report', () => {
  const CASE = 'ER-MGK1Z2AB-0123456789abcdef';
  const marker = `legal-packs/cases/${CASE}/complete.json`;
  const packWithWallet = () => {
    const e = event();
    e.data.object.metadata = { product: 'emergency_pack', email: 'buyer@example.com', caseId: CASE, country: 'US', walletAddress: '0xabc' } as never;
    return e;
  };
  const summary = {
    riskScore: 77, recoveryScore: 40, recoveryLabel: 'Moderate', hops: 5, keyFindings: ['k'],
    identifiedEntities: [{ type: 'exchange', label: 'Binance', address: '0xb1' }, { type: 'mixer', label: 'Tornado', address: '0xm' }],
  };
  /** Stand-in for generateReport: freezes like the real one, then succeeds. */
  const freezingReport = async (...args: unknown[]) => {
    const opts = args[2] as { caseId: string };
    seedFrozenReport(opts.caseId, summary);
    return { caseId: opts.caseId, identifiedEntities: summary.identifiedEntities, riskScore: 77, recoveryScore: 40, recoveryLabel: 'Moderate', graphData: { nodes: [1, 2, 3, 4, 5] }, keyFindings: ['k'] };
  };
  const backoffPassed = () => {
    const job = getJson<WebhookJob>(jobKey())!;
    putJson(jobKey(), { ...job, lastAttemptAt: new Date(Date.now() - RETRY_BACKOFF_MS - 60_000).toISOString() });
  };

  it('a failed forensic report fails the attempt: no legal documents, no completion, job kept', async () => {
    gen.report.mockRejectedValueOnce(new Error('Report not delivered (uploaded=false, emailed=false)'));
    await deliver(packWithWallet());
    await settle();
    expect(gen.pack).not.toHaveBeenCalled();
    expect(s3Store.has(marker)).toBe(false);
    expect(getJson<WebhookJob>(jobKey())?.lastError).toContain('Report not delivered');
  });

  it('a retry after the pack failed reuses the frozen report and builds the same enrichment', async () => {
    gen.report.mockImplementationOnce(freezingReport);
    gen.pack.mockRejectedValueOnce(new Error('renderer crashed'));
    await deliver(packWithWallet());
    await settle();
    backoffPassed();
    gen.pack.mockResolvedValueOnce({ templates: [{ type: 'police-complaint', label: 'p', url: 'u' }] });
    await resumeStaleJobs();

    expect(gen.report).toHaveBeenCalledTimes(1); // not regenerated on retry
    const [first, second] = gen.pack.mock.calls.map((c) => (c[0] as { enrichment: Record<string, unknown> }).enrichment);
    expect(second).toEqual(first);
    expect(first).toMatchObject({
      riskScore: 77, recoveryScore: 40, hops: 5, mixerDetected: true,
      identifiedExchanges: [{ name: 'Binance', address: '0xb1' }],
    });
    expect(s3Store.has(marker)).toBe(true);
    expect(s3Store.has(jobKey())).toBe(false);
  });
});

describe('payment owner is not the right to run', () => {
  it('a redelivery for a job already running elsewhere does not start a second runner', async () => {
    // Another process acquired the job a minute ago and is still generating.
    putJson(`webhook-payment-locks/${PAYMENT}`, { claimedAt: 'earlier', eventId: EVENT_ID });
    putJson(`webhook-events/${EVENT_ID}`, { claimedAt: 'earlier' });
    seedJob({ status: 'running', attempts: 1, startedAt: new Date(Date.now() - 60_000).toISOString() });
    expect((await deliver()).status).toBe(200);
    await settle();
    expect(gen.report).not.toHaveBeenCalled();
  });

  it('a stale runner that was taken over cannot overwrite the new runner state', async () => {
    let release: (v?: unknown) => void = () => {};
    gen.report.mockImplementationOnce(() => new Promise((_r, reject) => { release = () => reject(new Error('old runner failed late')); }));
    await deliver(); // runner A acquires
    await vi.waitFor(() => expect(gen.report).toHaveBeenCalledTimes(1));
    // A goes silent; much later the sweep takes the job over (runner B).
    const job = getJson<WebhookJob>(jobKey())!;
    putJson(jobKey(), { ...job, startedAt: new Date(Date.now() - STALE_RUNNING_MS - 60_000).toISOString() });
    __resetBackgroundTasksForTests(); // A's process is "gone" for the sweep's in-flight check
    let releaseB: () => void = () => {};
    gen.report.mockImplementationOnce(() => new Promise((r) => { releaseB = () => r({ caseId: 'LH', identifiedEntities: [] }); }));
    const sweeping = resumeStaleJobs();
    await vi.waitFor(() => expect(gen.report).toHaveBeenCalledTimes(2));
    release(); // A finally fails: must not put the job back to pending under B
    await new Promise((r) => setTimeout(r, 20));
    expect(getJson<WebhookJob>(jobKey())?.status).toBe('running');
    releaseB();
    await sweeping;
    expect(s3Store.has(jobKey())).toBe(false);
  });
});

describe('forensic report retries', () => {
  it('reuses one report case id and idempotency key across attempts', async () => {
    gen.report.mockRejectedValueOnce(new Error('Report not delivered (uploaded=true, emailed=false)'));
    await deliver();
    await settle();
    const job = getJson<WebhookJob>(jobKey())!;
    expect(job.reportCaseId).toMatch(/^LH-[0-9A-Z]+-[0-9a-f]{16}$/);
    putJson(jobKey(), { ...job, lastAttemptAt: new Date(Date.now() - RETRY_BACKOFF_MS - 60_000).toISOString() });
    await resumeStaleJobs();
    const [first, second] = gen.report.mock.calls.map((c) => c[2] as { caseId: string; idempotencyKey: string });
    expect(second.caseId).toBe(first.caseId);
    expect(second.idempotencyKey).toBe(`ledgerhound:report:${PAYMENT}`);
    expect(first.caseId).toBe(job.reportCaseId);
  });

  it('a frozen report whose email failed is re-sent from the frozen version on retry', async () => {
    seedFrozenReport(REPORT_CASE);
    const { resendFailures } = await import('./helpers/resend-mock');
    resendFailures.push({ name: 'application_error', message: 'down' });
    seedJob({ reportCaseId: REPORT_CASE, status: 'running', attempts: 1, startedAt: new Date(Date.now() - STALE_RUNNING_MS - 60_000).toISOString() });
    await resumeStaleJobs();
    expect(sentEmails).toHaveLength(0);
    const job = getJson<WebhookJob>(jobKey())!;
    putJson(jobKey(), { ...job, lastAttemptAt: new Date(Date.now() - RETRY_BACKOFF_MS - 60_000).toISOString() });
    await resumeStaleJobs();
    expect(gen.report).not.toHaveBeenCalled();
    expect(sentEmails).toHaveLength(1);
  });
});

describe('shutdown (draining)', () => {
  it('refuses new webhooks with 503 while running work finishes; health reports draining', async () => {
    let release: () => void = () => {};
    gen.report.mockImplementationOnce(() => new Promise((r) => { release = () => r({ caseId: 'LH', identifiedEntities: [] }); }));
    await deliver();
    await vi.waitFor(() => expect(gen.report).toHaveBeenCalledTimes(1));

    beginDrain();
    const before = s3Store.size;
    const late = await deliver(event('evt_test_late', 'pi_test_late'));
    expect(late.status).toBe(503); // Stripe redelivers to the next process
    expect(s3Store.size).toBe(before); // nothing written: no job, no locks
    expect(s3Store.has(jobKey('evt_test_late'))).toBe(false);

    const h = await health();
    expect(h.status).toBe(503);
    expect((await h.json()).status).toBe('draining');

    const sweepRes = await sweep(new Request('https://x/api/admin/resume-webhook-jobs', { headers: { authorization: 'Bearer cron-secret-for-tests' } }) as never);
    expect(sweepRes.status).toBe(503);

    release();
    expect(await drainBackgroundTasks(5_000)).toEqual({ drained: true, remaining: 0 });
    expect(s3Store.has(jobKey())).toBe(false); // the in-flight job still completed
  });
});

describe('failures', () => {
  it('keeps a failed job pending with the error, retries after backoff, then parks it', async () => {
    gen.report.mockRejectedValue(new Error('explorer API timeout'));
    await deliver();
    await settle();
    let job = getJson<WebhookJob>(jobKey())!;
    expect(job.status).toBe('pending');
    expect(job.attempts).toBe(1);
    expect(job.lastError).toContain('explorer API timeout');

    // Too early: backoff not elapsed.
    expect((await resumeStaleJobs()).waiting).toBe(1);

    for (let attempt = 2; attempt <= MAX_ATTEMPTS; attempt++) {
      job = getJson<WebhookJob>(jobKey())!;
      putJson(jobKey(), { ...job, lastAttemptAt: new Date(Date.now() - RETRY_BACKOFF_MS - 60_000).toISOString() });
      await resumeStaleJobs();
    }
    expect(gen.report).toHaveBeenCalledTimes(MAX_ATTEMPTS);
    expect(s3Store.has(jobKey())).toBe(false);
    expect(getJson<WebhookJob>(failedKey())?.lastError).toContain('explorer API timeout');
  });

  it('parks a checkout that can never succeed without retrying it', async () => {
    const evt = event();
    delete (evt.data.object.metadata as Record<string, string>).email;
    await deliver(evt);
    await settle();
    expect(gen.report).not.toHaveBeenCalled();
    expect(s3Store.has(jobKey())).toBe(false);
    expect(s3Store.has(failedKey())).toBe(true);
  });
});

describe('graceful shutdown drain', () => {
  it('waits for in-flight work and reports what is left at the deadline', async () => {
    let finished = false;
    runInBackground(new Promise<void>((r) => setTimeout(() => { finished = true; r(); }, 50)), 'quick');
    expect(await drainBackgroundTasks(2_000)).toEqual({ drained: true, remaining: 0 });
    expect(finished).toBe(true);

    runInBackground(new Promise<void>(() => {}), 'stuck');
    expect(await drainBackgroundTasks(30)).toEqual({ drained: false, remaining: 1 });
  });
});

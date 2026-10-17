// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getJson, putJson, resetS3, s3Faults, s3Store } from './helpers/aws-s3-mock';
import { resetStripe } from './helpers/stripe-mock';
import { POST as webhook } from '@/app/api/webhook/route';
import { GET as sweep } from '@/app/api/admin/resume-webhook-jobs/route';
import { drainBackgroundTasks, runInBackground } from '@/lib/background-tasks';
import { MAX_ATTEMPTS, RETRY_BACKOFF_MS, STALE_RUNNING_MS, type WebhookJob } from '@/lib/webhook-jobs';
import { resumeStaleJobs } from '@/lib/webhook-job-runner';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('stripe', () => import('./helpers/stripe-mock'));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }),
  hasUpstash: false,
}));
const gen = vi.hoisted(() => ({
  report: vi.fn(async () => ({ caseId: 'LH-TEST', identifiedEntities: [] })),
  pack: vi.fn(async () => ({ templates: [] })),
  reports: vi.fn(async () => [] as { stripePaymentId: string }[]),
}));
vi.mock('@/lib/generateReport', () => ({ generateReport: gen.report }));
vi.mock('@/lib/generateEmergencyPack', () => ({ generateEmergencyPack: gen.pack }));
vi.mock('@/lib/reports-log', () => ({ getReports: gen.reports }));

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

beforeEach(() => {
  resetS3();
  resetStripe();
  gen.report.mockReset().mockResolvedValue({ caseId: 'LH-TEST', identifiedEntities: [] });
  gen.pack.mockReset().mockResolvedValue({ templates: [] });
  gen.reports.mockReset().mockResolvedValue([]);
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  process.env.CRON_SECRET = 'cron-secret-for-tests';
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

  it('does not email twice when the interrupted run had already produced the report', async () => {
    gen.reports.mockResolvedValue([{ stripePaymentId: PAYMENT }]);
    seedJob({ status: 'running', attempts: 1, startedAt: new Date(Date.now() - STALE_RUNNING_MS - 60_000).toISOString() });
    const summary = await resumeStaleJobs();
    expect(summary.succeeded).toBe(1);
    expect(gen.report).not.toHaveBeenCalled();
    expect(s3Store.has(jobKey())).toBe(false);
  });

  it('leaves a never-started, unclaimed job to Stripe redelivery', async () => {
    seedJob({}); // attempts 0, created an hour ago, no payment lock
    const summary = await resumeStaleJobs();
    expect(summary.waiting).toBe(1);
    expect(gen.report).not.toHaveBeenCalled();
    expect(s3Store.has(jobKey())).toBe(true);
  });

  it('resumes a never-started job that this deployment did claim', async () => {
    putJson(`webhook-payment-locks/${PAYMENT}`, { claimedAt: 'earlier' });
    seedJob({});
    const summary = await resumeStaleJobs();
    expect(summary.resumed).toBe(1);
    expect(gen.report).toHaveBeenCalledTimes(1);
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

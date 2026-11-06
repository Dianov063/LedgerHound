// @vitest-environment node
/**
 * Package 46: immutable purchase snapshots (F2, F3), manual review, delivery
 * once per payment and order health (F10). Fictitious data only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getJson, putJson, resetS3, s3Calls, s3Faults, s3Store } from './helpers/aws-s3-mock';
import { resetResend, sentEmails } from './helpers/resend-mock';
import { createSession, expireSession, resetStripe, stripeSessions } from './helpers/stripe-mock';
import { seedSnapshot } from './helpers/purchase';
import { createCaseSecret } from '@/lib/emergency-case-access';
import { POST as checkout } from '@/app/api/emergency/checkout/route';
import { POST as webhook } from '@/app/api/webhook/route';
import { GET as health } from '@/app/api/health/route';
import { GET as ordersHealth } from '@/app/api/health/orders/route';
import { GET as parkedList, POST as rerun } from '@/app/api/admin/webhook-jobs/route';
import { GET as sweepRoute } from '@/app/api/admin/resume-webhook-jobs/route';
import { __resetBackgroundTasksForTests, drainBackgroundTasks } from '@/lib/background-tasks';
import { __resetOrderHealthCacheForTests, readOrderHealth } from '@/lib/order-health';
import { sendEmailOnce } from '@/lib/idempotent-email';
import {
  EXPIRE_MS, MAX_ATTEMPTS, RETRY_BACKOFF_MS, STALE_RUNNING_MS,
  acquireJob, classifyJob, isAcquirable, jobFromEvent, requeueParkedJob, type WebhookJob,
} from '@/lib/webhook-jobs';
import { resumeStaleJobs } from '@/lib/webhook-job-runner';
import { logOrders } from '@/scripts/cron-runner.mjs';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('stripe', () => import('./helpers/stripe-mock'));
vi.mock('resend', () => import('./helpers/resend-mock'));
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: async () => 'https://signed.example/x' }));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }),
  hasUpstash: false,
}));
const gen = vi.hoisted(() => ({
  report: vi.fn(),
  pack: vi.fn(),
}));
vi.mock('@/lib/generateReport', () => ({ generateReport: gen.report }));
vi.mock('@/lib/generateEmergencyPack', () => ({ generateEmergencyPack: gen.pack }));
vi.mock('@/lib/reports-log', () => ({ getReports: async () => [], logReport: vi.fn() }));

const CASE = 'ER-MGK1Z2AB-0123456789abcdef';
const ADMIN = 'admin-key-for-tests';
let ownerSecret = '';

/** Stand-in for the pack generator: emails like the real one (idempotent per payment key). */
async function packThatEmails(input: Record<string, unknown>) {
  await sendEmailOnce(
    { from: 'LedgerHound <noreply@ledgerhound.vip>', to: String(input.email), subject: 'Your Emergency Pack', html: `<p>${input.caseId}</p>` },
    String(input.idempotencyKey),
  );
  return { templates: [{ type: 'police-complaint', label: 'Police', url: 'https://signed.example/p' }] };
}

function postJson(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`https://www.ledgerhound.vip${url}`, {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
}

async function openCheckout(fields: Record<string, unknown> = {}) {
  const res = await checkout(postJson('/api/emergency/checkout', {
    product: 'emergency_pack', caseId: CASE, caseSecret: ownerSecret, email: 'buyer@example.com',
    country: 'US', lossAmount: 2500, description: 'original description', victimWallet: '0xvictimA', ...fields,
  }));
  expect(res.status).toBe(200);
  const id = createSession.mock.results.at(-1)!.value as Promise<{ id: string }>;
  return (await id).id;
}

function paidEvent(sessionId: string, eventId: string, paymentId: string) {
  const s = stripeSessions.get(sessionId)!;
  return {
    id: eventId, type: 'checkout.session.completed',
    data: { object: { id: sessionId, payment_intent: paymentId, amount_total: 7900, metadata: { ...s.metadata }, customer_details: { name: 'Buyer' } } },
  };
}

function deliver(evt: unknown) {
  return webhook(new Request('https://www.ledgerhound.vip/api/webhook', {
    method: 'POST', headers: { 'stripe-signature': 'valid-signature' }, body: JSON.stringify(evt),
  }));
}

const settle = () => drainBackgroundTasks(5_000);
const pendingKey = (id: string) => `webhook-jobs/pending/${id}.json`;
const manualKey = (id: string) => `webhook-jobs/manual-review/${id}.json`;
const failedKey = (id: string) => `webhook-jobs/failed/${id}.json`;
const marker = `legal-packs/cases/${CASE}/complete.json`;
const delivered = (pi: string) => `webhook-deliveries/${pi}.json`;
const packInput = (n = 0) => gen.pack.mock.calls[n][0] as Record<string, unknown>;

function backoffPassed(eventId: string) {
  const job = getJson<WebhookJob>(pendingKey(eventId))!;
  putJson(pendingKey(eventId), { ...job, lastAttemptAt: new Date(Date.now() - RETRY_BACKOFF_MS - 60_000).toISOString() });
}

const s3Error = (name: string, status: number) => Object.assign(new Error(name), { name, $metadata: { httpStatusCode: status } });
const failReads = (prefix: string, name = 'ServiceUnavailable', status = 503) =>
  s3Faults.push((cmd, input) => (cmd === 'GetObjectCommand' && String(input.Key).startsWith(prefix) ? s3Error(name, status) : null));

beforeEach(() => {
  resetS3();
  resetStripe();
  resetResend();
  __resetBackgroundTasksForTests();
  __resetOrderHealthCacheForTests();
  gen.report.mockReset().mockResolvedValue({ caseId: 'LH-TEST', identifiedEntities: [] });
  gen.pack.mockReset().mockImplementation(packThatEmails);
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  process.env.CRON_SECRET = 'cron-secret-for-tests';
  process.env.ADMIN_PASSWORD = ADMIN;
  delete process.env.EMAIL_TRANSPORT;
  for (const k of ['STRIPE_SECRET_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET', 'RESEND_API_KEY']) process.env[k] = 'test';
  const owner = createCaseSecret();
  ownerSecret = owner.secret;
  putJson(`emergency-cases/${CASE}.json`, { caseId: CASE, ownerSecretHash: owner.hash, email: 'buyer@example.com', analysis: { recoveryScore: 1 } });
});

describe('checkout writes the purchase snapshot before the payment link', () => {
  it('stores the snapshot once, then hands its id and hash to the session and its record', async () => {
    const sessionId = await openCheckout();
    const meta = stripeSessions.get(sessionId)!.metadata;
    expect(meta.purchaseId).toMatch(/^pur_[0-9a-f]{24}$/);
    const key = `emergency-purchases/${CASE}/${meta.purchaseId}.json`;
    const put = s3Calls.find((c) => c.command === 'PutObjectCommand' && c.input.Key === key)!;
    expect(put.input.IfNoneMatch).toBe('*');
    // Written before Stripe was asked for a link.
    const putIndex = s3Calls.indexOf(put);
    expect(createSession.mock.invocationCallOrder[0]).toBeGreaterThan(0);
    expect(putIndex).toBeLessThan(s3Calls.findIndex((c) => String(c.input.Key).startsWith(`emergency-case-sessions/${CASE}/`)));
    const { createHash } = await import('node:crypto');
    expect(meta.snapshotSha256).toBe(createHash('sha256').update(s3Store.get(key)!.body).digest('hex'));
    const snap = getJson<{ case: Record<string, unknown> }>(key)!;
    expect(snap.case).toMatchObject({ description: 'original description', victimWallet: '0xvictimA', lossAmount: 2500 });
    expect(snap.case).not.toHaveProperty('ownerSecretHash');
    expect(getJson(`emergency-case-sessions/${CASE}/${sessionId}.json`)).toMatchObject({ purchaseId: meta.purchaseId, snapshotSha256: meta.snapshotSha256 });
  });

  it('creates no payment link when the snapshot cannot be written', async () => {
    s3Faults.push((cmd, input) => (cmd === 'PutObjectCommand' && String(input.Key).startsWith('emergency-purchases/') ? s3Error('ServiceUnavailable', 503) : null));
    const res = await checkout(postJson('/api/emergency/checkout', { product: 'emergency_pack', caseId: CASE, caseSecret: ownerSecret, email: 'buyer@example.com' }));
    expect(res.status).toBe(500);
    expect(createSession).not.toHaveBeenCalled();
  });

  it('expires the earlier open link of the case when a new one is created', async () => {
    const a = await openCheckout();
    const b = await openCheckout({ description: 'edited' });
    expect(expireSession).toHaveBeenCalledWith(a);
    expect(expireSession).not.toHaveBeenCalledWith(b);
  });
});

describe('sessions A and B each deliver their own snapshot', () => {
  it('paying A after B was created uses A, not the edited case', async () => {
    const a = await openCheckout();
    await openCheckout({ description: 'edited for B', country: 'DE', victimWallet: '0xvictimB', lossAmount: 9999 });
    expect(getJson<Record<string, unknown>>(`emergency-cases/${CASE}.json`)!.description).toBe('edited for B');
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    expect(packInput()).toMatchObject({ description: 'original description', countryCode: 'US', victimWallet: '0xvictimA', lossAmount: 2500 });
    expect(sentEmails).toHaveLength(1);
    expect(s3Store.has(delivered('pi_a'))).toBe(true);
  });

  it('paying B uses B', async () => {
    await openCheckout();
    const b = await openCheckout({ description: 'edited for B', country: 'DE', victimWallet: '0xvictimB', lossAmount: 9999 });
    await deliver(paidEvent(b, 'evt_b', 'pi_b'));
    await settle();
    expect(packInput()).toMatchObject({ description: 'edited for B', countryCode: 'DE', victimWallet: '0xvictimB', lossAmount: 9999 });
  });

  it('a summary report is built from its own snapshot too', async () => {
    const a = await openCheckout({ product: 'summary_report', walletAddress: '0xsnapA', network: 'tron' });
    await openCheckout({ product: 'summary_report', walletAddress: '0xeditedB', network: 'eth' });
    await deliver(paidEvent(a, 'evt_s', 'pi_s'));
    await settle();
    expect(gen.report).toHaveBeenCalledTimes(1);
    expect(gen.report.mock.calls[0][0]).toBe('0xsnapA');
    expect(gen.report.mock.calls[0][2]).toMatchObject({ network: 'tron' });
    expect(s3Store.has(delivered('pi_s'))).toBe(true);
  });

  it('a second payment for an already delivered case goes to manual review without a second email', async () => {
    const a = await openCheckout();
    const b = await openCheckout({ description: 'edited for B' });
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    await deliver(paidEvent(b, 'evt_b', 'pi_b'));
    await settle();
    expect(gen.pack).toHaveBeenCalledTimes(1);
    expect(sentEmails).toHaveLength(1);
    expect(getJson<WebhookJob>(manualKey('evt_b'))!.parkedReason).toContain('case_paid_twice');
    expect(s3Store.has(pendingKey('evt_b'))).toBe(false);
  });

  it('an edit made while A is being generated does not reach A', async () => {
    const a = await openCheckout();
    let checkoutDuringGeneration = 0;
    gen.pack.mockImplementationOnce(async (input: Record<string, unknown>) => {
      // A new checkout is refused once A owns the case documents...
      const res = await checkout(postJson('/api/emergency/checkout', {
        product: 'emergency_pack', caseId: CASE, caseSecret: ownerSecret, email: 'buyer@example.com', description: 'edited during generation',
      }));
      checkoutDuringGeneration = res.status;
      // ...and even a direct rewrite of the shared case file does not reach A.
      const saved = getJson<Record<string, unknown>>(`emergency-cases/${CASE}.json`)!;
      putJson(`emergency-cases/${CASE}.json`, { ...saved, description: 'edited during generation', victimWallet: '0xvictimC' });
      return packThatEmails(input);
    });
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    expect(checkoutDuringGeneration).toBe(409);
    expect(packInput()).toMatchObject({ description: 'original description', victimWallet: '0xvictimA' });
    expect(getJson<Record<string, unknown>>(`emergency-cases/${CASE}.json`)!.description).toBe('edited during generation');
    expect(s3Store.has(marker)).toBe(true);
  });
});

describe('reading the snapshot', () => {
  it.each([
    ['an S3 outage', 'ServiceUnavailable', 503],
    ['denied access', 'AccessDenied', 403],
  ])('%s stops the attempt before anything is generated, and the retry after recovery uses the snapshot', async (_label, name, status) => {
    const a = await openCheckout();
    const restore = s3Faults.length;
    failReads('emergency-purchases/', name, status);
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    expect(gen.pack).not.toHaveBeenCalled();
    expect(gen.report).not.toHaveBeenCalled();
    expect(sentEmails).toHaveLength(0);
    expect(s3Store.has(marker)).toBe(false);
    expect(s3Store.has(delivered('pi_a'))).toBe(false);
    const job = getJson<WebhookJob>(pendingKey('evt_a'))!;
    expect(job.lastError).toContain('Could not read purchase snapshot');
    expect(s3Store.has(manualKey('evt_a'))).toBe(false);

    s3Faults.length = restore; // S3 is back
    backoffPassed('evt_a');
    await resumeStaleJobs();
    expect(gen.pack).toHaveBeenCalledTimes(1);
    expect(packInput()).toMatchObject({ description: 'original description', lossAmount: 2500 });
    expect(sentEmails).toHaveLength(1);
    expect(s3Store.has(pendingKey('evt_a'))).toBe(false);
  });

  it('an outage that outlasts every retry parks the job as failed, never as delivered', async () => {
    const a = await openCheckout();
    failReads('emergency-purchases/');
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    for (let i = 1; i < MAX_ATTEMPTS; i++) { backoffPassed('evt_a'); await resumeStaleJobs(); }
    expect(s3Store.has(failedKey('evt_a'))).toBe(true);
    expect(gen.pack).not.toHaveBeenCalled();
    expect(s3Store.has(delivered('pi_a'))).toBe(false);
  });

  it('a confirmed missing snapshot goes to manual review at once', async () => {
    const a = await openCheckout();
    s3Store.delete(`emergency-purchases/${CASE}/${stripeSessions.get(a)!.metadata.purchaseId}.json`);
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    expect(gen.pack).not.toHaveBeenCalled();
    expect(sentEmails).toHaveLength(0);
    expect(s3Store.has(marker)).toBe(false);
    expect(getJson<WebhookJob>(manualKey('evt_a'))!.parkedReason).toContain('snapshot_missing');
    expect(s3Store.has(pendingKey('evt_a'))).toBe(false);
  });

  it('a snapshot that differs from the recorded hash goes to manual review', async () => {
    const a = await openCheckout();
    const key = `emergency-purchases/${CASE}/${stripeSessions.get(a)!.metadata.purchaseId}.json`;
    const snap = getJson<{ case: Record<string, unknown> }>(key)!;
    putJson(key, { ...snap, case: { ...snap.case, lossAmount: 1 } });
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    expect(gen.pack).not.toHaveBeenCalled();
    expect(getJson<WebhookJob>(manualKey('evt_a'))!.parkedReason).toContain('snapshot_integrity');
  });

  it('a session whose reference is incomplete goes to manual review', async () => {
    const a = await openCheckout();
    const evt = paidEvent(a, 'evt_a', 'pi_a');
    evt.data.object.metadata.snapshotSha256 = '';
    await deliver(evt);
    await settle();
    expect(gen.pack).not.toHaveBeenCalled();
    expect(getJson<WebhookJob>(manualKey('evt_a'))!.parkedReason).toContain('snapshot_reference_invalid');
  });

  it('a missing loss amount stays unknown; the price is never used for it', async () => {
    const ref = seedSnapshot({ caseId: CASE, case: { lossAmount: '' } });
    await deliver({ id: 'evt_l', type: 'checkout.session.completed', data: { object: {
      id: 'cs_test_l', payment_intent: 'pi_l', amount_total: 7900, customer_details: { name: 'B' },
      metadata: { product: 'emergency_pack', caseId: CASE, email: 'buyer@example.com', purchaseId: ref.purchaseId, snapshotSha256: ref.snapshotSha256 },
    } } });
    await settle();
    expect(packInput().lossAmount).toBeNull();
  });
});

describe('one payment, one delivery, one email', () => {
  it('a replayed webhook after delivery generates and emails nothing more', async () => {
    const a = await openCheckout();
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    expect((await deliver(paidEvent(a, 'evt_a', 'pi_a'))).status).toBe(200);
    await settle();
    expect((await deliver(paidEvent(a, 'evt_a2', 'pi_a'))).status).toBe(200); // another event for the same payment
    await settle();
    expect(gen.pack).toHaveBeenCalledTimes(1);
    expect(sentEmails).toHaveLength(1);
  });

  it('SIGKILL after the email: the resumed job reuses the snapshot and the email is not sent again', async () => {
    const a = await openCheckout();
    // First process: takes the job, sends the email, is killed before the completion marker.
    gen.pack.mockImplementationOnce(async (input: Record<string, unknown>) => {
      await packThatEmails(input);
      const saved = getJson<Record<string, unknown>>(`emergency-cases/${CASE}.json`)!;
      putJson(`emergency-cases/${CASE}.json`, { ...saved, description: 'edited after the kill' });
      return new Promise(() => {}); // never returns: the process is gone
    });
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await vi.waitFor(() => expect(sentEmails).toHaveLength(1));
    __resetBackgroundTasksForTests(); // the killed process's in-flight state disappears with it
    const job = getJson<WebhookJob>(pendingKey('evt_a'))!;
    expect(job.status).toBe('running');
    putJson(pendingKey('evt_a'), { ...job, startedAt: new Date(Date.now() - STALE_RUNNING_MS - 60_000).toISOString() });

    const summary = await resumeStaleJobs();
    expect(summary.resumed).toBe(1);
    expect(gen.pack).toHaveBeenCalledTimes(2);
    expect(packInput(1)).toMatchObject({ description: 'original description', idempotencyKey: 'ledgerhound:pack:pi_a' });
    expect(sentEmails).toHaveLength(1); // same key, same body: the provider does not send twice
    expect(s3Store.has(marker)).toBe(true);
    expect(s3Store.has(delivered('pi_a'))).toBe(true);
  });

  it('manual re-run: a parked job runs once; a second re-run and a delivered payment are refused', async () => {
    const a = await openCheckout();
    failReads('emergency-purchases/');
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    for (let i = 1; i < MAX_ATTEMPTS; i++) { backoffPassed('evt_a'); await resumeStaleJobs(); }
    expect(s3Store.has(failedKey('evt_a'))).toBe(true);
    s3Faults.length = 0; // cause fixed

    const anonymous = await rerun(postJson('/api/admin/webhook-jobs', { eventId: 'evt_a' }));
    expect(anonymous.status).toBe(401);
    const first = await rerun(postJson('/api/admin/webhook-jobs', { eventId: 'evt_a' }, { 'x-admin-key': ADMIN }));
    expect(await first.json()).toMatchObject({ result: 'requeued', from: 'failed', started: true, outcome: 'done' });
    expect(s3Store.has(failedKey('evt_a'))).toBe(false);
    expect(sentEmails).toHaveLength(1);

    // A stale parked copy of the same payment (e.g. restored by hand) is refused as delivered.
    putJson(failedKey('evt_a'), { eventId: 'evt_a', createdAt: new Date().toISOString(), status: 'pending', attempts: 3,
      session: paidEvent(a, 'evt_a', 'pi_a').data.object });
    const again = await rerun(postJson('/api/admin/webhook-jobs', { eventId: 'evt_a' }, { 'x-admin-key': ADMIN }));
    expect(again.status).toBe(409);
    expect(await again.json()).toEqual({ result: 'already-delivered' });
    expect(gen.pack).toHaveBeenCalledTimes(1);
    expect(sentEmails).toHaveLength(1);
  });

  it('two simultaneous manual re-runs start the job once', async () => {
    const a = await openCheckout();
    s3Store.delete(`emergency-purchases/${CASE}/${stripeSessions.get(a)!.metadata.purchaseId}.json`);
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    expect(s3Store.has(manualKey('evt_a'))).toBe(true);
    // The operator restored the snapshot from a backup copy (identical bytes).
    const ref = seedSnapshot({ caseId: CASE });
    const parked = getJson<WebhookJob>(manualKey('evt_a'))!;
    parked.session.metadata = { ...parked.session.metadata, purchaseId: ref.purchaseId, snapshotSha256: ref.snapshotSha256 };
    parked.purchase = { purchaseId: ref.purchaseId, caseId: CASE, product: 'emergency_pack', snapshotSha256: ref.snapshotSha256 };
    putJson(manualKey('evt_a'), parked);

    const [r1, r2] = await Promise.all([
      rerun(postJson('/api/admin/webhook-jobs', { eventId: 'evt_a' }, { 'x-admin-key': ADMIN })),
      rerun(postJson('/api/admin/webhook-jobs', { eventId: 'evt_a' }, { 'x-admin-key': ADMIN })),
    ]);
    const results = [await r1.json(), await r2.json()];
    expect(results.filter((r) => r.result === 'requeued')).toHaveLength(1);
    await settle();
    expect(gen.pack).toHaveBeenCalledTimes(1);
    expect(sentEmails).toHaveLength(1);
  });

  it('a re-run past the email retry deadline needs the operator to confirm every email key', async () => {
    const job = {
      eventId: 'evt_old', createdAt: new Date(Date.now() - EXPIRE_MS - 60_000).toISOString(), status: 'pending', attempts: 3,
      session: { id: 'cs_old', payment_intent: 'pi_old', amount_total: 4900, metadata: { email: 'buyer@example.com', walletAddress: '0xabc' }, customer_details: null },
    };
    putJson(failedKey('evt_old'), job);
    const refused = await rerun(postJson('/api/admin/webhook-jobs', { eventId: 'evt_old' }, { 'x-admin-key': ADMIN }));
    expect(refused.status).toBe(409);
    expect(await refused.json()).toMatchObject({ result: 'email-window-passed', idempotencyKeys: ['ledgerhound:report:pi_old'] });
    expect(gen.report).not.toHaveBeenCalled();
    const confirmed = await rerun(postJson('/api/admin/webhook-jobs', { eventId: 'evt_old', emailChecked: true }, { 'x-admin-key': ADMIN }));
    expect((await confirmed.json()).outcome).toBe('done');
  });
});

describe('sessions created before purchase snapshots', () => {
  const SESSION = 'cs_test_legacy0001';
  const meta = { product: 'emergency_pack', caseId: CASE, email: 'buyer@example.com', country: 'US', walletAddress: '', network: '',
    platformName: 'Fictional Exchange', scamType: 'romance', route: '', lossAmount: '2500', txid: '' };
  const legacyEvent = (id = 'evt_legacy') => ({ id, type: 'checkout.session.completed', data: { object: {
    id: SESSION, payment_intent: 'pi_legacy', amount_total: 7900, metadata: { ...meta }, customer_details: { name: 'B' } } } });

  it('R2: interleaved older checkouts are not trusted, even when the timestamps and copied fields agree', async () => {
    // A saved at 10:00:00; B overwrote the case at 10:00:01; A's session was recorded at 10:00:02.
    putJson(`emergency-cases/${CASE}.json`, { ...meta, ownerSecretHash: 'h', description: 'PURCHASE B', savedAt: '2026-11-06T10:00:01.000Z' });
    putJson(`emergency-case-sessions/${CASE}/${SESSION}.json`, { sessionId: SESSION, product: 'emergency_pack', createdAt: '2026-11-06T10:00:02.000Z' });
    await deliver(legacyEvent());
    await settle();
    expect(gen.pack).not.toHaveBeenCalled();
    expect(gen.report).not.toHaveBeenCalled();
    expect(sentEmails).toHaveLength(0);
    expect(getJson<WebhookJob>(manualKey('evt_legacy'))!.parkedReason).toContain('legacy_unverifiable');
    expect(Array.from(s3Store.keys()).some((k) => k.startsWith('emergency-purchases/'))).toBe(false); // nothing frozen
    expect(s3Store.has(`legal-packs/cases/${CASE}/owner.json`)).toBe(false);
  });

  it('every older pack session goes to manual review, whatever its case looks like', async () => {
    putJson(`emergency-cases/${CASE}.json`, { ...meta, description: 'whatever', savedAt: '2026-11-01T10:00:00.000Z' });
    putJson(`emergency-case-sessions/${CASE}/${SESSION}.json`, { sessionId: SESSION, createdAt: '2026-11-01T10:00:01.000Z' });
    await deliver(legacyEvent('evt_l2'));
    await settle();
    expect(getJson<WebhookJob>(manualKey('evt_l2'))!.parkedReason).toContain('legacy_unverifiable');
    expect(gen.pack).not.toHaveBeenCalled();
  });

  it('an older summary report keeps using its own session data', async () => {
    await deliver({ id: 'evt_sum', type: 'checkout.session.completed', data: { object: {
      id: 'cs_test_sum', payment_intent: 'pi_sum', amount_total: 1900, customer_details: null,
      metadata: { product: 'summary_report', caseId: CASE, email: 'buyer@example.com', walletAddress: '0xabc', network: 'eth' } } } });
    await settle();
    expect(gen.report).toHaveBeenCalledTimes(1);
    expect(gen.report.mock.calls[0][0]).toBe('0xabc');
  });
});

describe('R1: the case document set has one owner from the start', () => {
  const owner = `legal-packs/cases/${CASE}/owner.json`;

  it('the owner is recorded before the forensic report and the first document', async () => {
    const a = await openCheckout({ walletAddress: '0xabc' });
    gen.report.mockImplementationOnce(async () => {
      expect(getJson(owner)).toMatchObject({ paymentId: 'pi_a', caseId: CASE });
      return { caseId: 'LH', identifiedEntities: [] };
    });
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    expect(gen.report).toHaveBeenCalledTimes(1);
    expect(gen.pack).toHaveBeenCalledTimes(1);
  });

  it('a payment that finds another owner sends nothing: no report, no documents, no email', async () => {
    const a = await openCheckout({ walletAddress: '0xabc' });
    const b = await openCheckout({ walletAddress: '0xabc', description: 'B' });
    // A owns the set and was interrupted before its manifest.
    gen.pack.mockRejectedValueOnce(new Error('renderer crashed after the first PDF'));
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    expect(getJson(owner)).toMatchObject({ paymentId: 'pi_a' });
    await deliver(paidEvent(b, 'evt_b', 'pi_b'));
    await settle();
    expect(gen.report).toHaveBeenCalledTimes(1);
    expect(gen.pack).toHaveBeenCalledTimes(1);
    expect(sentEmails).toHaveLength(0);
    expect(getJson<WebhookJob>(manualKey('evt_b'))!.parkedReason).toContain('case_paid_twice');
    expect(s3Store.has(pendingKey('evt_a'))).toBe(true); // A keeps retrying its own set
  });

  it('A and B paid at the same moment: exactly one owns the set, the other goes to manual review', async () => {
    const a = await openCheckout();
    const b = await openCheckout({ description: 'B' });
    await Promise.all([deliver(paidEvent(a, 'evt_a', 'pi_a')), deliver(paidEvent(b, 'evt_b', 'pi_b'))]);
    await settle();
    expect(gen.pack).toHaveBeenCalledTimes(1);
    expect(sentEmails).toHaveLength(1);
    const winner = getJson<{ paymentId: string }>(owner)!.paymentId;
    const loser = winner === 'pi_a' ? 'evt_b' : 'evt_a';
    expect(getJson<WebhookJob>(manualKey(loser))!.parkedReason).toContain('case_paid_twice');
  });

  it.each([
    ['a PDF', 'police-complaint.pdf', { pdf: 'old' }],
    ['a manifest without a payment', 'manifest.json', { caseId: CASE, documents: [] }],
  ])('existing documents without an owner (%s) are not adopted', async (_label, file, body) => {
    const a = await openCheckout({ walletAddress: '0xabc' });
    putJson(`legal-packs/cases/${CASE}/${file}`, body);
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    expect(gen.report).not.toHaveBeenCalled();
    expect(gen.pack).not.toHaveBeenCalled();
    expect(getJson<WebhookJob>(manualKey('evt_a'))!.parkedReason).toContain('pack_artifacts_unowned');
    expect(s3Store.has(owner)).toBe(false);
  });

  it('a completion marker without a payment is not taken for this payment', async () => {
    const a = await openCheckout();
    putJson(`legal-packs/cases/${CASE}/complete.json`, { completedAt: 'earlier' });
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    expect(getJson<WebhookJob>(manualKey('evt_a'))!.parkedReason).toContain('pack_artifacts_unowned');
    expect(s3Store.has(delivered('pi_a'))).toBe(false);
  });

  it('an unreadable owner record is retried, not decided', async () => {
    const a = await openCheckout();
    failReads(`legal-packs/cases/${CASE}/owner.json`);
    await deliver(paidEvent(a, 'evt_a', 'pi_a'));
    await settle();
    expect(gen.pack).not.toHaveBeenCalled();
    expect(getJson<WebhookJob>(pendingKey('evt_a'))!.lastError).toContain('Could not read pack owner');
  });
});

describe('R3: the email retry deadline survives manual re-runs', () => {
  const parkedAt = (ageMs: number, now: number) => ({
    eventId: 'evt_old', createdAt: new Date(now - ageMs).toISOString(), status: 'pending' as const, attempts: 3,
    session: { id: 'cs_old', payment_intent: 'pi_old', amount_total: 7900, metadata: { product: 'emergency_pack' }, customer_details: null },
  });

  it('a re-run 1 minute before the deadline keeps it: after a failed attempt and 2 h the job expires', async () => {
    const now = Date.now();
    putJson(failedKey('evt_old'), parkedAt(EXPIRE_MS - 60_000, now));
    const requeued = await requeueParkedJob('evt_old', { now });
    expect(requeued.result).toBe('requeued');
    const fresh = getJson<WebhookJob>(pendingKey('evt_old'))!;
    expect(Date.parse(fresh.emailRetryDeadline!)).toBe(Date.parse(fresh.originalCreatedAt!) + EXPIRE_MS);
    const retry = { ...fresh, attempts: 1, lastAttemptAt: new Date(now).toISOString() };
    expect(classifyJob(retry, now + 2 * 3600_000, false)).toBe('expire');
    expect(isAcquirable(retry, now + 2 * 3600_000)).toBe(false);
  });

  it('after the deadline no path starts the job: acquire and webhook redelivery do nothing, the sweep parks it', async () => {
    const now = Date.now();
    const evt = { id: 'evt_dl', type: 'checkout.session.completed', data: { object: {
      id: 'cs_dl', payment_intent: 'pi_dl', amount_total: 4900, customer_details: null, metadata: { email: 'buyer@example.com', walletAddress: '0xabc' } } } };
    // A recent createdAt (as after a re-run) must not matter: the deadline is what counts.
    const job = { ...jobFromEvent(evt, new Date(now - EXPIRE_MS - 60_000)), attempts: 1,
      lastAttemptAt: new Date(now - RETRY_BACKOFF_MS - 60_000).toISOString(), createdAt: new Date(now - 60_000).toISOString() };
    putJson(pendingKey('evt_dl'), job);
    expect(await acquireJob('evt_dl', { now })).toBeNull();
    putJson('webhook-payment-locks/pi_dl', { eventId: 'evt_dl' });
    putJson('webhook-events/evt_dl', { claimedAt: 'earlier' });
    await deliver(evt);
    await settle();
    expect(gen.report).not.toHaveBeenCalled();
    await resumeStaleJobs({ now });
    expect(getJson<WebhookJob>(failedKey('evt_dl'))!.parkedReason).toContain('email retry deadline');
    expect(gen.report).not.toHaveBeenCalled();
  });

  it('an operator confirmation is recorded with the keys it covered and opens one new window', async () => {
    const now = Date.now();
    putJson(failedKey('evt_old'), parkedAt(EXPIRE_MS + 3600_000, now));
    expect(await requeueParkedJob('evt_old', { now })).toMatchObject({
      result: 'email-window-passed', idempotencyKeys: ['ledgerhound:report:pi_old', 'ledgerhound:pack:pi_old'],
    });
    const ok = await requeueParkedJob('evt_old', { now, emailChecked: true });
    expect(ok.result).toBe('requeued');
    const fresh = getJson<WebhookJob>(pendingKey('evt_old'))!;
    expect(fresh.emailChecks).toEqual([expect.objectContaining({ keys: ['ledgerhound:report:pi_old', 'ledgerhound:pack:pi_old'] })]);
    expect(Date.parse(fresh.emailRetryDeadline!)).toBe(now + EXPIRE_MS);
  });
});

describe('order health', () => {
  it('counts pending, failed and manual review without ids or personal data; /api/health stays ok', async () => {
    putJson(manualKey('evt_m'), { eventId: 'evt_m', session: { metadata: { email: 'secret-person@example.com' } } });
    putJson(failedKey('evt_f'), { eventId: 'evt_f' });
    putJson(pendingKey('evt_p'), { eventId: 'evt_p', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() });
    const res = await ordersHealth();
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(JSON.parse(text)).toMatchObject({ status: 'attention', pending: 1, failed: 1, manualReview: 1 });
    expect(JSON.parse(text).oldestPendingAgeSeconds).toBeGreaterThanOrEqual(7200);
    expect(text).not.toMatch(/evt_|@|buyer|secret/);

    const container = await health();
    expect(container.status).toBe(200);
    expect((await container.json()).status).toBe('ok');
  });

  it('an unreadable queue is unknown, not zero', async () => {
    s3Faults.push((cmd, input) => (cmd === 'ListObjectsV2Command' && input.Prefix === 'webhook-jobs/failed/' ? s3Error('AccessDenied', 403) : null));
    const orders = await readOrderHealth();
    expect(orders).toMatchObject({ status: 'unknown', failed: null, pending: 0, manualReview: 0 });
  });

  it('R4: a 3-hour-old order retried a moment ago is still 3 hours old', async () => {
    const now = Date.now();
    putJson(pendingKey('evt_late'), { createdAt: new Date(now - 3 * 3600_000).toISOString(), status: 'pending', attempts: 1 }, new Date(now));
    const orders = await readOrderHealth(now);
    expect(orders).toMatchObject({ pending: 1, status: 'attention' });
    expect(orders.oldestPendingAgeSeconds).toBeGreaterThanOrEqual(3 * 3600);
  });

  it('R4: a manual re-run does not make an order look new', async () => {
    const now = Date.now();
    putJson(pendingKey('evt_rq'), { createdAt: new Date(now).toISOString(), originalCreatedAt: new Date(now - 5 * 3600_000).toISOString(), status: 'pending', attempts: 0 });
    expect((await readOrderHealth(now)).oldestPendingAgeSeconds).toBeGreaterThanOrEqual(5 * 3600);
  });

  it('R4: an unreadable pending record makes the age unknown, never zero', async () => {
    putJson(pendingKey('evt_bad'), { status: 'pending' }); // no creation time
    expect(await readOrderHealth()).toMatchObject({ pending: 1, oldestPendingAgeSeconds: null, status: 'unknown' });
    s3Store.delete(pendingKey('evt_bad'));
    putJson(pendingKey('evt_x'), { createdAt: new Date().toISOString() });
    s3Faults.push((cmd, input) => (cmd === 'GetObjectCommand' && String(input.Key).startsWith('webhook-jobs/pending/') ? s3Error('ServiceUnavailable', 503) : null));
    expect(await readOrderHealth()).toMatchObject({ pending: 1, oldestPendingAgeSeconds: null, status: 'unknown' });
  });

  it('an empty system is ok', async () => {
    expect(await readOrderHealth()).toMatchObject({ status: 'ok', pending: 0, failed: 0, manualReview: 0, oldestPendingAgeSeconds: 0 });
  });

  it('the sweep reports the counts and the cron runner logs attention, never for ok', async () => {
    putJson(manualKey('evt_m'), { eventId: 'evt_m' });
    const res = await sweepRoute(new NextRequest('https://x/api/admin/resume-webhook-jobs', { headers: { authorization: 'Bearer cron-secret-for-tests' } }));
    const body = await res.json();
    expect(body.orders).toMatchObject({ status: 'attention', manualReview: 1 });

    const lines: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((l: string) => { lines.push(l); });
    try {
      logOrders({ name: 'resume-webhook-jobs' }, body);
      logOrders({ name: 'resume-webhook-jobs' }, { orders: { status: 'ok' } });
      logOrders({ name: 'resume-webhook-jobs' }, null);
    } finally { spy.mockRestore(); }
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0])).toMatchObject({ result: 'attention', orders: { status: 'attention', manualReview: 1 } });
    expect(JSON.parse(lines[1])).toMatchObject({ result: 'attention', orders: { status: 'unknown' } });
  });

  it('the operator list shows reasons and ids, without email addresses', async () => {
    putJson(manualKey('evt_m'), { eventId: 'evt_m', createdAt: '2026-11-06T00:00:00.000Z', parkedReason: 'Manual review (snapshot_missing): x',
      purchase: { purchaseId: 'pur_x' }, session: { id: 'cs_x', payment_intent: 'pi_x', metadata: { email: 'buyer@example.com', caseId: CASE, product: 'emergency_pack' } } });
    expect((await parkedList(new NextRequest('https://x/api/admin/webhook-jobs'))).status).toBe(401);
    const res = await parkedList(new NextRequest('https://x/api/admin/webhook-jobs', { headers: { 'x-admin-key': ADMIN } }));
    const text = await res.text();
    expect(JSON.parse(text).parked).toEqual([expect.objectContaining({ eventId: 'evt_m', state: 'manual-review', caseId: CASE, paymentId: 'pi_x', purchaseId: 'pur_x' })]);
    expect(text).not.toContain('buyer@example.com');
  });
});

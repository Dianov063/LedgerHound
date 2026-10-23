// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { S3Client } from '@aws-sdk/client-s3';
import { putJson, resetS3, s3Store } from './helpers/aws-s3-mock';
import { resetStripe } from './helpers/stripe-mock';
import { POST as webhook } from '@/app/api/webhook/route';
import { drainBackgroundTasks, __resetBackgroundTasksForTests } from '@/lib/background-tasks';
import { resumeStaleJobs } from '@/lib/webhook-job-runner';
vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('stripe', () => import('./helpers/stripe-mock'));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ success: true }), hasUpstash: false }));
vi.mock('@/lib/logger', () => ({ default: { info() {}, warn() {}, error() {} } }));
const gen = vi.hoisted(() => ({ report: vi.fn(), pack: vi.fn() }));
vi.mock('@/lib/generateReport', () => ({ generateReport: gen.report }));
vi.mock('@/lib/generateEmergencyPack', () => ({ generateEmergencyPack: gen.pack }));
vi.mock('@/lib/reports-log', () => ({ getReports: async () => [] }));
const EVENT = 'evt_review';
const PAYMENT = 'pi_review';
const CASE = 'ER-MGK1Z2AB-0123456789abcdef';
const key = `webhook-jobs/pending/${EVENT}.json`;
function event(pack = false) {
  return { id: EVENT, type: 'checkout.session.completed', data: { object: {
    id: 'cs_test_review0001', payment_intent: PAYMENT, amount_total: 7900,
    metadata: { email: 'buyer@example.com', walletAddress: '0xabc', country: 'US', caseId: CASE,
      product: pack ? 'emergency_pack' : 'forensic_report' }, customer_details: { name: 'Buyer' },
  } } };
}
const deliver = (pack = false) => webhook(new Request('https://www.ledgerhound.vip/api/webhook', {
  method: 'POST', headers: { 'stripe-signature': 'valid-signature' }, body: JSON.stringify(event(pack)),
}));
beforeEach(() => {
  resetS3(); resetStripe(); __resetBackgroundTasksForTests();
  gen.report.mockReset().mockResolvedValue({ caseId: 'LH-TEST', identifiedEntities: [] });
  gen.pack.mockReset().mockResolvedValue({ templates: [] });
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_review';
});
describe('review regression', () => {
  it('does not start a second runner when redelivery wins during the sweep lock check', async () => {
    putJson(key, { eventId: EVENT, createdAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'pending', attempts: 0, session: event().data.object });
    putJson(`webhook-events/${EVENT}`, { claimedAt: 'earlier' });
    let release = () => {};
    gen.report.mockImplementationOnce(() => new Promise((r) => { release = () => r({ caseId: 'LH', identifiedEntities: [] }); }));
    const originalSend = S3Client.prototype.send;
    let intercept = true;
    const spy = vi.spyOn(S3Client.prototype, 'send').mockImplementation(async function (cmd: any) {
      // Any access to the payment lock (Head/Get/Put): the sweep's ownership check.
      if (intercept && cmd.input.Key === `webhook-payment-locks/${PAYMENT}`) {
        intercept = false;
        expect((await deliver()).status).toBe(200);
        await vi.waitFor(() => expect(gen.report).toHaveBeenCalledTimes(1));
      }
      return originalSend.call(this, cmd);
    } as any);
    try {
      await resumeStaleJobs();
      expect(gen.report).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore(); release(); await drainBackgroundTasks(1000);
    }
  });
  it('keeps an emergency pack pending if the forensic report fails', async () => {
    gen.report.mockRejectedValueOnce(new Error('S3 and email failed'));
    gen.pack.mockResolvedValueOnce({ templates: [{ type: 'police-complaint' }] });
    await deliver(true);
    await drainBackgroundTasks(1000);
    expect(s3Store.has(key)).toBe(true);
    expect(s3Store.has(`legal-packs/cases/${CASE}/complete.json`)).toBe(false);
  });
});

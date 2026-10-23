// @vitest-environment node
/**
 * Exhaustive interleavings of the two actors that can start a job: a Stripe
 * redelivery (webhook) and the recovery sweep. For every S3 call k made by the
 * first actor, the second actor runs to completion right before call k. In
 * every interleaving, and in both orders, generation must start exactly once.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { S3Client } from '@aws-sdk/client-s3';
import { putJson, resetS3 } from './helpers/aws-s3-mock';
import { resetStripe } from './helpers/stripe-mock';
import { POST as webhook } from '@/app/api/webhook/route';
import { __resetBackgroundTasksForTests, drainBackgroundTasks } from '@/lib/background-tasks';
import { resumeStaleJobs } from '@/lib/webhook-job-runner';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('stripe', () => import('./helpers/stripe-mock'));
vi.mock('resend', () => import('./helpers/resend-mock'));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ success: true }), hasUpstash: false }));
vi.mock('@/lib/logger', () => ({ default: { info() {}, warn() {}, error() {} } }));
const gen = vi.hoisted(() => ({ report: vi.fn() }));
vi.mock('@/lib/generateReport', () => ({ generateReport: gen.report }));
vi.mock('@/lib/generateEmergencyPack', () => ({ generateEmergencyPack: vi.fn() }));

const EVENT = 'evt_race';
const PAYMENT = 'pi_race';

function evt() {
  return { id: EVENT, type: 'checkout.session.completed', data: { object: {
    id: 'cs_test_race00000001', payment_intent: PAYMENT, amount_total: 4900,
    metadata: { email: 'buyer@example.com', walletAddress: '0xabc', network: 'eth' }, customer_details: { name: 'B' },
  } } };
}
const deliver = () => webhook(new Request('https://www.ledgerhound.vip/api/webhook', {
  method: 'POST', headers: { 'stripe-signature': 'valid-signature' }, body: JSON.stringify(evt()),
}));

/** A job whose first delivery died after the event lock, before the payment lock. */
function seedCrashedDelivery() {
  putJson(`webhook-jobs/pending/${EVENT}.json`, {
    eventId: EVENT, createdAt: new Date(Date.now() - 3_600_000).toISOString(), status: 'pending', attempts: 0,
    reportCaseId: 'LH-MGK1Z2AB-0123456789abcdef', session: evt().data.object,
  });
  putJson(`webhook-events/${EVENT}`, { claimedAt: 'earlier' });
}

type Actor = () => Promise<unknown>;
const sweep: Actor = () => resumeStaleJobs();

/** Counts the S3 calls an actor makes when run alone. */
async function countCalls(actor: Actor): Promise<number> {
  seedCrashedDelivery();
  const spy = vi.spyOn(S3Client.prototype, 'send');
  await actor();
  await drainBackgroundTasks(2000);
  const n = spy.mock.calls.length;
  spy.mockRestore();
  return n;
}

async function interleave(first: Actor, second: Actor, k: number): Promise<number> {
  seedCrashedDelivery();
  const original = S3Client.prototype.send;
  let seen = 0;
  let secondRan = false;
  let inSecond = false;
  const spy = vi.spyOn(S3Client.prototype, 'send').mockImplementation(async function (this: S3Client, cmd: never) {
    if (!inSecond && !secondRan) {
      seen += 1;
      if (seen === k) {
        inSecond = true;
        await second();
        inSecond = false;
        secondRan = true;
      }
    }
    return original.call(this, cmd);
  } as never);
  try {
    await first();
    if (!secondRan) await second();
    await drainBackgroundTasks(2000);
    return gen.report.mock.calls.length;
  } finally {
    spy.mockRestore();
  }
}

beforeEach(() => {
  resetS3();
  resetStripe();
  __resetBackgroundTasksForTests();
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_race';
  gen.report.mockReset().mockResolvedValue({ caseId: 'LH', identifiedEntities: [] });
});

describe('exactly one runner across every interleaving', () => {
  it.each([
    ['sweep first, redelivery in between', sweep, deliver],
    ['redelivery first, sweep in between', deliver, sweep],
  ] as const)('%s', async (_name, first, second) => {
    const total = await countCalls(first);
    expect(total).toBeGreaterThan(3);
    for (let k = 1; k <= total + 1; k++) {
      resetS3();
      __resetBackgroundTasksForTests();
      gen.report.mockClear();
      const runs = await interleave(first, second, k);
      expect(runs, `interleaving before S3 call ${k} of ${total}`).toBe(1);
    }
  });
});

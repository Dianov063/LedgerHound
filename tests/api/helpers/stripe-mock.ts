import { vi } from 'vitest';

/**
 * Stand-in for the `stripe` package, used via
 *   vi.mock('stripe', () => import('./helpers/stripe-mock'))
 * Tests register Checkout sessions in `stripeSessions`.
 */
export interface FakeSession {
  id: string;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  metadata: Record<string, string>;
}

export const stripeSessions = new Map<string, FakeSession>();

export const retrieveSession = vi.fn(async (id: string) => {
  const s = stripeSessions.get(id);
  if (!s) throw Object.assign(new Error('No such checkout.session'), { type: 'StripeInvalidRequestError' });
  return s;
});

let created = 0;
export const createSession = vi.fn(async (params: { metadata?: Record<string, string> }) => {
  created += 1;
  const id = `cs_test_created${String(created).padStart(4, '0')}`;
  stripeSessions.set(id, { id, payment_status: 'unpaid', metadata: params.metadata ?? {} });
  return { id, url: `https://checkout.stripe.test/pay/${id}`, metadata: params.metadata };
});

export const expireSession = vi.fn(async (id: string) => ({ id, status: 'expired' }));

export function resetStripe(): void {
  stripeSessions.clear();
  retrieveSession.mockClear();
  createSession.mockClear();
  expireSession.mockClear();
  created = 0;
}

export default class Stripe {
  checkout = { sessions: { retrieve: retrieveSession, create: createSession, expire: expireSession } };
  constructor(_key?: string) {}
}

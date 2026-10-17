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

export const createSession = vi.fn(async (params: { metadata?: Record<string, string> }) => ({
  id: 'cs_test_created0001',
  url: 'https://checkout.stripe.test/pay/cs_test_created0001',
  metadata: params.metadata,
}));

export function resetStripe(): void {
  stripeSessions.clear();
  retrieveSession.mockClear();
  createSession.mockClear();
}

export default class Stripe {
  checkout = { sessions: { retrieve: retrieveSession, create: createSession } };
  constructor(_key?: string) {}
}

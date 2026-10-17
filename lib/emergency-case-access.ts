import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Access control for Emergency Pack cases.
 *
 * A case id is NOT an access token. Cases created before 2026-10 used a
 * timestamp-only id (`ER-<base36 ms>`), which is enumerable, so knowing an id
 * must never be enough to read or rewrite a case:
 *
 *  - Rewriting case data (emergency/checkout) requires the per-case owner
 *    secret that only the browser which ran emergency/analyze received.
 *  - Reading generated documents + the victim email (emergency/status)
 *    requires a PAID Stripe Checkout session whose metadata names this case.
 *    Stripe appends that session id to the success URL, so legitimate buyers
 *    (including buyers of legacy cases) keep access; a guessed id does not.
 */

/** Current case id format: `ER-<base36 time>-<64-bit random hex>`. */
export const CASE_ID_RE = /^ER-[0-9A-Z]{6,12}-[0-9a-f]{16}$/;

/** Legacy ids (and anything else) still pass this looser shape check for reads. */
export const ANY_CASE_ID_RE = /^[\w-]{1,64}$/;

const SECRET_RE = /^[0-9a-f]{32}$/;
const STRIPE_SESSION_RE = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

export function createCaseSecret(): { secret: string; hash: string } {
  const secret = randomBytes(16).toString('hex');
  return { secret, hash: hashSecret(secret) };
}

function hashSecret(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

/** Constant-time check of a presented owner secret against the stored hash. */
export function verifyCaseSecret(secret: unknown, storedHash: unknown): boolean {
  if (typeof secret !== 'string' || !SECRET_RE.test(secret)) return false;
  if (typeof storedHash !== 'string' || !/^[0-9a-f]{64}$/.test(storedHash)) return false;
  return timingSafeEqual(Buffer.from(hashSecret(secret), 'hex'), Buffer.from(storedHash, 'hex'));
}

export function isStripeSessionId(value: unknown): value is string {
  return typeof value === 'string' && STRIPE_SESSION_RE.test(value);
}

/** Minimal shape of the Stripe Checkout session fields we rely on. */
export interface CheckoutSessionLike {
  payment_status?: string | null;
  metadata?: Record<string, string> | null;
}

export function sessionGrantsCase(session: CheckoutSessionLike | null | undefined, caseId: string): boolean {
  return !!session
    && session.payment_status === 'paid'
    && typeof session.metadata?.caseId === 'string'
    && session.metadata.caseId === caseId;
}

/* Success pages poll status every 5s; cache positive verifications so each
   poll does not cost a Stripe API round-trip. Negative results are not cached. */
const VERIFIED_TTL_MS = 10 * 60 * 1000;
const verified = new Map<string, number>();

export async function verifyPaidSessionForCase(
  sessionId: string,
  caseId: string,
  retrieve: (id: string) => Promise<CheckoutSessionLike>,
): Promise<boolean> {
  if (!isStripeSessionId(sessionId)) return false;
  const key = `${sessionId}:${caseId}`;
  const now = Date.now();
  const cachedUntil = verified.get(key);
  if (cachedUntil && cachedUntil > now) return true;

  let session: CheckoutSessionLike;
  try {
    session = await retrieve(sessionId);
  } catch {
    return false;
  }
  if (!sessionGrantsCase(session, caseId)) return false;

  verified.set(key, now + VERIFIED_TTL_MS);
  if (verified.size > 5000) {
    verified.forEach((until, k) => { if (until <= now) verified.delete(k); });
  }
  return true;
}

/** Test hook: clears the positive-verification cache. */
export function __resetCaseAccessCacheForTests(): void {
  verified.clear();
}

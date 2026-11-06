import { createHash } from 'node:crypto';
import { s3Store } from './aws-s3-mock';

/**
 * Writes a purchase snapshot exactly as /api/emergency/checkout does and
 * returns the reference its Stripe session would carry in metadata.
 */
export function seedSnapshot(opts: {
  caseId: string;
  purchaseId?: string;
  product?: string;
  case?: Record<string, unknown>;
}): { purchaseId: string; snapshotSha256: string; key: string; body: string } {
  const purchaseId = opts.purchaseId ?? `pur_${'0'.repeat(23)}1`;
  const product = opts.product ?? 'emergency_pack';
  const snapshot = {
    version: 1,
    purchaseId,
    caseId: opts.caseId,
    product,
    createdAt: '2026-11-06T00:00:00.000Z',
    amountCents: product === 'emergency_pack' ? 7900 : 1900,
    currency: 'usd',
    source: 'checkout',
    case: { caseId: opts.caseId, product, email: 'buyer@example.com', country: 'US', lossAmount: '2500', ...opts.case },
  };
  const body = JSON.stringify(snapshot);
  const key = `emergency-purchases/${opts.caseId}/${purchaseId}.json`;
  s3Store.set(key, { body, modified: new Date(), input: {}, etag: `"snap-${purchaseId}"` });
  return { purchaseId, snapshotSha256: createHash('sha256').update(body, 'utf8').digest('hex'), key, body };
}

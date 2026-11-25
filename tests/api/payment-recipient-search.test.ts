import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/non-crypto-scam-database/search/route';
import { normalizePaymentIdentifier, publicView, type PaymentIdentitySummary, type PaymentRail } from '@/lib/non-crypto-scam-db';
import { SEARCH_COUNTRY_REQUIRED } from '@/lib/payment-recipient-search';
import { putJson, resetS3, s3Calls, s3Faults, s3Store } from './helpers/aws-s3-mock';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
const rate = vi.hoisted(() => ({ allowed: true }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ success: rate.allowed }) }));
const prefix = 'non-crypto-scam-database/';

function identity(country: string, rail: PaymentRail, value = 'seller@example.invalid', extra: Partial<PaymentIdentitySummary> = {}): PaymentIdentitySummary {
  const id = normalizePaymentIdentifier(rail, value, country);
  const summary: PaymentIdentitySummary = {
    identityHash: id.hash, country, rail, identityMask: id.mask, categories: ['fake_service'],
    paymentMethodDetails: [], categoryDetails: [], aliases: [], states: [],
    reportIds: ['private-report-id'], independentReporterKeys: ['private-reporter-key'],
    reportCount: 3, independentReporters: 3, paymentProofCount: 0, totalReportedAmount: 100,
    currency: 'USD', firstReported: '2026-11-01', lastReported: '2026-11-25',
    publicLevel: 'multiple_reports', publicEligible: true, indexedEligible: false, ...extra,
  };
  putJson(`${prefix}identities/${id.hash}.json`, summary);
  return summary;
}
function index(...entries: PaymentIdentitySummary[]) {
  putJson(`${prefix}index/identities.json`, entries.map(publicView));
}
async function search(params: Record<string, string> = {}) {
  const response = await GET(new NextRequest(`https://example.invalid/api/non-crypto-scam-database/search?${new URLSearchParams(params)}`));
  return { status: response.status, body: await response.json() };
}
const email = { paymentIdentifier: ' Seller@Example.Invalid ' };
beforeEach(() => { resetS3(); rate.allowed = true; });

describe('public recipient search across countries and methods', () => {
  it('finds the same email across countries and methods, with separate counts and masked public results', async () => {
    const us = identity('US', 'paypal');
    const gb = identity('GB', 'paypal', undefined, { reportCount: 5 });
    const other = identity('OTHER', 'email');
    index(us, gb, other);
    const { status, body } = await search({ ...email, country: 'all', rail: 'all' });
    expect(status).toBe(200);
    expect(body.matched).toBe(true);
    expect(body.identities.map((i: PaymentIdentitySummary) => [i.country, i.rail, i.reportCount])).toEqual([
      ['US', 'paypal', 3], ['GB', 'paypal', 5], ['OTHER', 'email', 3],
    ]);
    expect(body.identity.identityHash).toBe(us.identityHash); // legacy clients
    expect(JSON.stringify(body)).not.toMatch(/private-report-id|private-reporter-key|seller@example.invalid/);
    expect(s3Calls.every(c => c.command === 'GetObjectCommand')).toBe(true);
    expect(s3Calls.every(c => !String(c.input.Key).includes('/reports/'))).toBe(true);
  });

  it('allows omitted filters and honours either filter independently', async () => {
    const a = identity('US', 'paypal'), b = identity('GB', 'paypal'), c = identity('US', 'email');
    index(a, b, c);
    expect((await search(email)).body.identities).toHaveLength(3);
    expect((await search({ ...email, country: 'us' })).body.identities.map((i: PaymentIdentitySummary) => i.identityHash)).toEqual([a.identityHash, c.identityHash]);
    expect((await search({ ...email, rail: 'paypal' })).body.identities.map((i: PaymentIdentitySummary) => i.identityHash)).toEqual([a.identityHash, b.identityHash]);
  });

  it('keeps exact searches working without the public index', async () => {
    identity('US', 'paypal');
    const result = await search({ ...email, country: 'US', rail: 'paypal' });
    expect(result.status).toBe(200);
    expect(result.body.identities).toHaveLength(1);
    expect(s3Calls).toHaveLength(1);
  });

  it('keeps OTHER territory and other method as real filters, not wildcards', async () => {
    const a = identity('OTHER', 'email'), b = identity('US', 'email'), c = identity('US', 'other');
    index(a, b, c);
    expect((await search({ ...email, country: 'OTHER' })).body.identities.map((i: PaymentIdentitySummary) => i.identityHash)).toEqual([a.identityHash]);
    expect((await search({ ...email, rail: 'other' })).body.identities.map((i: PaymentIdentitySummary) => i.identityHash)).toEqual([c.identityHash]);
  });

  it('deduplicates index entries but never adds report counts together', async () => {
    const a = identity('US', 'paypal'); index(a, a);
    expect((await search(email)).body.identities.map((i: PaymentIdentitySummary) => i.reportCount)).toEqual([3]);
  });

  it('does not reveal private, newly private or paused warnings from a stale index', async () => {
    const a = identity('US', 'paypal'), b = identity('GB', 'email'), c = identity('CA', 'paypal', undefined, { publicEligible: false });
    index(a, b, c);
    identity('US', 'paypal', undefined, { publicEligible: false });
    identity('GB', 'email', undefined, { publicationPaused: true });
    const { body } = await search(email);
    expect(body).toMatchObject({ matched: false, identities: [], identity: null, publicWarning: null });
    expect((await search({ ...email, country: 'GB', rail: 'email' })).body.matched).toBe(false);
  });

  it('does not expose records absent from the public index in a broad search', async () => {
    identity('US', 'paypal', undefined, { publicEligible: false });
    expect((await search(email)).body.identities).toEqual([]);
  });

  it.each(['index', 'summary', 'missing', 'malformed'])('fails honestly instead of returning a clean/partial result on %s failure', async (failure) => {
    const a = identity('US', 'paypal'), b = identity('GB', 'paypal'); index(a, b);
    if (failure === 'missing') s3Store.delete(`${prefix}identities/${b.identityHash}.json`);
    else if (failure === 'malformed') putJson(`${prefix}index/identities.json`, {});
    else s3Faults.push((_command, input) => String(input.Key).endsWith(failure === 'index' ? 'index/identities.json' : `${b.identityHash}.json`) ? new Error('temporary 503') : null);
    const { status, body } = await search(email);
    expect(status).toBe(500);
    expect(body).toEqual({ error: 'Search failed' });
  });

  it('returns an empty list for an actual non-match', async () => {
    const a = identity('US', 'paypal'); index(a);
    expect((await search({ paymentIdentifier: 'different@example.invalid' })).body).toMatchObject({ matched: false, identities: [], identity: null });
  });

  it('does not extract a phone from digits in an email or a $handle', async () => {
    const phone = identity('US', 'phone', '2125550199');
    const emailIdentity = identity('US', 'paypal', 'seller2125550199@example.invalid');
    const cash = identity('US', 'cashapp', '$2125550199');
    index(phone, emailIdentity, cash);
    expect((await search({ paymentIdentifier: 'seller2125550199@example.invalid' })).body.identities.map((i: PaymentIdentitySummary) => i.rail)).toEqual(['paypal']);
    expect((await search({ paymentIdentifier: '$2125550199' })).body.identities.map((i: PaymentIdentitySummary) => i.rail)).toEqual(['cashapp']);
  });
});

describe('ambiguous identifiers and input limits', () => {
  it.each(['2125550199', '(212) 555-0199', '123456789012', '123/456'])('asks for a country for local identifier %s before reading storage', async (paymentIdentifier) => {
    const { status, body } = await search({ paymentIdentifier, country: 'all', rail: 'all' });
    expect(status).toBe(400); expect(body.error).toBe(SEARCH_COUNTRY_REQUIRED); expect(s3Calls).toHaveLength(0);
  });
  it('allows a local number once a country is selected', async () => {
    const a = identity('US', 'phone', '2125550199'), b = identity('GB', 'phone', '2125550199'); index(a, b);
    expect((await search({ country: 'US', rail: 'all', paymentIdentifier: '(212) 555-0199' })).body.identities.map((i: PaymentIdentitySummary) => i.country)).toEqual(['US']);
  });
  it('allows an international phone across countries without treating it as a bank account', async () => {
    const a = identity('US', 'phone', '+12125550199'), b = identity('GB', 'zelle', '+12125550199');
    const c = identity('US', 'bank_account', '+12125550199'); index(a, b, c);
    expect((await search({ paymentIdentifier: '+1 (212) 555-0199' })).body.identities.map((i: PaymentIdentitySummary) => i.rail)).toEqual(['phone', 'zelle']);
  });
  it('requires a country for an explicit bank account but supports IBAN global search', async () => {
    expect((await search({ paymentIdentifier: 'ABC1234', rail: 'bank_account' })).status).toBe(400);
    const iban = 'GB82WEST12345698765432'; index(identity('GB', 'iban', iban), identity('US', 'phone', '8212345698765432'));
    expect((await search({ paymentIdentifier: 'GB82 WEST 1234 5698 7654 32' })).body.identities).toHaveLength(1);
  });
  it.each([{ rail: 'bogus' }, { country: 'United States' }, { paymentIdentifier: 'x'.repeat(513) }, { rail: 'all', paymentIdentifier: '' }])('rejects invalid input %j', async (params) => {
    expect((await search({ ...email, ...params })).status).toBe(400); expect(s3Calls).toHaveLength(0);
  });
  it('preserves rate limiting without reading storage', async () => {
    rate.allowed = false; expect((await search(email)).status).toBe(429); expect(s3Calls).toHaveLength(0);
  });
});

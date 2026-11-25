import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/non-crypto-scam-database/search/route';
import { normalizePaymentIdentifier, publicView, type PaymentIdentitySummary, type PaymentRail } from '@/lib/non-crypto-scam-db';
import { putJson, resetS3, s3Calls, s3Faults } from './helpers/aws-s3-mock';
vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ success: true }) }));
const prefix = 'non-crypto-scam-database/';
function record(value: string, country = 'US', rail: PaymentRail = 'phone', extra: Partial<PaymentIdentitySummary> = {}) {
  const id = normalizePaymentIdentifier(rail, value, country);
  const row: PaymentIdentitySummary = {
    country, rail, identityHash: id.hash, identityMask: id.mask, categories: ['fake_service'],
    paymentMethodDetails: [], categoryDetails: [], aliases: [], states: [], reportIds: ['private'],
    independentReporterKeys: ['private-email-key'], reportCount: 3, independentReporters: 3,
    paymentProofCount: 0, totalReportedAmount: 100, currency: 'USD', firstReported: '2026-11-01',
    lastReported: '2026-11-25', publicLevel: 'multiple_reports', publicEligible: true, indexedEligible: false, ...extra,
  };
  putJson(`${prefix}identities/${id.hash}.json`, row);
  return row;
}
function index(...rows: PaymentIdentitySummary[]) { putJson(`${prefix}index/identities.json`, rows.map(publicView)); }
async function search(value: string, country = 'all', rail = 'all') {
  const response = await GET(new NextRequest(`https://example.invalid/api/non-crypto-scam-database/search?${new URLSearchParams({ paymentIdentifier: value, country, rail })}`));
  return { status: response.status, body: await response.json() };
}
beforeEach(resetS3);

describe('phone-format compatibility through the real public API', () => {
  it.each(['phone', 'zelle', 'apple_cash', 'chime'] as const)('%s finds old national and international keys both ways without the index', async (rail) => {
    const national = record('2125550199', 'US', rail);
    const first = await search('+1 (212) 555-0199', 'US', rail);
    expect(first.status).toBe(200); expect(first.body.identities.map((i: PaymentIdentitySummary) => i.identityHash)).toEqual([national.identityHash]);
    resetS3(); const international = record('+12125550199', 'US', rail);
    const second = await search('(212) 555-0199', 'US', rail);
    expect(second.body.identities.map((i: PaymentIdentitySummary) => i.identityHash)).toEqual([international.identityHash]);
    expect(s3Calls.every(c => c.command === 'GetObjectCommand')).toBe(true);
    expect(s3Calls.length).toBeLessThanOrEqual(6);
  });
  it.each([
    ['GB', '02079460958', '+442079460958'], ['FR', '0612345678', '+33612345678'],
    ['IT', '0669821234', '+390669821234'], ['RU', '84951234567', '+74951234567'],
    ['NG', '08031234567', '+2348031234567'],
  ])('%s searches public national keys from an international query and vice versa', async (country, local, international) => {
    const a = record(local, country); index(a);
    expect((await search(international)).body.identities.map((i: PaymentIdentitySummary) => i.identityHash)).toEqual([a.identityHash]);
    resetS3(); const b = record(international, country); index(b);
    expect((await search(local, country)).body.identities.map((i: PaymentIdentitySummary) => i.identityHash)).toEqual([b.identityHash]);
  });
  it('does not confuse identical national digits under US and GB', async () => {
    const us = record('2079460958', 'US'), gb = record('2079460958', 'GB'); index(us, gb);
    expect((await search('+442079460958')).body.identities.map((i: PaymentIdentitySummary) => i.country)).toEqual(['GB']);
    expect((await search('+12079460958')).body.identities.map((i: PaymentIdentitySummary) => i.country)).toEqual(['US']);
  });
  it('keeps historical local/code/+code clusters separate rather than adding counts', async () => {
    const a = record('2125550199'), b = record('12125550199', 'US', 'phone', { reportCount: 4 }), c = record('+12125550199', 'US', 'phone', { reportCount: 5 });
    index(a, a, b, c);
    const result = await search('+12125550199');
    expect(result.status).toBe(200);
    expect(result.body.identities.map((i: PaymentIdentitySummary) => i.reportCount)).toEqual([3, 4, 5]);
    expect(JSON.stringify(result.body)).not.toContain('private-email-key');
    expect(s3Calls.every(c => c.command === 'GetObjectCommand')).toBe(true);
  });
  it('does not give bank accounts or numeric handles derived phone matches', async () => {
    const phone = record('+12125550199'), bank = record('12125550199', 'US', 'bank_account'), handle = record('12125550199', 'US', 'cashapp');
    index(phone, bank, handle);
    expect((await search('2125550199', 'US')).body.identities.map((i: PaymentIdentitySummary) => i.rail)).toEqual(['phone']);
  });
  it('rechecks privacy of every matching old-format key', async () => {
    const a = record('2125550199'), b = record('+12125550199'); index(a, b);
    record('2125550199', 'US', 'phone', { publicEligible: false });
    record('+12125550199', 'US', 'phone', { publicationPaused: true });
    expect((await search('+12125550199')).body.identities).toEqual([]);
    expect((await search('2125550199', 'US', 'phone')).body.identities).toEqual([]);
  });
  it('fails instead of giving an incomplete negative when one exact alias cannot be read', async () => {
    const a = record('+12125550199');
    s3Faults.push((_command, input) => String(input.Key).endsWith(`${a.identityHash}.json`) ? new Error('503') : null);
    expect((await search('2125550199', 'US', 'phone')).status).toBe(500);
  });
  it('supports code without plus and IDD when the country is known', async () => {
    const a = record('02079460958', 'GB'); index(a);
    for (const query of ['442079460958', '00442079460958']) {
      expect((await search(query, 'GB', 'phone')).body.identities.map((i: PaymentIdentitySummary) => i.identityHash)).toEqual([a.identityHash]);
    }
  });
});

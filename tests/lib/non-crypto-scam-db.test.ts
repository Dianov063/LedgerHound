import { describe, expect, it } from 'vitest';
import {
  derivePublicLevel,
  hasUploadedPaymentProof,
  maskPaymentIdentifier,
  normalizeCountry,
  normalizePaymentIdentifier,
  normalizeTransactionReference,
  publicView,
  sanitizeHttpUrl,
  type PaymentIdentitySummary,
} from '@/lib/non-crypto-scam-db';

describe('normalizeCountry', () => {
  it('normalizes two and three character country codes', () => {
    expect(normalizeCountry(' us ')).toBe('US');
    expect(normalizeCountry('GB')).toBe('GB');
    expect(normalizeCountry('usa')).toBe('USA');
  });

  it('falls back to OTHER for unusable input', () => {
    expect(normalizeCountry('')).toBe('OTHER');
    expect(normalizeCountry('United States')).toBe('OTHER');
  });
});

describe('normalizePaymentIdentifier', () => {
  it('normalizes Zelle email identities case-insensitively', () => {
    const a = normalizePaymentIdentifier('zelle', ' VictimPay@Example.COM ', 'us');
    const b = normalizePaymentIdentifier('zelle', 'victimpay@example.com', 'US');
    expect(a.normalized).toBe('victimpay@example.com');
    expect(a.hash).toBe(b.hash);
    expect(a.mask).toBe('zelle email vi***@example.com');
  });

  it('normalizes Zelle phone identities to digits', () => {
    const identity = normalizePaymentIdentifier('zelle', '(212) 555-1234', 'US');
    expect(identity.normalized).toBe('2125551234');
    expect(identity.mask).toBe('zelle phone ending 1234');
  });

  it('normalizes Cash App and Venmo handles', () => {
    expect(normalizePaymentIdentifier('cashapp', ' $CakeSeller ', 'US').normalized).toBe('cakeseller');
    expect(normalizePaymentIdentifier('venmo', ' @CakeSeller ', 'US').normalized).toBe('cakeseller');
  });

  it('normalizes Apple Cash email and phone identities', () => {
    expect(normalizePaymentIdentifier('apple_cash', ' Seller@Example.COM ', 'US').normalized).toBe('seller@example.com');
    expect(normalizePaymentIdentifier('apple_cash', '(415) 555-0199', 'US').normalized).toBe('4155550199');
  });

  it('normalizes Chime handles without confusing handle digits for a phone', () => {
    expect(normalizePaymentIdentifier('chime', ' $CakeShop21 ', 'US').normalized).toBe('cakeshop21');
    expect(normalizePaymentIdentifier('chime', '(415) 555-0199', 'US').normalized).toBe('4155550199');
  });

  it('normalizes IBAN identifiers without spaces or hyphens', () => {
    const identity = normalizePaymentIdentifier('iban', 'gb82 west 1234-5698-7654-32', 'GB');
    expect(identity.normalized).toBe('GB82WEST12345698765432');
    expect(identity.mask).toBe('IBAN ending 5432 (GB)');
  });
});

describe('maskPaymentIdentifier', () => {
  it('does not expose full bank account identifiers', () => {
    const mask = maskPaymentIdentifier('bank_account', '1234567890123456', 'US');
    expect(mask).toBe('bank account ending 3456 (US)');
    expect(mask).not.toContain('1234567890123456');
  });

  it('masks handles without exposing the full value', () => {
    const mask = maskPaymentIdentifier('cashapp', 'cakeseller2026', 'US');
    expect(mask).toBe('Cash App $cak***26');
    expect(mask).not.toContain('cakeseller2026');
  });

  it('masks US Apple Cash and Chime identifiers', () => {
    expect(maskPaymentIdentifier('apple_cash', '4155550199', 'US')).toBe('Apple Cash phone ending 0199');
    expect(maskPaymentIdentifier('chime', 'cakeshop21', 'US')).toBe('Chime $cak***21');
    expect(maskPaymentIdentifier('chime', '4155550199', 'US')).toBe('Chime phone ending 0199');
  });
});

describe('private US report fields', () => {
  it('normalizes transaction references for private duplicate detection', () => {
    const a = normalizeTransactionReference('zelle', ' TXN-123 456 ');
    const b = normalizeTransactionReference('zelle', 'txn123456');
    const otherRail = normalizeTransactionReference('venmo', 'txn123456');

    expect(a.privateValue).toBe('TXN-123 456');
    expect(a.hash).toBe(b.hash);
    expect(a.hash).not.toBe(otherRail.hash);
  });

  it('keeps only http and https listing URLs', () => {
    expect(sanitizeHttpUrl('https://example.com/listing/123')).toBe('https://example.com/listing/123');
    expect(sanitizeHttpUrl('javascript:alert(1)')).toBeUndefined();
    expect(sanitizeHttpUrl('not a url')).toBeUndefined();
  });

  it('counts payment proof only when a private evidence file was uploaded', () => {
    expect(hasUploadedPaymentProof(['payment_receipt'], [])).toBe(false);
    expect(hasUploadedPaymentProof(['chat_screenshot'], ['non-crypto-scam-database/evidence/chat.png'])).toBe(false);
    expect(hasUploadedPaymentProof(['payment_receipt'], ['non-crypto-scam-database/evidence/receipt.png'])).toBe(true);
  });
});

describe('derivePublicLevel', () => {
  it('keeps one report private', () => {
    expect(derivePublicLevel({ independentReporters: 1, paymentProofCount: 1 })).toEqual({
      publicLevel: 'private_intake',
      publicEligible: false,
      indexedEligible: false,
    });
  });

  it('marks two independent reports as internal watch only', () => {
    expect(derivePublicLevel({ independentReporters: 2, paymentProofCount: 2 })).toEqual({
      publicLevel: 'internal_watch',
      publicEligible: false,
      indexedEligible: false,
    });
  });

  it('allows public warning at three independent reports without indexing', () => {
    expect(derivePublicLevel({ independentReporters: 3, paymentProofCount: 1 })).toEqual({
      publicLevel: 'multiple_reports',
      publicEligible: true,
      indexedEligible: false,
    });
  });

  it('allows indexing at five reports or three payment-proof reports', () => {
    expect(derivePublicLevel({ independentReporters: 5, paymentProofCount: 1 }).indexedEligible).toBe(true);
    expect(derivePublicLevel({ independentReporters: 3, paymentProofCount: 3 })).toEqual({
      publicLevel: 'payment_proof_cluster',
      publicEligible: true,
      indexedEligible: true,
    });
  });
});

describe('publicView', () => {
  it('removes private report ids and reporter keys', () => {
    const summary: PaymentIdentitySummary = {
      identityHash: 'abc',
      country: 'US',
      rail: 'zelle',
      identityMask: 'zelle phone ending 1234',
      categories: ['non_delivery_goods'],
      paymentMethodDetails: [],
      categoryDetails: [],
      aliases: ['Cake Seller'],
      reportIds: ['R1', 'R2'],
      reportCount: 2,
      independentReporterKeys: ['K1', 'K2'],
      independentReporters: 2,
      paymentProofCount: 1,
      totalReportedAmount: 120,
      currency: 'USD',
      firstReported: '2026-07-18T00:00:00.000Z',
      lastReported: '2026-07-18T00:00:00.000Z',
      publicLevel: 'internal_watch',
      publicEligible: false,
      indexedEligible: false,
    };

    const view = publicView(summary) as Record<string, unknown>;
    expect(view.reportIds).toBeUndefined();
    expect(view.independentReporterKeys).toBeUndefined();
    expect(view.identityMask).toBe('zelle phone ending 1234');
  });

  it('defaults missing detail arrays for older summaries', () => {
    const summary = {
      identityHash: 'abc',
      country: 'US',
      rail: 'other',
      identityMask: 'other ending 1234 (US)',
      categories: ['other'],
      aliases: [],
      reportIds: ['R1'],
      reportCount: 1,
      independentReporterKeys: ['K1'],
      independentReporters: 1,
      paymentProofCount: 0,
      totalReportedAmount: 0,
      currency: 'USD',
      firstReported: '2026-07-18T00:00:00.000Z',
      lastReported: '2026-07-18T00:00:00.000Z',
      publicLevel: 'private_intake',
      publicEligible: false,
      indexedEligible: false,
    } as PaymentIdentitySummary;

    expect(publicView(summary).paymentMethodDetails).toEqual([]);
    expect(publicView(summary).categoryDetails).toEqual([]);
  });
});

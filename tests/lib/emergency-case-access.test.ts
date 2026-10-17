// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CASE_ID_RE,
  __resetCaseAccessCacheForTests,
  createCaseSecret,
  sessionGrantsCase,
  verifyCaseSecret,
  verifyPaidSessionForCase,
} from '@/lib/emergency-case-access';

beforeEach(() => __resetCaseAccessCacheForTests());

describe('CASE_ID_RE', () => {
  it('accepts the current format and rejects legacy timestamp-only ids', () => {
    expect(CASE_ID_RE.test('ER-MGK1Z2AB-0123456789abcdef')).toBe(true);
    expect(CASE_ID_RE.test('ER-MGK1Z2AB')).toBe(false);
    expect(CASE_ID_RE.test('ER-MGK1Z2AB-0123')).toBe(false);
    expect(CASE_ID_RE.test('../etc/passwd')).toBe(false);
  });
});

describe('owner secret', () => {
  it('verifies only the matching secret', () => {
    const { secret, hash } = createCaseSecret();
    expect(verifyCaseSecret(secret, hash)).toBe(true);
    expect(verifyCaseSecret(createCaseSecret().secret, hash)).toBe(false);
    expect(verifyCaseSecret(undefined, hash)).toBe(false);
    expect(verifyCaseSecret(secret, undefined)).toBe(false);
    expect(verifyCaseSecret(hash, hash)).toBe(false); // the stored hash is not a credential
  });
});

describe('paid session check', () => {
  it('requires paid status and a matching case', () => {
    expect(sessionGrantsCase({ payment_status: 'paid', metadata: { caseId: 'A' } }, 'A')).toBe(true);
    expect(sessionGrantsCase({ payment_status: 'unpaid', metadata: { caseId: 'A' } }, 'A')).toBe(false);
    expect(sessionGrantsCase({ payment_status: 'paid', metadata: { caseId: 'B' } }, 'A')).toBe(false);
    expect(sessionGrantsCase({ payment_status: 'paid', metadata: {} }, 'A')).toBe(false);
  });

  it('caches positive results, never negative ones', async () => {
    const retrieve = vi.fn(async () => ({ payment_status: 'paid', metadata: { caseId: 'A' } }));
    expect(await verifyPaidSessionForCase('cs_test_abcdefghij1', 'A', retrieve)).toBe(true);
    expect(await verifyPaidSessionForCase('cs_test_abcdefghij1', 'A', retrieve)).toBe(true);
    expect(retrieve).toHaveBeenCalledTimes(1);

    const denied = vi.fn(async () => ({ payment_status: 'unpaid', metadata: { caseId: 'A' } }));
    expect(await verifyPaidSessionForCase('cs_test_abcdefghij2', 'A', denied)).toBe(false);
    expect(await verifyPaidSessionForCase('cs_test_abcdefghij2', 'A', denied)).toBe(false);
    expect(denied).toHaveBeenCalledTimes(2);
  });

  it('treats Stripe errors as denial', async () => {
    const failing = vi.fn(async () => { throw new Error('No such session'); });
    expect(await verifyPaidSessionForCase('cs_test_abcdefghij3', 'A', failing)).toBe(false);
  });
});

// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getJson, putJson, resetS3, s3Calls, s3Store } from './helpers/aws-s3-mock';
import { createSession, resetStripe } from './helpers/stripe-mock';
import { CASE_ID_RE, createCaseSecret, verifyCaseSecret } from '@/lib/emergency-case-access';
import { POST as checkout } from '@/app/api/emergency/checkout/route';
import { POST as analyze } from '@/app/api/emergency/analyze/route';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('stripe', () => import('./helpers/stripe-mock'));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }),
}));
vi.mock('@/lib/scam-db', () => ({
  getPlatformIndex: async () => [],
  slugify: (s: string) => s.toLowerCase(),
}));


const CASE = 'ER-MGK1Z2AB-0123456789abcdef';
let ownerSecret = '';

function post(handler: (r: NextRequest) => Promise<Response>, body: unknown) {
  return handler(
    new NextRequest('https://www.ledgerhound.vip/api/emergency/x', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

const validBody = (overrides: Record<string, unknown> = {}) => ({
  product: 'emergency_pack',
  caseId: CASE,
  caseSecret: ownerSecret,
  email: 'victim@example.com',
  description: 'victim description',
  ...overrides,
});

beforeEach(() => {
  resetS3();
  resetStripe();
  const owner = createCaseSecret();
  ownerSecret = owner.secret;
  putJson(`emergency-cases/${CASE}.json`, {
    caseId: CASE,
    ownerSecretHash: owner.hash,
    email: 'victim@example.com',
    analysis: { recoveryScore: 80 },
  });
});

const caseBody = () => s3Store.get(`emergency-cases/${CASE}.json`)?.body;

describe('POST /api/emergency/checkout ownership', () => {
  it('rejects a request without the owner secret and leaves the case untouched', async () => {
    const before = caseBody();
    const res = await post(checkout, validBody({ caseSecret: undefined, email: 'attacker@example.com' }));
    expect(res.status).toBe(403);
    expect(caseBody()).toBe(before);
    expect(createSession).not.toHaveBeenCalled();
  });

  it('rejects a wrong owner secret and leaves the case untouched', async () => {
    const before = caseBody();
    const res = await post(checkout, validBody({ caseSecret: createCaseSecret().secret, description: 'tampered' }));
    expect(res.status).toBe(403);
    expect(caseBody()).toBe(before);
  });

  it('rejects legacy timestamp-only case ids outright', async () => {
    const res = await post(checkout, validBody({ caseId: 'ER-MGK1Z2AB' }));
    expect(res.status).toBe(400);
    expect(s3Calls.some((c) => c.command === 'PutObjectCommand')).toBe(false);
  });

  it('does not create a case that analyze never created', async () => {
    const res = await post(checkout, validBody({ caseId: 'ER-MGK1Z2AC-fedcba9876543210' }));
    expect(res.status).toBe(403);
    expect(s3Store.has('emergency-cases/ER-MGK1Z2AC-fedcba9876543210.json')).toBe(false);
  });

  it('refuses to rewrite a case whose pack was already generated (paid)', async () => {
    s3Store.set(`legal-packs/cases/${CASE}/police-complaint.pdf`, { body: '%PDF', modified: new Date(), input: {} });
    const before = caseBody();
    const res = await post(checkout, validBody({ description: 'changed after payment' }));
    expect(res.status).toBe(409);
    expect(caseBody()).toBe(before);
  });

  it('lets the owner check out, keeping analyze data and the owner hash', async () => {
    const res = await post(checkout, validBody());
    expect(res.status).toBe(200);
    const saved = getJson<Record<string, unknown>>(`emergency-cases/${CASE}.json`)!;
    expect(saved.description).toBe('victim description');
    expect(saved.analysis).toEqual({ recoveryScore: 80 });
    expect(verifyCaseSecret(ownerSecret, saved.ownerSecretHash)).toBe(true);
    expect(createSession.mock.calls[0][0].metadata?.caseId).toBe(CASE);
  });

  it('does not leak internal error messages', async () => {
    createSession.mockRejectedValueOnce(new Error('sk_live_secret internal detail'));
    const res = await post(checkout, validBody());
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('internal detail');
  });
});

describe('POST /api/emergency/analyze issues an owner secret', () => {
  it('returns a new-format id plus secret, stores only the hash, never overwrites', async () => {
    const res = await post(analyze, { country: 'US', email: 'victim@example.com', lossAmount: 100 });
    const data = await res.json();
    expect(data.caseId).toMatch(CASE_ID_RE);
    expect(data.caseSecret).toMatch(/^[0-9a-f]{32}$/);
    const stored = getJson<Record<string, unknown>>(`emergency-cases/${data.caseId}.json`)!;
    expect(stored.caseSecret).toBeUndefined();
    expect(JSON.stringify(stored)).not.toContain(data.caseSecret);
    expect(verifyCaseSecret(data.caseSecret, stored.ownerSecretHash)).toBe(true);
    const put = s3Calls.find((c) => c.command === 'PutObjectCommand');
    expect(put?.input.IfNoneMatch).toBe('*');
  });
});

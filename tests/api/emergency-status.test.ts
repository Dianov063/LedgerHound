// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { putJson, resetS3, s3Store } from './helpers/aws-s3-mock';
import { resetStripe, retrieveSession, stripeSessions } from './helpers/stripe-mock';
import { __resetCaseAccessCacheForTests } from '@/lib/emergency-case-access';
import { GET } from '@/app/api/emergency/status/route';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('stripe', () => import('./helpers/stripe-mock'));
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: async (_client: unknown, cmd: { input: { Key: string } }) => `https://signed.example/${cmd.input.Key}`,
}));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }),
}));


const NEW_CASE = 'ER-MGK1Z2AB-0123456789abcdef';
const OTHER_CASE = 'ER-MGK1Z2AC-fedcba9876543210';
const LEGACY_CASE = 'ER-MGK1Z2AB'; // pre-2026-10 timestamp-only id (enumerable)

function seedPack(caseId: string, email: string) {
  putJson(`emergency-cases/${caseId}.json`, { caseId, email });
  s3Store.set(`legal-packs/cases/${caseId}/police-complaint.pdf`, { body: '%PDF', modified: new Date(), input: {} });
}

function seedSession(id: string, caseId: string, paid = true) {
  stripeSessions.set(id, { id, payment_status: paid ? 'paid' : 'unpaid', metadata: { caseId } });
}

function request(params: Record<string, string>, headers: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return new NextRequest(`https://www.ledgerhound.vip/api/emergency/status?${qs}`, { headers });
}

async function call(params: Record<string, string>, headers?: Record<string, string>) {
  const res = await GET(request(params, headers));
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  resetS3();
  resetStripe();
  __resetCaseAccessCacheForTests();
  process.env.ADMIN_PASSWORD = 'correct-horse-battery-staple';
  seedPack(NEW_CASE, 'victim@example.com');
  seedPack(OTHER_CASE, 'other@example.com');
  seedPack(LEGACY_CASE, 'legacy@example.com');
});

describe('GET /api/emergency/status access control', () => {
  it('denies a request that presents only the case id', async () => {
    const { status, body } = await call({ case_id: NEW_CASE });
    expect(status).toBe(403);
    expect(JSON.stringify(body)).not.toContain('victim@example.com');
    expect(body.documents).toBeUndefined();
  });

  it('denies a guessed legacy (timestamp-only) case id without a paid session', async () => {
    const { status, body } = await call({ case_id: LEGACY_CASE });
    expect(status).toBe(403);
    expect(JSON.stringify(body)).not.toContain('legacy@example.com');
  });

  it('returns documents and email for the paid session that bought the case', async () => {
    seedSession('cs_test_buyer00000001', NEW_CASE);
    const { status, body } = await call({ case_id: NEW_CASE, session_id: 'cs_test_buyer00000001' });
    expect(status).toBe(200);
    expect(body.status).toBe('ready');
    expect(body.email).toBe('victim@example.com');
    expect(body.documents[0].url).toContain(`legal-packs/cases/${NEW_CASE}/police-complaint.pdf`);
  });

  it('keeps access for a legitimate buyer of a legacy case via their paid session', async () => {
    seedSession('cs_live_legacybuyer0001', LEGACY_CASE);
    const { status, body } = await call({ case_id: LEGACY_CASE, session_id: 'cs_live_legacybuyer0001' });
    expect(status).toBe(200);
    expect(body.email).toBe('legacy@example.com');
  });

  it("denies someone else's case even with a valid paid session of their own", async () => {
    seedSession('cs_test_attacker000001', OTHER_CASE);
    for (const target of [NEW_CASE, LEGACY_CASE]) {
      const { status, body } = await call({ case_id: target, session_id: 'cs_test_attacker000001' });
      expect(status).toBe(403);
      expect(JSON.stringify(body)).not.toMatch(/victim@|legacy@/);
    }
  });

  it('denies an unpaid session for the right case', async () => {
    seedSession('cs_test_unpaid00000001', NEW_CASE, false);
    const { status } = await call({ case_id: NEW_CASE, session_id: 'cs_test_unpaid00000001' });
    expect(status).toBe(403);
  });

  it('rejects malformed session ids without calling Stripe', async () => {
    const { status } = await call({ case_id: NEW_CASE, session_id: 'not-a-session' });
    expect(status).toBe(403);
    expect(retrieveSession).not.toHaveBeenCalled();
  });

  it('allows the admin key and rejects a wrong admin key', async () => {
    const ok = await call({ case_id: LEGACY_CASE }, { 'x-admin-key': 'correct-horse-battery-staple' });
    expect(ok.status).toBe(200);
    const bad = await call({ case_id: LEGACY_CASE }, { 'x-admin-key': 'guess' });
    expect(bad.status).toBe(401);
    expect(JSON.stringify(bad.body)).not.toContain('legacy@example.com');
  });
});

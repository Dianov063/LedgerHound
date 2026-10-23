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
  const key = `legal-packs/cases/${caseId}/police-complaint.pdf`;
  s3Store.set(key, { body: '%PDF', modified: new Date(), input: {} });
  // Complete set: the manifest is written after every document is stored.
  putJson(`legal-packs/cases/${caseId}/manifest.json`, {
    caseId, createdAt: new Date().toISOString(),
    documents: [{ type: 'police-complaint', label: 'Police Complaint', key, url: 'x' }], email: {},
  });
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

describe('GET /api/emergency/status completeness', () => {
  const CASE = 'ER-MGK1Z2AD-1111111111111111';
  const pdf = (doc: string) => `legal-packs/cases/${CASE}/${doc}.pdf`;
  beforeEach(() => {
    putJson(`emergency-cases/${CASE}.json`, { caseId: CASE, email: 'p@example.com' });
    seedSession('cs_test_partial000001', CASE);
  });
  const status = () => call({ case_id: CASE, session_id: 'cs_test_partial000001' });

  it('reports generating (no documents) while only part of the pack exists', async () => {
    s3Store.set(pdf('police-complaint'), { body: '%PDF', modified: new Date(), input: {} });
    const { status: code, body } = await status();
    expect(code).toBe(200);
    expect(body.status).toBe('generating');
    expect(body.documents).toEqual([]);
  });

  it('reports ready with exactly the documents of the complete set', async () => {
    for (const d of ['police-complaint', 'regulator-complaint']) s3Store.set(pdf(d), { body: '%PDF', modified: new Date(), input: {} });
    putJson(`legal-packs/cases/${CASE}/manifest.json`, {
      caseId: CASE, createdAt: 'now', email: {},
      documents: ['police-complaint', 'regulator-complaint'].map((d) => ({ type: d, label: d, key: pdf(d), url: 'x' })),
    });
    const { body } = await status();
    expect(body.status).toBe('ready');
    expect(body.documents.map((d: { type: string }) => d.type).sort()).toEqual(['police-complaint', 'regulator-complaint']);
  });

  it('treats an old pack without a manifest (generated before manifests) as ready', async () => {
    const old = new Date(Date.now() - 72 * 3600 * 1000);
    s3Store.set(pdf('police-complaint'), { body: '%PDF', modified: old, input: {} });
    const { body } = await status();
    expect(body.status).toBe('ready');
    expect(body.documents).toHaveLength(1);
  });
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

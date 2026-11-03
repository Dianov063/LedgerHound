// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { resetStripe, retrieveSession, stripeSessions } from './helpers/stripe-mock';
import { GET as reportStatus } from '@/app/api/report-status/route';
import { POST as scamCheck } from '@/app/api/scam-check/route';

vi.mock('stripe', () => import('./helpers/stripe-mock'));
vi.mock('@/lib/reports-log', () => ({ getReports: async () => [] }));
vi.mock('@/lib/s3-storage', () => ({ getReportDownloadUrl: async () => 'https://signed.example/report.pdf' }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }) }));

const ofacListed = new Set<string>();
vi.mock('@/lib/labels/ofac', () => ({
  checkOfac: async (address: string) => (ofacListed.has(address)
    ? { source: 'ofac', tag: 'OFAC SDN (ETH)', category: 'sanctions', confidence: 1 }
    : null),
}));
vi.mock('@/lib/scam-db', () => ({ getAddressIndex: async () => null }));

const status = (sessionId?: string) => reportStatus(new NextRequest(
  `https://www.ledgerhound.vip/api/report-status${sessionId === undefined ? '' : `?session_id=${encodeURIComponent(sessionId)}`}`,
));

const check = (address: string) => scamCheck(new NextRequest('https://www.ledgerhound.vip/api/scam-check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address }),
}));

beforeEach(() => {
  resetStripe();
  ofacListed.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/report-status', () => {
  it('rejects a missing session id', async () => {
    expect((await status()).status).toBe(400);
  });

  it('rejects a malformed session id without asking Stripe', async () => {
    const res = await status('not-a-session');
    expect(res.status).toBe(400);
    expect(retrieveSession).not.toHaveBeenCalled();
  });

  it('answers 404, not 500, for a session Stripe does not know', async () => {
    const res = await status('cs_test_doesnotexist0000');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Session not found' });
  });

  it('still answers 500 when Stripe itself fails', async () => {
    retrieveSession.mockImplementationOnce(async () => { throw Object.assign(new Error('boom'), { type: 'StripeAPIError' }); });
    expect((await status('cs_test_stripeisdown00000')).status).toBe(500);
  });

  it('reports processing for a paid session whose report is not ready yet', async () => {
    stripeSessions.set('cs_test_paidsession00000', { id: 'cs_test_paidsession00000', payment_status: 'paid', metadata: { email: 'qa@example.invalid' } });
    const body = await (await status('cs_test_paidsession00000')).json();
    expect(body.status).toBe('processing');
  });
});

describe('POST /api/scam-check', () => {
  const SANCTIONED = '0x' + '1'.repeat(40);
  const CLEAN = '0x' + '2'.repeat(40);

  it('flags an address on the OFAC SDN list', async () => {
    ofacListed.add(SANCTIONED);
    const body = await (await check(SANCTIONED)).json();
    expect(body.isFlagged).toBe(true);
    expect(body.riskLevel).toBe('CRITICAL');
    expect(body.sources).toContainEqual(expect.objectContaining({ source: 'OFAC SDN list', type: 'sanctioned' }));
    expect(body.categories[0]).toBe('OFAC Sanctioned');
  });

  it('does not call Chainabuse: a keyless request is always refused', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const body = await (await check(CLEAN)).json();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(body.isFlagged).toBe(false);
    expect(body).not.toHaveProperty('chainabuseReports');
  });
});

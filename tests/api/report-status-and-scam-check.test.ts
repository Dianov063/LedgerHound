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
let ofacDown = false;
vi.mock('@/lib/labels/ofac', () => ({
  checkOfac: async (address: string) => {
    if (ofacDown) throw new Error('OFAC SDN list unavailable: S3 timeout');
    return ofacListed.has(address) ? { source: 'ofac', tag: 'OFAC SDN (ETH)', category: 'sanctions', confidence: 1 } : null;
  },
}));
let scamDbDown = false;
const scamDbListed = new Set<string>();
vi.mock('@/lib/scam-db', () => ({
  getAddressIndex: async (address: string) => {
    if (scamDbDown) throw new Error('S3 timeout');
    return scamDbListed.has(address) ? { platforms: ['demo'], platformNames: ['Demo Platform'], reports: [{}] } : null;
  },
}));

const status = (sessionId?: string) => reportStatus(new NextRequest(
  `https://www.ledgerhound.vip/api/report-status${sessionId === undefined ? '' : `?session_id=${encodeURIComponent(sessionId)}`}`,
));

const check = (address: string) => scamCheck(new NextRequest('https://www.ledgerhound.vip/api/scam-check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address }),
}));

const stripeError = (code: string | undefined, type = 'StripeInvalidRequestError') =>
  Object.assign(new Error('stripe error'), { type, code });

beforeEach(() => {
  resetStripe();
  ofacListed.clear();
  scamDbListed.clear();
  ofacDown = false;
  scamDbDown = false;
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

  it('answers 404 when Stripe confirms the session does not exist', async () => {
    retrieveSession.mockImplementationOnce(async () => { throw stripeError('resource_missing'); });
    const res = await status('cs_test_doesnotexist0000');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Session not found' });
  });

  it.each([
    ['another invalid-request error', stripeError('parameter_invalid_string')],
    ['an invalid-request error without a code', stripeError(undefined)],
    ['a Stripe API failure', stripeError(undefined, 'StripeAPIError')],
  ])('does not hide %s behind a 404', async (_name, error) => {
    retrieveSession.mockImplementationOnce(async () => { throw error; });
    expect((await status('cs_test_stripeerror000000')).status).toBe(500);
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
    expect(body.incomplete).toBe(false);
    expect(body.sources).toContainEqual(expect.objectContaining({ source: 'OFAC SDN list', type: 'sanctioned' }));
    expect(body.categories[0]).toBe('OFAC Sanctioned');
  });

  it('calls a fully checked address with no matches clean', async () => {
    const body = await (await check(CLEAN)).json();
    expect(body).toMatchObject({ isFlagged: false, riskLevel: 'CLEAN', incomplete: false, unavailableSources: [] });
  });

  it.each([
    ['the OFAC list', () => { ofacDown = true; }, 'OFAC SDN list'],
    ['the scam database', () => { scamDbDown = true; }, 'LedgerHound Scam Database'],
  ])('does not call an address clean when %s cannot be read', async (_name, breakSource, source) => {
    breakSource();
    const body = await (await check(CLEAN)).json();
    expect(body).toMatchObject({ isFlagged: false, riskLevel: 'INCOMPLETE', incomplete: true, unavailableSources: [source] });
  });

  it('keeps a match from one source and marks the result incomplete when another is down', async () => {
    scamDbListed.add(CLEAN);
    ofacDown = true;
    const body = await (await check(CLEAN)).json();
    expect(body).toMatchObject({ isFlagged: true, riskLevel: 'HIGH', incomplete: true, unavailableSources: ['OFAC SDN list'] });
  });

  it('does not call Chainabuse: a keyless request is always refused', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const body = await (await check(CLEAN)).json();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(body).not.toHaveProperty('chainabuseReports');
  });
});

// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { putJson, resetS3, s3Store } from './helpers/aws-s3-mock';
import { createSession, resetStripe } from './helpers/stripe-mock';
import { createCaseSecret } from '@/lib/emergency-case-access';
import { getPublicOrigin, publicOriginProblem } from '@/lib/public-origin';
import { POST as createCheckout } from '@/app/api/create-checkout/route';
import { POST as emergencyCheckout } from '@/app/api/emergency/checkout/route';
import { GET as verifyEmail } from '@/app/api/non-crypto-scam-database/verify-email/route';
import { POST as scamReport } from '@/app/api/scam-database/report/route';
import { GET as health } from '@/app/api/health/route';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('stripe', () => import('./helpers/stripe-mock'));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }),
  hasUpstash: false,
}));
const nonCrypto = vi.hoisted(() => ({ verifyToken: vi.fn() }));
vi.mock('@/lib/non-crypto-scam-db', () => ({
  verifyNonCryptoEmailToken: nonCrypto.verifyToken,
  createNonCryptoEmailVerification: vi.fn(),
}));
vi.mock('@/lib/payment-safety-emails', () => ({ sendPaymentReportVerification: vi.fn() }));
const scamDb = vi.hoisted(() => ({ saveReport: vi.fn() }));
vi.mock('@/lib/scam-db', () => ({
  saveReport: scamDb.saveReport,
  isTxidUsed: async () => false,
  calcRecoveryScore: () => ({ score: 50, label: 'x', factors: [] }),
  getPlatformIndex: async () => [],
  slugify: (s: string) => s.toLowerCase(),
}));

const PUBLIC = 'https://www.ledgerhound.vip';
// What the standalone server hands the route handler behind Caddy, with spoofed headers.
const BOUND = 'https://0.0.0.0:3000';
const SPOOFED = { host: 'evil.example', 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'http' };
const CASE = 'ER-MGK1Z2AB-0123456789abcdef';
const WALLET = '0xbc8996a9a5ff12ebf8702e857cc0faa451dc9569';
const EMAIL = 'buyer+tag@example.com';

const request = (url: string, body?: unknown) => new NextRequest(url, {
  method: body === undefined ? 'GET' : 'POST',
  headers: { ...SPOOFED, 'content-type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const stripeParams = () => createSession.mock.calls[0][0] as unknown as { success_url: string; cancel_url: string };

function seedCase(): string {
  const owner = createCaseSecret();
  putJson(`emergency-cases/${CASE}.json`, { caseId: CASE, ownerSecretHash: owner.hash, email: EMAIL });
  return owner.secret;
}

const reportBody = {
  platformName: 'Fake Exchange',
  platformType: 'fake_exchange',
  description: 'x'.repeat(120),
  txHash: '0xabc',
  network: 'eth',
};

beforeEach(() => {
  resetS3();
  resetStripe();
  nonCrypto.verifyToken.mockReset();
  scamDb.saveReport.mockReset();
  scamDb.saveReport.mockResolvedValue({ id: 'r1', report: { id: 'r1', slug: 'fake-exchange' } });
  vi.stubEnv('LEDGERHOUND_PUBLIC_ORIGIN', PUBLIC);
  vi.stubEnv('LEDGERHOUND_SELF_HOST', '1');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('self-hosted behind a proxy: addresses stay on the configured origin', () => {
  it('forensic checkout sends Stripe the exact return URLs', async () => {
    const res = await createCheckout(request(`${BOUND}/api/create-checkout`, { walletAddress: WALLET, email: EMAIL }));
    expect(res.status).toBe(200);
    expect(stripeParams().success_url).toBe(
      `${PUBLIC}/report/success?session_id={CHECKOUT_SESSION_ID}&email=buyer%2Btag%40example.com`,
    );
    expect(stripeParams().cancel_url).toBe(`${PUBLIC}/report`);
  });

  it('emergency checkout sends Stripe the exact return URLs', async () => {
    const caseSecret = seedCase();
    const res = await emergencyCheckout(request(`${BOUND}/api/emergency/checkout`, {
      product: 'emergency_pack', caseId: CASE, caseSecret, email: EMAIL, description: 'victim description',
    }));
    expect(res.status).toBe(200);
    expect(stripeParams().success_url).toBe(
      `${PUBLIC}/emergency/success?session_id={CHECKOUT_SESSION_ID}&case_id=${CASE}&product=emergency_pack`,
    );
    expect(stripeParams().cancel_url).toBe(`${PUBLIC}/emergency`);
  });

  it('a verified email link keeps the locale and report id', async () => {
    nonCrypto.verifyToken.mockResolvedValue({ locale: 'ru', reportId: 'a b/1' });
    const res = await verifyEmail(request(`${BOUND}/api/non-crypto-scam-database/verify-email?token=t`));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`${PUBLIC}/ru/payment-safety?emailVerified=1&reportId=a%20b%2F1`);
  });

  it('an English verified link has no locale prefix', async () => {
    nonCrypto.verifyToken.mockResolvedValue({ locale: 'en', reportId: 'r1' });
    const res = await verifyEmail(request(`${BOUND}/api/non-crypto-scam-database/verify-email?token=t`));
    expect(res.headers.get('location')).toBe(`${PUBLIC}/payment-safety?emailVerified=1&reportId=r1`);
  });

  it('a rejected email link redirects to the public error page', async () => {
    nonCrypto.verifyToken.mockRejectedValue(new Error('bad token'));
    const res = await verifyEmail(request(`${BOUND}/api/non-crypto-scam-database/verify-email?token=bad`));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(`${PUBLIC}/payment-safety?emailVerificationError=1`);
  });

  it('the report asks the public origin to verify the transaction and keeps the result', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({
      hash: '0xabc', from: '0x1', to: '0x2', value: '1', token: 'ETH', network: 'eth', networkLabel: 'Ethereum', timestamp: 1,
    })));
    vi.stubGlobal('fetch', fetchMock);
    const res = await scamReport(request(`${BOUND}/api/scam-database/report`, reportBody));
    expect(res.status).toBeLessThan(300);
    expect(fetchMock.mock.calls[0][0]).toBe(`${PUBLIC}/api/tx`);
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
    expect(scamDb.saveReport.mock.calls[0][0]).toMatchObject({ blockchainConfirmed: true, verified: true, scamAddress: '0x2' });
  });

  it('a failed transaction lookup still saves an unverified report, as before', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network'); }));
    const res = await scamReport(request(`${BOUND}/api/scam-database/report`, reportBody));
    expect(res.status).toBeLessThan(300);
    expect(scamDb.saveReport.mock.calls[0][0]).toMatchObject({ blockchainConfirmed: false });
  });

  it('a report without a transaction makes no request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const res = await scamReport(request(`${BOUND}/api/scam-database/report`, { ...reportBody, txHash: undefined }));
    expect(res.status).toBeLessThan(300);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe.each([
  ['missing', undefined],
  ['invalid', 'http://www.ledgerhound.vip/path?x=1'],
])('self-hosted with a %s origin: refused, nothing is done with the bad address', (_name, value) => {
  beforeEach(() => {
    if (value === undefined) vi.stubEnv('LEDGERHOUND_PUBLIC_ORIGIN', '');
    else vi.stubEnv('LEDGERHOUND_PUBLIC_ORIGIN', value);
  });

  it('forensic checkout does not reach Stripe', async () => {
    const res = await createCheckout(request(`${BOUND}/api/create-checkout`, { walletAddress: WALLET, email: EMAIL }));
    expect(res.status).toBe(500);
    expect(createSession).not.toHaveBeenCalled();
    expect(JSON.stringify(await res.json())).not.toContain('LEDGERHOUND_PUBLIC_ORIGIN');
  });

  it('emergency checkout leaves the case untouched and does not reach Stripe', async () => {
    const caseSecret = seedCase();
    const before = s3Store.get(`emergency-cases/${CASE}.json`)?.body;
    const res = await emergencyCheckout(request(`${BOUND}/api/emergency/checkout`, {
      product: 'emergency_pack', caseId: CASE, caseSecret, email: EMAIL, description: 'changed',
    }));
    expect(res.status).toBe(500);
    expect(createSession).not.toHaveBeenCalled();
    expect(s3Store.get(`emergency-cases/${CASE}.json`)?.body).toBe(before);
  });

  it('an email link is not used up and does not redirect', async () => {
    const res = await verifyEmail(request(`${BOUND}/api/non-crypto-scam-database/verify-email?token=t`));
    expect(res.status).toBe(500);
    expect(res.headers.get('location')).toBeNull();
    expect(nonCrypto.verifyToken).not.toHaveBeenCalled();
  });

  it('a report with a transaction fails instead of being saved as unverified', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const res = await scamReport(request(`${BOUND}/api/scam-database/report`, reportBody));
    expect(res.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(scamDb.saveReport).not.toHaveBeenCalled();
  });

  it('health reports misconfigured without naming the value', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_x');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_x');
    vi.stubEnv('AWS_ACCESS_KEY_ID', 'a');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'b');
    vi.stubEnv('AWS_S3_BUCKET', 'c');
    vi.stubEnv('ADMIN_PASSWORD', 'd');
    const res = await health();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'misconfigured' });
  });
});

describe('Vercel and local development (variable unset)', () => {
  beforeEach(() => {
    vi.stubEnv('LEDGERHOUND_PUBLIC_ORIGIN', '');
    vi.stubEnv('LEDGERHOUND_SELF_HOST', '');
  });

  it.each([
    ['production domain', PUBLIC],
    ['preview deployment', 'https://ledger-hound-abc123-team.vercel.app'],
    ['local development', 'http://localhost:3000'],
  ])('%s keeps its own origin', async (_name, origin) => {
    const res = await createCheckout(request(`${origin}/api/create-checkout`, { walletAddress: WALLET, email: EMAIL }));
    expect(res.status).toBe(200);
    expect(stripeParams().cancel_url).toBe(`${origin}/report`);
    expect(publicOriginProblem()).toBeNull();
  });

  it.each(['http://0.0.0.0:3000', 'https://0.0.0.0:3000', 'http://[::]:3000'])(
    'never returns the bind address %s, even if self-hosting is not detected',
    (url) => {
      expect(() => getPublicOrigin(new NextRequest(`${url}/x`))).toThrow(/LEDGERHOUND_PUBLIC_ORIGIN/);
    },
  );
});

describe('validation of LEDGERHOUND_PUBLIC_ORIGIN', () => {
  const req = new NextRequest(`${BOUND}/x`);
  const parse = (value: string) => {
    vi.stubEnv('LEDGERHOUND_PUBLIC_ORIGIN', value);
    return getPublicOrigin(req);
  };

  it.each([
    [PUBLIC, PUBLIC],
    [`${PUBLIC}/`, PUBLIC],
    ['https://WWW.LedgerHound.VIP', PUBLIC],
    ['https://staging.example.com:8443', 'https://staging.example.com:8443'],
  ])('accepts %s', (value, expected) => {
    expect(parse(value)).toBe(expected);
  });

  it.each([
    ['no scheme', 'www.ledgerhound.vip'],
    ['not a URL', 'not a url'],
    ['ftp', 'ftp://www.ledgerhound.vip'],
    ['javascript', 'javascript:alert(1)'],
    ['credentials', 'https://user:pass@www.ledgerhound.vip'],
    ['username', 'https://user@www.ledgerhound.vip'],
    ['query', 'https://www.ledgerhound.vip?x=1'],
    ['empty query', 'https://www.ledgerhound.vip/?'],
    ['fragment', 'https://www.ledgerhound.vip#x'],
    ['path', 'https://www.ledgerhound.vip/app'],
    ['double slash', 'https://www.ledgerhound.vip//'],
    ['dot path', 'https://www.ledgerhound.vip/.'],
    ['surrounding space', ' https://www.ledgerhound.vip'],
    ['backslash', 'https:\\\\www.ledgerhound.vip'],
  ])('rejects %s', (_name, value) => {
    expect(() => parse(value)).toThrow(/LEDGERHOUND_PUBLIC_ORIGIN/);
  });

  it('allows http outside production', () => {
    expect(parse('http://localhost:3000')).toBe('http://localhost:3000');
  });

  describe('in production', () => {
    beforeEach(() => vi.stubEnv('NODE_ENV', 'production'));

    it('accepts the public https origin', () => {
      expect(parse(PUBLIC)).toBe(PUBLIC);
    });

    it.each([
      'http://www.ledgerhound.vip',
      'https://0.0.0.0:3000',
      'https://localhost',
      'https://127.0.0.1',
      'https://[::1]',
      'https://ledgerhound-web:3000',
    ])('rejects %s', (value) => {
      expect(() => parse(value)).toThrow(/LEDGERHOUND_PUBLIC_ORIGIN/);
    });
  });
});

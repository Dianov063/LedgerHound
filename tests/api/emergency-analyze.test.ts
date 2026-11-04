// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getJson, resetS3 } from './helpers/aws-s3-mock';
import { POST as analyze } from '@/app/api/emergency/analyze/route';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }) }));

const ofacListed = new Set<string>();
let ofacDown = false;
vi.mock('@/lib/labels/ofac', () => ({
  checkOfac: async (address: string) => {
    if (ofacDown) throw new Error('OFAC SDN list unavailable: S3 timeout');
    return ofacListed.has(address) ? { source: 'ofac', tag: 'OFAC SDN (ETH)' } : null;
  },
}));
let scamDbDown = false;
vi.mock('@/lib/scam-db', () => ({
  slugify: (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  getPlatformIndex: async () => {
    if (scamDbDown) throw new Error('S3 timeout');
    return [{ slug: 'demo-platform', name: 'Demo Platform', victims: 4, totalLoss: 90000, addresses: [] }];
  },
}));

const BINANCE = '0x28c6c06298d514db089934071355e5743bf21d60';
const OTHER = '0x' + '2'.repeat(40);

const send = (fields: Record<string, unknown>) => analyze(new NextRequest('https://www.ledgerhound.vip/api/emergency/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ country: 'US', lossAmount: 5000, txDate: new Date().toISOString().slice(0, 10), email: 'qa@example.invalid', ...fields }),
}));

beforeEach(() => {
  resetS3();
  vi.stubEnv('AWS_S3_BUCKET', 'test-bucket');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  ofacListed.clear();
  ofacDown = false;
  scamDbDown = false;
});

describe('Emergency analysis', () => {
  it('reports what it checked and no recovery score', async () => {
    const res = await send({ walletAddress: BINANCE, platformName: 'Demo Platform' });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.analysis).toMatchObject({
      exchange: 'Binance',
      ofacStatus: 'clear',
      scamDbStatus: 'match',
      scamDbMatch: { name: 'Demo Platform', victims: 4 },
    });
    expect(body.analysis).not.toHaveProperty('recoveryScore');
    expect(body.analysis).not.toHaveProperty('recoveryLabel');
  });

  it('marks a listed address as listed', async () => {
    ofacListed.add(OTHER);
    const body = await (await send({ walletAddress: OTHER })).json();
    expect(body.analysis).toMatchObject({ exchange: null, ofacStatus: 'listed', hasOfac: true });
  });

  it('never reports an unreadable source as clean', async () => {
    ofacDown = true;
    scamDbDown = true;
    const body = await (await send({ walletAddress: OTHER, platformName: 'Demo Platform' })).json();
    expect(body.analysis).toMatchObject({ ofacStatus: 'unavailable', scamDbStatus: 'unavailable', hasOfac: false });
  });

  it('says what was not checked', async () => {
    const body = await (await send({ walletAddress: '', platformName: '' })).json();
    expect(body.analysis).toMatchObject({ ofacStatus: 'not_checked', scamDbStatus: 'not_checked' });
  });

  it('tells an unknown platform from a database failure', async () => {
    const body = await (await send({ walletAddress: OTHER, platformName: 'Unknown Venue' })).json();
    expect(body.analysis.scamDbStatus).toBe('no_match');
  });

  it('stores the statuses with the case', async () => {
    const body = await (await send({ walletAddress: OTHER, platformName: 'Demo Platform' })).json();
    const stored = getJson<{ analysis: Record<string, unknown> }>(`emergency-cases/${body.caseId}.json`)!;
    expect(stored.analysis).toMatchObject({ ofacStatus: 'clear', scamDbStatus: 'match' });
    expect(stored.analysis).not.toHaveProperty('recoveryScore');
  });
});

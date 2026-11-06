// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as track } from '@/app/api/track/route';

vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }) }));
vi.mock('@/lib/backfill-timestamps', () => ({ backfillBlockTimestamps: async () => {} }));

/** Provider calls, and the most that were in flight at once. */
const calls = vi.hoisted(() => ({ rpc: 0, btc: 0, inFlight: 0, maxInFlight: 0 }));
const slow = async <T>(value: T) => {
  calls.inFlight++;
  calls.maxInFlight = Math.max(calls.maxInFlight, calls.inFlight);
  await new Promise((r) => setTimeout(r, 5));
  calls.inFlight--;
  return value;
};
vi.mock('@/lib/fetch-timeout', () => ({
  fetchWithTimeout: async () => {
    calls.rpc++;
    return slow(new Response(JSON.stringify({ result: { transfers: [] } })));
  },
}));
vi.mock('@/lib/bitcoin-tracker', () => ({
  fetchBtcTransfers: async () => { calls.btc++; return slow({ transfers: [] }); },
}));

const send = (body: unknown) => track(new NextRequest('https://www.ledgerhound.vip/api/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
}));
const eth = (n: number) => '0x' + n.toString(16).padStart(40, '0');
const btc = (n: number) => 'bc1q' + 'a'.repeat(30) + n.toString().padStart(4, '0');

beforeEach(() => {
  Object.assign(calls, { rpc: 0, btc: 0, inFlight: 0, maxInFlight: 0 });
  vi.stubEnv('ALCHEMY_API_KEY', 'test-key');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('/api/track limits', () => {
  it('a repeated address costs once', async () => {
    const res = await send({ network: 'eth', addresses: Array(50).fill(eth(1)) });
    expect(res.status).toBe(200);
    expect(calls.rpc).toBe(2); // incoming + outgoing for one address
  });

  it('repeats differing only in case or spaces count once', async () => {
    const a = eth(0xabc);
    await send({ network: 'eth', addresses: [a, a.toUpperCase().replace('0X', '0x'), ` ${a} `] });
    expect(calls.rpc).toBe(2);
  });

  it.each([
    ['too many different addresses', { network: 'eth', addresses: [1, 2, 3, 4, 5, 6].map(eth) }, 413],
    ['an oversized list (the audit case: 100 copies)', { network: 'eth', addresses: Array(100).fill(eth(1)) }, 413],
    ['a non-string element', { network: 'eth', addresses: [eth(1), { toLowerCase: 1 }] }, 400],
    ['a nested array', { network: 'eth', addresses: [[eth(1)]] }, 400],
    ['no list', { network: 'eth', addresses: eth(1) }, 400],
    ['an unreadable body', null, 400],
  ])('refuses %s before any provider call', async (_name, body, status) => {
    const res = await send(body);
    expect(res.status).toBe(status);
    expect(calls.rpc + calls.btc).toBe(0);
  });

  it('fetches at most two addresses at a time', async () => {
    const res = await send({ network: 'btc', addresses: [1, 2, 3, 4, 5].map(btc) });
    expect(res.status).toBe(200);
    expect(calls.btc).toBe(5);
    expect(calls.maxInFlight).toBeLessThanOrEqual(2);
  });

  it('allows the maximum of five addresses', async () => {
    const res = await send({ network: 'eth', addresses: [1, 2, 3, 4, 5].map(eth) });
    expect(res.status).toBe(200);
    expect(calls.rpc).toBe(10);
    expect(calls.maxInFlight).toBeLessThanOrEqual(2);
  });
});

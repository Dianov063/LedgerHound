// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getJson, putJson, resetS3, s3Faults, s3Store } from './helpers/aws-s3-mock';
import { POST as join } from '@/app/api/emergency/join-group/route';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }) }));

const PREFIX = 'scam-database/groups/fictional-exchange/members/';
const send = (fields: Record<string, unknown>) => join(new NextRequest('https://www.ledgerhound.vip/api/emergency/join-group', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ caseId: 'ER-TEST-1', email: 'a@example.invalid', country: 'US', platformName: 'Fictional Exchange', lossAmount: 100, scamType: 'romance', ...fields }),
}));
const members = () => Array.from(s3Store.keys()).filter((k) => k.startsWith(PREFIX)).map((k) => getJson<Record<string, unknown>>(k)!);

beforeEach(() => {
  resetS3();
  vi.stubEnv('AWS_S3_BUCKET', 'test-bucket');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const record = () => { const m = members(); expect(m).toHaveLength(1); return m[0]; };

describe('list of people affected by a platform', () => {
  it('keeps both of two parallel joins', async () => {
    const [a, b] = await Promise.all([send({ email: 'a@example.invalid' }), send({ email: 'b@example.invalid', lossAmount: 40, country: 'DE' })]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(members().map((m) => m.email).sort()).toEqual(['a@example.invalid', 'b@example.invalid']);
  });

  it('links each email to its own country, loss and case', async () => {
    await send({ email: 'b@example.invalid', lossAmount: 40, country: 'DE', caseId: 'ER-TEST-2' });
    expect(record()).toMatchObject({ email: 'b@example.invalid', lossAmount: 40, country: 'DE', caseId: 'ER-TEST-2', platformName: 'Fictional Exchange' });
  });

  it('counts a repeated join once, case and spaces in the email included', async () => {
    await send({});
    expect((await send({ email: '  A@Example.invalid ' })).status).toBe(200);
    expect(record()).toMatchObject({ email: 'a@example.invalid', lossAmount: 100 });
  });

  it('a request by someone who only knows the email changes nothing (review 47, R1)', async () => {
    await send({ caseId: 'ORIGINAL-CASE', lossAmount: 100, country: 'US', walletAddress: '0xaaa', scamType: 'romance' });
    const before = record();
    const res = await send({ caseId: 'UNRELATED-CASE', lossAmount: 999999, country: 'FR', walletAddress: '0xbbb', scamType: 'phishing' });
    expect(res.status).toBe(200);
    expect(record()).toEqual(before);
  });

  it('answers the same whether or not the email was already on the list', async () => {
    const first = await (await send({})).json();
    const repeat = await (await send({ lossAmount: 5 })).json();
    const other = await (await send({ email: 'new@example.invalid' })).json();
    expect(repeat).toEqual(first);
    expect(other).toEqual(first);
    expect(first).toEqual({ success: true, groupSlug: 'fictional-exchange' });
  });

  it('parallel joins by the same person leave one record, written by the first', async () => {
    const results = await Promise.all([send({}), send({}), send({ lossAmount: 300 })]);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(record().lossAmount).toBe(100);
  });

  it('leaves an older group file as it was', async () => {
    const legacy = { platformName: 'Fictional Exchange', slug: 'fictional-exchange', victims: 7, totalLoss: 700, threshold: 500000, jurisdictions: ['US'], emails: ['old@example.invalid'], createdAt: 'x', updatedAt: 'x' };
    putJson('scam-database/groups/fictional-exchange.json', legacy);
    await send({});
    expect(getJson('scam-database/groups/fictional-exchange.json')).toEqual(legacy);
  });

  it('reports a storage failure instead of success', async () => {
    s3Faults.push((command) => (command === 'PutObjectCommand' ? new Error('S3 timeout') : null));
    expect((await send({})).status).toBe(500);
    expect(members()).toHaveLength(0);
  });

  it.each([
    ['no case', { caseId: '' }],
    ['a bad email', { email: 'not-an-email' }],
    ['no platform', { platformName: '' }],
    ['a zero loss', { lossAmount: 0 }],
    ['a non-number loss', { lossAmount: '100' }],
  ])('refuses %s', async (_name, fields) => {
    expect((await send(fields)).status).toBe(400);
    expect(members()).toHaveLength(0);
  });
});

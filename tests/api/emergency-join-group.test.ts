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

describe('list of people affected by a platform', () => {
  it('keeps both of two parallel joins', async () => {
    const [a, b] = await Promise.all([send({ email: 'a@example.invalid' }), send({ email: 'b@example.invalid', lossAmount: 40, country: 'DE' })]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(members().map((m) => m.email).sort()).toEqual(['a@example.invalid', 'b@example.invalid']);
    expect(await (await send({ email: 'c@example.invalid', lossAmount: 1 })).json()).toMatchObject({ victims: 3, totalLoss: 141 });
  });

  it('links each email to its own country, loss and case', async () => {
    await send({ email: 'b@example.invalid', lossAmount: 40, country: 'DE', caseId: 'ER-TEST-2' });
    expect(members()[0]).toMatchObject({ email: 'b@example.invalid', lossAmount: 40, country: 'DE', caseId: 'ER-TEST-2', platformName: 'Fictional Exchange' });
  });

  it('counts a repeated join once', async () => {
    await send({});
    const again = await (await send({ email: '  A@Example.invalid ' })).json();
    expect(again).toMatchObject({ success: true, alreadyOnList: true, victims: 1, totalLoss: 100 });
    expect(members()).toHaveLength(1);
  });

  it('updates the record when the person sends new answers, still counting once', async () => {
    await send({});
    const res = await (await send({ lossAmount: 250, country: 'FR' })).json();
    expect(res).toMatchObject({ victims: 1, totalLoss: 250 });
    expect(members()[0]).toMatchObject({ lossAmount: 250, country: 'FR' });
  });

  it('two parallel joins by the same person leave one record', async () => {
    const results = await Promise.all([send({}), send({}), send({ lossAmount: 300 })]);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(members()).toHaveLength(1);
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

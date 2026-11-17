// @vitest-environment node
/**
 * Audit F9, gaps found in the review of package 63 (each scenario was reproduced by the reviewer
 * on the first revision):
 *  1. a cached "not listed" outlived the maximum age of the OFAC list it came from;
 *  2. parallel lookups overspent the Chainabuse quota, and an unreadable counter counted as zero;
 *  3. the scam database said "no match" when the address index was read but a report it names was not;
 *  4. GoPlus `code: 1` with an empty result counted as "no risk flags".
 * No request leaves the test: fetch and S3 are replaced.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getJson, putJson, resetS3, s3Calls, s3Faults, s3Store } from '../api/helpers/aws-s3-mock';

vi.mock('@aws-sdk/client-s3', () => import('../api/helpers/aws-s3-mock'));

import { CHAINABUSE_USABLE_CAP, reserveChainabuseCall } from '@/lib/labels/chainabuse';
import { queryGoPlus } from '@/lib/labels/goplus';
import { getAddressLabels, getAddressLabelsBatch } from '@/lib/labels/federation';
import { uncheckedSources } from '@/lib/labels/coverage';
import { _clearOfacCache } from '@/lib/labels/ofac';
import { getAddressIndex, getAddressIndexChecked } from '@/lib/scam-db';
import { crossReferenceScamDb, scamDbEvidenceFactor } from '@/lib/report-scam-db';
import { getReportTranslations } from '@/lib/report-i18n';

const DAY = 24 * 60 * 60 * 1000;
const addr = (c: string) => '0x' + c.repeat(40);
const ADDRESS = addr('c');
const LISTED = addr('a');
const BINANCE = '0x28c6c06298d514db089934071355e5743bf21d60'; // KNOWN_ENTITIES: exchange
const OFAC_KEY = 'ofac-sdn/crypto-addresses.json';
const cacheKey = (address: string) => `address-labels/eth/${address}.json`;
const month = () => { const d = new Date(); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; };
const usageKey = () => `chainabuse-usage/${month()}.json`;
const ofacEntries = (...addresses: string[]) => addresses.map((address) => ({ address, currency: 'ETH', source: 'OFAC SDN', added: '2026-01-05' }));

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const GOPLUS_CLEAN = { code: 1, message: 'OK', result: { phishing_activities: '0', sanctioned: '0', blacklist_doubt: '0' } };

type Answer = Response | Error | (() => Response | Error);
function stubFetch(answers: { chainabuse?: Answer; goplus?: Answer } = {}) {
  const calls = { chainabuse: 0, goplus: 0 };
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL) => {
    const url = String(input);
    const which = url.includes('api.chainabuse.com') ? 'chainabuse' : url.includes('api.gopluslabs.io') ? 'goplus' : null;
    if (!which) throw new Error('unexpected request ' + url);
    calls[which]++;
    const configured = answers[which] ?? (which === 'goplus' ? json(GOPLUS_CLEAN) : json({ reports: [] }));
    const answer = typeof configured === 'function' ? configured() : configured;
    if (answer instanceof Error) throw answer;
    return answer.clone();
  }));
  return calls;
}

beforeEach(() => {
  resetS3();
  _clearOfacCache();
  vi.stubEnv('AWS_S3_BUCKET', 'test-bucket');
  vi.stubEnv('CHAINABUSE_API_KEY', 'test-key-not-real');
  putJson(OFAC_KEY, ofacEntries(LISTED));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('1. the cache does not outlive the OFAC list', () => {
  it('"not listed" from a 15-day-old list is not served from the cache once the list is past its limit', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    putJson(OFAC_KEY, ofacEntries(LISTED), new Date(Date.now() - 15 * DAY));
    const calls = stubFetch();
    const first = await getAddressLabels(ADDRESS);
    expect(first.sources!.ofac).toEqual({ status: 'no_match' });
    expect(first.hadExternalSourceFailure).toBe(false);
    const stored = s3Store.get(cacheKey(ADDRESS))!.body;

    vi.setSystemTime(Date.now() + 2 * DAY); // the list is now 17 days old; the cache entry is 2 days old
    const second = await getAddressLabels(ADDRESS);
    expect(second.sources!.ofac.status).toBe('unavailable');
    expect(second.hadExternalSourceFailure).toBe(true);
    expect(uncheckedSources(second)).toEqual(['ofac']);
    // the other sources still come from the cache: no second call, no second quota slot
    expect(second.sources!.chainabuse).toEqual({ status: 'no_match' });
    expect(calls).toEqual({ chainabuse: 1, goplus: 1 });
    expect(getJson(usageKey())).toMatchObject({ calls_used: 1 });
    expect(s3Store.get(cacheKey(ADDRESS))!.body).toBe(stored);
  });

  it('once the list is refreshed the cached result is complete again', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    putJson(OFAC_KEY, ofacEntries(LISTED), new Date(Date.now() - 15 * DAY));
    const calls = stubFetch();
    await getAddressLabels(ADDRESS);
    vi.setSystemTime(Date.now() + 2 * DAY);
    expect((await getAddressLabels(ADDRESS)).hadExternalSourceFailure).toBe(true);
    putJson(OFAC_KEY, ofacEntries(LISTED), new Date());
    _clearOfacCache(); // a process that loads the list anew
    const third = await getAddressLabels(ADDRESS);
    expect(third.sources!.ofac).toEqual({ status: 'no_match' });
    expect(third.hadExternalSourceFailure).toBe(false);
    expect(calls.chainabuse).toBe(1);
  });

  it('an address sanctioned after it was cached is reported as sanctioned from the next lookup', async () => {
    const calls = stubFetch();
    const before = await getAddressLabels(ADDRESS);
    expect(before.hasSanctionsFlag).toBe(false);
    putJson(OFAC_KEY, ofacEntries(LISTED, ADDRESS));
    _clearOfacCache();
    const after = await getAddressLabels(ADDRESS);
    expect(after.sources!.ofac).toEqual({ status: 'match' });
    expect(after.hasSanctionsFlag).toBe(true);
    expect(after.labels.map((l) => l.source)).toEqual(['ofac']);
    expect(after.highestConfidence).toBe(1);
    expect(calls.chainabuse).toBe(1); // served from the cache apart from OFAC
  });

  it('an address taken off the list is looked up again in full', async () => {
    const calls = stubFetch();
    const listed = await getAddressLabels(LISTED);
    expect(listed.sources).toMatchObject({ ofac: { status: 'match' }, chainabuse: { status: 'skipped', reason: 'ofac_match' } });
    expect(calls.chainabuse).toBe(0);
    putJson(OFAC_KEY, ofacEntries(addr('9')));
    _clearOfacCache();
    const delisted = await getAddressLabels(LISTED);
    expect(delisted.sources).toMatchObject({ ofac: { status: 'no_match' }, chainabuse: { status: 'no_match' } });
    expect(delisted.hasSanctionsFlag).toBe(false);
    expect(calls.chainabuse).toBe(1); // it had been skipped only because of the listing
  });

  it('a cached sanctions hit stays a hit while the list cannot be read', async () => {
    stubFetch();
    await getAddressLabels(LISTED);
    _clearOfacCache();
    s3Faults.push((command, input) => (command === 'GetObjectCommand' && input.Key === OFAC_KEY ? new Error('S3 timeout') : null));
    const again = await getAddressLabels(LISTED);
    expect(again.sources!.ofac).toEqual({ status: 'match' });
    expect(again.hasSanctionsFlag).toBe(true);
    expect(again.hadExternalSourceFailure).toBe(false);
  });

  it('a cached "not listed" is not confirmed while the list cannot be read', async () => {
    stubFetch();
    await getAddressLabels(ADDRESS);
    _clearOfacCache();
    s3Faults.push((command, input) => (command === 'GetObjectCommand' && input.Key === OFAC_KEY ? new Error('S3 timeout') : null));
    const again = await getAddressLabels(ADDRESS);
    expect(again.sources!.ofac.status).toBe('unavailable');
    expect(again.hadExternalSourceFailure).toBe(true);
  });
});

describe('2. the Chainabuse quota is reserved before the call', () => {
  const seedUsage = (used: number) => putJson(usageKey(), { month: month(), calls_used: used, calls_limit: 10, last_call_at: null });

  it('one slot left and three lookups at once: exactly one call', async () => {
    seedUsage(CHAINABUSE_USABLE_CAP - 1);
    const calls = stubFetch();
    const results = await Promise.all([addr('1'), addr('2'), addr('3')].map((a) => getAddressLabels(a)));
    expect(calls.chainabuse).toBe(1);
    const statuses = results.map((r) => r.sources!.chainabuse);
    expect(statuses.filter((s) => s.status === 'no_match')).toHaveLength(1);
    expect(statuses.filter((s) => s.status === 'skipped' && s.reason === 'rate_limit_reached')).toHaveLength(2);
    expect(getJson(usageKey())).toMatchObject({ calls_used: CHAINABUSE_USABLE_CAP });
  });

  it('a new month and twenty lookups at once: the cap is the number of calls', async () => {
    const calls = stubFetch();
    const addresses = Array.from({ length: 20 }, (_, i) => '0x' + i.toString(16).padStart(2, '0').repeat(20));
    const results = await getAddressLabelsBatch(addresses, 'eth', 20);
    expect(calls.chainabuse).toBe(CHAINABUSE_USABLE_CAP);
    expect(results.filter((r) => r.sources!.chainabuse.reason === 'rate_limit_reached')).toHaveLength(20 - CHAINABUSE_USABLE_CAP);
    expect(results.every((r) => r.sources!.chainabuse.status !== 'unavailable')).toBe(true);
    expect(getJson(usageKey())).toMatchObject({ month: month(), calls_used: CHAINABUSE_USABLE_CAP });
  });

  it('the slot is taken before the request goes out, and stays taken when the call fails', async () => {
    seedUsage(3);
    let usedAtCallTime: unknown;
    const calls = stubFetch({ chainabuse: () => { usedAtCallTime = getJson(usageKey())?.calls_used; return json({}, 500); } });
    const r = await getAddressLabels(ADDRESS);
    expect(usedAtCallTime).toBe(4);
    expect(r.sources!.chainabuse).toEqual({ status: 'unavailable', reason: 'http_500' });
    expect(getJson(usageKey())).toMatchObject({ calls_used: 4 });
    expect(calls.chainabuse).toBe(1);
  });

  it('every write of the counter is conditional', async () => {
    stubFetch();
    await getAddressLabels(addr('1')); // creates the month's file
    await getAddressLabels(addr('2')); // updates it
    const writes = s3Calls.filter((c) => c.command === 'PutObjectCommand' && c.input.Key === usageKey()).map((c) => c.input);
    expect(writes).toHaveLength(2);
    expect(writes[0].IfNoneMatch).toBe('*');
    expect(typeof writes[1].IfMatch).toBe('string');
    expect(writes.every((w) => w.IfNoneMatch === '*' || typeof w.IfMatch === 'string')).toBe(true);
  });

  it.each([
    ['the counter cannot be read', () => { s3Faults.push((c, i) => (c === 'GetObjectCommand' && String(i.Key).startsWith('chainabuse-usage/') ? new Error('S3 timeout') : null)); }],
    ['the counter cannot be written', () => { s3Faults.push((c, i) => (c === 'PutObjectCommand' && String(i.Key).startsWith('chainabuse-usage/') ? Object.assign(new Error('AccessDenied'), { name: 'AccessDenied', $metadata: { httpStatusCode: 403 } }) : null)); }],
    ['the counter is not JSON', () => { s3Store.set(usageKey(), { body: '<html>', modified: new Date(), input: {}, etag: '"x1"' }); }],
    ['the counter has no number of calls', () => { putJson(usageKey(), { month: month(), calls_used: 'three' }); }],
    ['the counter has a negative number of calls', () => { putJson(usageKey(), { month: month(), calls_used: -1 }); }],
    ['the counter belongs to another month', () => { putJson(usageKey(), { month: '2020-01', calls_used: 0 }); }],
  ])('%s: no call is made, and the lookup is incomplete and not cached', async (_name, breakCounter) => {
    breakCounter();
    const calls = stubFetch();
    const r = await getAddressLabels(ADDRESS);
    expect(calls.chainabuse).toBe(0);
    expect(r.sources!.chainabuse).toEqual({ status: 'unavailable', reason: 'quota_check_failed' });
    expect(r.hadExternalSourceFailure).toBe(true);
    expect(uncheckedSources(r)).toEqual(['chainabuse']);
    expect(s3Store.has(cacheKey(ADDRESS))).toBe(false);
  });

  it('without a bucket there is no counter, so no slot', async () => {
    vi.stubEnv('AWS_S3_BUCKET', '');
    expect(await reserveChainabuseCall()).toEqual({ reserved: false, reason: 'quota_check_failed' });
  });

  it('the reservation reports the counter it wrote, and refuses at the cap without writing', async () => {
    seedUsage(CHAINABUSE_USABLE_CAP - 1);
    expect(await reserveChainabuseCall()).toMatchObject({ reserved: true, usage: { calls_used: CHAINABUSE_USABLE_CAP } });
    const writesBefore = s3Calls.filter((c) => c.command === 'PutObjectCommand').length;
    expect(await reserveChainabuseCall()).toMatchObject({ reserved: false, reason: 'rate_limit_reached' });
    expect(s3Calls.filter((c) => c.command === 'PutObjectCommand').length).toBe(writesBefore);
  });

  it('an address another source identified spends no slot and is not a gap, also when the quota is spent', async () => {
    seedUsage(CHAINABUSE_USABLE_CAP);
    const calls = stubFetch();
    const exchange = await getAddressLabels(BINANCE);
    expect(exchange.sources!.chainabuse).toEqual({ status: 'skipped', reason: 'cex_whitelisted' });
    expect(uncheckedSources(exchange)).toEqual([]);
    expect(calls.chainabuse).toBe(0);
    expect(getJson(usageKey())).toMatchObject({ calls_used: CHAINABUSE_USABLE_CAP });
  });
});

describe('3. the scam database does not hide a failed read', () => {
  const report = (id: string, over: Record<string, unknown> = {}) => ({
    id, createdAt: '2026-10-01T00:00:00.000Z', platformName: 'Demo Platform', platformType: 'fake_exchange', scamAddress: ADDRESS,
    network: 'eth', lossAmount: 1200, verified: false, blockchainConfirmed: false, status: 'pending', trustTier: 1, ...over,
  });
  const seedIndex = (address: string, reports: string[]) => putJson(`scam-database/addresses/${address}.json`, {
    address, platforms: ['demo-platform'], platformNames: ['Demo Platform'], reports, totalLoss: 1200, networks: ['eth'], firstSeen: '2026-10-01', lastSeen: '2026-10-01',
  });
  const failReport = (id: string) => s3Faults.push((command, input) => (command === 'GetObjectCommand' && input.Key === `scam-database/reports/${id}.json`
    ? Object.assign(new Error('SlowDown'), { name: 'SlowDown', $metadata: { httpStatusCode: 503 } }) : null));

  it('the index is read, the report it names is not: unavailable, never no_match', async () => {
    seedIndex(ADDRESS, ['SB1']);
    putJson('scam-database/reports/SB1.json', report('SB1'));
    failReport('SB1');
    stubFetch();
    expect(await getAddressIndexChecked(ADDRESS)).toEqual({ index: null, failedReads: 1 });
    const r = await getAddressLabels(ADDRESS);
    expect(r.sources!.scam_db).toEqual({ status: 'unavailable', reason: 'incomplete_read' });
    expect(r.hadExternalSourceFailure).toBe(true);
    expect(uncheckedSources(r)).toEqual(['scam_db']);
    expect(s3Store.has(cacheKey(ADDRESS))).toBe(false);
  });

  it('the same data with the report readable: a match', async () => {
    seedIndex(ADDRESS, ['SB1']);
    putJson('scam-database/reports/SB1.json', report('SB1'));
    const calls = stubFetch();
    const r = await getAddressLabels(ADDRESS);
    expect(r.sources!.scam_db).toEqual({ status: 'match' });
    expect(r.labels[0]).toMatchObject({ source: 'ledgerhound_scam_db', tag: 'Demo Platform', reportCount: 1 });
    expect(r.sources!.chainabuse).toEqual({ status: 'skipped', reason: 'scam_db_match' });
    expect(calls.chainabuse).toBe(0);
  });

  it('one report read, one not: what was read still shows the match', async () => {
    seedIndex(ADDRESS, ['SB1', 'SB2']);
    putJson('scam-database/reports/SB1.json', report('SB1'));
    putJson('scam-database/reports/SB2.json', report('SB2'));
    failReport('SB2');
    stubFetch();
    const lookup = await getAddressIndexChecked(ADDRESS);
    expect(lookup.failedReads).toBe(1);
    expect(lookup.index).toMatchObject({ platforms: ['demo-platform'], reports: ['SB1'] });
    expect((await getAddressLabels(ADDRESS)).sources!.scam_db).toEqual({ status: 'match' });
  });

  it('a report that was removed or rejected is not a failed read: no_match', async () => {
    seedIndex(ADDRESS, ['SB1', 'SB2']);
    putJson('scam-database/reports/SB2.json', report('SB2', { status: 'rejected' })); // SB1 has no file
    stubFetch();
    expect(await getAddressIndexChecked(ADDRESS)).toEqual({ index: null, failedReads: 0 });
    expect(await getAddressIndex(ADDRESS)).toBeNull();
    const r = await getAddressLabels(ADDRESS);
    expect(r.sources!.scam_db).toEqual({ status: 'no_match' });
    expect(r.hadExternalSourceFailure).toBe(false);
  });

  it('the report cross-reference counts the lookups that did not complete', async () => {
    const [found, unread, down, clean] = [addr('1'), addr('2'), addr('3'), addr('4')];
    seedIndex(found, ['SB1']);
    putJson('scam-database/reports/SB1.json', report('SB1', { scamAddress: found }));
    seedIndex(unread, ['SB2']);
    putJson('scam-database/reports/SB2.json', report('SB2', { scamAddress: unread }));
    failReport('SB2');
    s3Faults.push((command, input) => (command === 'GetObjectCommand' && input.Key === `scam-database/addresses/${down}.json` ? new Error('S3 timeout') : null));
    const result = await crossReferenceScamDb([found, unread, down, clean]);
    expect(result).toMatchObject({ checked: 4, failed: 2 });
    expect(result.matches).toEqual([{ address: found, platformNames: ['Demo Platform'], platformSlugs: ['demo-platform'], totalLoss: 1200, reports: 1 }]);
    expect(await crossReferenceScamDb([clean])).toEqual({ matches: [], checked: 1, failed: 0 });
  });

  it.each(['en', 'es'] as const)('%s evidence line: incomplete instead of an unmet "in the database" line', (locale) => {
    const strings = getReportTranslations(locale).investigation.evidence;
    const factor = (isVictimRole: boolean, matches: number, failed: number) =>
      scamDbEvidenceFactor({ isVictimRole, counterpartyMatches: matches, totalMatches: matches, check: { checked: 30, failed }, strings });
    for (const victim of [true, false]) {
      const incomplete = factor(victim, 0, 2);
      expect(incomplete).toEqual({ label: strings.scamDbIncomplete(2, 30), met: false, severity: 'unverified' });
      expect(incomplete.label).toMatch(/2 \S+ 30/);
      // every lookup answered and found nothing: the plain unmet line
      expect(factor(victim, 0, 0)).toEqual({ label: victim ? strings.counterpartyScamDbGeneric : strings.scamDbMatch, met: false });
      // a match is a match, whatever else failed
      expect(factor(victim, 3, 2)).toEqual({ label: victim ? strings.counterpartyScamDb(3) : strings.scamDbMatch, met: true });
    }
    expect(strings.scamDbIncomplete(1, 1)).not.toBe(strings.scamDbIncomplete(1, 2));
  });
});

describe('4. GoPlus: "no flags" needs an answer with flag data', () => {
  it.each([
    ['an empty list', [], 'empty_result'],
    ['an empty object', {}, 'empty_result'],
    ['an object without any known flag', { data_source: 'GoPlus', contract_address: '0' }, 'unrecognized_result'],
    ['flags with values that are not "0" or "1"', { phishing_activities: null, sanctioned: '' }, 'unrecognized_result'],
    ['a list of objects', [{ phishing_activities: '0' }], 'empty_result'],
  ])('code 1 with %s is unavailable', async (_name, result, reason) => {
    stubFetch({ goplus: json({ code: 1, message: 'OK', result }) });
    expect(await queryGoPlus(ADDRESS, 'eth')).toEqual({ status: 'unavailable', reason });
  });

  it('an empty result makes the federation result incomplete and uncached', async () => {
    stubFetch({ goplus: json({ code: 1, message: 'OK', result: {} }) });
    const r = await getAddressLabels(ADDRESS);
    expect(r.sources!.goplus).toEqual({ status: 'unavailable', reason: 'empty_result' });
    expect(r.hadExternalSourceFailure).toBe(true);
    expect(s3Store.has(cacheKey(ADDRESS))).toBe(false);
  });

  it('a single recognized flag at "0" is an answer: no_match', async () => {
    stubFetch({ goplus: json({ code: 1, result: { phishing_activities: '0' } }) });
    expect(await queryGoPlus(ADDRESS, 'eth')).toEqual({ status: 'no_match' });
  });

  it.each([
    ['cybercrime', { cybercrime: '1', phishing_activities: '0' }, 'scam', 'cybercrime'],
    ['financial_crime', { financial_crime: '1' }, 'scam', 'financial crime'],
    ['fake_token', { fake_token: '1' }, 'scam', 'fake token'],
    ['gas_abuse', { gas_abuse: '1' }, 'scam', 'gas abuse'],
    ['mixer', { mixer: '1', phishing_activities: '0' }, 'mixer', 'mixer'],
    ['number_of_malicious_contracts_created', { phishing_activities: '0', number_of_malicious_contracts_created: 3 }, 'scam', 'created malicious contracts'],
    ['mixer together with sanctioned', { mixer: '1', sanctioned: '1' }, 'sanctions', 'sanctioned, mixer'],
  ])('a documented flag that was not read before (%s) is a match', async (_name, result, category, tag) => {
    stubFetch({ goplus: json({ code: 1, result }) });
    const r = await queryGoPlus(ADDRESS, 'eth');
    expect(r.status).toBe('match');
    expect(r.label).toMatchObject({ source: 'goplus', category, tag: `GoPlus risk: ${tag}` });
  });

  it('contract properties are not risk flags', async () => {
    stubFetch({ goplus: json({ code: 1, result: { phishing_activities: '0', contract_address: '1', reinit: '1', number_of_malicious_contracts_created: '0' } }) });
    expect(await queryGoPlus(ADDRESS, 'eth')).toEqual({ status: 'no_match' });
  });
});

// @vitest-environment node
/**
 * Audit F9: a source that failed, or was not asked, must never look like "nothing found".
 *  - Chainabuse and GoPlus say what happened (match / no_match / unavailable / skipped);
 *  - the federation records it per source, flags the result as incomplete when a source failed,
 *    and does not cache an incomplete result;
 *  - the paid report gets a coverage summary and, per address, the sources that did not answer.
 * No request leaves the test: fetch and S3 are replaced.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getJson, putJson, resetS3, s3Faults, s3Store } from '../api/helpers/aws-s3-mock';

vi.mock('@aws-sdk/client-s3', () => import('../api/helpers/aws-s3-mock'));

import { queryChainabuse } from '@/lib/labels/chainabuse';
import { queryGoPlus } from '@/lib/labels/goplus';
import { getAddressLabels, getAddressLabelsBatch } from '@/lib/labels/federation';
import { coverageOf, summarizeCoverage, uncheckedSources } from '@/lib/labels/coverage';
import { _clearOfacCache } from '@/lib/labels/ofac';
import { LABELS_SCHEMA, type AddressLabelResponse } from '@/lib/labels/types';
import { coverageNotes } from '@/lib/reportPdf';
import { getReportTranslations } from '@/lib/report-i18n';

const ADDRESS = '0x' + 'c'.repeat(40);
const OTHER = '0x' + 'd'.repeat(40);
const LISTED = '0x' + 'a'.repeat(40);
const BINANCE = '0x28c6c06298d514db089934071355e5743bf21d60'; // KNOWN_ENTITIES: exchange
const OFAC_KEY = 'ofac-sdn/crypto-addresses.json';
const cacheKey = (address: string) => `address-labels/eth/${address}.json`;
const usageKey = () => { const d = new Date(); return `chainabuse-usage/${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}.json`; };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const timeout = () => Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });
const GOPLUS_CLEAN = { code: 1, message: 'OK', result: { phishing_activities: '0', sanctioned: '0', blacklist_doubt: '0' } };

type Answer = Response | Error | (() => Response | Error);
/** fetch double: one answer per host; counts the calls. */
function stubFetch(answers: { chainabuse?: Answer; goplus?: Answer }) {
  const calls = { chainabuse: 0, goplus: 0, other: [] as string[] };
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL) => {
    const url = String(input);
    const which = url.includes('api.chainabuse.com') ? 'chainabuse' : url.includes('api.gopluslabs.io') ? 'goplus' : null;
    if (!which) { calls.other.push(url); throw new Error('unexpected request ' + url); }
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
  putJson(OFAC_KEY, [{ address: LISTED, currency: 'ETH', source: 'OFAC SDN', added: '2026-11-16' }]);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Chainabuse lookup', () => {
  it('reports exist: match with the label', async () => {
    stubFetch({ chainabuse: json({ reports: [{ scamCategory: 'PHISHING' }, { scamCategory: 'PHISHING' }] }) });
    const r = await queryChainabuse(ADDRESS);
    expect(r.status).toBe('match');
    expect(r.label).toMatchObject({ source: 'chainabuse', category: 'phishing', reportCount: 2 });
  });

  it.each([
    ['404', json({}, 404)],
    ['an empty reports list', json({ reports: [], pagination: {} })],
    ['an empty items list', json({ items: [] })],
    ['an empty array', json([])],
  ])('Chainabuse answered with %s: no_match', async (_name, answer) => {
    stubFetch({ chainabuse: answer });
    expect(await queryChainabuse(ADDRESS)).toEqual({ status: 'no_match' });
  });

  it.each([
    ['a timeout', timeout(), 'timeout'],
    ['a network error', new TypeError('fetch failed'), 'network_error'],
    ['401', json({ error: 'unauthorized' }, 401), 'http_401'],
    ['403', json({ error: 'forbidden' }, 403), 'http_403'],
    ['429', json({ error: 'rate limited' }, 429), 'http_429'],
    ['500', json({ error: 'server' }, 500), 'http_500'],
    ['a body that is not JSON', new Response('<html>Bad gateway</html>', { status: 200 }), 'invalid_json'],
    ['an object without a report list', json({ message: 'ok' }), 'unexpected_response'],
    ['null', json(null), 'unexpected_response'],
  ])('%s is unavailable, never "no reports"', async (_name, answer, reason) => {
    stubFetch({ chainabuse: answer });
    expect(await queryChainabuse(ADDRESS)).toEqual({ status: 'unavailable', reason });
  });

  it('without an API key no call is made: skipped', async () => {
    vi.stubEnv('CHAINABUSE_API_KEY', '');
    const calls = stubFetch({});
    expect(await queryChainabuse(ADDRESS)).toEqual({ status: 'skipped', reason: 'no_api_key' });
    expect(calls.chainabuse).toBe(0);
  });
});

describe('GoPlus lookup', () => {
  it('risk flags: match with the label', async () => {
    stubFetch({ goplus: json({ code: 1, result: { phishing_activities: '1', sanctioned: '0' } }) });
    const r = await queryGoPlus(ADDRESS, 'eth');
    expect(r.status).toBe('match');
    expect(r.label).toMatchObject({ source: 'goplus', category: 'phishing' });
  });

  it('GoPlus answered with no flags: no_match', async () => {
    stubFetch({ goplus: json(GOPLUS_CLEAN) });
    expect(await queryGoPlus(ADDRESS, 'eth')).toEqual({ status: 'no_match' });
  });

  it.each([
    ['a timeout', timeout(), 'timeout'],
    ['a network error', new TypeError('fetch failed'), 'network_error'],
    ['HTTP 500', json({}, 500), 'http_500'],
    ['HTTP 404', json({}, 404), 'http_404'],
    ['HTTP 429', json({}, 429), 'http_429'],
    ['a body that is not JSON', new Response('oops', { status: 200 }), 'invalid_json'],
    ['a rate-limit error code', json({ code: 4029, message: 'too many requests', result: null }), 'code_4029'],
    ['code 1 without a result', json({ code: 1 }), 'code_1'],
    ['an answer without a code', json({ result: {} }), 'code_missing'],
  ])('%s is unavailable, never "no risk flags"', async (_name, answer, reason) => {
    stubFetch({ goplus: answer });
    expect(await queryGoPlus(ADDRESS, 'eth')).toEqual({ status: 'unavailable', reason });
  });

  it('a network GoPlus does not cover: skipped, no call', async () => {
    const calls = stubFetch({});
    expect(await queryGoPlus('TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', 'trx')).toEqual({ status: 'skipped', reason: 'unsupported_network' });
    expect(calls.goplus).toBe(0);
  });
});

describe('federation: what each source answered', () => {
  it('every source answers and has nothing: all no_match, complete, cached, one quota call', async () => {
    const calls = stubFetch({});
    const r = await getAddressLabels(ADDRESS);
    expect(r.sources).toEqual({ scam_db: { status: 'no_match' }, ofac: { status: 'no_match' }, goplus: { status: 'no_match' }, chainabuse: { status: 'no_match' } });
    expect(r.hadExternalSourceFailure).toBe(false);
    expect(r.labels).toEqual([]);
    expect(uncheckedSources(r)).toEqual([]);
    expect(getJson(cacheKey(ADDRESS))).toMatchObject({ schema: LABELS_SCHEMA, hadExternalSourceFailure: false });
    expect(getJson(usageKey())).toMatchObject({ calls_used: 1 });
    expect(calls).toMatchObject({ chainabuse: 1, goplus: 1, other: [] });
  });

  it.each([
    ['Chainabuse answers 429', { chainabuse: json({}, 429) }, 'chainabuse', 'http_429'],
    ['Chainabuse times out', { chainabuse: timeout() }, 'chainabuse', 'timeout'],
    ['Chainabuse sends an unreadable body', { chainabuse: new Response('<html>', { status: 200 }) }, 'chainabuse', 'invalid_json'],
    ['GoPlus times out', { goplus: timeout() }, 'goplus', 'timeout'],
    ['GoPlus answers with an error code', { goplus: json({ code: 4029, result: null }) }, 'goplus', 'code_4029'],
  ] as const)('%s: that source is unavailable, the result is incomplete and is NOT cached', async (_name, answers, source, reason) => {
    stubFetch(answers);
    const r = await getAddressLabels(ADDRESS);
    expect(r.sources![source]).toEqual({ status: 'unavailable', reason });
    expect(r.hadExternalSourceFailure).toBe(true);
    expect(uncheckedSources(r)).toEqual([source]);
    expect(s3Store.has(cacheKey(ADDRESS))).toBe(false); // a failure is never served for 7 days as "nothing found"
  });

  it('after a failed lookup the next one asks the source again, and a complete result is then cached', async () => {
    let fail = true;
    const calls = stubFetch({ chainabuse: () => (fail ? json({}, 429) : json({ reports: [{ scamCategory: 'Rug Pull' }] })) });
    expect((await getAddressLabels(ADDRESS)).hadExternalSourceFailure).toBe(true);
    fail = false;
    const again = await getAddressLabels(ADDRESS);
    expect(calls.chainabuse).toBe(2);
    expect(again.sources!.chainabuse).toEqual({ status: 'match' });
    expect(again.labels.map((l) => l.source)).toEqual(['chainabuse']);
    expect(again.hadExternalSourceFailure).toBe(false);
    expect(s3Store.has(cacheKey(ADDRESS))).toBe(true);
    // failed attempts count toward the monthly quota too: a failing API is not retried without limit
    expect(getJson(usageKey())).toMatchObject({ calls_used: 2 });
    const third = await getAddressLabels(ADDRESS);
    expect(calls.chainabuse).toBe(2); // served from the cache
    expect(third.sources).toEqual(again.sources);
  });

  it('the OFAC list cannot be read: ofac is unavailable and nothing is cached', async () => {
    stubFetch({});
    s3Faults.push((command, input) => (command === 'GetObjectCommand' && input.Key === OFAC_KEY ? new Error('S3 timeout') : null));
    const r = await getAddressLabels(ADDRESS);
    expect(r.sources!.ofac.status).toBe('unavailable');
    expect(r.hadExternalSourceFailure).toBe(true);
    expect(s3Store.has(cacheKey(ADDRESS))).toBe(false);
  });

  it('the scam database cannot be read: scam_db is unavailable and nothing is cached', async () => {
    stubFetch({});
    s3Faults.push((command, input) => (command === 'GetObjectCommand' && String(input.Key).startsWith('scam-database/addresses/')
      ? Object.assign(new Error('InternalError'), { name: 'InternalError', $metadata: { httpStatusCode: 500 } }) : null));
    const r = await getAddressLabels(ADDRESS);
    expect(r.sources!.scam_db).toEqual({ status: 'unavailable', reason: 'InternalError' });
    expect(r.hadExternalSourceFailure).toBe(true);
    expect(s3Store.has(cacheKey(ADDRESS))).toBe(false);
  });

  it('no Chainabuse key: skipped, not a failure, but the address is not "checked" there', async () => {
    vi.stubEnv('CHAINABUSE_API_KEY', '');
    const calls = stubFetch({});
    const r = await getAddressLabels(ADDRESS);
    expect(r.sources!.chainabuse).toEqual({ status: 'skipped', reason: 'no_api_key' });
    expect(r.hadExternalSourceFailure).toBe(false);
    expect(uncheckedSources(r)).toEqual(['chainabuse']);
    expect(calls.chainabuse).toBe(0);
    expect(s3Store.has(cacheKey(ADDRESS))).toBe(true); // complete as far as the sources asked go
  });

  it('monthly quota reached: skipped with that reason, and no call', async () => {
    const d = new Date();
    putJson(usageKey(), { month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`, calls_used: 8, calls_limit: 10, last_call_at: null });
    const calls = stubFetch({});
    const r = await getAddressLabels(ADDRESS);
    expect(r.sources!.chainabuse).toEqual({ status: 'skipped', reason: 'rate_limit_reached' });
    expect(uncheckedSources(r)).toEqual(['chainabuse']);
    expect(calls.chainabuse).toBe(0);
  });

  it('an address another source already identified: Chainabuse is skipped as not needed, nothing is missing', async () => {
    const calls = stubFetch({});
    const exchange = await getAddressLabels(BINANCE);
    expect(exchange.sources!.chainabuse).toEqual({ status: 'skipped', reason: 'cex_whitelisted' });
    expect(uncheckedSources(exchange)).toEqual([]);
    const sanctioned = await getAddressLabels(LISTED);
    expect(sanctioned.sources).toMatchObject({ ofac: { status: 'match' }, chainabuse: { status: 'skipped', reason: 'ofac_match' } });
    expect(sanctioned.hasSanctionsFlag).toBe(true);
    expect(uncheckedSources(sanctioned)).toEqual([]);
    expect(calls.chainabuse).toBe(0);
  });

  it('a non-EVM network: GoPlus is skipped and listed as not checked', async () => {
    stubFetch({});
    const r = await getAddressLabels('TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', 'trx');
    expect(r.sources!.goplus).toEqual({ status: 'skipped', reason: 'unsupported_network' });
    expect(uncheckedSources(r)).toEqual(['goplus']);
    expect(r.hadExternalSourceFailure).toBe(false);
  });

  it('a cache entry written before per-source statuses existed is not used', async () => {
    putJson(cacheKey(ADDRESS), { address: ADDRESS, network: 'eth', labels: [], cached_at: new Date().toISOString(), ttl_days: 7,
      hasPhishingFlag: false, hasSanctionsFlag: false, hasScamFlag: false, isKycExchange: false, highestConfidence: 0, hadExternalSourceFailure: false });
    const calls = stubFetch({ chainabuse: json({ reports: [{ scamCategory: 'Phishing' }] }) });
    const r = await getAddressLabels(ADDRESS);
    expect(calls.chainabuse).toBe(1);
    expect(r.labels.map((l) => l.source)).toEqual(['chainabuse']);
    expect(getJson(cacheKey(ADDRESS))).toMatchObject({ schema: LABELS_SCHEMA });
  });

  it('a lookup that crashes is returned by the batch with every source unavailable', async () => {
    stubFetch({});
    const spy = vi.spyOn(await import('@/lib/labels/chainabuse'), 'reserveChainabuseCall').mockRejectedValueOnce(new Error('boom'));
    const [crashed, fine] = await getAddressLabelsBatch([ADDRESS, OTHER], 'eth', 1);
    expect(spy).toHaveBeenCalled();
    expect(crashed.hadExternalSourceFailure).toBe(true);
    expect(Object.values(crashed.sources!).every((c) => c.status === 'unavailable')).toBe(true);
    expect(uncheckedSources(crashed)).toEqual(['scam_db', 'ofac', 'goplus', 'chainabuse']);
    expect(fine.hadExternalSourceFailure).toBe(false);
  });
});

describe('coverage for the paid report', () => {
  const response = (sources: AddressLabelResponse['sources'], failure = false): AddressLabelResponse => ({
    address: ADDRESS, network: 'eth', labels: [], cached_at: '2026-11-17T00:00:00.000Z', ttl_days: 7, hasPhishingFlag: false, hasSanctionsFlag: false,
    hasScamFlag: false, isKycExchange: false, highestConfidence: 0, hadExternalSourceFailure: failure, sources, schema: LABELS_SCHEMA });
  const ok = { status: 'no_match' } as const;

  it('classifies what a source did', () => {
    expect(coverageOf({ status: 'match' })).toBe('checked');
    expect(coverageOf({ status: 'no_match' })).toBe('checked');
    expect(coverageOf({ status: 'unavailable', reason: 'timeout' })).toBe('unavailable');
    for (const reason of ['no_api_key', 'rate_limit_reached', 'unsupported_network', 'not_reached', undefined]) {
      expect(coverageOf({ status: 'skipped', reason }), String(reason)).toBe('not_consulted');
    }
    for (const reason of ['cex_whitelisted', 'mixer_known', 'sanctions_known', 'known_phishing', 'scam_db_match', 'ofac_match']) {
      expect(coverageOf({ status: 'skipped', reason }), reason).toBe('not_needed');
    }
    // older responses carry only the flag
    expect(coverageOf(undefined, true)).toBe('unavailable');
    expect(coverageOf(undefined, false)).toBe('checked');
  });

  it('counts per source across the analyzed addresses and names the gaps', () => {
    const coverage = summarizeCoverage([
      response({ scam_db: ok, ofac: ok, goplus: ok, chainabuse: ok }),
      response({ scam_db: ok, ofac: ok, goplus: { status: 'unavailable', reason: 'timeout' }, chainabuse: { status: 'skipped', reason: 'rate_limit_reached' } }, true),
      response({ scam_db: ok, ofac: { status: 'match' }, goplus: ok, chainabuse: { status: 'skipped', reason: 'ofac_match' } }),
      response({ scam_db: ok, ofac: ok, goplus: ok, chainabuse: { status: 'skipped', reason: 'rate_limit_reached' } }),
    ]);
    expect(coverage.analyzed).toBe(4);
    expect(coverage.bySource.chainabuse).toEqual({ checked: 1, unavailable: 0, notConsulted: 2, notNeeded: 1 });
    expect(coverage.bySource.goplus).toEqual({ checked: 3, unavailable: 1, notConsulted: 0, notNeeded: 0 });
    expect(coverage.bySource.ofac).toEqual({ checked: 4, unavailable: 0, notConsulted: 0, notNeeded: 0 });
    expect(coverage.unavailableSources).toEqual(['goplus']);
    expect(coverage.notConsultedSources).toEqual(['chainabuse']);
  });

  it.each(['en', 'es'] as const)('the %s report names the failed and the not-queried sources with their counts', (locale) => {
    const av = getReportTranslations(locale).addressVerification;
    const coverage = summarizeCoverage([
      response({ scam_db: ok, ofac: ok, goplus: { status: 'unavailable', reason: 'timeout' }, chainabuse: { status: 'skipped', reason: 'rate_limit_reached' } }, true),
      response({ scam_db: ok, ofac: ok, goplus: ok, chainabuse: { status: 'unavailable', reason: 'http_429' } }, true),
      response({ scam_db: ok, ofac: ok, goplus: ok, chainabuse: ok }),
    ]);
    const notes = coverageNotes({ sourceCoverage: coverage }, av);
    expect(notes.unavailable).toContain('GoPlus');
    expect(notes.unavailable).toContain('Chainabuse');
    expect(notes.unavailable).toMatch(/1 \S+ 3/);       // "1 of 3" / "1 de 3"
    expect(notes.notConsulted).toContain('Chainabuse');
    expect(notes.notConsulted).not.toContain('GoPlus for'); // GoPlus was asked for every address
    // the strings a single address uses
    expect(av.noMatchesPartial).not.toBe(av.noMatches);
    expect(av.notChecked([av.sourceName('chainabuse'), av.sourceName('goplus')])).toContain('Chainabuse, GoPlus');
    expect(av.sourceName('scam_db')).not.toBe('scam_db');
  });

  it('nothing to report: no notes; report data without the summary: no notes either', () => {
    const av = getReportTranslations('en').addressVerification;
    const complete = summarizeCoverage([response({ scam_db: ok, ofac: ok, goplus: ok, chainabuse: ok })]);
    expect(coverageNotes({ sourceCoverage: complete }, av)).toEqual({ unavailable: null, notConsulted: null });
    expect(coverageNotes({ sourceCoverage: undefined }, av)).toEqual({ unavailable: null, notConsulted: null });
  });

  it('the general wording no longer claims the sources were consulted when they were not', () => {
    for (const locale of ['en', 'es'] as const) {
      const av = getReportTranslations(locale).addressVerification;
      expect(av.degradedBody).not.toMatch(/Chainabuse, GoPlus, OFAC/); // the sources are now named from the data
      expect(av.methodology).toMatch(/not cached|no se almacena/);
    }
  });
});

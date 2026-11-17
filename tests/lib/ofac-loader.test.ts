// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { putJson, resetS3, s3Faults } from '../api/helpers/aws-s3-mock';
import { _clearOfacCache, checkOfac, isOfacListFresh, loadOfacList, OFAC_MAX_AGE_DAYS, ofacListAgeMs, OfacUnavailableError } from '@/lib/labels/ofac';

vi.mock('@aws-sdk/client-s3', () => import('../api/helpers/aws-s3-mock'));

const KEY = 'ofac-sdn/crypto-addresses.json';
const LISTED = '0x' + 'a'.repeat(40);
const OTHER = '0x' + 'b'.repeat(40);
const seed = () => putJson(KEY, [{ address: LISTED, currency: 'ETH', source: 'OFAC SDN', added: '2026-11-02' }]);
const failNextRead = () => s3Faults.push((command) => (command === 'GetObjectCommand' ? new Error('S3 timeout') : null));

beforeEach(() => {
  resetS3();
  _clearOfacCache();
  vi.stubEnv('AWS_S3_BUCKET', 'test-bucket');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('OFAC SDN loader', () => {
  it('finds a listed address and clears an unlisted one', async () => {
    seed();
    expect(await checkOfac(LISTED)).toMatchObject({ source: 'ofac', tag: 'OFAC SDN (ETH)' });
    expect(await checkOfac(OTHER)).toBeNull();
  });

  it('reports a missing list as unavailable, not as empty', async () => {
    await expect(checkOfac(OTHER)).rejects.toBeInstanceOf(OfacUnavailableError);
  });

  it('reports an S3 failure as unavailable', async () => {
    seed();
    failNextRead();
    await expect(loadOfacList()).rejects.toBeInstanceOf(OfacUnavailableError);
  });

  it('reports an empty or unreadable list as unavailable', async () => {
    putJson(KEY, []);
    await expect(loadOfacList()).rejects.toBeInstanceOf(OfacUnavailableError);
  });

  it('does not cache a failure: the next call reads the list again', async () => {
    await expect(checkOfac(LISTED)).rejects.toBeInstanceOf(OfacUnavailableError);
    seed();
    expect(await checkOfac(LISTED)).not.toBeNull();
  });

  it('keeps the last loaded list when a later reload fails', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    seed();
    expect(await checkOfac(LISTED)).not.toBeNull();
    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000); // past the 24 h cache
    failNextRead();
    expect(await checkOfac(LISTED)).not.toBeNull();
  });

  it('reports a missing bucket setting as unavailable', async () => {
    vi.stubEnv('AWS_S3_BUCKET', '');
    await expect(loadOfacList()).rejects.toBeInstanceOf(OfacUnavailableError);
  });
});

// Audit F9: nothing limited the age of the list, so an address sanctioned after the last
// successful refresh was reported as "not listed" for as long as the refresh kept failing.
describe('OFAC SDN list age', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const entry = (added = '2026-01-05') => [{ address: LISTED, currency: 'ETH', source: 'OFAC SDN', added }];
  const seedAged = (days: number) => putJson(KEY, entry(), new Date(Date.now() - days * DAY));

  it('the limit is 16 days: one missed weekly refresh plus margin', () => {
    expect(OFAC_MAX_AGE_DAYS).toBe(16);
  });

  it('a list within the limit: a miss means "not listed"', async () => {
    seedAged(15);
    expect(await checkOfac(OTHER)).toBeNull();
    expect(isOfacListFresh()).toBe(true);
    expect(Math.round(ofacListAgeMs()! / DAY)).toBe(15);
  });

  it('a list past the limit: a miss is "not checked", a hit is still a hit', async () => {
    seedAged(17);
    await expect(checkOfac(OTHER)).rejects.toBeInstanceOf(OfacUnavailableError);
    await expect(checkOfac(OTHER)).rejects.toThrow(/17 days old \(limit 16\)/);
    expect(await checkOfac(LISTED)).toMatchObject({ source: 'ofac', category: 'sanctions' });
    expect(isOfacListFresh()).toBe(false);
  });

  it('OFAC_MAX_AGE_DAYS changes the limit; a value that is not a positive number is ignored', async () => {
    seedAged(17);
    vi.stubEnv('OFAC_MAX_AGE_DAYS', '30');
    expect(await checkOfac(OTHER)).toBeNull();
    vi.stubEnv('OFAC_MAX_AGE_DAYS', '10');
    await expect(checkOfac(OTHER)).rejects.toThrow(/limit 10/);
    for (const bad of ['0', '-5', 'abc', '']) {
      vi.stubEnv('OFAC_MAX_AGE_DAYS', bad);
      await expect(checkOfac(OTHER), bad).rejects.toThrow(/limit 16/);
    }
  });

  it('a list kept in memory ages while reloads fail, and a successful refresh clears it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    seedAged(1);
    expect(await checkOfac(OTHER)).toBeNull();
    // The refresh job and every reload fail for 20 days: the process keeps the list it has.
    s3Faults.push((command) => (command === 'GetObjectCommand' ? new Error('S3 timeout') : null));
    vi.setSystemTime(Date.now() + 20 * DAY);
    await expect(checkOfac(OTHER)).rejects.toThrow(/21 days old/);
    expect(await checkOfac(LISTED)).not.toBeNull();
    // The list is refreshed and can be read again.
    s3Faults.length = 0;
    putJson(KEY, entry('2026-11-16'), new Date());
    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000); // past the 24 h in-memory cache
    expect(await checkOfac(OTHER)).toBeNull();
  });

  it('without a usable LastModified the newest "added" date of the entries is used', async () => {
    const recent = new Date(Date.now() - 3 * DAY).toISOString().slice(0, 10);
    putJson(KEY, [...entry('2025-01-01'), { address: '0x' + 'e'.repeat(40), currency: 'ETH', source: 'OFAC SDN', added: recent }], new Date(NaN));
    expect(await checkOfac(OTHER)).toBeNull();
    _clearOfacCache();
    putJson(KEY, entry(new Date(Date.now() - 40 * DAY).toISOString().slice(0, 10)), new Date(NaN));
    await expect(checkOfac(OTHER)).rejects.toBeInstanceOf(OfacUnavailableError);
  });

  it('a list with no date at all cannot confirm "not listed"', async () => {
    putJson(KEY, [{ address: LISTED, currency: 'ETH', source: 'OFAC SDN' }], new Date(NaN));
    await expect(checkOfac(OTHER)).rejects.toThrow(/no date/);
    expect(ofacListAgeMs()).toBeNull();
    expect(await checkOfac(LISTED)).not.toBeNull();
  });
});

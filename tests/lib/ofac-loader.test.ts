// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { putJson, resetS3, s3Faults } from '../api/helpers/aws-s3-mock';
import { _clearOfacCache, checkOfac, loadOfacList, OfacUnavailableError } from '@/lib/labels/ofac';

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

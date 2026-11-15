// @vitest-environment node
/**
 * Package 58 (Codex round 5): a temporary storage error (503) while a write refreshes the public
 * index must never leave a report that is accepted and shown on its platform card but missing from
 * search and from the totals. The write path used to read the platform's reports with the
 * forgiving public reader, which leaves out a report whose read failed, and then stored that
 * incomplete view in the index and the counters.
 *
 * Every test checks the three public results together: card, search (name and address), totals
 * (public and stored).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getJson, resetS3, s3Faults } from '../api/helpers/aws-s3-mock';

vi.mock('@aws-sdk/client-s3', () => import('../api/helpers/aws-s3-mock'));

import {
  saveReport, updateReportStatus, getPublicPlatform, getPublicStats, searchPlatforms, searchByAddress,
  _clearPublicIndexCache, txReportId, type ScamReport,
} from '@/lib/scam-db';

const P = 'scam-database';
const ADDRESS = '0xqa00000000000000000000000000000000005030';
const body = (platformName: string, i: number | string, over: Partial<ScamReport> = {}) => ({
  platformName, platformType: 'ponzi' as const, platformUrl: 'https://qa-transient.invalid', network: 'eth', lossAmount: 300,
  scamAddress: ADDRESS, description: `QA transient complaint ${i}`, reporterEmail: `t${i}@qa-mail.invalid`,
  verified: false, blockchainConfirmed: false, status: 'pending' as const, trustTier: 1 as const, ...over,
});
const unavailable = () => Object.assign(new Error('ServiceUnavailable'), { name: 'ServiceUnavailable', $metadata: { httpStatusCode: 503 } });
/** Answer 503 to the first `times` reads of report files (optionally only of one report). */
const failReportReads = (times: number, onlyId?: () => string | undefined) => {
  let failed = 0;
  s3Faults.push((command, input) => {
    const key = String(input.Key ?? '');
    if (command !== 'GetObjectCommand' || !key.startsWith(`${P}/reports/`)) return null;
    const id = onlyId?.();
    if (id && key !== `${P}/reports/${id}.json`) return null;
    if (failed >= times) return null;
    failed++;
    return unavailable();
  });
  return () => failed;
};
const storedStats = () => getJson<{ totalReports: number; totalPlatforms: number; totalLoss: number }>(`${P}/index/stats.json`);

/** Card, search and totals, read fresh. */
async function publicResults(slug: string, name: string) {
  _clearPublicIndexCache();
  const card = await getPublicPlatform(slug);
  const byName = (await searchPlatforms(name)).find((p) => p.slug === slug);
  const byAddress = (await searchByAddress(ADDRESS)).find((p) => p.slug === slug);
  const totals = await getPublicStats();
  return { card: card?.reports.map((r) => r.id) ?? [], byName: byName?.victims ?? 0, byAddress: byAddress?.victims ?? 0, totals, stored: storedStats() };
}

beforeEach(() => {
  resetS3();
  _clearPublicIndexCache();
});

describe('a 503 while the write refreshes the index', () => {
  it('first report of a new platform: accepted, so shown on the card, in search and in the totals', async () => {
    const failed = failReportReads(1);
    const { id } = await saveReport(body('QA Transient New', 1));
    expect(failed()).toBe(1); // the fault really hit the write path
    const r = await publicResults('qa-transient-new', 'QA Transient New');
    expect(r.card).toEqual([id]);
    expect(r.byName).toBe(1);
    expect(r.byAddress).toBe(1);
    expect(r.totals).toMatchObject({ totalReports: 1, totalPlatforms: 1, totalLoss: 300 });
    expect(r.stored).toMatchObject({ totalReports: 1, totalPlatforms: 1, totalLoss: 300 });
  });

  it('a report added to an existing platform: the stored entry and counters include it', async () => {
    const first = await saveReport(body('QA Transient Existing', 1));
    let newId: string | undefined;
    s3Faults.push((command, input) => {
      // the new report's file is written before any read of it: remember its id from that write
      const key = String(input.Key ?? '');
      if (command === 'PutObjectCommand' && key.startsWith(`${P}/reports/`) && !key.endsWith(`${first.id}.json`)) newId = key.slice(`${P}/reports/`.length, -'.json'.length);
      return null;
    });
    const failed = failReportReads(1, () => newId);
    const second = await saveReport(body('QA Transient Existing', 2));
    expect(failed()).toBe(1);
    expect(getJson<{ slug: string; victims: number }[]>(`${P}/index/platforms.json`)!.find((e) => e.slug === 'qa-transient-existing')?.victims).toBe(2);
    const r = await publicResults('qa-transient-existing', 'QA Transient Existing');
    expect([...r.card].sort()).toEqual([first.id, second.id].sort());
    expect(r.byName).toBe(2);
    expect(r.byAddress).toBe(2);
    expect(r.totals).toMatchObject({ totalReports: 2, totalLoss: 600 });
    expect(r.stored).toMatchObject({ totalReports: 2, totalPlatforms: 1, totalLoss: 600 });
  });

  it('moderating one report while another report of the platform reads with 503: that other report stays everywhere', async () => {
    const a = await saveReport(body('QA Transient Moderated', 'a'));
    const b = await saveReport(body('QA Transient Moderated', 'b'));
    const failed = failReportReads(1, () => b.id);
    await updateReportStatus(a.id, 'verified');
    expect(failed()).toBe(1);
    const r = await publicResults('qa-transient-moderated', 'QA Transient Moderated');
    expect([...r.card].sort()).toEqual([a.id, b.id].sort());
    expect(r.byName).toBe(2);
    expect(r.byAddress).toBe(2);
    expect(r.stored).toMatchObject({ totalReports: 2, totalPlatforms: 1 });
  });

  it('storage stays down: the submission fails (no 200), and the resubmission makes all three agree', async () => {
    const TX = '0x' + '5e'.repeat(32);
    s3Faults.push((command, input) => (command === 'GetObjectCommand' && String(input.Key).startsWith(`${P}/reports/`) ? unavailable() : null));
    await expect(saveReport(body('QA Transient Down', 1, { txHash: TX }))).rejects.toThrow('ServiceUnavailable');
    s3Faults.length = 0; // storage recovers
    const again = await saveReport(body('QA Transient Down', 2, { txHash: TX }));
    expect(again.id).toBe(txReportId(TX));
    const r = await publicResults('qa-transient-down', 'QA Transient Down');
    expect(r.card).toEqual([again.id]);
    expect(r.byName).toBe(1);
    expect(r.byAddress).toBe(1);
    expect(r.totals).toMatchObject({ totalReports: 1, totalPlatforms: 1 });
    expect(r.stored).toMatchObject({ totalReports: 1, totalPlatforms: 1 });
  });

  it('a report file that is really missing is still left out (not an error)', async () => {
    const { id } = await saveReport(body('QA Transient Missing', 1));
    const platform = getJson<{ reportIds: string[] }>(`${P}/platforms/qa-transient-missing.json`)!;
    expect(platform.reportIds).toEqual([id]);
    // a second report whose file is gone: the write path must not fail on it
    const { s3Store } = await import('../api/helpers/aws-s3-mock');
    const other = await saveReport(body('QA Transient Missing', 2));
    s3Store.delete(`${P}/reports/${id}.json`);
    await updateReportStatus(other.id, 'verified');
    const r = await publicResults('qa-transient-missing', 'QA Transient Missing');
    expect(r.card).toEqual([other.id]);
    expect(r.stored).toMatchObject({ totalReports: 1 });
  });
});

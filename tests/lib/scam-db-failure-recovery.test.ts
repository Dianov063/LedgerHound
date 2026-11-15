// @vitest-environment node
/**
 * Package 58 (Codex rounds 3 and 4): failure and interleaving cases of the scam database writes.
 *  - a storage failure after a submission with a transaction hash started must not block a resubmission;
 *  - one transaction hash can never produce two reports, even when a delayed first request continues
 *    after its resubmission finished (round 4: the 60 s lease of round 3 allowed that);
 *  - the stored counters can never count a report twice, however late a retry comes (round 4: the
 *    bounded list of counted ids of round 3 forgot old ids);
 *  - the stored platform count must not keep a stale index size after a write conflict.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getJson, putJson, resetS3, s3Faults, s3Gates, s3Store } from '../api/helpers/aws-s3-mock';

vi.mock('@aws-sdk/client-s3', () => import('../api/helpers/aws-s3-mock'));

import { saveReport, isTxidUsed, getPublicPlatform, _clearPublicIndexCache, TxidAlreadyUsedError, txReportId, type ScamReport } from '@/lib/scam-db';

const P = 'scam-database';
const TX = '0x' + 'cd'.repeat(32);
const body = (platformName: string, i: number | string, over: Partial<ScamReport> = {}) => ({
  platformName, platformType: 'phishing' as const, platformUrl: 'https://qa-recovery.invalid', network: 'eth', lossAmount: 250,
  description: `QA recovery complaint ${i}`, reporterEmail: `r${i}@qa-mail.invalid`, verified: false, blockchainConfirmed: false,
  status: 'pending' as const, trustTier: 1 as const, ...over,
});
const s3Down = (name = 'InternalError') => Object.assign(new Error(name), { name, $metadata: { httpStatusCode: 500 } });
/** Fail the n-th matching command (1-based) once. */
const failNth = (n: number, match: (command: string, key: string) => boolean) => {
  let seen = 0;
  s3Faults.push((command, input) => (match(command, String(input.Key ?? '')) && ++seen === n ? s3Down() : null));
};
const storedReports = () => Array.from(s3Store.keys()).filter((k) => k.startsWith(`${P}/reports/`));
const stats = () => getJson<{ totalReports: number; totalPlatforms: number; totalLoss: number }>(`${P}/index/stats.json`)!;
const indexVictims = () => (getJson<{ victims: number }[]>(`${P}/index/platforms.json`) ?? []).reduce((s, e) => s + e.victims, 0);

beforeEach(() => {
  resetS3();
  _clearPublicIndexCache();
});

describe('resubmission after a failure (transaction hash)', () => {
  it('the report write failed: the hash is not used and the resubmission saves the report', async () => {
    failNth(1, (cmd, key) => cmd === 'PutObjectCommand' && key.startsWith(`${P}/reports/`));
    await expect(saveReport(body('QA Recovery', 1, { txHash: TX }))).rejects.toThrow('InternalError');
    expect(await isTxidUsed(TX)).toBe(false);
    const { id } = await saveReport(body('QA Recovery', 2, { txHash: TX }));
    expect(id).toBe(txReportId(TX));
    expect(getJson<{ reportIds: string[] }>(`${P}/platforms/qa-recovery.json`)!.reportIds).toEqual([id]);
    expect(getJson(`${P}/txids/${TX}.json`)).toMatchObject({ reportId: id, state: 'done' });
    await expect(saveReport(body('QA Recovery', 3, { txHash: TX }))).rejects.toBeInstanceOf(TxidAlreadyUsedError);
  });

  it('the report was saved but linking failed: the resubmission completes THAT report, counted once', async () => {
    failNth(1, (cmd, key) => cmd === 'PutObjectCommand' && key.endsWith('platforms/qa-half-saved.json'));
    await expect(saveReport(body('QA Half Saved', 1, { txHash: TX }))).rejects.toThrow('InternalError');
    expect(await isTxidUsed(TX)).toBe(false); // not complete: the route must not answer 409
    const again = await saveReport(body('QA Half Saved', 2, { txHash: TX }));
    expect(again.id).toBe(txReportId(TX));
    expect(again.report.description).toBe('QA recovery complaint 1'); // the first, saved report is completed
    expect(storedReports()).toEqual([`${P}/reports/${again.id}.json`]);
    expect(getJson(`${P}/platforms/qa-half-saved.json`)).toMatchObject({ reportIds: [again.id], victims: 1 });
    expect(stats().totalReports).toBe(1);
    expect((await getPublicPlatform('qa-half-saved'))?.reports.map((r) => r.id)).toEqual([again.id]);
  });

  it('hashes recorded by the previous version (no state) stay used', async () => {
    putJson(`${P}/txids/${TX}.json`, { reportId: 'OLD-REPORT', createdAt: '2026-10-01T00:00:00.000Z' });
    expect(await isTxidUsed(TX)).toBe(true);
    await expect(saveReport(body('QA Legacy', 1, { txHash: TX }))).rejects.toBeInstanceOf(TxidAlreadyUsedError);
  });

  it('the same hash twice at the same moment: one report, both answers carry its id', async () => {
    const [a, b] = await Promise.all([saveReport(body('QA Tx Race', 'a', { txHash: TX })), saveReport(body('QA Tx Race', 'b', { txHash: TX }))]);
    expect(a.id).toBe(b.id);
    expect(storedReports()).toHaveLength(1);
    expect(getJson(`${P}/platforms/qa-tx-race.json`)).toMatchObject({ reportIds: [a.id], victims: 1 });
    expect(stats().totalReports).toBe(1);
  });
});

describe('Codex round 4, scenario 1: a delayed first request continues after its resubmission finished', () => {
  it('one hash gives one public report and one id, whatever the timing', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-13T10:00:00Z') });
    try {
      // hold the FIRST request right before it writes its report file
      let release!: () => void;
      const held = new Promise<void>((r) => { release = r; });
      let atGate!: () => void;
      const reached = new Promise<void>((r) => { atGate = r; });
      let gated = false;
      s3Gates.push((cmd, input) => {
        if (!gated && cmd === 'PutObjectCommand' && String(input.Key).startsWith(`${P}/reports/`)) { gated = true; atGate(); return held; }
        return null;
      });
      const first = saveReport(body('QA Late First', 'first', { txHash: TX }));
      await reached;
      vi.setSystemTime(new Date('2026-11-13T10:05:00Z')); // far past any lease
      const retry = await saveReport(body('QA Late First', 'retry', { txHash: TX }));
      expect(getJson(`${P}/txids/${TX}.json`)).toMatchObject({ reportId: retry.id, state: 'done' });
      release();
      const late = await first; // the delayed request continues
      expect(late.id).toBe(retry.id);
      expect(storedReports()).toEqual([`${P}/reports/${retry.id}.json`]);
      expect(getJson(`${P}/platforms/qa-late-first.json`)).toMatchObject({ reportIds: [retry.id], victims: 1 });
      expect(getJson(`${P}/txids/${TX}.json`)).toMatchObject({ reportId: retry.id, state: 'done' });
      _clearPublicIndexCache();
      expect((await getPublicPlatform('qa-late-first'))?.reports).toHaveLength(1);
      expect(stats().totalReports).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Codex round 4, scenario 2: a late retry after the counters were written', () => {
  it('the counter does not grow again, even with no memory of the report in the counter file', async () => {
    // the counters are written, then the final mark of the hash ('done', after the report is linked) fails
    let failedDone = false;
    s3Faults.push((cmd, input) => (!failedDone && cmd === 'PutObjectCommand' && input.Key === `${P}/txids/${TX}.json`
      && String(input.Body).includes('"state":"done"') ? (failedDone = true, s3Down()) : null));
    await expect(saveReport(body('QA Late Retry', 1, { txHash: TX }))).rejects.toThrow('InternalError');
    expect(stats().totalReports).toBe(1);
    // much later: many other reports, and the counter file keeps no history of earlier ids
    for (let i = 0; i < 5; i++) await saveReport(body(`QA Other ${i}`, `o${i}`));
    const evicted = { ...stats() } as Record<string, unknown>;
    delete evicted.countedReportIds;
    putJson(`${P}/index/stats.json`, evicted);
    const again = await saveReport(body('QA Late Retry', 2, { txHash: TX }));
    expect(again.id).toBe(txReportId(TX));
    expect(storedReports()).toHaveLength(6);
    expect(stats()).toMatchObject({ totalReports: 6, totalPlatforms: 6, totalLoss: 6 * 250 });
    expect(stats().totalReports).toBe(indexVictims());
  });

  it('the stored counters always equal what the stored index holds', async () => {
    await Promise.all(Array.from({ length: 8 }, (_, i) => saveReport(body(`QA Sum ${i % 3}`, i))));
    expect(stats()).toMatchObject({ totalReports: 8, totalPlatforms: 3, totalLoss: 8 * 250 });
    expect(stats().totalReports).toBe(indexVictims());
    expect(stats()).not.toHaveProperty('countedReportIds');
  });
});

describe('stored platform count after a write conflict', () => {
  it('a report that read the index before a concurrent one still stores the current platform count', async () => {
    let release!: () => void;
    const held = new Promise<void>((r) => { release = r; });
    let gated = false;
    let reachedGate!: () => void;
    const atGate = new Promise<void>((r) => { reachedGate = r; });
    s3Gates.push((cmd, input) => {
      if (!gated && cmd === 'GetObjectCommand' && input.Key === `${P}/index/stats.json`) { gated = true; reachedGate(); return held; }
      return null;
    });
    const a = saveReport(body('QA Counter A', 'a'));
    await atGate;
    await saveReport(body('QA Counter B', 'b'));
    release();
    await a;
    expect(getJson<unknown[]>(`${P}/index/platforms.json`)).toHaveLength(2);
    expect(stats()).toMatchObject({ totalReports: 2, totalPlatforms: 2 });
  });
});

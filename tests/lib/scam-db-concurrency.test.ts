// @vitest-environment node
/**
 * Package 58: concurrent writes to the scam database must not lose updates.
 * Before the fix, saveReport read -> changed -> wrote shared files without a condition: concurrent
 * reports for one platform were stored but not linked to it, and concurrent new platforms went
 * missing from the public index (reproduced over HTTP in scripts/qa/scam-db-mass/).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getJson, resetS3, s3Calls, s3Faults, s3Store } from '../api/helpers/aws-s3-mock';

vi.mock('@aws-sdk/client-s3', () => import('../api/helpers/aws-s3-mock'));

import {
  saveReport, updateReportStatus, getPublicPlatform, getPlatformIndex, getPublicStats, searchByAddress,
  _clearPublicIndexCache, TxidAlreadyUsedError, type ScamReport,
} from '@/lib/scam-db';

const P = 'scam-database';
const base = (platformName: string, i: number | string, over: Partial<ScamReport> = {}) => ({
  platformName, platformType: 'ponzi' as const, platformUrl: 'https://qa-concurrency.invalid', network: 'eth', lossAmount: 100,
  scamAddress: '0xqa0000000000000000000000000000000000c0de', description: `QA concurrency complaint ${i}`,
  reporterEmail: `c${i}@qa-mail.invalid`, verified: false, blockchainConfirmed: false, status: 'pending' as const, trustTier: 1 as const, ...over,
});
const conflict = () => Object.assign(new Error('PreconditionFailed'), { name: 'PreconditionFailed', $metadata: { httpStatusCode: 412 } });

beforeEach(() => {
  resetS3();
  _clearPublicIndexCache();
});

describe('concurrent reports', () => {
  it('12 reports for one platform at once: all linked, counted and public', async () => {
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) => saveReport(base('QA Same Platform', i))));
    const ids = results.map((r) => r.id);
    const platform = getJson<{ reportIds: string[]; victims: number }>(`${P}/platforms/qa-same-platform.json`)!;
    expect([...platform.reportIds].sort()).toEqual([...ids].sort());
    expect(platform.victims).toBe(12);
    expect(getJson<{ reports: string[] }>(`${P}/addresses/0xqa0000000000000000000000000000000000c0de.json`)!.reports).toHaveLength(12);
    expect(getJson<{ totalReports: number }>(`${P}/index/stats.json`)!.totalReports).toBe(12);
    const index = getJson<{ slug: string; victims: number }[]>(`${P}/index/platforms.json`)!;
    expect(index.find((e) => e.slug === 'qa-same-platform')?.victims).toBe(12);
    const view = await getPublicPlatform('qa-same-platform');
    expect(view?.platform.victims).toBe(12);
    expect(view?.reports).toHaveLength(12);
    expect((await getPublicStats()).totalReports).toBe(12);
  });

  it('12 new platforms at once: every one in the public index', async () => {
    await Promise.all(Array.from({ length: 12 }, (_, i) => saveReport(base(`QA Many ${String(i).padStart(2, '0')}`, i, { scamAddress: undefined }))));
    const index = getJson<{ slug: string }[]>(`${P}/index/platforms.json`)!;
    expect(index.map((e) => e.slug).sort()).toEqual(Array.from({ length: 12 }, (_, i) => `qa-many-${String(i).padStart(2, '0')}`));
    const stats = getJson<{ totalReports: number; totalPlatforms: number }>(`${P}/index/stats.json`)!;
    expect(stats.totalReports).toBe(12);
    // regression (Codex, package 58 round 3): the stored platform counter must not keep a stale index size
    expect(stats.totalPlatforms).toBe(12);
    _clearPublicIndexCache();
    expect(await getPlatformIndex()).toHaveLength(12);
  });

  it('concurrent moderation of one platform: the public view follows every decision', async () => {
    const saved = [];
    for (let i = 0; i < 8; i++) saved.push(await saveReport(base('QA Moderated', i)));
    await Promise.all(saved.map((r, i) => updateReportStatus(r.id, i % 2 ? 'rejected' : 'verified')));
    _clearPublicIndexCache();
    const view = await getPublicPlatform('qa-moderated');
    expect(view?.platform.victims).toBe(4);
    expect(view?.reports.every((r) => r.status === 'verified')).toBe(true);
    const entry = getJson<{ slug: string; victims: number }[]>(`${P}/index/platforms.json`)!.find((e) => e.slug === 'qa-moderated');
    expect(entry?.victims).toBe(4);
    expect(getJson<{ totalReports: number }>(`${P}/index/stats.json`)!.totalReports).toBe(4);
    expect((await searchByAddress('0xqa0000000000000000000000000000000000c0de')).map((p) => p.slug)).toEqual(['qa-moderated']);
  });

  it('the same transaction hash twice at once: exactly one report is saved; a later one is refused', async () => {
    const tx = '0x' + 'ab'.repeat(32);
    const results = await Promise.all([0, 1].map((i) => saveReport(base('QA Tx Race', i, { txHash: tx }))));
    expect(results[0].id).toBe(results[1].id); // both answers name the one report
    const reportFiles = Array.from(s3Store.keys()).filter((k) => k.startsWith(`${P}/reports/`));
    expect(reportFiles).toEqual([`${P}/reports/${results[0].id}.json`]);
    await expect(saveReport(base('QA Tx Race', 2, { txHash: tx }))).rejects.toBeInstanceOf(TxidAlreadyUsedError);
  });
});

describe('conditional write mechanics', () => {
  it('every shared-file write is conditional (If-Match or If-None-Match)', async () => {
    await saveReport(base('QA Conditional', 1));
    await saveReport(base('QA Conditional', 2));
    const puts = s3Calls.filter((c) => c.command === 'PutObjectCommand');
    expect(puts.length).toBeGreaterThan(0);
    for (const p of puts) expect(p.input.IfMatch !== undefined || p.input.IfNoneMatch === '*', String(p.input.Key)).toBe(true);
  });

  it('a write conflict is retried from a fresh read', async () => {
    let injected = 0;
    s3Faults.push((command, input) => (command === 'PutObjectCommand' && String(input.Key).endsWith('platforms/qa-retry.json') && injected++ < 3 ? conflict() : null));
    const { id } = await saveReport(base('QA Retry', 1));
    expect(injected).toBe(4); // 3 refused + 1 accepted attempt
    expect(getJson<{ reportIds: string[] }>(`${P}/platforms/qa-retry.json`)!.reportIds).toEqual([id]);
  });

  it('any other storage error is not retried and fails the call', async () => {
    let calls = 0;
    s3Faults.push((command, input) => (command === 'PutObjectCommand' && String(input.Key).endsWith('platforms/qa-broken.json') && ++calls ? Object.assign(new Error('InternalError'), { name: 'InternalError', $metadata: { httpStatusCode: 500 } }) : null));
    await expect(saveReport(base('QA Broken', 1))).rejects.toThrow('InternalError');
    expect(calls).toBe(1);
  });
});

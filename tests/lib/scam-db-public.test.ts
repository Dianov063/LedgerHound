// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getJson, putJson, resetS3, s3Faults } from '../api/helpers/aws-s3-mock';
import {
  _clearPublicIndexCache, getAddressIndex, getPlatformIndex, getPublicStats, getTrustLabel,
  saveReport, searchByAddress, searchPlatforms, updateReportStatus, UNMODERATED_SCORE_CAP,
  type ScamPlatform, type ScamReport,
} from '@/lib/scam-db';
import { GET as platformApi } from '@/app/api/scam-database/platform/route';
import { GET as statsApi } from '@/app/api/scam-database/stats/route';

vi.mock('@aws-sdk/client-s3', () => import('../api/helpers/aws-s3-mock'));

const P = 'scam-database';
const ADDR = '0x' + '1'.repeat(40);
const OTHER = '0x' + '2'.repeat(40);

const report = (fields: Partial<ScamReport> = {}) => ({
  platformName: 'Fictional Exchange',
  platformUrl: 'fictional-exchange.invalid',
  platformType: 'fake_exchange' as const,
  scamAddress: ADDR,
  network: 'ethereum',
  lossAmount: 100,
  lossCurrency: 'USD',
  verified: false,
  blockchainConfirmed: false,
  reporterEmail: 'reporter@example.invalid',
  description: 'Fictitious report text',
  status: 'pending' as const,
  trustTier: 1 as const,
  ...fields,
});

const platformApiFor = async (slug: string) => {
  const res = await platformApi(new NextRequest(`https://www.ledgerhound.vip/api/scam-database/platform?slug=${slug}`));
  return { status: res.status, body: await res.json() };
};

/** Everything the public can see about the platform, as one string. */
async function publicSurface(slug: string) {
  _clearPublicIndexCache();
  const [index, search, byAddress, address, stats, page] = await Promise.all([
    getPlatformIndex(), searchPlatforms(''), searchByAddress(ADDR), getAddressIndex(ADDR),
    statsApi().then((r) => r.json()), platformApiFor(slug),
  ]);
  return { index, search, byAddress, address, stats, page };
}

beforeEach(() => {
  resetS3();
  _clearPublicIndexCache();
  vi.stubEnv('AWS_S3_BUCKET', 'test-bucket');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('public scam database', () => {
  it('a rejected report disappears from every public view', async () => {
    const { id } = await saveReport(report());
    expect((await publicSurface('fictional-exchange')).page.status).toBe(200);

    await updateReportStatus(id, 'rejected');
    const s = await publicSurface('fictional-exchange');
    expect(s.page.status).toBe(404);
    expect(s.index).toEqual([]);
    expect(s.search).toEqual([]);
    expect(s.byAddress).toEqual([]);
    expect(s.address).toBeNull();
    expect(s.stats).toMatchObject({ totalReports: 0, totalPlatforms: 0, totalLoss: 0 });
    expect(JSON.stringify(s)).not.toContain('Fictitious report text');
  });

  it('a rejected report stops counting but the other reports stay', async () => {
    const a = await saveReport(report());
    await saveReport(report({ scamAddress: OTHER, lossAmount: 40, platformUrl: 'other-mirror.invalid' }));
    await updateReportStatus(a.id, 'rejected');

    const s = await publicSurface('fictional-exchange');
    expect(s.page.body.platform).toMatchObject({ victims: 1, totalLoss: 40, addresses: [OTHER], urls: ['other-mirror.invalid'] });
    expect(s.page.body.platform.reportIds).toEqual([expect.not.stringMatching(a.id)]);
    expect(s.page.body.reports.map((r: ScamReport) => r.id)).not.toContain(a.id);
    expect(s.index[0]).toMatchObject({ victims: 1, totalLoss: 40, addresses: [OTHER] });
    expect(s.address).toBeNull();
    expect(await getAddressIndex(OTHER)).toMatchObject({ reports: [expect.any(String)], totalLoss: 40 });
    expect(s.stats).toMatchObject({ totalReports: 1, totalLoss: 40 });
  });

  it('corrects stored files written before the rule, without rewriting them', async () => {
    // As the old code left them: counters and indexes still include a rejected report.
    putJson(`${P}/reports/R1.json`, { ...report(), id: 'R1', createdAt: '2026-11-01T00:00:00Z', status: 'rejected' });
    const stale: ScamPlatform = {
      slug: 'fictional-exchange', name: 'Fictional Exchange', urls: ['fictional-exchange.invalid'], types: ['fake_exchange'],
      reportIds: ['R1'], totalLoss: 100, lossCurrency: 'USD', victims: 1, addresses: [ADDR], verified: true, trustScore: 25,
      staffVerified: true, blockchainVerifiedCount: 1, firstReported: '2026-11-01T00:00:00Z', lastReported: '2026-11-01T00:00:00Z',
    };
    putJson(`${P}/platforms/fictional-exchange.json`, stale);
    putJson(`${P}/index/platforms.json`, [{ ...stale, reportIds: undefined }]);
    putJson(`${P}/addresses/${ADDR}.json`, {
      address: ADDR, platforms: ['fictional-exchange'], platformNames: ['Fictional Exchange'], reports: ['R1'],
      totalLoss: 100, networks: ['ethereum'], firstSeen: '2026-11-01T00:00:00Z', lastSeen: '2026-11-01T00:00:00Z',
    });
    putJson(`${P}/index/stats.json`, { totalReports: 1, totalPlatforms: 1, totalLoss: 100, blockchainVerified: 1, updatedAt: '2026-11-01T00:00:00Z' });

    const s = await publicSurface('fictional-exchange');
    expect(s.page.status).toBe(404);
    expect(s.index).toEqual([]);
    expect(s.address).toBeNull();
    expect(s.stats).toMatchObject({ totalReports: 0, totalPlatforms: 0, totalLoss: 0, blockchainVerified: 0 });
    // Nothing was rewritten: the stored files are corrected only when read.
    expect(getJson(`${P}/platforms/fictional-exchange.json`)).toMatchObject({ victims: 1, trustScore: 25 });
  });

  it('unmoderated reports never make a platform more than Suspicious', async () => {
    for (let i = 0; i < 25; i++) await saveReport(report({ blockchainConfirmed: true, trustTier: 2, lossAmount: 10 }));
    const { page, index } = await publicSurface('fictional-exchange');
    expect(page.body.platform.trustScore).toBe(UNMODERATED_SCORE_CAP);
    expect(getTrustLabel(index[0].trustScore).label).toBe('Suspicious');
    expect(index[0].verified).toBe(false);
  });

  it('a moderator-verified report lifts the cap, and un-rejecting restores a report', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 6; i++) ids.push((await saveReport(report({ blockchainConfirmed: true, trustTier: 2 }))).id);
    await updateReportStatus(ids[0], 'verified', 3);
    let { index } = await publicSurface('fictional-exchange');
    expect(getTrustLabel(index[0].trustScore).label).toBe('Confirmed Scam');

    await updateReportStatus(ids[0], 'rejected');
    ({ index } = await publicSurface('fictional-exchange'));
    expect(index[0]).toMatchObject({ victims: 5, trustScore: UNMODERATED_SCORE_CAP });

    await updateReportStatus(ids[0], 'verified', 3);
    const s = await publicSurface('fictional-exchange');
    expect(s.index[0].victims).toBe(6);
    expect(s.stats.totalReports).toBe(6);
  });

  it('keeps a seeded platform and its sources when a community report on it is rejected', async () => {
    const seeded: ScamPlatform = {
      slug: 'fictional-exchange', name: 'Fictional Exchange', urls: ['seed.invalid'], types: ['ponzi'], reportIds: [],
      totalLoss: 0, lossCurrency: 'USD', victims: 0, addresses: [OTHER], verified: true, trustScore: 90, staffVerified: true,
      blockchainVerifiedCount: 0, firstReported: '2026-06-29T00:00:00Z', lastReported: '2026-06-29T00:00:00Z',
      sources: [{ type: 'regulator_warning', authority: 'Example Regulator', url: 'https://regulator.invalid/w', date: '2026-06-29' }],
    };
    putJson(`${P}/platforms/fictional-exchange.json`, seeded);
    putJson(`${P}/index/platforms.json`, [{ ...seeded }]);
    putJson(`${P}/addresses/${OTHER}.json`, {
      address: OTHER, platforms: ['fictional-exchange'], platformNames: ['Fictional Exchange'], reports: [],
      totalLoss: 0, networks: [], firstSeen: '2026-06-29T00:00:00Z', lastSeen: '2026-06-29T00:00:00Z',
    });

    const { id } = await saveReport(report());
    expect(getJson<ScamPlatform>(`${P}/platforms/fictional-exchange.json`)!.trustScore).toBe(90);
    await updateReportStatus(id, 'rejected');

    const s = await publicSurface('fictional-exchange');
    expect(s.page.body.platform).toMatchObject({
      victims: 0, totalLoss: 0, trustScore: 90, verified: true, addresses: [OTHER], urls: ['seed.invalid'], types: ['ponzi'],
    });
    expect(s.page.body.platform.sources).toHaveLength(1);
    expect(s.address).toBeNull();
    expect(await getAddressIndex(OTHER)).toMatchObject({ platforms: ['fictional-exchange'], reports: [] });
  });

  it('a report that cannot be read is not shown', async () => {
    const a = await saveReport(report());
    await saveReport(report({ scamAddress: OTHER, lossAmount: 40 }));
    s3Faults.push((command, input) => (command === 'GetObjectCommand' && String(input.Key).endsWith(`/${a.id}.json`) ? new Error('S3 timeout') : null));
    const { page, address } = await publicSurface('fictional-exchange');
    expect(page.body.platform).toMatchObject({ victims: 1, totalLoss: 40, addresses: [OTHER] });
    expect(address).toBeNull();
  });
});

describe('public stats', () => {
  it('derives totals from what is public', async () => {
    await saveReport(report({ lossAmount: 70 }));
    _clearPublicIndexCache();
    expect(await getPublicStats()).toMatchObject({ totalReports: 1, totalPlatforms: 1, totalLoss: 70 });
  });
});

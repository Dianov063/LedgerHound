import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';

/* ── S3 client ── */
const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;
const PREFIX = 'scam-database';

/* ── Types ── */
export type ScamType = 'fake_exchange' | 'pig_butchering' | 'rug_pull' | 'phishing' | 'ponzi' | 'other';

/**
 * External corroborating source for a platform entry. This is the legal spine of
 * the public scam-database: every seeded platform states WHO flagged it and WHERE,
 * so an entry is a factual restatement of a published third-party finding — not
 * LedgerHound's own accusation. Ordered by evidentiary weight in getSourceWeight.
 */
export type PlatformSourceType =
  | 'regulator_warning'   // FCA / SEC / CFTC / ASIC / CSA warning or alert list
  | 'ofac_sdn'            // US Treasury OFAC sanctions listing
  | 'court_doj'           // DOJ indictment / court filing / law-enforcement action
  | 'etherscan_tag'       // Etherscan Fake_Phishing#### address tag
  | 'onchain_forensic'    // LedgerHound forensic case (own analysis, with case ID)
  | 'community_report';   // Chainabuse / community corroboration (secondary)

export interface PlatformSource {
  type: PlatformSourceType;
  /** Issuing authority as published, e.g. "FCA (UK)", "SEC (US)", "OFAC", "Etherscan". */
  authority: string;
  /** Reference/ID at the source: warning slug, case number, Fake_Phishing####, or TXID. */
  reference?: string;
  /** Direct link to the PRIMARY source page (regulator's own URL, not a blog). */
  url: string;
  /** Date the source published/listed it (ISO). Regulator warnings can be withdrawn — date matters. */
  date: string;
  /** Factual restatement of the source's finding, verbatim-ish. NOT our own claim. */
  note?: string;
  /** For clone-firm warnings: the LEGITIMATE firm being impersonated (must never be
   *  listed as the scam itself). Present ⇒ the entry is the impersonator, not this firm. */
  clonesLegitimate?: string;
}

export interface ScamReport {
  id: string;
  createdAt: string;
  platformName: string;
  platformUrl?: string;
  platformUrls?: string[];
  platformType: ScamType;
  scamAddress?: string;
  network?: string;
  txHash?: string;
  lossAmount?: number;
  lossCurrency?: string;
  lossDate?: string;
  verified: boolean;
  verifiedAt?: string;
  blockchainConfirmed: boolean;
  reporterEmail?: string;
  description?: string;
  status: 'pending' | 'verified' | 'rejected';
  trustTier: 1 | 2 | 3;
}

export interface ScamPlatform {
  slug: string;
  name: string;
  urls: string[];
  types: ScamType[];
  reportIds: string[];
  totalLoss: number;
  lossCurrency: string;
  victims: number;
  addresses: string[];
  verified: boolean;
  trustScore: number;
  staffVerified: boolean;
  blockchainVerifiedCount: number;
  firstReported: string;
  lastReported: string;
  /** External corroborating sources (regulator warnings, OFAC, Etherscan, etc.).
   *  Optional for legacy/community entries; REQUIRED for seeded platforms. */
  sources?: PlatformSource[];
}

export interface PlatformIndexEntry {
  slug: string;
  name: string;
  victims: number;
  totalLoss: number;
  verified: boolean;
  trustScore: number;
  types: ScamType[];
  urls: string[];
  lastReported: string;
  addresses: string[];
}

export interface AddressIndex {
  address: string;
  platforms: string[];
  platformNames: string[];
  reports: string[];
  totalLoss: number;
  networks: string[];
  firstSeen: string;
  lastSeen: string;
}

export interface ScamStats {
  totalReports: number;
  totalPlatforms: number;
  totalLoss: number;
  blockchainVerified: number;
  updatedAt: string;
}

export interface ScamDispute {
  id: string;
  createdAt: string;
  platformSlug?: string;
  reportId?: string;
  contactEmail: string;
  reason: string;
  relationship?: string;
  evidenceType?: string;
  evidenceFiles?: string[];
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

/* ── Helpers ── */
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

async function streamToString(stream: any): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function s3Get(key: string): Promise<any | null> {
  try {
    const data = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: `${PREFIX}/${key}` }));
    const str = await streamToString(data.Body);
    return JSON.parse(str);
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

async function s3Put(key: string, data: any): Promise<void> {
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: `${PREFIX}/${key}`,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
  }));
}

async function s3Exists(key: string): Promise<boolean> {
  try {
    await getS3().send(new HeadObjectCommand({ Bucket: bucket(), Key: `${PREFIX}/${key}` }));
    return true;
  } catch {
    return false;
  }
}

async function s3Delete(key: string): Promise<void> {
  await getS3().send(new DeleteObjectCommand({
    Bucket: bucket(),
    Key: `${PREFIX}/${key}`,
  }));
}

/* ── Trust Score System (numeric) ── */
export function calcTrustScore(platform: ScamPlatform): number {
  let score = 0;
  score += platform.victims * 1;                             // +1 per report
  score += (platform.blockchainVerifiedCount || 0) * 3;      // +3 per verified TX
  if (platform.victims >= 5) score += 5;                     // +5 multiple victims
  if (platform.victims >= 20) score += 5;                    // +5 many victims
  if (platform.staffVerified) score += 10;                   // +10 staff review
  return score;
}

export function getTrustLabel(score: number): { label: string; color: string; emoji: string } {
  if (score >= 20) return { label: 'Confirmed Scam', color: 'red', emoji: '🚨' };
  if (score >= 10) return { label: 'Likely Scam', color: 'orange', emoji: '🔴' };
  if (score >= 4) return { label: 'Suspicious', color: 'yellow', emoji: '⚠️' };
  return { label: 'Community Reported', color: 'gray', emoji: '' };
}

/* ── TXID uniqueness (atomic — file existence check) ── */
export async function isTxidUsed(txid: string): Promise<boolean> {
  return s3Exists(`txids/${txid.toLowerCase()}.json`);
}

async function markTxidUsed(txid: string, reportId: string): Promise<void> {
  await s3Put(`txids/${txid.toLowerCase()}.json`, { reportId, createdAt: new Date().toISOString() });
}

/* ── Default platform ── */
function defaultPlatform(report: Omit<ScamReport, 'id' | 'createdAt'>, slug: string): ScamPlatform {
  return {
    slug,
    name: report.platformName,
    urls: [],
    types: [],
    reportIds: [],
    totalLoss: 0,
    lossCurrency: 'USD',
    victims: 0,
    addresses: [],
    verified: false,
    trustScore: 0,
    staffVerified: false,
    blockchainVerifiedCount: 0,
    firstReported: new Date().toISOString(),
    lastReported: new Date().toISOString(),
  };
}

function defaultStats(): ScamStats {
  return { totalReports: 0, totalPlatforms: 0, totalLoss: 0, blockchainVerified: 0, updatedAt: new Date().toISOString() };
}

/* ── Save report (INCREMENTAL — no full rebuild) ── */
export async function saveReport(report: Omit<ScamReport, 'id' | 'createdAt'>): Promise<{ id: string; report: ScamReport }> {
  const id = generateId();
  const now = new Date().toISOString();
  const full: ScamReport = { ...report, id, createdAt: now };

  // 1. Save report file
  await s3Put(`reports/${id}.json`, full);

  // 2. TXID uniqueness (atomic file check)
  if (full.txHash) {
    await markTxidUsed(full.txHash, id);
  }

  // 3. Update ONLY this platform file (not all platforms)
  const slug = slugify(full.platformName);
  const platform: ScamPlatform = (await s3Get(`platforms/${slug}.json`)) || defaultPlatform(report, slug);
  platform.victims++;
  platform.totalLoss += full.lossAmount || 0;
  if (full.lossCurrency) platform.lossCurrency = full.lossCurrency;
  platform.reportIds.push(id);
  if (full.platformUrl && !platform.urls.includes(full.platformUrl)) platform.urls.push(full.platformUrl);
  if (full.platformUrls) {
    for (const u of full.platformUrls) {
      if (u && !platform.urls.includes(u)) platform.urls.push(u);
    }
  }
  if (full.scamAddress && !platform.addresses.includes(full.scamAddress)) platform.addresses.push(full.scamAddress);
  if (full.platformType && !platform.types.includes(full.platformType)) platform.types.push(full.platformType);
  if (full.blockchainConfirmed) platform.blockchainVerifiedCount++;
  if (full.trustTier === 3) platform.staffVerified = true;
  platform.lastReported = now;
  if (now < platform.firstReported) platform.firstReported = now;
  platform.trustScore = calcTrustScore(platform);
  platform.verified = platform.trustScore >= 10;
  await s3Put(`platforms/${slug}.json`, platform);

  // 4. Update address index if address provided
  if (full.scamAddress) {
    const addrKey = full.scamAddress.toLowerCase();
    const addr: AddressIndex = (await s3Get(`addresses/${addrKey}.json`)) || {
      address: full.scamAddress,
      platforms: [],
      platformNames: [],
      reports: [],
      totalLoss: 0,
      networks: [],
      firstSeen: now,
      lastSeen: now,
    };
    if (!addr.platforms.includes(slug)) addr.platforms.push(slug);
    if (!addr.platformNames.includes(full.platformName)) addr.platformNames.push(full.platformName);
    addr.reports.push(id);
    addr.totalLoss += full.lossAmount || 0;
    if (full.network && !addr.networks.includes(full.network)) addr.networks.push(full.network);
    addr.lastSeen = now;
    await s3Put(`addresses/${addrKey}.json`, addr);
  }

  // 5. Update platform index (append/update one entry — lightweight)
  const index: PlatformIndexEntry[] = (await s3Get('index/platforms.json')) || [];
  const existing = index.findIndex(p => p.slug === slug);
  const entry: PlatformIndexEntry = {
    slug,
    name: platform.name,
    victims: platform.victims,
    totalLoss: platform.totalLoss,
    verified: platform.verified,
    trustScore: platform.trustScore,
    types: platform.types,
    urls: platform.urls,
    lastReported: platform.lastReported,
    addresses: platform.addresses,
  };
  if (existing >= 0) index[existing] = entry;
  else index.push(entry);
  await s3Put('index/platforms.json', index);

  // 6. Update stats (increment only)
  const stats: ScamStats = (await s3Get('index/stats.json')) || defaultStats();
  stats.totalReports++;
  stats.totalPlatforms = index.length;
  stats.totalLoss += full.lossAmount || 0;
  if (full.blockchainConfirmed) stats.blockchainVerified++;
  stats.updatedAt = now;
  await s3Put('index/stats.json', stats);

  return { id, report: full };
}

/* ── Save dispute ── */
export async function saveDispute(dispute: Omit<ScamDispute, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const id = generateId();
  const full: ScamDispute = { ...dispute, id, createdAt: new Date().toISOString(), status: 'pending' };
  await s3Put(`disputes/${id}.json`, full);
  return id;
}

/* ── Read data ── */
export async function getPlatformIndex(): Promise<PlatformIndexEntry[]> {
  const data = await s3Get('index/platforms.json');
  if (Array.isArray(data)) {
    console.log('[platforms] Loaded', data.length, 'platforms from S3');
    return data;
  }
  console.log('[platforms] No platform index found in S3 (key: scam-database/index/platforms.json)');
  return [];
}

export async function getStats(): Promise<ScamStats> {
  const data = await s3Get('index/stats.json');
  if (data) {
    console.log('[stats] Loaded from S3:', JSON.stringify(data));
    return data;
  }
  console.log('[stats] No stats found in S3, returning defaults');
  return defaultStats();
}

export async function getPlatformBySlug(slug: string): Promise<ScamPlatform | null> {
  return s3Get(`platforms/${slug}.json`);
}

export async function getReportById(id: string): Promise<ScamReport | null> {
  return s3Get(`reports/${id}.json`);
}

export async function getReportsForPlatform(reportIds: string[]): Promise<ScamReport[]> {
  const results = await Promise.allSettled(reportIds.map(id => s3Get(`reports/${id}.json`)));
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`[scam-db] getReportsForPlatform: ${failed.length}/${results.length} S3 fetches failed`);
  }
  return results
    .filter((r): r is PromiseFulfilledResult<ScamReport | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(Boolean) as ScamReport[];
}

export async function getAddressIndex(address: string): Promise<AddressIndex | null> {
  return s3Get(`addresses/${address.toLowerCase()}.json`);
}

/* ── Search ── */
export async function searchPlatforms(query: string): Promise<PlatformIndexEntry[]> {
  const index = await getPlatformIndex();
  const q = query.toLowerCase().trim();
  if (!q) return index;
  return index.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.slug.includes(q) ||
    p.urls.some(u => u.toLowerCase().includes(q)) ||
    p.addresses.some(a => a.toLowerCase().includes(q))
  );
}

export async function searchByAddress(address: string): Promise<PlatformIndexEntry[]> {
  // First check dedicated address index (O(1) lookup)
  const addrIndex = await getAddressIndex(address);
  if (addrIndex && addrIndex.platforms.length > 0) {
    const index = await getPlatformIndex();
    return index.filter(p => addrIndex.platforms.includes(p.slug));
  }
  // Fallback to platform index scan
  const index = await getPlatformIndex();
  const addr = address.toLowerCase().trim();
  return index.filter(p => p.addresses.some(a => a.toLowerCase() === addr));
}

/* ── Admin: list all reports (with S3 pagination) ── */
export async function listAllReports(): Promise<ScamReport[]> {
  const s3 = getS3();
  const allReports: ScamReport[] = [];
  let ContinuationToken: string | undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: bucket(),
      Prefix: `${PREFIX}/reports/`,
      ContinuationToken,
    }));
    if (res.Contents) {
      const batch = await Promise.all(
        res.Contents.map(async (obj) => {
          try {
            const data = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: obj.Key! }));
            return JSON.parse(await streamToString(data.Body)) as ScamReport;
          } catch { return null; }
        })
      );
      allReports.push(...(batch.filter(Boolean) as ScamReport[]));
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return allReports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ── Admin: update report status ── */
export async function updateReportStatus(id: string, status: 'verified' | 'rejected', trustTier?: 1 | 2 | 3): Promise<void> {
  const report = await getReportById(id);
  if (!report) throw new Error('Report not found');

  const oldStatus = report.status;
  report.status = status;
  if (trustTier) report.trustTier = trustTier;
  if (status === 'verified') report.verifiedAt = new Date().toISOString();
  await s3Put(`reports/${id}.json`, report);

  // Update the platform's trust score
  const slug = slugify(report.platformName);
  const platform = await getPlatformBySlug(slug);
  if (platform) {
    if (status === 'verified' && trustTier === 3) platform.staffVerified = true;
    platform.trustScore = calcTrustScore(platform);
    platform.verified = platform.trustScore >= 10;
    await s3Put(`platforms/${slug}.json`, platform);

    // Update index entry
    const index = await getPlatformIndex();
    const idx = index.findIndex(p => p.slug === slug);
    if (idx >= 0) {
      index[idx].trustScore = platform.trustScore;
      index[idx].verified = platform.verified;
      await s3Put('index/platforms.json', index);
    }
  }

  // Update stats if rejecting
  if (status === 'rejected' && oldStatus !== 'rejected') {
    const stats = await getStats();
    stats.totalReports = Math.max(0, stats.totalReports - 1);
    stats.totalLoss -= report.lossAmount || 0;
    if (report.blockchainConfirmed) stats.blockchainVerified = Math.max(0, stats.blockchainVerified - 1);
    stats.updatedAt = new Date().toISOString();
    await s3Put('index/stats.json', stats);
  }
}

/* ── List disputes ── */
export async function listDisputes(): Promise<ScamDispute[]> {
  const s3 = getS3();
  const disputes: ScamDispute[] = [];
  let ContinuationToken: string | undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: bucket(),
      Prefix: `${PREFIX}/disputes/`,
      ContinuationToken,
    }));
    if (res.Contents) {
      const batch = await Promise.all(
        res.Contents.map(async (obj) => {
          try {
            const data = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: obj.Key! }));
            return JSON.parse(await streamToString(data.Body)) as ScamDispute;
          } catch { return null; }
        })
      );
      disputes.push(...(batch.filter(Boolean) as ScamDispute[]));
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return disputes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ── Update dispute status ── */
export async function updateDisputeStatus(
  disputeId: string,
  status: ScamDispute['status'],
  resolutionNote?: string,
): Promise<ScamDispute | null> {
  const existing = await s3Get(`disputes/${disputeId}.json`) as ScamDispute | null;
  if (!existing) return null;

  const updated: ScamDispute = {
    ...existing,
    status,
    resolvedAt: ['resolved', 'rejected'].includes(status) ? new Date().toISOString() : existing.resolvedAt,
    resolutionNote: resolutionNote || existing.resolutionNote,
  };

  await s3Put(`disputes/${disputeId}.json`, updated);
  return updated;
}

/* ── Get single dispute ── */
export async function getDispute(disputeId: string): Promise<ScamDispute | null> {
  return await s3Get(`disputes/${disputeId}.json`) as ScamDispute | null;
}

/* ── Recovery score calculator ── */
export function calcRecoveryScore(report: {
  lossDate?: string;
  blockchainConfirmed: boolean;
  network?: string;
  lossAmount?: number;
}): { score: number; label: string; details: string[] } {
  let score = 30; // baseline
  const details: string[] = [];

  // Time factor
  if (report.lossDate) {
    const daysSince = Math.floor((Date.now() - new Date(report.lossDate).getTime()) / 86400000);
    if (daysSince <= 7) { score += 25; details.push('Reported within 7 days — critical window for exchange freezes'); }
    else if (daysSince <= 30) { score += 15; details.push('Reported within 30 days — some exchange cooperation possible'); }
    else if (daysSince <= 90) { score += 5; details.push('Reported within 90 days — limited exchange cooperation'); }
    else { details.push('Reported after 90 days — recovery more difficult but not impossible'); }
  }

  // Blockchain evidence
  if (report.blockchainConfirmed) { score += 15; details.push('Transaction verified on blockchain — strong evidence for legal action'); }

  // Network factor (some chains easier to trace)
  if (['eth', 'bnb', 'polygon'].includes(report.network || '')) { score += 5; details.push('EVM chain — well-supported by exchange compliance teams'); }
  else if (report.network === 'btc') { score += 5; details.push('Bitcoin — traceable through UTXO analysis'); }
  else if (report.network === 'trx') { score += 3; details.push('TRON — USDT tracing available but fewer exchange freeze options'); }

  // Amount factor
  if ((report.lossAmount || 0) >= 50000) { score += 10; details.push('Significant amount — meets threshold for law enforcement priority'); }
  else if ((report.lossAmount || 0) >= 10000) { score += 5; details.push('Moderate amount — viable for legal action'); }

  score = Math.min(85, Math.max(5, score));
  const label = score >= 60 ? 'Good recovery potential' : score >= 40 ? 'Moderate recovery potential' : 'Limited recovery potential';

  return { score, label, details };
}

/* ── Seed database from VERIFIED platforms ──────────────────────────────
 *
 * 2026-05-20 CLEANUP: The original SEED array contained 10 fabricated platforms
 * (CryptoTrade Pro, BitInvestment Club, etc.) with no real provenance — one
 * entry falsely labeled Binance hot wallet 0x56eddb7a... as "CryptoYield Ponzi".
 * This created defamation risk and was indexed on ledgerhound.vip publicly.
 *
 * All 10 fabricated platforms were removed in feature/report-v2-phase-0-cleanup.
 * See docs/removed-fabricated-entries.md for the full audit trail.
 *
 * NEW BEHAVIOR: This function now seeds from VERIFIED_SEED_PLATFORMS in
 * lib/scam-db-verified-seed.ts. Each entry there MUST have real on-chain
 * evidence + external corroboration + documented research process.
 *
 * Currently empty (until Phase 4 adds DZHLWK FINTECH).
 */
export async function seedDatabase(force = false): Promise<{ seeded: number; skipped: boolean }> {
  console.log('[seed] Starting seed...');
  console.log('[seed] Bucket:', bucket(), 'Region:', process.env.AWS_REGION || 'eu-central-1');

  // Check if already seeded (skip unless force=true)
  const existing = await getPlatformIndex();
  if (!force && existing.length > 0) {
    console.log('[seed] Database already has', existing.length, 'platforms, skipping (use force=true to re-seed)');
    return { seeded: 0, skipped: true };
  }

  // Dynamic import to avoid circular dep at module load
  const { VERIFIED_SEED_PLATFORMS } = await import('./scam-db-verified-seed');

  const now = new Date().toISOString();

  if (VERIFIED_SEED_PLATFORMS.length === 0) {
    console.log('[seed] No verified seed platforms defined yet. Database remains empty.');
    console.log('[seed] Add platforms to lib/scam-db-verified-seed.ts with full evidence chain.');
    // Write empty indexes so reads return [] not 404
    await Promise.all([
      s3Put('index/platforms.json', [] as PlatformIndexEntry[]),
      s3Put('index/stats.json', {
        totalReports: 0, totalPlatforms: 0, totalLoss: 0, blockchainVerified: 0, updatedAt: now,
      } as ScamStats),
    ]);
    return { seeded: 0, skipped: false };
  }

  console.log(`[seed] Loading ${VERIFIED_SEED_PLATFORMS.length} verified platforms...`);
  const allPlatforms: ScamPlatform[] = [];
  const allAddresses: { key: string; data: AddressIndex }[] = [];
  const platformIndex: PlatformIndexEntry[] = [];
  let totalReports = 0;
  let totalLoss = 0;
  let totalVerified = 0;

  for (const platform of VERIFIED_SEED_PLATFORMS) {
    allPlatforms.push(platform);
    platformIndex.push({
      slug: platform.slug,
      name: platform.name,
      victims: platform.victims,
      totalLoss: platform.totalLoss,
      verified: platform.verified,
      trustScore: platform.trustScore,
      types: platform.types,
      urls: platform.urls,
      lastReported: platform.lastReported,
      addresses: platform.addresses,
    });

    for (const addr of platform.addresses) {
      allAddresses.push({
        key: `addresses/${addr.toLowerCase()}.json`,
        data: {
          address: addr,
          platforms: [platform.slug],
          platformNames: [platform.name],
          reports: platform.reportIds,
          totalLoss: platform.totalLoss,
          networks: [],
          firstSeen: platform.firstReported,
          lastSeen: platform.lastReported,
        },
      });
    }

    totalReports += platform.victims;
    totalLoss += platform.totalLoss;
    totalVerified += platform.blockchainVerifiedCount;
  }

  const stats: ScamStats = {
    totalReports, totalPlatforms: allPlatforms.length,
    totalLoss, blockchainVerified: totalVerified,
    updatedAt: now,
  };

  await Promise.all([
    s3Put('index/platforms.json', platformIndex),
    s3Put('index/stats.json', stats),
  ]);
  for (let i = 0; i < allPlatforms.length; i += 4) {
    const batch = allPlatforms.slice(i, i + 4);
    await Promise.all(batch.map(p => s3Put(`platforms/${p.slug}.json`, p)));
  }
  if (allAddresses.length > 0) {
    await Promise.all(allAddresses.map(a => s3Put(a.key, a.data)));
  }

  console.log(`[seed] Done! ${stats.totalPlatforms} verified platforms seeded.`);
  return { seeded: allPlatforms.length, skipped: false };
}


/* ── Delete report + platform cleanup ── */
export async function deleteReportAndPlatform(reportId: string, platformSlug: string): Promise<{
  deleted: string[];
  updatedStats: ScamStats;
  platformsRemaining: number;
}> {
  const deleted: string[] = [];

  // 1. Delete report JSON
  try {
    await s3Delete(`reports/${reportId}.json`);
    deleted.push(`reports/${reportId}.json`);
  } catch (e) { console.log(`[delete] report ${reportId} not found, skipping`); }

  // 2. Delete platform JSON
  try {
    await s3Delete(`platforms/${platformSlug}.json`);
    deleted.push(`platforms/${platformSlug}.json`);
  } catch (e) { console.log(`[delete] platform ${platformSlug} not found, skipping`); }

  // 3. Update platforms index — remove the entry
  const platforms = await getPlatformIndex();
  const filtered = platforms.filter(p => p.slug !== platformSlug);
  await s3Put('index/platforms.json', filtered);
  deleted.push('index/platforms.json (updated)');

  // 4. Update stats
  const stats = await getStats();
  stats.totalPlatforms = filtered.length;
  // Recalculate from remaining platforms
  stats.totalReports = filtered.reduce((sum, p) => sum + p.victims, 0);
  stats.totalLoss = filtered.reduce((sum, p) => sum + p.totalLoss, 0);
  stats.updatedAt = new Date().toISOString();
  await s3Put('index/stats.json', stats);
  deleted.push('index/stats.json (updated)');

  // 5. Clean up address index entries referencing this platform
  // (best effort — iterate known addresses if platform data existed)

  console.log(`[delete] Cleaned up report=${reportId}, platform=${platformSlug}`);
  console.log(`[delete] Platforms remaining: ${filtered.length}`);
  console.log(`[delete] Updated stats:`, JSON.stringify(stats));

  return { deleted, updatedStats: stats, platformsRemaining: filtered.length };
}

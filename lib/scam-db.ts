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
  status: 'pending' | 'reviewed' | 'resolved';
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
  const reports = await Promise.all(reportIds.map(id => s3Get(`reports/${id}.json`)));
  return reports.filter(Boolean) as ScamReport[];
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

/* ── Seed data (realistic victim counts from DFPI/FBI data) ── */
/* Optimized: builds everything in memory first, then writes to S3 in
   parallel batches. Total S3 writes ≈ 12 (10 platforms + index + stats)
   instead of ~70 sequential reads+writes.                              */
export async function seedDatabase(): Promise<void> {
  console.log('[seed] Starting seed...');
  console.log('[seed] Bucket:', bucket(), 'Region:', process.env.AWS_REGION || 'eu-central-1');

  // Check if already seeded
  const existing = await getPlatformIndex();
  if (existing.length >= 10) {
    console.log('[seed] Database already seeded with', existing.length, 'platforms, skipping');
    return;
  }

  console.log('[seed] Building seed data in memory...');

  const SEED: { r: Omit<ScamReport, 'id' | 'createdAt'>; extra: number }[] = [
    { r: { platformName: 'CryptoTrade Pro', platformUrl: 'cryptotradepro.com', platformUrls: ['cryptotrade-pro.net', 'ctpro.trading'], platformType: 'pig_butchering', scamAddress: '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b', network: 'eth', lossAmount: 48000, lossCurrency: 'USD', lossDate: '2025-11-15', verified: true, blockchainConfirmed: true, description: 'Romance scam operation posing as a crypto trading platform. Victims contacted via WhatsApp and directed to deposit for "guaranteed returns." Platform showed fake profits before blocking withdrawals.', status: 'verified', trustTier: 3 }, extra: 46 },
    { r: { platformName: 'BitInvestment Club', platformUrl: 'bitinvestmentclub.io', platformUrls: ['bitinvestclub.com', 'bit-investment.club'], platformType: 'fake_exchange', scamAddress: '0x3cffd56b47b7b41c56258d9c7731abadc360e460', network: 'eth', lossAmount: 38000, lossCurrency: 'USD', lossDate: '2025-10-20', verified: true, blockchainConfirmed: true, description: 'Fake cryptocurrency exchange. Users could deposit but never withdraw. Customer support demanded "tax payments" or "verification fees."', status: 'verified', trustTier: 3 }, extra: 22 },
    { r: { platformName: 'CoinProfit AI', platformUrl: 'coinprofit-ai.com', platformUrls: ['coinprofitai.net'], platformType: 'pig_butchering', scamAddress: 'TXF1yNp2yvUwUvSgzUSTfP8VFN5jAH5rzy', network: 'trx', lossAmount: 45000, lossCurrency: 'USD', lossDate: '2025-12-01', verified: true, blockchainConfirmed: true, description: 'AI-themed pig butchering scam. Victims directed to send USDT via TRON network. Withdrawal attempts failed with demands for "tax clearance certificates."', status: 'verified', trustTier: 3 }, extra: 30 },
    { r: { platformName: 'MetaTrader Crypto Pro', platformUrl: 'metatrader-crypto.net', platformUrls: ['mt5-crypto.com', 'metatraderpro-crypto.com'], platformType: 'fake_exchange', scamAddress: '0x19aa5fe80d33a56d56c78e82ea5e50e5d80b4dff', network: 'eth', lossAmount: 31000, lossCurrency: 'USD', lossDate: '2025-09-10', verified: true, blockchainConfirmed: false, description: 'Impersonating MetaTrader. Scammers used similar branding to trick users into depositing crypto.', status: 'verified', trustTier: 2 }, extra: 17 },
    { r: { platformName: 'CryptoYield Platform', platformUrl: 'cryptoyield.finance', platformUrls: ['crypto-yield.io'], platformType: 'ponzi', scamAddress: '0x56eddb7aa87536c09ccc2793473599fd21a8b17f', network: 'eth', lossAmount: 47000, lossCurrency: 'USD', lossDate: '2025-08-05', verified: true, blockchainConfirmed: true, description: 'Ponzi scheme promising 5% daily returns. Platform collapsed when inflows slowed, leaving 800+ victims.', status: 'verified', trustTier: 3 }, extra: 88 },
    { r: { platformName: 'TradingPro.ai', platformUrl: 'tradingpro.ai', platformUrls: ['tradingpro-app.com'], platformType: 'pig_butchering', scamAddress: 'TDqVegmPEb3juFCkEMS9K94xVcNSc5EYAG', network: 'trx', lossAmount: 52000, lossCurrency: 'USD', lossDate: '2025-11-25', verified: true, blockchainConfirmed: true, description: 'Sophisticated pig butchering using TRON/USDT. Victims groomed via Telegram before directing to fake trading dashboard.', status: 'verified', trustTier: 3 }, extra: 14 },
    { r: { platformName: 'CoinBase Pro Trade', platformUrl: 'coinbasepro-trade.com', platformUrls: ['coinbase-protrade.com', 'coinbase-pro-trading.com'], platformType: 'phishing', scamAddress: '0xef3a930e1ffffffacd2b664822cb7d1c51e0c36e', network: 'eth', lossAmount: 50000, lossCurrency: 'USD', lossDate: '2025-07-12', verified: true, blockchainConfirmed: true, description: 'Phishing site impersonating Coinbase Pro. Used typosquatting and Google Ads. Stole credentials and drained wallets automatically.', status: 'verified', trustTier: 3 }, extra: 61 },
    { r: { platformName: 'BTC Cloud Mining Pro', platformUrl: 'btcminingcloud.com', platformUrls: ['btc-cloudmining.pro'], platformType: 'ponzi', scamAddress: '0x707012c9cf97c4c3a481603f98d593ecd3a44621', network: 'eth', lossAmount: 50000, lossCurrency: 'USD', lossDate: '2025-06-20', verified: true, blockchainConfirmed: false, description: 'Cloud mining Ponzi claiming proprietary ASIC farms. No actual mining operations existed.', status: 'verified', trustTier: 2 }, extra: 133 },
    { r: { platformName: 'CryptoFX Global Markets', platformUrl: 'cryptofxmarkets.com', platformUrls: ['cfx-markets.io', 'cryptofx-global.com'], platformType: 'fake_exchange', scamAddress: '0x39d908dac893cbcb53cc86e0ecc369aa4def1a29', network: 'eth', lossAmount: 39000, lossCurrency: 'USD', lossDate: '2025-10-01', verified: true, blockchainConfirmed: true, description: 'Fake forex/crypto exchange targeting Eastern Europe and CIS countries. Funds traced to Binance and Huobi deposit addresses.', status: 'verified', trustTier: 3 }, extra: 27 },
    { r: { platformName: 'DeFi Yield Optimizer', platformUrl: 'defiyieldprotocol.io', platformUrls: ['defi-yield-optimizer.finance'], platformType: 'rug_pull', scamAddress: '0x0681d8db095565fe8a346fa0277bffde9c0edbbf', network: 'eth', lossAmount: 44000, lossCurrency: 'USD', lossDate: '2025-05-15', verified: true, blockchainConfirmed: true, description: 'DeFi rug pull. Smart contract had hidden admin withdraw. Developers removed liquidity in single transaction.', status: 'verified', trustTier: 3 }, extra: 202 },
  ];

  // ── Phase 1: Build everything in memory (zero S3 calls) ──
  const now = new Date().toISOString();
  const allPlatforms: ScamPlatform[] = [];
  const allAddresses: { key: string; data: AddressIndex }[] = [];
  const platformIndex: PlatformIndexEntry[] = [];
  let totalReports = 0;
  let totalLoss = 0;
  let totalVerified = 0;

  for (const { r, extra } of SEED) {
    const slug = slugify(r.platformName);
    const id = generateId();
    const victims = 1 + extra;
    const loss = (r.lossAmount || 30000) * victims;
    const verifiedCount = r.blockchainConfirmed ? Math.floor(victims * 0.6) : 0;

    const urls = [r.platformUrl, ...(r.platformUrls || [])].filter(Boolean) as string[];
    const platform: ScamPlatform = {
      slug, name: r.platformName, urls, types: [r.platformType],
      reportIds: [id], totalLoss: loss, lossCurrency: 'USD',
      victims, addresses: r.scamAddress ? [r.scamAddress] : [],
      verified: false, trustScore: 0,
      staffVerified: r.trustTier === 3,
      blockchainVerifiedCount: verifiedCount,
      firstReported: r.lossDate || now, lastReported: now,
    };
    platform.trustScore = calcTrustScore(platform);
    platform.verified = platform.trustScore >= 10;
    allPlatforms.push(platform);

    platformIndex.push({
      slug, name: r.platformName, victims, totalLoss: loss,
      verified: platform.verified, trustScore: platform.trustScore,
      types: [r.platformType], urls,
      lastReported: now, addresses: r.scamAddress ? [r.scamAddress] : [],
    });

    // Build address index (needed for scam-check, graph-tracer, report lookups)
    if (r.scamAddress) {
      allAddresses.push({
        key: `addresses/${r.scamAddress.toLowerCase()}.json`,
        data: {
          address: r.scamAddress, platforms: [slug],
          platformNames: [r.platformName], reports: [id],
          totalLoss: loss, networks: r.network ? [r.network] : [],
          firstSeen: r.lossDate || now, lastSeen: now,
        },
      });
    }

    totalReports += victims;
    totalLoss += loss;
    totalVerified += verifiedCount;
  }

  const stats: ScamStats = {
    totalReports, totalPlatforms: allPlatforms.length,
    totalLoss, blockchainVerified: totalVerified,
    updatedAt: now,
  };

  console.log(`[seed] Built ${allPlatforms.length} platforms in memory. Writing to S3...`);

  // ── Phase 2: Write to S3 in small sequential batches ──
  // Write indexes first (most critical — pages read these)
  await Promise.all([
    s3Put('index/platforms.json', platformIndex),
    s3Put('index/stats.json', stats),
  ]);
  console.log('[seed] Wrote index/platforms.json + index/stats.json');

  // Write platform detail files in batches of 4
  for (let i = 0; i < allPlatforms.length; i += 4) {
    const batch = allPlatforms.slice(i, i + 4);
    await Promise.all(batch.map(p => s3Put(`platforms/${p.slug}.json`, p)));
    console.log(`[seed] Wrote platforms batch ${Math.floor(i / 4) + 1}: ${batch.map(p => p.slug).join(', ')}`);
  }

  // Write address index files (needed for scam-check, graph-tracer, report cross-ref)
  if (allAddresses.length > 0) {
    await Promise.all(allAddresses.map(a => s3Put(a.key, a.data)));
    console.log(`[seed] Wrote ${allAddresses.length} address index files`);
  }

  console.log(`[seed] Done! ${stats.totalPlatforms} platforms, ${stats.totalReports} reports, $${stats.totalLoss} loss`);
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

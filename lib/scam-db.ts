import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

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
  firstReported: string;
  lastReported: string;
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
    const data = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
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
    Key: key,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
  }));
}

/* ── TXID uniqueness ── */
async function getUsedTxids(): Promise<string[]> {
  const data = await s3Get('scam-database/used-txids.json');
  return Array.isArray(data) ? data : [];
}

async function addUsedTxid(txid: string): Promise<void> {
  const existing = await getUsedTxids();
  if (!existing.includes(txid.toLowerCase())) {
    existing.push(txid.toLowerCase());
    await s3Put('scam-database/used-txids.json', existing);
  }
}

export async function isTxidUsed(txid: string): Promise<boolean> {
  const existing = await getUsedTxids();
  return existing.includes(txid.toLowerCase());
}

/* ── Save individual report ── */
export async function saveReport(report: Omit<ScamReport, 'id' | 'createdAt'>): Promise<{ id: string; report: ScamReport }> {
  const id = generateId();
  const full: ScamReport = {
    ...report,
    id,
    createdAt: new Date().toISOString(),
  };
  const key = `scam-database/reports/${id}.json`;
  await s3Put(key, full);

  // Track TXID if present
  if (full.txHash) {
    await addUsedTxid(full.txHash);
  }

  // Rebuild aggregates
  await rebuildAggregates();

  return { id, report: full };
}

/* ── Save dispute ── */
export async function saveDispute(dispute: Omit<ScamDispute, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const id = generateId();
  const full: ScamDispute = {
    ...dispute,
    id,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  await s3Put(`scam-database/disputes/${id}.json`, full);
  return id;
}

/* ── Read aggregates ── */
export async function getPlatforms(): Promise<ScamPlatform[]> {
  const data = await s3Get('scam-database/platforms.json');
  return Array.isArray(data) ? data : [];
}

export async function getStats(): Promise<ScamStats> {
  const data = await s3Get('scam-database/stats.json');
  return data || { totalReports: 0, totalPlatforms: 0, totalLoss: 0, blockchainVerified: 0, updatedAt: new Date().toISOString() };
}

export async function getPlatformBySlug(slug: string): Promise<ScamPlatform | null> {
  const platforms = await getPlatforms();
  return platforms.find(p => p.slug === slug) || null;
}

export async function getReportById(id: string): Promise<ScamReport | null> {
  return s3Get(`scam-database/reports/${id}.json`);
}

export async function getReportsForPlatform(reportIds: string[]): Promise<ScamReport[]> {
  const reports = await Promise.all(
    reportIds.map(id => s3Get(`scam-database/reports/${id}.json`))
  );
  return reports.filter(Boolean) as ScamReport[];
}

/* ── Search ── */
export async function searchPlatforms(query: string): Promise<ScamPlatform[]> {
  const platforms = await getPlatforms();
  const q = query.toLowerCase().trim();
  if (!q) return platforms;
  return platforms.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.slug.includes(q) ||
    p.urls.some(u => u.toLowerCase().includes(q)) ||
    p.addresses.some(a => a.toLowerCase().includes(q))
  );
}

export async function searchByAddress(address: string): Promise<ScamPlatform[]> {
  const platforms = await getPlatforms();
  const addr = address.toLowerCase().trim();
  return platforms.filter(p => p.addresses.some(a => a.toLowerCase() === addr));
}

/* ── Rebuild aggregates from all individual reports ── */
export async function rebuildAggregates(): Promise<void> {
  const s3 = getS3();
  const allReports: ScamReport[] = [];

  // List all report files
  let continuationToken: string | undefined;
  do {
    const list = await s3.send(new ListObjectsV2Command({
      Bucket: bucket(),
      Prefix: 'scam-database/reports/',
      ContinuationToken: continuationToken,
    }));

    if (list.Contents) {
      const batch = await Promise.all(
        list.Contents.map(async (obj) => {
          try {
            const data = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: obj.Key! }));
            const str = await streamToString(data.Body);
            return JSON.parse(str) as ScamReport;
          } catch {
            return null;
          }
        })
      );
      allReports.push(...(batch.filter(Boolean) as ScamReport[]));
    }
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  // Group by platform (only non-rejected)
  const platforms: Record<string, ScamPlatform> = {};
  for (const r of allReports.filter(r => r.status !== 'rejected')) {
    const slug = slugify(r.platformName);
    if (!platforms[slug]) {
      platforms[slug] = {
        slug,
        name: r.platformName,
        urls: [],
        types: [],
        reportIds: [],
        totalLoss: 0,
        lossCurrency: 'USD',
        victims: 0,
        addresses: [],
        verified: false,
        firstReported: r.createdAt,
        lastReported: r.createdAt,
      };
    }
    const p = platforms[slug];
    p.reportIds.push(r.id);
    p.victims++;
    if (r.lossAmount) p.totalLoss += r.lossAmount;
    if (r.lossCurrency) p.lossCurrency = r.lossCurrency;
    if (r.platformUrl && !p.urls.includes(r.platformUrl)) p.urls.push(r.platformUrl);
    if (r.platformUrls) {
      for (const u of r.platformUrls) {
        if (!p.urls.includes(u)) p.urls.push(u);
      }
    }
    if (r.scamAddress && !p.addresses.includes(r.scamAddress)) p.addresses.push(r.scamAddress);
    if (r.platformType && !p.types.includes(r.platformType)) p.types.push(r.platformType);
    if (r.blockchainConfirmed || r.trustTier >= 2) p.verified = true;
    if (r.createdAt < p.firstReported) p.firstReported = r.createdAt;
    if (r.createdAt > p.lastReported) p.lastReported = r.createdAt;
  }

  // Save platforms.json
  await s3Put('scam-database/platforms.json', Object.values(platforms));

  // Save stats.json
  const stats: ScamStats = {
    totalReports: allReports.filter(r => r.status !== 'rejected').length,
    totalPlatforms: Object.keys(platforms).length,
    totalLoss: allReports.reduce((s, r) => s + (r.status !== 'rejected' && r.lossAmount ? r.lossAmount : 0), 0),
    blockchainVerified: allReports.filter(r => r.blockchainConfirmed).length,
    updatedAt: new Date().toISOString(),
  };
  await s3Put('scam-database/stats.json', stats);

  console.log(`[scam-db] Rebuilt aggregates: ${stats.totalReports} reports, ${stats.totalPlatforms} platforms`);
}

/* ── Admin: list all reports ── */
export async function listAllReports(): Promise<ScamReport[]> {
  const s3 = getS3();
  const allReports: ScamReport[] = [];
  let continuationToken: string | undefined;
  do {
    const list = await s3.send(new ListObjectsV2Command({
      Bucket: bucket(),
      Prefix: 'scam-database/reports/',
      ContinuationToken: continuationToken,
    }));
    if (list.Contents) {
      const batch = await Promise.all(
        list.Contents.map(async (obj) => {
          try {
            const data = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: obj.Key! }));
            return JSON.parse(await streamToString(data.Body)) as ScamReport;
          } catch { return null; }
        })
      );
      allReports.push(...(batch.filter(Boolean) as ScamReport[]));
    }
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);
  return allReports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ── Admin: update report status ── */
export async function updateReportStatus(id: string, status: 'verified' | 'rejected', trustTier?: 1 | 2 | 3): Promise<void> {
  const report = await getReportById(id);
  if (!report) throw new Error('Report not found');
  report.status = status;
  if (trustTier) report.trustTier = trustTier;
  if (status === 'verified') report.verifiedAt = new Date().toISOString();
  await s3Put(`scam-database/reports/${id}.json`, report);
  await rebuildAggregates();
}

/* ── List disputes ── */
export async function listDisputes(): Promise<ScamDispute[]> {
  const s3 = getS3();
  const disputes: ScamDispute[] = [];
  let continuationToken: string | undefined;
  do {
    const list = await s3.send(new ListObjectsV2Command({
      Bucket: bucket(),
      Prefix: 'scam-database/disputes/',
      ContinuationToken: continuationToken,
    }));
    if (list.Contents) {
      const batch = await Promise.all(
        list.Contents.map(async (obj) => {
          try {
            const data = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: obj.Key! }));
            return JSON.parse(await streamToString(data.Body)) as ScamDispute;
          } catch { return null; }
        })
      );
      disputes.push(...(batch.filter(Boolean) as ScamDispute[]));
    }
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);
  return disputes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ── Seed data ── */
export async function seedDatabase(): Promise<void> {
  const existing = await getPlatforms();
  if (existing.length > 0) {
    console.log('[scam-db] Database already seeded, skipping');
    return;
  }

  const seedReports: Omit<ScamReport, 'id' | 'createdAt'>[] = [
    {
      platformName: 'CryptoTrade Pro',
      platformUrl: 'cryptotradepro.com',
      platformType: 'pig_butchering',
      scamAddress: '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b',
      network: 'eth',
      lossAmount: 145000,
      lossCurrency: 'USD',
      lossDate: '2025-11-15',
      verified: true,
      blockchainConfirmed: true,
      description: 'Romance scam operation posing as a crypto trading platform. Victim was contacted via WhatsApp and directed to deposit funds for "guaranteed returns." Platform showed fake profits before blocking withdrawals.',
      status: 'verified',
      trustTier: 3,
    },
    {
      platformName: 'BitInvestment Club',
      platformUrl: 'bitinvestmentclub.io',
      platformUrls: ['bitinvestclub.com', 'bit-investment.club'],
      platformType: 'fake_exchange',
      scamAddress: '0x3cffd56b47b7b41c56258d9c7731abadc360e460',
      network: 'eth',
      lossAmount: 87500,
      lossCurrency: 'USD',
      lossDate: '2025-10-20',
      verified: true,
      blockchainConfirmed: true,
      description: 'Fake cryptocurrency exchange with professional-looking UI. Users could deposit but never withdraw. Customer support would demand additional "tax payments" or "verification fees" before releasing funds.',
      status: 'verified',
      trustTier: 3,
    },
    {
      platformName: 'CoinProfit AI',
      platformUrl: 'coinprofit-ai.com',
      platformType: 'pig_butchering',
      scamAddress: 'TXF1yNp2yvUwUvSgzUSTfP8VFN5jAH5rzy',
      network: 'trx',
      lossAmount: 230000,
      lossCurrency: 'USD',
      lossDate: '2025-12-01',
      verified: true,
      blockchainConfirmed: true,
      description: 'AI-themed pig butchering scam promoting "AI-powered trading algorithms." Victims directed to send USDT via TRON network. Multiple withdrawal attempts failed with demands for "tax clearance certificates."',
      status: 'verified',
      trustTier: 3,
    },
    {
      platformName: 'MetaTrader Crypto',
      platformUrl: 'metatrader-crypto.net',
      platformUrls: ['mt5-crypto.com'],
      platformType: 'fake_exchange',
      scamAddress: '0x19aa5fe80d33a56d56c78e82ea5e50e5d80b4dff',
      network: 'eth',
      lossAmount: 56000,
      lossCurrency: 'USD',
      lossDate: '2025-09-10',
      verified: true,
      blockchainConfirmed: false,
      description: 'Impersonating the legitimate MetaTrader platform. Scammers used similar branding to trick users into depositing crypto. Domain hosted on bulletproof hosting in Russia.',
      status: 'verified',
      trustTier: 2,
    },
    {
      platformName: 'CryptoYield',
      platformUrl: 'cryptoyield.finance',
      platformType: 'ponzi',
      scamAddress: '0x56eddb7aa87536c09ccc2793473599fd21a8b17f',
      network: 'eth',
      lossAmount: 1200000,
      lossCurrency: 'USD',
      lossDate: '2025-08-05',
      verified: true,
      blockchainConfirmed: true,
      description: 'Ponzi scheme promising 5% daily returns on crypto deposits. Early investors received payouts from new deposits. Platform collapsed when inflows slowed, leaving 800+ victims.',
      status: 'verified',
      trustTier: 3,
    },
    {
      platformName: 'TradingPro.ai',
      platformUrl: 'tradingpro.ai',
      platformUrls: ['tradingpro-app.com'],
      platformType: 'pig_butchering',
      scamAddress: 'TDqVegmPEb3juFCkEMS9K94xVcNSc5EYAG',
      network: 'trx',
      lossAmount: 310000,
      lossCurrency: 'USD',
      lossDate: '2025-11-25',
      verified: true,
      blockchainConfirmed: true,
      description: 'Sophisticated pig butchering operation using TRON/USDT. Victims groomed over weeks via Telegram before being directed to platform. Fake trading dashboard showed manipulated profits.',
      status: 'verified',
      trustTier: 3,
    },
    {
      platformName: 'CoinBase Pro Trade',
      platformUrl: 'coinbasepro-trade.com',
      platformUrls: ['coinbase-protrade.com', 'coinbase-pro-trading.com'],
      platformType: 'phishing',
      scamAddress: '0xef3a930e1ffffffacd2b664822cb7d1c51e0c36e',
      network: 'eth',
      lossAmount: 42000,
      lossCurrency: 'USD',
      lossDate: '2025-07-12',
      verified: true,
      blockchainConfirmed: true,
      description: 'Phishing site impersonating Coinbase Pro. Used typosquatting domains and Google Ads to appear in search results. Stole wallet credentials and drained connected wallets automatically.',
      status: 'verified',
      trustTier: 3,
    },
    {
      platformName: 'BTC Mining Cloud',
      platformUrl: 'btcminingcloud.com',
      platformType: 'ponzi',
      scamAddress: '0x707012c9cf97c4c3a481603f98d593ecd3a44621',
      network: 'eth',
      lossAmount: 890000,
      lossCurrency: 'USD',
      lossDate: '2025-06-20',
      verified: true,
      blockchainConfirmed: false,
      description: 'Cloud mining Ponzi scheme claiming proprietary ASIC farms. Marketed through YouTube ads and influencer partnerships. No actual mining operations existed.',
      status: 'verified',
      trustTier: 2,
    },
    {
      platformName: 'CryptoFX Markets',
      platformUrl: 'cryptofxmarkets.com',
      platformUrls: ['cfx-markets.io'],
      platformType: 'fake_exchange',
      scamAddress: '0x39d908dac893cbcb53cc86e0ecc369aa4def1a29',
      network: 'eth',
      lossAmount: 175000,
      lossCurrency: 'USD',
      lossDate: '2025-10-01',
      verified: true,
      blockchainConfirmed: true,
      description: 'Fake forex/crypto exchange targeting victims in Eastern Europe and CIS countries. Used Telegram groups and fake testimonials. Funds traced to Binance and Huobi deposit addresses.',
      status: 'verified',
      trustTier: 3,
    },
    {
      platformName: 'DeFi Yield Protocol',
      platformUrl: 'defiyieldprotocol.io',
      platformType: 'rug_pull',
      scamAddress: '0x0681d8db095565fe8a346fa0277bffde9c0edbbf',
      network: 'eth',
      lossAmount: 2400000,
      lossCurrency: 'USD',
      lossDate: '2025-05-15',
      verified: true,
      blockchainConfirmed: true,
      description: 'DeFi rug pull disguised as a yield farming protocol. Smart contract had a hidden admin withdraw function. Developers removed liquidity and drained all pools in a single transaction.',
      status: 'verified',
      trustTier: 3,
    },
  ];

  for (const report of seedReports) {
    await saveReport(report);
  }

  console.log(`[scam-db] Seeded ${seedReports.length} reports`);
}

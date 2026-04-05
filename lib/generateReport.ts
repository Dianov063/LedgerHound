import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { sendReport } from './sendReport';
import { ReportDocument } from './reportPdf';
import { uploadReport, getReportDownloadUrl } from './s3-storage';
import { logReport } from './reports-log';

const ALCHEMY_URL = 'https://eth-mainnet.g.alchemy.com/v2/OAymykkPw_Oi3LINBgrqZ';

const KNOWN_ENTITIES: Record<string, { label: string; type: 'exchange' | 'mixer' | 'defi' | 'scam' }> = {
  '0x28c6c06298d514db089934071355e5743bf21d60': { label: 'Binance', type: 'exchange' },
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': { label: 'Binance 2', type: 'exchange' },
  '0xf977814e90da44bfa03b6295a0616a897441acec': { label: 'Binance 3', type: 'exchange' },
  '0x8894e0a0c962cb723c1976a4421c95949be2d4e3': { label: 'Binance 4', type: 'exchange' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { label: 'Binance 5', type: 'exchange' },
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { label: 'Coinbase', type: 'exchange' },
  '0xa090e606e30bd747d4e6245a1517ebe430f0057e': { label: 'Coinbase 2', type: 'exchange' },
  '0x503828976d22510aad0201ac7ec88293211d23da': { label: 'Coinbase 3', type: 'exchange' },
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': { label: 'Kraken', type: 'exchange' },
  '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13': { label: 'Kraken 2', type: 'exchange' },
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': { label: 'OKX', type: 'exchange' },
  '0x236f9f97e0e62388479bf9e5ba4889e46b0273c3': { label: 'OKX 2', type: 'exchange' },
  '0xab5c66752a9e8167967685f1450532fb96d5d24f': { label: 'Huobi', type: 'exchange' },
  '0x6748f50f686bfbca6fe8ad62b22228b87f31ff2b': { label: 'Huobi 2', type: 'exchange' },
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': { label: 'Bybit', type: 'exchange' },
  '0x2b5634c42055806a59e9107ed44d43c426e58258': { label: 'KuCoin', type: 'exchange' },
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe': { label: 'Gate.io', type: 'exchange' },
  '0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec': { label: 'Bitfinex', type: 'exchange' },
  '0x6262998ced04146fa42253a5c0af90ca02dfd2a3': { label: 'Crypto.com', type: 'exchange' },
  '0x077d360f11d220e4d5d9ba269170a1ef1fe5b62d': { label: 'ChangeNOW', type: 'exchange' },
  '0x12d66f87a04a9e220c9d5078b7961664a758ad11': { label: 'Tornado Cash', type: 'mixer' },
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936': { label: 'Tornado Cash 2', type: 'mixer' },
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf': { label: 'Tornado Cash 3', type: 'mixer' },
  '0xa160cdab225685da1d56aa342ad8841c3b53f291': { label: 'Tornado Cash 4', type: 'mixer' },
  '0x7f268357a8c2552623316e2562d90e642bb538e5': { label: 'FixedFloat', type: 'mixer' },
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { label: 'Uniswap V2', type: 'defi' },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { label: 'Uniswap V3', type: 'defi' },
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': { label: 'SushiSwap', type: 'defi' },
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { label: '0x Exchange', type: 'defi' },
  '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b': { label: 'Flagged Address', type: 'scam' },
};

/* ── Known legitimate tokens (used to separate ETH stats from junk) ── */
const KNOWN_TOKENS = new Set([
  'ETH', 'WETH', 'USDT', 'USDC', 'DAI', 'WBTC', 'BTC',
  'MATIC', 'BNB', 'UNI', 'AAVE', 'LINK', 'CRV', 'MKR',
  'LDO', 'RPL', 'COMP', 'SNX', 'BAL', 'SUSHI', 'YFI',
  'GRT', 'ENS', 'DYDX', 'OP', 'ARB',
  'SAND', 'MANA', 'LRC', 'IMX', 'FXS', 'FRAX',
  'LUSD', 'RAI', 'RETH', 'STETH', 'CBETH', '1INCH',
  'TORN', 'OMG', 'SAI', 'REQ', 'MASK', 'DATA', 'LPT',
]);

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

interface Transfer {
  from: string;
  to: string;
  value: number | null;
  asset: string | null;
  hash: string;
  category?: string;
  rawContract?: { value?: string; decimal?: string; address?: string };
  metadata?: { blockTimestamp?: string };
}

/* ── Spam detection keywords ── */
const SPAM_KEYWORDS = [
  'visit', 'claim', 'airdrop', 'reward', 'voucher', 'ticket',
  'bonus', 'gift', 'free', 'disney', 'ukraine', 'windows',
  'google', 'youtube', 'tesla', 'tiktok', 'porn',
  'mcdonalds', 'superbowl', 'superbo', 'netflix',
  'amazon', 'apple', 'twitter', 'facebook', 'instagram',
  'coinbase', 'binance', 'opensea', 'metamask',
];

const SPAM_EXACT = new Set([
  'visa', 'paypal', 'nba', 'nfl', 'pranksy', 'vitalik',
  'bowl', 'lens', 'mooney', 'solid', 'wlunc', 'vsolid',
  'zepe', 'dhold', 'sablier', 'tls', 'shi', 'nike', 'vish',
  'endgame', 'vshiba', 'kimu', 'koti', 'milkers',
  'flokisnacks', 'flokielon', 'flokifire', 'shibindia',
  'voof', 'sher', 'vb', 'apecoin', 'plsx', 'belle', 'vya',
  'year', 'sea', 'erc20', 'sz', 'upool', 'hex2t', 'disco',
  'minigogeta', 'vvb', 'kick', 'aaa', 'beb', 'swd', 'nme',
  'pyro', 'ethmny', 'fry', 'sushib', 'dtf', 'okswap',
  'lr', 'swc', 'doe', 'party', 'unii', 'fire', 'rev',
  'axn', 'aleph', 'ecrtt', 'uet', 'viu', 'fifamini',
  'elec', 'sc', 'mdt', 'umi', 'shibtzu', 'gsgc', 'manu',
  'gaia', 'hur', 'vbt', 'ape dao', 'da-fi', 'uni-v2',
  'time', 'kncl',
]);

/**
 * Alchemy getAssetTransfers: `value` is already in human-readable units.
 *   external → value = ETH amount (e.g. 1.5 means 1.5 ETH)
 *   erc20    → value = token amount (already divided by decimals)
 *
 * Fallback only when value is null: use rawContract.value (hex) ÷ 10^decimal.
 * Sanity cap: any single transfer > 1e15 is garbage data → return 0.
 */
function safeValue(tx: Transfer): number {
  // Alchemy pre-converted value — use directly
  if (tx.value !== null && tx.value !== undefined) {
    const v = Number(tx.value);
    if (!isNaN(v) && v < 1e15) return v;
    return 0; // impossibly large → garbage
  }

  // Fallback for ERC-20s where Alchemy returned value: null
  if (tx.rawContract?.value && tx.rawContract?.decimal) {
    try {
      const raw = BigInt(tx.rawContract.value);
      const rawDec = tx.rawContract.decimal;
      const decimals = rawDec.startsWith('0x')
        ? parseInt(rawDec, 16)
        : (parseInt(rawDec, 10) || 18);
      // Reject obviously broken decimals (0 or 1 → produces huge numbers)
      if (decimals < 2) return 0;
      const converted = Number(raw) / Math.pow(10, decimals);
      if (!isNaN(converted) && converted < 1e15) return converted;
    } catch {
      return 0;
    }
  }

  return 0;
}

/** Check if a token is likely spam/airdrop */
function isSpamToken(tx: Transfer): boolean {
  const asset = (tx.asset || '').trim();

  // No asset name or control characters → spam
  if (!asset || asset.charCodeAt(0) < 32) return true;

  const lower = asset.toLowerCase();

  // URL patterns, very long names, suspicious chars, @-handles, spaces in name
  if (/[/:.<>@]/.test(asset) || asset.length > 15) return true;
  if (/\s/.test(asset) && !KNOWN_TOKENS.has(asset.toUpperCase())) return true;
  if (/^https?/i.test(asset) || /\.(com|io|org|net|xyz|co)/i.test(asset)) return true;

  // Exact-match spam names
  if (SPAM_EXACT.has(lower)) return true;

  // Substring-match spam keywords
  if (SPAM_KEYWORDS.some((s) => lower.includes(s))) return true;

  // Minted from null address AND not a known legitimate token → spam airdrop
  if (tx.from === NULL_ADDRESS && !KNOWN_TOKENS.has(asset.toUpperCase())) return true;

  // Absurdly large value (>1M) for unknown tokens → spam airdrop
  // Legitimate tokens rarely exceed 1M units in a single transfer unless it's SHIB/PEPE
  const val = safeValue(tx);
  if (val > 1e6 && !KNOWN_TOKENS.has(asset.toUpperCase())) return true;

  return false;
}

/** Filter out spam tokens — keep only transfers with meaningful value or known assets */
function filterSpam(transfers: Transfer[]): Transfer[] {
  return transfers.filter((tx) => {
    // Always keep ETH/native transfers
    if (tx.category === 'external') return true;
    // Filter spam
    if (isSpamToken(tx)) return false;
    // Filter dust: value rounds to ~0
    const val = safeValue(tx);
    if (val > 0 && val < 0.0001) return false;
    return true;
  });
}

/** Format value with smart precision: >1000 → 2 dec, <1 → 6 dec, else 4 dec */
export function fmtEth(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) {
    return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (abs > 0 && abs < 1) {
    return v.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  }
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

async function fetchAllTransfers(address: string, direction: 'from' | 'to'): Promise<Transfer[]> {
  const all: Transfer[] = [];
  let pageKey: string | undefined;

  for (let i = 0; i < 10; i++) { // max 10 pages
    const params: any = {
      fromBlock: '0x0',
      toBlock: 'latest',
      category: ['external', 'erc20'],
      withMetadata: true,
      maxCount: '0x64', // 100 per page
    };
    if (direction === 'from') params.fromAddress = address;
    else params.toAddress = address;
    if (pageKey) params.pageKey = pageKey;

    const res = await fetch(ALCHEMY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'alchemy_getAssetTransfers', params: [params] }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);

    const transfers = json.result?.transfers || [];
    all.push(...transfers);
    pageKey = json.result?.pageKey;
    if (!pageKey) break;
  }

  return all;
}

export interface ReportData {
  walletAddress: string;
  caseId: string;
  date: string;
  totalReceived: number;
  totalSent: number;
  netBalance: number;
  ethReceived: number;
  ethSent: number;
  transactionCount: number;
  uniqueTokens: string[];
  spamFiltered: number;
  firstActivity: string;
  lastActivity: string;
  topCounterparties: { address: string; label: string; count: number; volume: number }[];
  identifiedEntities: { address: string; label: string; type: string; interactions: number }[];
  riskScore: number;
  riskLabel: string;
  keyFindings: string[];
  recommendations: string[];
  transactions: {
    date: string;
    direction: 'IN' | 'OUT';
    from: string;
    to: string;
    value: number;
    token: string;
  }[];
}

export async function generateReport(
  walletAddress: string,
  email: string,
  options?: { stripePaymentId?: string; amount?: number },
) {
  const address = walletAddress.toLowerCase();
  const caseId = `LH-${Date.now().toString(36).toUpperCase()}`;
  const date = new Date().toISOString().split('T')[0];

  // Fetch all transfers and filter spam
  const [rawOutgoing, rawIncoming] = await Promise.all([
    fetchAllTransfers(address, 'from'),
    fetchAllTransfers(address, 'to'),
  ]);
  const outgoing = filterSpam(rawOutgoing);
  const incoming = filterSpam(rawIncoming);
  const spamFiltered = (rawIncoming.length - incoming.length) + (rawOutgoing.length - outgoing.length);

  console.log(`[generateReport] Transfers: ${rawIncoming.length} in → ${incoming.length} clean, ${rawOutgoing.length} out → ${outgoing.length} clean (${spamFiltered} spam filtered)`);

  // Calculate stats — ETH-only totals (different tokens can't be summed)
  let ethReceived = 0;
  let ethSent = 0;
  const tokenSet = new Set<string>();
  const counterpartyMap = new Map<string, { count: number; volume: number }>();
  const entityMap = new Map<string, { label: string; type: string; interactions: number }>();
  const timestamps: number[] = [];

  /** Only count ETH/WETH toward totals — token values are different units */
  const isEthLike = (tx: Transfer) =>
    tx.category === 'external' ||
    (tx.asset || '').toUpperCase() === 'ETH' ||
    (tx.asset || '').toUpperCase() === 'WETH';

  const processCounterparty = (addr: string, value: number) => {
    const lower = addr.toLowerCase();
    const existing = counterpartyMap.get(lower) || { count: 0, volume: 0 };
    existing.count++;
    existing.volume += value;
    counterpartyMap.set(lower, existing);

    const entity = KNOWN_ENTITIES[lower];
    if (entity && !entityMap.has(lower)) {
      entityMap.set(lower, { label: entity.label, type: entity.type, interactions: 0 });
    }
    if (entity) {
      entityMap.get(lower)!.interactions++;
    }
  };

  for (const tx of incoming) {
    const val = safeValue(tx);
    if (isEthLike(tx)) ethReceived += val;
    if (tx.asset) tokenSet.add(tx.asset);
    if (tx.from) processCounterparty(tx.from, isEthLike(tx) ? val : 0);
    if (tx.metadata?.blockTimestamp) timestamps.push(new Date(tx.metadata.blockTimestamp).getTime());
  }

  for (const tx of outgoing) {
    const val = safeValue(tx);
    if (isEthLike(tx)) ethSent += val;
    if (tx.asset) tokenSet.add(tx.asset);
    if (tx.to) processCounterparty(tx.to, isEthLike(tx) ? val : 0);
    if (tx.metadata?.blockTimestamp) timestamps.push(new Date(tx.metadata.blockTimestamp).getTime());
  }

  console.log(`[generateReport] ETH received: ${ethReceived.toFixed(4)}, sent: ${ethSent.toFixed(4)}, net: ${(ethReceived - ethSent).toFixed(4)}`);

  timestamps.sort((a, b) => a - b);
  const firstActivity = timestamps.length > 0 ? new Date(timestamps[0]).toISOString().split('T')[0] : 'N/A';
  const lastActivity = timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1]).toISOString().split('T')[0] : 'N/A';

  // Top counterparties
  const topCounterparties = Array.from(counterpartyMap.entries())
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 5)
    .map(([addr, data]) => {
      const entity = KNOWN_ENTITIES[addr];
      return { address: addr, label: entity?.label || 'Unknown', count: data.count, volume: data.volume };
    });

  // Identified entities
  const identifiedEntities = Array.from(entityMap.entries()).map(([addr, data]) => ({
    address: addr,
    ...data,
  }));

  // Risk score
  let riskScore = 50; // baseline
  const hasMixer = identifiedEntities.some((e) => e.type === 'mixer');
  const hasExchange = identifiedEntities.some((e) => e.type === 'exchange');
  const hasScam = identifiedEntities.some((e) => e.type === 'scam');

  if (hasMixer) riskScore += 30;
  if (hasScam) riskScore += 25;
  if (!hasExchange && ethSent > 10) riskScore += 10;
  if (hasExchange) riskScore -= 20;
  if (outgoing.length + incoming.length < 5) riskScore -= 15;

  riskScore = Math.max(0, Math.min(100, riskScore));

  let riskLabel: string;
  if (riskScore >= 70) riskLabel = 'HIGH RISK';
  else if (riskScore >= 40) riskLabel = 'MODERATE RISK';
  else riskLabel = 'LOW RISK';

  // Key findings
  const keyFindings: string[] = [];
  if (hasMixer) keyFindings.push('Interactions with known mixer/tumbler services detected (Tornado Cash or similar). This is a significant risk indicator.');
  if (hasExchange) {
    const exchanges = identifiedEntities.filter((e) => e.type === 'exchange').map((e) => e.label);
    keyFindings.push(`Funds interacted with identified exchanges: ${exchanges.join(', ')}. KYC data may be available via subpoena.`);
  }
  if (hasScam) keyFindings.push('Interactions with flagged/scam-associated addresses detected.');
  if (ethSent > 0) keyFindings.push(`Wallet sent ${fmtEth(ethSent)} ETH across ${outgoing.filter((t) => t.category === 'external').length} native ETH transactions.`);
  if (spamFiltered > 0) keyFindings.push(`${spamFiltered} spam/airdrop token transfers were detected and filtered from this analysis.`);
  if (keyFindings.length === 0) keyFindings.push('No high-risk indicators detected in automated analysis. Manual review recommended for comprehensive assessment.');

  // Recommendations
  const recommendations: string[] = [];
  if (hasExchange) {
    const exchanges = identifiedEntities.filter((e) => e.type === 'exchange').map((e) => e.label);
    recommendations.push(`Subpoena target identified: ${exchanges[0]}. Attorney can file discovery request for account holder information.`);
  }
  if (hasMixer) recommendations.push('Mixer usage detected. Professional demixing analysis recommended to trace funds through mixing service.');
  recommendations.push('File FBI IC3 report at ic3.gov if not already done.');
  recommendations.push('For court-ready certified investigation with expert testimony, contact LedgerHound at contact@ledgerhound.vip.');

  // Build transaction list: ETH first → major tokens → rest, dedup by token (max 3)
  type TxRow = { date: string; direction: 'IN' | 'OUT'; from: string; to: string; value: number; token: string };
  const MAJOR_TOKENS = new Set(['ETH', 'WETH', 'USDT', 'USDC', 'DAI', 'WBTC']);

  const toRow = (tx: Transfer, dir: 'IN' | 'OUT'): TxRow => ({
    date: tx.metadata?.blockTimestamp ? new Date(tx.metadata.blockTimestamp).toISOString().split('T')[0] : 'N/A',
    direction: dir,
    from: dir === 'IN' ? (tx.from || 'N/A') : (tx.from || address),
    to: dir === 'OUT' ? (tx.to || 'N/A') : (tx.to || address),
    value: safeValue(tx),
    token: tx.asset || 'ETH',
  });

  const rawTxs: TxRow[] = [
    ...incoming.map((tx) => toRow(tx, 'IN')),
    ...outgoing.map((tx) => toRow(tx, 'OUT')),
  ];

  // Sort priority: ETH first, then major tokens, then others — within each group by value desc
  const sortKey = (tx: TxRow): number => {
    const upper = tx.token.toUpperCase();
    if (upper === 'ETH') return 0;
    if (MAJOR_TOKENS.has(upper)) return 1;
    return 2;
  };
  rawTxs.sort((a, b) => {
    const pa = sortKey(a), pb = sortKey(b);
    if (pa !== pb) return pa - pb;
    return b.value - a.value; // higher value first within same priority
  });

  // Deduplicate by TOKEN (max 3 rows per token symbol, then summary)
  const tokenCounts = new Map<string, { shown: number; total: number; totalValue: number }>();
  // Pre-count totals per token
  for (const tx of rawTxs) {
    const key = tx.token.toUpperCase();
    const existing = tokenCounts.get(key) || { shown: 0, total: 0, totalValue: 0 };
    existing.total++;
    existing.totalValue += tx.value;
    tokenCounts.set(key, existing);
  }

  const allTxs: TxRow[] = [];
  const tokenShown = new Map<string, number>();
  for (const tx of rawTxs) {
    const key = tx.token.toUpperCase();
    const shown = tokenShown.get(key) || 0;
    if (shown < 3) {
      allTxs.push(tx);
      tokenShown.set(key, shown + 1);
    } else if (shown === 3) {
      // Add summary row
      const stats = tokenCounts.get(key)!;
      const remaining = stats.total - 3;
      if (remaining > 0) {
        allTxs.push({
          date: '',
          direction: tx.direction,
          from: '—',
          to: '—',
          value: stats.totalValue,
          token: `+${remaining} more ${tx.token}`,
        });
      }
      tokenShown.set(key, shown + 1); // prevent duplicate summary
    }
    if (allTxs.length >= 50) break;
  }

  const round4 = (n: number) => Math.round(n * 10000) / 10000;

  const reportData: ReportData = {
    walletAddress: address,
    caseId,
    date,
    totalReceived: round4(ethReceived),
    totalSent: round4(ethSent),
    netBalance: round4(ethReceived - ethSent),
    ethReceived: round4(ethReceived),
    ethSent: round4(ethSent),
    transactionCount: outgoing.length + incoming.length,
    uniqueTokens: Array.from(tokenSet),
    spamFiltered,
    firstActivity,
    lastActivity,
    topCounterparties,
    identifiedEntities,
    riskScore,
    riskLabel,
    keyFindings,
    recommendations,
    transactions: allTxs,
  };

  // Generate PDF
  const doc = React.createElement(ReportDocument, { data: reportData }) as any;
  const pdfBuffer = await renderToBuffer(doc);
  const buf = Buffer.from(pdfBuffer);

  // Upload to S3 and get presigned download URL
  let downloadUrl = '';
  let s3Key = '';
  try {
    console.log(`[generateReport] S3 env check — bucket: ${process.env.AWS_S3_BUCKET || 'NOT SET'}, region: ${process.env.AWS_REGION || 'NOT SET'}, keyId: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.slice(0, 8) + '...' : 'NOT SET'}`);
    console.log(`[generateReport] PDF buffer size: ${buf.length} bytes`);
    s3Key = await uploadReport(buf, caseId);
    console.log(`[generateReport] S3 upload OK: ${s3Key}`);
    downloadUrl = await getReportDownloadUrl(caseId);
    console.log(`[generateReport] Presigned URL generated: ${downloadUrl.slice(0, 80)}...`);
  } catch (err: any) {
    console.error('[generateReport] S3 upload failed (continuing with email only):', err?.message || err);
    console.error('[generateReport] S3 error name:', err?.name, 'code:', err?.$metadata?.httpStatusCode);
  }

  // Send email with download link
  await sendReport(email, address, buf, caseId, downloadUrl);

  // Log report to S3 (non-blocking — don't fail if this errors)
  try {
    await logReport({
      caseId,
      walletAddress: address,
      email,
      network: 'eth',
      s3Key,
      downloadUrl,
      stripePaymentId: options?.stripePaymentId || '',
      createdAt: new Date().toISOString(),
      amount: options?.amount || 4900,
    });
  } catch (err) {
    console.error('[generateReport] Failed to log report:', err);
  }

  return { ...reportData, downloadUrl, s3Key };
}

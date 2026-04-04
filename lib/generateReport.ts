import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { sendReport } from './sendReport';
import { ReportDocument } from './reportPdf';

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

interface Transfer {
  from: string;
  to: string;
  value: number;
  asset: string;
  hash: string;
  rawContract?: { value?: string; decimal?: string };
  metadata?: { blockTimestamp?: string };
}

/**
 * Alchemy getAssetTransfers returns `value` in the token's native unit (ETH for
 * external, token-decimals for ERC-20). However, some transfers return `value`
 * as a raw big-integer (Wei-scale) when decimal info is missing. Any single-
 * transfer value > 1e12 is clearly Wei (there are only ~120M ETH in existence).
 */
function safeValue(tx: Transfer): number {
  const v = tx.value || 0;
  if (v > 1e12) return v / 1e18;
  return v;
}

/** Format ETH value: max 4 decimals, with thousands separators for large numbers */
export function fmtEth(v: number): string {
  if (Math.abs(v) >= 1000) {
    return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  return v.toFixed(4);
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
  transactionCount: number;
  uniqueTokens: string[];
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

export async function generateReport(walletAddress: string, email: string) {
  const address = walletAddress.toLowerCase();
  const caseId = `LH-${Date.now().toString(36).toUpperCase()}`;
  const date = new Date().toISOString().split('T')[0];

  // Fetch all transfers
  const [outgoing, incoming] = await Promise.all([
    fetchAllTransfers(address, 'from'),
    fetchAllTransfers(address, 'to'),
  ]);

  // Calculate stats
  let totalReceived = 0;
  let totalSent = 0;
  const tokenSet = new Set<string>();
  const counterpartyMap = new Map<string, { count: number; volume: number }>();
  const entityMap = new Map<string, { label: string; type: string; interactions: number }>();
  const timestamps: number[] = [];

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
    totalReceived += val;
    if (tx.asset) tokenSet.add(tx.asset);
    if (tx.from) processCounterparty(tx.from, val);
    if (tx.metadata?.blockTimestamp) timestamps.push(new Date(tx.metadata.blockTimestamp).getTime());
  }

  for (const tx of outgoing) {
    const val = safeValue(tx);
    totalSent += val;
    if (tx.asset) tokenSet.add(tx.asset);
    if (tx.to) processCounterparty(tx.to, val);
    if (tx.metadata?.blockTimestamp) timestamps.push(new Date(tx.metadata.blockTimestamp).getTime());
  }

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
  if (!hasExchange && totalSent > 10) riskScore += 10;
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
  if (totalSent > 0) keyFindings.push(`Wallet sent ${fmtEth(totalSent)} ETH across ${outgoing.length} outgoing transactions.`);
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

  // Transaction list (top 50)
  const allTxs = [
    ...incoming.map((tx) => ({
      date: tx.metadata?.blockTimestamp ? new Date(tx.metadata.blockTimestamp).toISOString().split('T')[0] : 'N/A',
      direction: 'IN' as const,
      from: tx.from || 'N/A',
      to: tx.to || address,
      value: safeValue(tx),
      token: tx.asset || 'ETH',
    })),
    ...outgoing.map((tx) => ({
      date: tx.metadata?.blockTimestamp ? new Date(tx.metadata.blockTimestamp).toISOString().split('T')[0] : 'N/A',
      direction: 'OUT' as const,
      from: tx.from || address,
      to: tx.to || 'N/A',
      value: safeValue(tx),
      token: tx.asset || 'ETH',
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50);

  const reportData: ReportData = {
    walletAddress: address,
    caseId,
    date,
    totalReceived: Math.round(totalReceived * 10000) / 10000,
    totalSent: Math.round(totalSent * 10000) / 10000,
    netBalance: Math.round((totalReceived - totalSent) * 10000) / 10000,
    transactionCount: outgoing.length + incoming.length,
    uniqueTokens: Array.from(tokenSet),
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

  // Send email
  await sendReport(email, address, Buffer.from(pdfBuffer), caseId);

  return reportData;
}

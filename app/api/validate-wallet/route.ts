import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-timeout';
import logger from '@/lib/logger';

function getAlchemyKey(): string {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) throw new Error('ALCHEMY_API_KEY not configured');
  return key;
}

const ALCHEMY_HOSTS: Record<string, string> = {
  eth: 'eth-mainnet',
  bnb: 'bnb-mainnet',
  polygon: 'polygon-mainnet',
  base: 'base-mainnet',
  arb: 'arb-mainnet',
  op: 'opt-mainnet',
};

const NETWORK_LABELS: Record<string, string> = {
  eth: 'Ethereum', btc: 'Bitcoin', sol: 'Solana', trx: 'TRON',
  bnb: 'BNB Chain', base: 'Base', arb: 'Arbitrum', op: 'Optimism',
};

const NATIVE_CURRENCY: Record<string, string> = {
  eth: 'ETH', bnb: 'BNB', polygon: 'MATIC', base: 'ETH',
  arb: 'ETH', op: 'ETH', btc: 'BTC', sol: 'SOL', trx: 'TRX',
};

/* ── EVM: check balance + tx count via Alchemy ── */
async function validateEVM(address: string, network: string) {
  const host = ALCHEMY_HOSTS[network];
  if (!host) throw new Error(`Unsupported EVM network: ${network}`);
  const url = `https://${host}.g.alchemy.com/v2/${getAlchemyKey()}`;

  const [balRes, countRes] = await Promise.all([
    fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'eth_getBalance', params: [address, 'latest'] }),
    }),
    fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 2, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [address, 'latest'] }),
    }),
  ]);

  const balData = await balRes.json();
  const countData = await countRes.json();

  const balanceWei = BigInt(balData.result || '0x0');
  const balance = Number(balanceWei) / 1e18;
  const txCount = Number(BigInt(countData.result || '0x0'));

  return {
    found: txCount > 0 || balance > 0,
    balance,
    currency: NATIVE_CURRENCY[network] || 'ETH',
    txCount,
  };
}

/* ── Bitcoin via Blockstream ── */
async function validateBTC(address: string) {
  const res = await fetchWithTimeout(`https://blockstream.info/api/address/${address}`);
  if (!res.ok) throw new Error('Address not found');
  const data = await res.json();

  const funded = data.chain_stats?.funded_txo_count || 0;
  const spent = data.chain_stats?.spent_txo_count || 0;
  const txCount = funded + spent;
  const balanceSats = (data.chain_stats?.funded_txo_sum || 0) - (data.chain_stats?.spent_txo_sum || 0);

  return {
    found: txCount > 0,
    balance: balanceSats / 1e8,
    currency: 'BTC',
    txCount,
  };
}

/* ── Solana via Helius/public RPC ── */
async function validateSOL(address: string) {
  const rpcUrl = process.env.HELIUS_API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    : 'https://api.mainnet-beta.solana.com';

  const [balRes, sigRes] = await Promise.all([
    fetchWithTimeout(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] }),
    }),
    fetchWithTimeout(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'getSignaturesForAddress', params: [address, { limit: 1 }] }),
    }),
  ]);

  const balData = await balRes.json();
  const sigData = await sigRes.json();

  if (balData.error) throw new Error(balData.error.message);

  const balance = (balData.result?.value || 0) / 1e9;
  const txCount = sigData.result?.length || 0;

  return {
    found: txCount > 0 || balance > 0,
    balance,
    currency: 'SOL',
    txCount: txCount > 0 ? txCount : 0, // We only fetched 1, so show ≥1
  };
}

/* ── TRON via TronGrid ── */
async function validateTRON(address: string) {
  const headers: Record<string, string> = {};
  if (process.env.TRONGRID_API_KEY) headers['TRON-PRO-API-KEY'] = process.env.TRONGRID_API_KEY;

  const res = await fetchWithTimeout(`https://api.trongrid.io/v1/accounts/${address}`, { headers });
  if (!res.ok) throw new Error('Address not found');
  const data = await res.json();

  const account = data.data?.[0];
  if (!account) {
    return { found: false, balance: 0, currency: 'TRX', txCount: 0 };
  }

  const balance = (account.balance || 0) / 1e6;
  // TronGrid doesn't give tx count directly in account endpoint, but if account exists it has activity
  return {
    found: true,
    balance,
    currency: 'TRX',
    txCount: -1, // unknown exact count
  };
}

/* ── Route handler ── */
export async function POST(req: NextRequest) {
  try {
    const { address, network } = await req.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
    }

    const net = (network || 'eth').toLowerCase();
    const trimmed = address.trim();

    let result;
    if (net === 'btc') {
      result = await validateBTC(trimmed);
    } else if (net === 'sol') {
      result = await validateSOL(trimmed);
    } else if (net === 'trx') {
      result = await validateTRON(trimmed);
    } else if (ALCHEMY_HOSTS[net]) {
      result = await validateEVM(trimmed.toLowerCase(), net);
    } else {
      return NextResponse.json({ error: `Unsupported network: ${net}` }, { status: 400 });
    }

    logger.info({ network: net, found: result.found, txCount: result.txCount }, '[validate-wallet] Check');

    return NextResponse.json({
      found: result.found,
      network: net,
      networkLabel: NETWORK_LABELS[net] || net.toUpperCase(),
      balance: result.balance,
      currency: result.currency,
      txCount: result.txCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Validation failed';
    logger.error({ err }, '[validate-wallet] Error');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-timeout';
import { fetchBtcTransfers } from '@/lib/bitcoin-tracker';
import { fetchSolTransfers } from '@/lib/solana-tracker';
import { fetchTronTransfers } from '@/lib/tron-tracker';
import { fetchEtherscanV2Transfers } from '@/lib/etherscan-v2-tracker';
import { backfillBlockTimestamps } from '@/lib/backfill-timestamps';

type Network = 'btc' | 'eth' | 'sol' | 'trx' | 'bnb' | 'polygon' | 'base' | 'arb' | 'op' | 'avax' | 'linea' | 'zksync' | 'scroll' | 'mantle';

const VALID_NETWORKS: Network[] = ['btc', 'eth', 'sol', 'trx', 'bnb', 'polygon', 'base', 'arb', 'op', 'avax', 'linea', 'zksync', 'scroll', 'mantle'];

const NATIVE_CURRENCY: Record<Network, string> = {
  btc: 'BTC',
  eth: 'ETH',
  sol: 'SOL',
  trx: 'TRX',
  bnb: 'BNB',
  polygon: 'MATIC',
  base: 'ETH',
  arb: 'ETH',
  op: 'ETH',
  avax: 'AVAX',
  linea: 'ETH',
  zksync: 'ETH',
  scroll: 'ETH',
  mantle: 'MNT',
};

function getAlchemyKey(): string {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) throw new Error('ALCHEMY_API_KEY not configured');
  return key;
}

function getAlchemyUrls(): Record<'eth' | 'polygon' | 'bnb', string> {
  const key = getAlchemyKey();
  return {
    eth: `https://eth-mainnet.g.alchemy.com/v2/${key}`,
    polygon: `https://polygon-mainnet.g.alchemy.com/v2/${key}`,
    bnb: `https://bnb-mainnet.g.alchemy.com/v2/${key}`,
  };
}

const ADDRESS_PATTERNS: Record<Network, RegExp> = {
  btc: /^(1|3)[a-zA-Z0-9]{24,33}$|^bc1[a-zA-Z0-9]{25,62}$/,
  eth: /^0x[a-fA-F0-9]{40}$/,
  sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  trx: /^T[a-zA-Z0-9]{33}$/,
  bnb: /^0x[a-fA-F0-9]{40}$/,
  polygon: /^0x[a-fA-F0-9]{40}$/,
  base: /^0x[a-fA-F0-9]{40}$/,
  arb: /^0x[a-fA-F0-9]{40}$/,
  op: /^0x[a-fA-F0-9]{40}$/,
  avax: /^0x[a-fA-F0-9]{40}$/,
  linea: /^0x[a-fA-F0-9]{40}$/,
  zksync: /^0x[a-fA-F0-9]{40}$/,
  scroll: /^0x[a-fA-F0-9]{40}$/,
  mantle: /^0x[a-fA-F0-9]{40}$/,
};

const EVM_NETWORKS: Network[] = ['eth', 'bnb', 'polygon', 'base', 'arb', 'op', 'avax', 'linea', 'zksync', 'scroll', 'mantle'];

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function fetchAlchemyTransfers(alchemyUrl: string, params: object) {
  // Retry with backoff on rate limit
  let json: any;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetchWithTimeout(alchemyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [params],
      }),
    }, 30000);
    json = await res.json();
    if (json.error?.message?.includes('compute units per second')) {
      console.warn(`[track] Alchemy rate limit, attempt ${attempt + 1}/3`);
      await delay(1000 * (attempt + 1));
      continue;
    }
    break;
  }
  if (json.error) throw new Error(json.error.message);
  return json.result?.transfers || [];
}

async function fetchAlchemyForAddress(address: string, alchemyUrl: string, network: string = 'eth') {
  // 'internal' category only supported for ETH and MATIC/Polygon via Alchemy
  const supportsInternal = network === 'eth' || network === 'polygon';
  const baseParams = {
    fromBlock: '0x0',
    toBlock: 'latest',
    order: 'desc' as const, // newest first — critical for wallets with >1000 txs
    category: supportsInternal
      ? ['external', 'internal', 'erc20', 'erc721', 'erc1155']
      : ['external', 'erc20', 'erc721', 'erc1155'],
    withMetadata: true,
    maxCount: '0x3e8',
  };

  // Sequential to avoid Alchemy CU/s rate limit (especially BNB)
  const incoming = await fetchAlchemyTransfers(alchemyUrl, { ...baseParams, toAddress: address });
  await delay(300);
  const outgoing = await fetchAlchemyTransfers(alchemyUrl, { ...baseParams, fromAddress: address });

  const all = [
    ...incoming.map((tx: any) => ({ ...tx, direction: 'IN', trackedAddress: address })),
    ...outgoing.map((tx: any) => ({ ...tx, direction: 'OUT', trackedAddress: address })),
  ];

  // Backfill timestamps if Alchemy didn't return metadata (e.g., BNB chain)
  await backfillBlockTimestamps(all, network, alchemyUrl);

  return all;
}

async function fetchTransfersForNetwork(
  addresses: string[],
  network: Network,
): Promise<any[]> {
  switch (network) {
    case 'btc': {
      const settled = await Promise.allSettled(addresses.map((a) => fetchBtcTransfers(a)));
      const failed = settled.filter(r => r.status === 'rejected');
      if (failed.length > 0) console.warn(`[track] ${failed.length}/${settled.length} BTC address fetches failed`);
      return settled
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchBtcTransfers>>> => r.status === 'fulfilled')
        .flatMap((r) => r.value.transfers);
    }
    case 'eth':
    case 'polygon':
    case 'bnb': {
      const url = getAlchemyUrls()[network];
      const settled = await Promise.allSettled(addresses.map((a) => fetchAlchemyForAddress(a, url, network)));
      const failed = settled.filter(r => r.status === 'rejected');
      if (failed.length > 0) console.warn(`[track] ${failed.length}/${settled.length} ${network} address fetches failed`);
      return settled
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchAlchemyForAddress>>> => r.status === 'fulfilled')
        .flatMap((r) => r.value);
    }
    case 'sol': {
      const settled = await Promise.allSettled(addresses.map((a) => fetchSolTransfers(a)));
      const failed = settled.filter(r => r.status === 'rejected');
      if (failed.length > 0) console.warn(`[track] ${failed.length}/${settled.length} SOL address fetches failed`);
      return settled
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchSolTransfers>>> => r.status === 'fulfilled')
        .flatMap((r) => r.value.transfers);
    }
    case 'trx': {
      const settled = await Promise.allSettled(addresses.map((a) => fetchTronTransfers(a)));
      const failed = settled.filter(r => r.status === 'rejected');
      if (failed.length > 0) console.warn(`[track] ${failed.length}/${settled.length} TRX address fetches failed`);
      return settled
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchTronTransfers>>> => r.status === 'fulfilled')
        .flatMap((r) => r.value.transfers);
    }
    case 'base':
    case 'arb':
    case 'op':
    case 'avax':
    case 'linea':
    case 'zksync':
    case 'scroll':
    case 'mantle': {
      const settled = await Promise.allSettled(addresses.map((a) => fetchEtherscanV2Transfers(a, network)));
      const failed = settled.filter(r => r.status === 'rejected');
      if (failed.length > 0) console.warn(`[track] ${failed.length}/${settled.length} ${network} address fetches failed`);
      return settled
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchEtherscanV2Transfers>>> => r.status === 'fulfilled')
        .flatMap((r) => r.value.transfers);
    }
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { addresses: rawAddresses, network: rawNetwork } = body;
    const network: Network = rawNetwork || 'eth';

    if (!VALID_NETWORKS.includes(network)) {
      return NextResponse.json(
        { error: `Invalid network: ${network}. Must be one of: ${VALID_NETWORKS.join(', ')}` },
        { status: 400 },
      );
    }

    if (!Array.isArray(rawAddresses) || rawAddresses.length === 0) {
      return NextResponse.json({ error: 'Provide at least one address' }, { status: 400 });
    }

    // Normalize addresses: only lowercase EVM addresses
    const addresses = rawAddresses.map((a: string) => {
      if (EVM_NETWORKS.includes(network)) return a.toLowerCase();
      return a;
    });

    const pattern = ADDRESS_PATTERNS[network];
    const invalid = addresses.find((a: string) => !pattern.test(a));
    if (invalid) {
      return NextResponse.json({ error: `Invalid ${network.toUpperCase()} address: ${invalid}` }, { status: 400 });
    }

    const nativeCurrency = NATIVE_CURRENCY[network];

    const all = (await fetchTransfersForNetwork(addresses, network)).sort((a, b) => {
      const da = a.metadata?.blockTimestamp ? new Date(a.metadata.blockTimestamp).getTime() : 0;
      const db = b.metadata?.blockTimestamp ? new Date(b.metadata.blockTimestamp).getTime() : 0;
      return db - da;
    });

    let totalNativeIn = 0;
    let totalNativeOut = 0;
    for (const tx of all) {
      if (tx.asset === nativeCurrency && tx.value) {
        if (tx.direction === 'IN') totalNativeIn += tx.value;
        else totalNativeOut += tx.value;
      }
    }

    const roundedIn = Math.round(totalNativeIn * 1e6) / 1e6;
    const roundedOut = Math.round(totalNativeOut * 1e6) / 1e6;

    return NextResponse.json({
      network,
      nativeCurrency,
      transfers: all,
      stats: {
        total: all.length,
        totalNativeIn: roundedIn,
        totalNativeOut: roundedOut,
        // Backward-compatible aliases
        totalEthIn: roundedIn,
        totalEthOut: roundedOut,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch transfers';
    console.error('[track] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

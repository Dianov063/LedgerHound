import { NextRequest, NextResponse } from 'next/server';
import { fetchBtcTransfers } from '@/lib/bitcoin-tracker';
import { fetchSolTransfers } from '@/lib/solana-tracker';
import { fetchTronTransfers } from '@/lib/tron-tracker';
import { fetchEtherscanV2Transfers } from '@/lib/etherscan-v2-tracker';

type Network = 'btc' | 'eth' | 'sol' | 'trx' | 'bnb' | 'polygon' | 'base' | 'arb' | 'op' | 'avax' | 'ftm' | 'linea' | 'zksync' | 'scroll' | 'mantle';

const VALID_NETWORKS: Network[] = ['btc', 'eth', 'sol', 'trx', 'bnb', 'polygon', 'base', 'arb', 'op', 'avax', 'ftm', 'linea', 'zksync', 'scroll', 'mantle'];

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
  ftm: 'FTM',
  linea: 'ETH',
  zksync: 'ETH',
  scroll: 'ETH',
  mantle: 'MNT',
};

const ALCHEMY_URLS: Record<'eth' | 'polygon' | 'bnb', string> = {
  eth: 'https://eth-mainnet.g.alchemy.com/v2/OAymykkPw_Oi3LINBgrqZ',
  polygon: 'https://polygon-mainnet.g.alchemy.com/v2/OAymykkPw_Oi3LINBgrqZ',
  bnb: 'https://bnb-mainnet.g.alchemy.com/v2/OAymykkPw_Oi3LINBgrqZ',
};

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
  ftm: /^0x[a-fA-F0-9]{40}$/,
  linea: /^0x[a-fA-F0-9]{40}$/,
  zksync: /^0x[a-fA-F0-9]{40}$/,
  scroll: /^0x[a-fA-F0-9]{40}$/,
  mantle: /^0x[a-fA-F0-9]{40}$/,
};

const EVM_NETWORKS: Network[] = ['eth', 'bnb', 'polygon', 'base', 'arb', 'op', 'avax', 'ftm', 'linea', 'zksync', 'scroll', 'mantle'];

async function fetchAlchemyTransfers(alchemyUrl: string, params: object) {
  const res = await fetch(alchemyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'alchemy_getAssetTransfers',
      params: [params],
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result?.transfers || [];
}

async function fetchAlchemyForAddress(address: string, alchemyUrl: string) {
  const baseParams = {
    fromBlock: '0x0',
    toBlock: 'latest',
    category: ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
    withMetadata: true,
    maxCount: '0x3e8',
  };

  const [incoming, outgoing] = await Promise.all([
    fetchAlchemyTransfers(alchemyUrl, { ...baseParams, toAddress: address }),
    fetchAlchemyTransfers(alchemyUrl, { ...baseParams, fromAddress: address }),
  ]);

  const inTagged = incoming.map((tx: any) => ({ ...tx, direction: 'IN', trackedAddress: address }));
  const outTagged = outgoing.map((tx: any) => ({ ...tx, direction: 'OUT', trackedAddress: address }));

  return [...inTagged, ...outTagged];
}

async function fetchTransfersForNetwork(
  addresses: string[],
  network: Network,
): Promise<any[]> {
  switch (network) {
    case 'btc': {
      const results = await Promise.all(addresses.map((a) => fetchBtcTransfers(a)));
      return results.flatMap((r) => r.transfers);
    }
    case 'eth':
    case 'polygon':
    case 'bnb': {
      const url = ALCHEMY_URLS[network];
      const results = await Promise.all(addresses.map((a) => fetchAlchemyForAddress(a, url)));
      return results.flat();
    }
    case 'sol': {
      const results = await Promise.all(addresses.map((a) => fetchSolTransfers(a)));
      return results.flatMap((r) => r.transfers);
    }
    case 'trx': {
      const results = await Promise.all(addresses.map((a) => fetchTronTransfers(a)));
      return results.flatMap((r) => r.transfers);
    }
    case 'base':
    case 'arb':
    case 'op':
    case 'avax':
    case 'ftm':
    case 'linea':
    case 'zksync':
    case 'scroll':
    case 'mantle': {
      const results = await Promise.all(addresses.map((a) => fetchEtherscanV2Transfers(a, network)));
      return results.flatMap((r) => r.transfers);
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch transfers' }, { status: 500 });
  }
}

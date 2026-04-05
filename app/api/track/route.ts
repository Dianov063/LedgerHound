import { NextRequest, NextResponse } from 'next/server';
import { fetchTronTransfers } from '@/lib/tron-tracker';
import { fetchBscTransfers } from '@/lib/bsc-tracker';

type Network = 'eth' | 'trx' | 'bnb' | 'polygon';

const VALID_NETWORKS: Network[] = ['eth', 'trx', 'bnb', 'polygon'];

const NATIVE_CURRENCY: Record<Network, string> = {
  eth: 'ETH',
  trx: 'TRX',
  bnb: 'BNB',
  polygon: 'MATIC',
};

const ALCHEMY_URLS: Record<'eth' | 'polygon', string> = {
  eth: 'https://eth-mainnet.g.alchemy.com/v2/OAymykkPw_Oi3LINBgrqZ',
  polygon: 'https://polygon-mainnet.g.alchemy.com/v2/OAymykkPw_Oi3LINBgrqZ',
};

const ADDRESS_PATTERNS: Record<Network, RegExp> = {
  eth: /^0x[a-fA-F0-9]{40}$/,
  bnb: /^0x[a-fA-F0-9]{40}$/,
  polygon: /^0x[a-fA-F0-9]{40}$/,
  trx: /^T[a-zA-Z0-9]{33}$/,
};

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
    case 'eth':
    case 'polygon': {
      const url = ALCHEMY_URLS[network];
      const results = await Promise.all(addresses.map((a) => fetchAlchemyForAddress(a, url)));
      return results.flat();
    }
    case 'trx': {
      const results = await Promise.all(addresses.map((a) => fetchTronTransfers(a)));
      return results.flat();
    }
    case 'bnb': {
      const results = await Promise.all(addresses.map((a) => fetchBscTransfers(a)));
      return results.flat();
    }
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { addresses, network: rawNetwork } = body;
    const network: Network = rawNetwork || 'eth';

    if (!VALID_NETWORKS.includes(network)) {
      return NextResponse.json(
        { error: `Invalid network: ${network}. Must be one of: ${VALID_NETWORKS.join(', ')}` },
        { status: 400 },
      );
    }

    if (!Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json({ error: 'Provide at least one address' }, { status: 400 });
    }

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

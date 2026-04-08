import { fetchWithTimeout } from './fetch-timeout';

// Chain-specific explorer APIs — each chain uses its own working free API
// All return Etherscan-compatible format (status/message/result)

interface ChainConfig {
  name: string;
  nativeCurrency: string;
  explorer: string;
  /** Function to build the API base URL for this chain */
  apiBase: (apiKey: string) => string;
  /** Whether this chain's API needs an API key */
  needsKey: boolean;
  /** Native token decimals (default 18) */
  decimals?: number;
}

export const ETHERSCAN_V2_CHAINS: Record<string, ChainConfig> = {
  // BNB: BSCScan native API (free, 5 calls/sec with key)
  bnb: {
    name: 'BNB Smart Chain',
    nativeCurrency: 'BNB',
    explorer: 'https://bscscan.com',
    apiBase: () => `https://api.bscscan.com/api`,
    needsKey: false,
  },
  // Polygon: PolygonScan native API (free, 5 calls/sec with key)
  polygon: {
    name: 'Polygon',
    nativeCurrency: 'MATIC',
    explorer: 'https://polygonscan.com',
    apiBase: () => `https://api.polygonscan.com/api`,
    needsKey: false,
  },
  // ARB: Etherscan V2 free plan supports Arbitrum
  arb: {
    name: 'Arbitrum One',
    nativeCurrency: 'ETH',
    explorer: 'https://arbiscan.io',
    apiBase: (key) => `https://api.etherscan.io/v2/api?chainid=42161`,
    needsKey: true,
  },
  // LINEA: Etherscan V2 free plan supports Linea
  linea: {
    name: 'Linea',
    nativeCurrency: 'ETH',
    explorer: 'https://lineascan.build',
    apiBase: (key) => `https://api.etherscan.io/v2/api?chainid=59144`,
    needsKey: true,
  },
  // BASE: Blockscout (free, no key)
  base: {
    name: 'Base',
    nativeCurrency: 'ETH',
    explorer: 'https://basescan.org',
    apiBase: () => `https://base.blockscout.com/api`,
    needsKey: false,
  },
  // OP: Blockscout (free, no key)
  op: {
    name: 'Optimism',
    nativeCurrency: 'ETH',
    explorer: 'https://optimistic.etherscan.io',
    apiBase: () => `https://explorer.optimism.io/api`,
    needsKey: false,
  },
  // AVAX: Snowtrace (same Etherscan key)
  avax: {
    name: 'Avalanche C-Chain',
    nativeCurrency: 'AVAX',
    explorer: 'https://snowtrace.io',
    apiBase: (key) => `https://api.snowtrace.io/api`,
    needsKey: true,
  },
  // zkSync: Era block explorer (free, no key)
  zksync: {
    name: 'zkSync Era',
    nativeCurrency: 'ETH',
    explorer: 'https://era.zksync.network',
    apiBase: () => `https://block-explorer-api.mainnet.zksync.io/api`,
    needsKey: false,
  },
  // Scroll: Blockscout (free, no key)
  scroll: {
    name: 'Scroll',
    nativeCurrency: 'ETH',
    explorer: 'https://scrollscan.com',
    apiBase: () => `https://scroll.blockscout.com/api`,
    needsKey: false,
  },
  // Mantle: Routescan (free, no key)
  mantle: {
    name: 'Mantle',
    nativeCurrency: 'MNT',
    explorer: 'https://mantlescan.xyz',
    apiBase: () => `https://api.routescan.io/v2/network/mainnet/evm/5000/etherscan/api`,
    needsKey: false,
  },
};

interface EvmTransfer {
  hash: string;
  from: string;
  to: string;
  value: number | null;
  asset: string | null;
  category: string;
  direction: 'IN' | 'OUT';
  trackedAddress?: string;
  metadata?: { blockTimestamp?: string };
}

export async function fetchEtherscanV2Transfers(
  address: string,
  networkKey: string,
): Promise<{
  transfers: EvmTransfer[];
  stats: { total: number; totalNativeIn: number; totalNativeOut: number };
}> {
  const chain = ETHERSCAN_V2_CHAINS[networkKey];
  if (!chain) {
    console.log(`[chain-tracker] Unknown network key: ${networkKey}`);
    return { transfers: [], stats: { total: 0, totalNativeIn: 0, totalNativeOut: 0 } };
  }

  const apiKey = process.env.ETHERSCAN_API_KEY || '';
  const addr = address.toLowerCase();
  const base = chain.apiBase(apiKey);

  console.log(`[chain-tracker] Fetching for ${addr} on ${chain.name} via ${base}`);

  // Build URLs — append apikey only if this chain needs it
  const keyParam = chain.needsKey && apiKey ? `&apikey=${apiKey}` : '';
  const separator = base.includes('?') ? '&' : '?';
  const baseParams = `${separator}module=account&address=${addr}&startblock=0&endblock=99999999&page=1&offset=200&sort=desc${keyParam}`;

  const nativeUrl = `${base}${baseParams}&action=txlist`;
  const tokenUrl = `${base}${baseParams}&action=tokentx`;

  let nativeData: { status: string; message: string; result: unknown } = { status: '0', message: '', result: [] };
  let tokenData: { status: string; message: string; result: unknown } = { status: '0', message: '', result: [] };

  const fetchSafe = async (url: string, label: string) => {
    try {
      const res = await fetchWithTimeout(url, { redirect: 'follow' }, 15000);
      return await res.json();
    } catch (err) {
      console.error(`[chain-tracker] ${chain.name} ${label} fetch error:`, err);
      return { status: '0', message: 'fetch error', result: [] };
    }
  };

  [nativeData, tokenData] = await Promise.all([
    fetchSafe(nativeUrl, 'native'),
    fetchSafe(tokenUrl, 'token'),
  ]);

  console.log(
    `[chain-tracker] ${chain.name} native: status=${nativeData.status}, results=${Array.isArray(nativeData.result) ? nativeData.result.length : typeof nativeData.result}`,
  );
  if (typeof nativeData.result === 'string') {
    console.error(`[chain-tracker] ${chain.name} native API error: ${nativeData.result}`);
  }

  console.log(
    `[chain-tracker] ${chain.name} token: status=${tokenData.status}, results=${Array.isArray(tokenData.result) ? tokenData.result.length : typeof tokenData.result}`,
  );
  if (typeof tokenData.result === 'string') {
    console.error(`[chain-tracker] ${chain.name} token API error: ${tokenData.result}`);
  }

  const transfers: EvmTransfer[] = [];
  let totalNativeIn = 0;
  let totalNativeOut = 0;
  const nativeDecimals = chain.decimals ?? 18;

  // Process native transactions
  if (nativeData.status === '1' && Array.isArray(nativeData.result)) {
    for (const tx of nativeData.result) {
      if (tx.isError === '1') continue;
      const to = (tx.to || '').toLowerCase();
      const valueNative = parseFloat(tx.value || '0') / Math.pow(10, nativeDecimals);
      const direction: 'IN' | 'OUT' = to === addr ? 'IN' : 'OUT';

      if (valueNative > 0) {
        if (direction === 'IN') totalNativeIn += valueNative;
        else totalNativeOut += valueNative;
      }

      transfers.push({
        hash: tx.hash || '',
        from: tx.from || '',
        to: tx.to || '',
        value: valueNative > 0 ? Math.round(valueNative * 1e6) / 1e6 : null,
        asset: chain.nativeCurrency,
        category: 'external',
        direction,
        trackedAddress: address,
        metadata: {
          blockTimestamp: tx.timeStamp
            ? new Date(parseInt(tx.timeStamp, 10) * 1000).toISOString()
            : undefined,
        },
      });
    }
  }

  // Process token transactions
  if (tokenData.status === '1' && Array.isArray(tokenData.result)) {
    for (const tx of tokenData.result) {
      const to = (tx.to || '').toLowerCase();
      const decimals = parseInt(tx.tokenDecimal || '18', 10);
      const rawValue = parseFloat(tx.value || '0');
      const value = rawValue / Math.pow(10, decimals);
      const symbol = tx.tokenSymbol || 'ERC20';
      const direction: 'IN' | 'OUT' = to === addr ? 'IN' : 'OUT';

      transfers.push({
        hash: tx.hash || '',
        from: tx.from || '',
        to: tx.to || '',
        value: value > 0 ? Math.round(value * 1e6) / 1e6 : null,
        asset: symbol,
        category: 'erc20',
        direction,
        trackedAddress: address,
        metadata: {
          blockTimestamp: tx.timeStamp
            ? new Date(parseInt(tx.timeStamp, 10) * 1000).toISOString()
            : undefined,
        },
      });
    }
  }

  // Sort by timestamp descending
  transfers.sort((a, b) => {
    const da = a.metadata?.blockTimestamp
      ? new Date(a.metadata.blockTimestamp).getTime()
      : 0;
    const db = b.metadata?.blockTimestamp
      ? new Date(b.metadata.blockTimestamp).getTime()
      : 0;
    return db - da;
  });

  console.log(`[chain-tracker] ${chain.name}: ${transfers.length} transfers found`);

  return {
    transfers,
    stats: {
      total: transfers.length,
      totalNativeIn: Math.round(totalNativeIn * 1e6) / 1e6,
      totalNativeOut: Math.round(totalNativeOut * 1e6) / 1e6,
    },
  };
}

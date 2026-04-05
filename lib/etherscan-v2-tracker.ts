// Etherscan V2 unified API — single endpoint for all supported EVM chains
const ETHERSCAN_V2_BASE = 'https://api.etherscan.io/v2/api';

export const ETHERSCAN_V2_CHAINS: Record<string, { chainId: number; name: string; nativeCurrency: string; explorer: string }> = {
  bnb: { chainId: 56, name: 'BNB Chain', nativeCurrency: 'BNB', explorer: 'https://bscscan.com' },
  base: { chainId: 8453, name: 'Base', nativeCurrency: 'ETH', explorer: 'https://basescan.org' },
  arb: { chainId: 42161, name: 'Arbitrum One', nativeCurrency: 'ETH', explorer: 'https://arbiscan.io' },
  op: { chainId: 10, name: 'Optimism', nativeCurrency: 'ETH', explorer: 'https://optimistic.etherscan.io' },
  avax: { chainId: 43114, name: 'Avalanche C-Chain', nativeCurrency: 'AVAX', explorer: 'https://snowtrace.io' },
  ftm: { chainId: 250, name: 'Fantom', nativeCurrency: 'FTM', explorer: 'https://ftmscan.com' },
  linea: { chainId: 59144, name: 'Linea', nativeCurrency: 'ETH', explorer: 'https://lineascan.build' },
  zksync: { chainId: 324, name: 'zkSync Era', nativeCurrency: 'ETH', explorer: 'https://era.zksync.network' },
  scroll: { chainId: 534352, name: 'Scroll', nativeCurrency: 'ETH', explorer: 'https://scrollscan.com' },
  mantle: { chainId: 5000, name: 'Mantle', nativeCurrency: 'MNT', explorer: 'https://mantlescan.xyz' },
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
    console.log(`[etherscan-v2] Unknown network key: ${networkKey}`);
    return { transfers: [], stats: { total: 0, totalNativeIn: 0, totalNativeOut: 0 } };
  }

  const apiKey = process.env.ETHERSCAN_API_KEY || '';
  const addr = address.toLowerCase();

  console.log(`[etherscan-v2] Fetching for address: ${addr} on ${chain.name} (chainId=${chain.chainId})`);
  console.log(`[etherscan-v2] API key present: ${!!apiKey}`);

  const baseParams = `chainid=${chain.chainId}&address=${addr}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

  // Fetch native txs and token txs in parallel
  const nativeUrl = `${ETHERSCAN_V2_BASE}?${baseParams}&module=account&action=txlist`;
  const tokenUrl = `${ETHERSCAN_V2_BASE}?${baseParams}&module=account&action=tokentx`;

  console.log(`[etherscan-v2] Fetching native txs and token txs in parallel...`);

  let nativeData: { status: string; message: string; result: unknown } = { status: '0', message: '', result: [] };
  let tokenData: { status: string; message: string; result: unknown } = { status: '0', message: '', result: [] };

  try {
    const [nativeRes, tokenRes] = await Promise.all([fetch(nativeUrl), fetch(tokenUrl)]);
    [nativeData, tokenData] = await Promise.all([nativeRes.json(), tokenRes.json()]);
  } catch (err) {
    console.error(`[etherscan-v2] Fetch error:`, err);
    return { transfers: [], stats: { total: 0, totalNativeIn: 0, totalNativeOut: 0 } };
  }

  console.log(
    `[etherscan-v2] Native response: status=${nativeData.status}, message=${nativeData.message}, results=${Array.isArray(nativeData.result) ? nativeData.result.length : typeof nativeData.result}`,
  );
  if (typeof nativeData.result === 'string') {
    console.error(`[etherscan-v2] Native API error: ${nativeData.result}`);
  }

  console.log(
    `[etherscan-v2] Token response: status=${tokenData.status}, message=${tokenData.message}, results=${Array.isArray(tokenData.result) ? tokenData.result.length : typeof tokenData.result}`,
  );
  if (typeof tokenData.result === 'string') {
    console.error(`[etherscan-v2] Token API error: ${tokenData.result}`);
  }

  const transfers: EvmTransfer[] = [];
  let totalNativeIn = 0;
  let totalNativeOut = 0;

  // Process native transactions
  if (nativeData.status === '1' && Array.isArray(nativeData.result)) {
    for (const tx of nativeData.result) {
      if (tx.isError === '1') continue; // skip failed txs
      const to = (tx.to || '').toLowerCase();
      const valueNative = parseFloat(tx.value || '0') / 1e18;
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

  console.log(`[etherscan-v2] ${chain.name}: ${transfers.length} transfers found`);

  return {
    transfers,
    stats: {
      total: transfers.length,
      totalNativeIn: Math.round(totalNativeIn * 1e6) / 1e6,
      totalNativeOut: Math.round(totalNativeOut * 1e6) / 1e6,
    },
  };
}

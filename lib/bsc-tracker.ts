const BSC_BASE = 'https://api.bscscan.com/api';

interface BscTransfer {
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

export async function fetchBscTransfers(address: string): Promise<{
  transfers: BscTransfer[];
  stats: { total: number; totalNativeIn: number; totalNativeOut: number };
}> {
  const apiKey = process.env.BSCSCAN_API_KEY || '';
  const addr = address.toLowerCase();

  // Fetch BNB native transactions
  const bnbRes = await fetch(
    `${BSC_BASE}?module=account&action=txlist&address=${addr}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`
  );
  const bnbData = await bnbRes.json();

  // Fetch BEP20 token transactions
  const bep20Res = await fetch(
    `${BSC_BASE}?module=account&action=tokentx&address=${addr}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`
  );
  const bep20Data = await bep20Res.json();

  const transfers: BscTransfer[] = [];
  let totalNativeIn = 0;
  let totalNativeOut = 0;

  // Process BNB transactions
  if (bnbData.result && Array.isArray(bnbData.result)) {
    for (const tx of bnbData.result) {
      if (tx.isError === '1') continue; // skip failed txs
      const from = (tx.from || '').toLowerCase();
      const to = (tx.to || '').toLowerCase();
      const valueBNB = parseFloat(tx.value || '0') / 1e18;
      const direction = to === addr ? 'IN' : 'OUT';

      if (valueBNB > 0) {
        if (direction === 'IN') totalNativeIn += valueBNB;
        else totalNativeOut += valueBNB;
      }

      transfers.push({
        hash: tx.hash || '',
        from: tx.from || '',
        to: tx.to || '',
        value: valueBNB > 0 ? Math.round(valueBNB * 1e6) / 1e6 : null,
        asset: 'BNB',
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

  // Process BEP20 token transactions
  if (bep20Data.result && Array.isArray(bep20Data.result)) {
    for (const tx of bep20Data.result) {
      const from = (tx.from || '').toLowerCase();
      const to = (tx.to || '').toLowerCase();
      const decimals = parseInt(tx.tokenDecimal || '18', 10);
      const rawValue = parseFloat(tx.value || '0');
      const value = rawValue / Math.pow(10, decimals);
      const symbol = tx.tokenSymbol || 'BEP20';
      const direction = to === addr ? 'IN' : 'OUT';

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

  return {
    transfers,
    stats: {
      total: transfers.length,
      totalNativeIn: Math.round(totalNativeIn * 1e6) / 1e6,
      totalNativeOut: Math.round(totalNativeOut * 1e6) / 1e6,
    },
  };
}

const TRONGRID_BASE = 'https://api.trongrid.io';

interface TronTransfer {
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

export async function fetchTronTransfers(address: string): Promise<{
  transfers: TronTransfer[];
  stats: { total: number; totalNativeIn: number; totalNativeOut: number };
}> {
  const apiKey = process.env.TRONGRID_API_KEY || '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['TRON-PRO-API-KEY'] = apiKey;

  // Fetch TRX native transfers
  const trxRes = await fetch(
    `${TRONGRID_BASE}/v1/accounts/${address}/transactions?limit=200&only_confirmed=true`,
    { headers }
  );
  const trxData = await trxRes.json();

  // Fetch TRC20 token transfers
  const trc20Res = await fetch(
    `${TRONGRID_BASE}/v1/accounts/${address}/transactions/trc20?limit=200&only_confirmed=true`,
    { headers }
  );
  const trc20Data = await trc20Res.json();

  const transfers: TronTransfer[] = [];
  let totalNativeIn = 0;
  let totalNativeOut = 0;
  const addrLower = address.toLowerCase();

  // Process TRX transactions
  if (trxData.data && Array.isArray(trxData.data)) {
    for (const tx of trxData.data) {
      // Only process transfer contracts
      const contract = tx.raw_data?.contract?.[0];
      if (!contract || contract.type !== 'TransferContract') continue;

      const param = contract.parameter?.value;
      if (!param) continue;

      const from = param.owner_address || '';
      const to = param.to_address || '';
      const valueSun = param.amount || 0;
      const valueTRX = valueSun / 1e6; // Sun to TRX
      const direction =
        to.toLowerCase() === addrLower || to === address ? 'IN' : 'OUT';

      if (direction === 'IN') totalNativeIn += valueTRX;
      else totalNativeOut += valueTRX;

      transfers.push({
        hash: tx.txID || '',
        from,
        to,
        value: Math.round(valueTRX * 1e6) / 1e6,
        asset: 'TRX',
        category: 'external',
        direction,
        trackedAddress: address,
        metadata: {
          blockTimestamp: tx.block_timestamp
            ? new Date(tx.block_timestamp).toISOString()
            : undefined,
        },
      });
    }
  }

  // Process TRC20 token transfers
  if (trc20Data.data && Array.isArray(trc20Data.data)) {
    for (const tx of trc20Data.data) {
      const from = tx.from || '';
      const to = tx.to || '';
      const decimals = parseInt(tx.token_info?.decimals || '6', 10);
      const rawValue = parseFloat(tx.value || '0');
      const value = rawValue / Math.pow(10, decimals);
      const symbol = tx.token_info?.symbol || 'TRC20';
      const direction =
        to.toLowerCase() === addrLower || to === address ? 'IN' : 'OUT';

      transfers.push({
        hash: tx.transaction_id || '',
        from,
        to,
        value: Math.round(value * 1e6) / 1e6,
        asset: symbol,
        category: 'erc20',
        direction,
        trackedAddress: address,
        metadata: {
          blockTimestamp: tx.block_timestamp
            ? new Date(tx.block_timestamp).toISOString()
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

/**
 * Backfill block timestamps for transfers that lack metadata.blockTimestamp.
 * Shared between generateReport.ts (paid) and /api/track (free).
 *
 * Uses blockNum → eth_getBlockByNumber RPC to fetch block timestamps.
 * Batches unique blocks in groups of 20 to minimize RPC calls.
 */

/** Public RPC endpoints for block timestamp lookups (free, no key needed) */
const PUBLIC_RPC: Record<string, string> = {
  eth: 'https://eth.llamarpc.com',
  bnb: 'https://bsc-dataseed.binance.org/',
  polygon: 'https://polygon-rpc.com/',
};

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Backfill timestamps for transfers that lack metadata.blockTimestamp.
 * Mutates transfers in-place, attaching metadata.blockTimestamp.
 *
 * @param transfers — array of transfer objects (must have `blockNum` hex field from Alchemy)
 * @param network — chain key (e.g., 'bnb', 'polygon', 'eth')
 * @param fallbackRpcUrl — optional RPC URL to use if no public RPC is known for this network
 */
export async function backfillBlockTimestamps(
  transfers: any[],
  network: string,
  fallbackRpcUrl?: string,
): Promise<void> {
  if (transfers.length === 0) return;

  // Check if timestamps are already present
  const hasTimestamps = transfers.some((t) => t.metadata?.blockTimestamp);
  if (hasTimestamps) return;

  // Collect unique block numbers
  const blockNums = new Set<string>();
  for (const t of transfers) {
    const bn = t.blockNum;
    if (bn) blockNums.add(bn);
  }
  if (blockNums.size === 0) return;

  console.log(`[backfillBlockTimestamps] ${network}: ${blockNums.size} unique blocks for ${transfers.length} transfers`);

  const rpcUrl = PUBLIC_RPC[network] || fallbackRpcUrl;
  if (!rpcUrl) {
    console.warn(`[backfillBlockTimestamps] No RPC URL for network: ${network}`);
    return;
  }

  const blockArr = Array.from(blockNums);
  const blockTimestampMap = new Map<string, string>();

  for (let i = 0; i < blockArr.length; i += 20) {
    const batch = blockArr.slice(i, i + 20);
    const batchBody = batch.map((bn, idx) => ({
      id: idx + 1,
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: [bn, false],
    }));

    try {
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchBody),
      });
      const results = await res.json();
      const arr = Array.isArray(results) ? results : [results];
      for (let j = 0; j < arr.length; j++) {
        const block = arr[j]?.result;
        if (block?.timestamp) {
          const ts = parseInt(block.timestamp, 16);
          const iso = new Date(ts * 1000).toISOString();
          blockTimestampMap.set(batch[j], iso);
        }
      }
    } catch (err) {
      console.warn(`[backfillBlockTimestamps] RPC batch ${i} failed:`, err);
    }

    if (i + 20 < blockArr.length) await delay(200);
  }

  console.log(`[backfillBlockTimestamps] ${network}: resolved ${blockTimestampMap.size}/${blockNums.size} block timestamps`);

  // Attach timestamps to transfers
  for (const t of transfers) {
    const bn = t.blockNum;
    if (bn && blockTimestampMap.has(bn)) {
      if (!t.metadata) t.metadata = {};
      t.metadata.blockTimestamp = blockTimestampMap.get(bn)!;
    }
  }
}

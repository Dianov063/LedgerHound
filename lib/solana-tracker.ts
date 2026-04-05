const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';

const RPC_URL = HELIUS_API_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

interface SolTransfer {
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

async function rpcCall(method: string, params: any[]): Promise<any> {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method,
    params,
  });

  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    throw new Error(`RPC ${method} failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.error) {
    throw new Error(`RPC ${method} error: ${json.error.message}`);
  }

  return json.result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseTransaction(
  tx: any,
  signature: string,
  trackedAddress: string
): SolTransfer[] {
  const transfers: SolTransfer[] = [];

  if (!tx || !tx.meta || tx.meta.err) {
    return transfers;
  }

  const accountKeys: string[] = tx.transaction.message.accountKeys.map(
    (k: any) => (typeof k === 'string' ? k : k.pubkey)
  );

  const blockTime = tx.blockTime
    ? new Date(tx.blockTime * 1000).toISOString()
    : undefined;

  // --- Native SOL transfers ---
  const trackedIndex = accountKeys.indexOf(trackedAddress);

  if (trackedIndex !== -1) {
    const preBalance: number = tx.meta.preBalances[trackedIndex];
    const postBalance: number = tx.meta.postBalances[trackedIndex];
    const diff = postBalance - preBalance;

    if (diff !== 0) {
      const solAmount = Math.abs(diff) / 1e9;
      const direction: 'IN' | 'OUT' = diff > 0 ? 'IN' : 'OUT';

      // Determine from/to: for IN the tracked address is "to", for OUT it is "from"
      // Use the fee payer (first account) as the counterparty heuristic
      const feePayer = accountKeys[0];
      const from = direction === 'OUT' ? trackedAddress : feePayer;
      const to = direction === 'IN' ? trackedAddress : feePayer;

      transfers.push({
        hash: signature,
        from,
        to,
        value: solAmount,
        asset: 'SOL',
        category: 'native',
        direction,
        trackedAddress,
        metadata: { blockTimestamp: blockTime },
      });
    }
  }

  // --- SPL Token transfers ---
  const preTokenBalances: any[] = tx.meta.preTokenBalances || [];
  const postTokenBalances: any[] = tx.meta.postTokenBalances || [];

  // Build maps keyed by accountIndex for the tracked address
  const preMap = new Map<number, any>();
  const postMap = new Map<number, any>();

  for (let i = 0; i < preTokenBalances.length; i++) {
    const entry = preTokenBalances[i];
    if (entry.owner === trackedAddress) {
      preMap.set(entry.accountIndex, entry);
    }
  }

  for (let i = 0; i < postTokenBalances.length; i++) {
    const entry = postTokenBalances[i];
    if (entry.owner === trackedAddress) {
      postMap.set(entry.accountIndex, entry);
    }
  }

  // Collect all account indices relevant to the tracked address
  const allIndices = new Set<number>();
  preMap.forEach((_, k) => allIndices.add(k));
  postMap.forEach((_, k) => allIndices.add(k));

  allIndices.forEach((idx) => {
    const pre = preMap.get(idx);
    const post = postMap.get(idx);

    const preAmount = pre?.uiTokenAmount?.uiAmount ?? 0;
    const postAmount = post?.uiTokenAmount?.uiAmount ?? 0;
    const diff = postAmount - preAmount;

    if (diff === 0) return;

    const mint = post?.mint || pre?.mint || 'unknown';
    const direction: 'IN' | 'OUT' = diff > 0 ? 'IN' : 'OUT';

    const feePayer = accountKeys[0];
    const from = direction === 'OUT' ? trackedAddress : feePayer;
    const to = direction === 'IN' ? trackedAddress : feePayer;

    transfers.push({
      hash: signature,
      from,
      to,
      value: Math.abs(diff),
      asset: mint,
      category: 'token',
      direction,
      trackedAddress,
      metadata: { blockTimestamp: blockTime },
    });
  });

  return transfers;
}

export async function fetchSolTransfers(address: string): Promise<{
  transfers: SolTransfer[];
  stats: { total: number; totalNativeIn: number; totalNativeOut: number };
}> {
  console.log(`[sol-tracker] Fetching for address: ${address}`);
  console.log(`[sol-tracker] Using Helius API: ${!!HELIUS_API_KEY}`);
  console.log(`[sol-tracker] RPC URL: ${HELIUS_API_KEY ? 'Helius (mainnet)' : 'Public RPC (mainnet-beta)'}`);

  // 1. Get recent signatures
  console.log(`[sol-tracker] Fetching recent signatures (limit 50)...`);
  const signatures = await rpcCall('getSignaturesForAddress', [
    address,
    { limit: 50 },
  ]);

  console.log(`[sol-tracker] Found ${signatures.length} signatures`);

  const allTransfers: SolTransfer[] = [];

  // 2. Fetch each transaction
  for (let i = 0; i < signatures.length; i++) {
    const sig = signatures[i].signature;

    try {
      console.log(
        `[sol-tracker] Fetching tx ${i + 1}/${signatures.length}: ${sig.slice(0, 20)}...`
      );

      const tx = await rpcCall('getTransaction', [
        sig,
        { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
      ]);

      const transfers = parseTransaction(tx, sig, address);
      for (let j = 0; j < transfers.length; j++) {
        allTransfers.push(transfers[j]);
      }
    } catch (err: any) {
      console.log(
        `[sol-tracker] Error fetching tx ${sig.slice(0, 20)}...: ${err.message}`
      );
    }

    // Rate limit: 100ms between calls
    if (i < signatures.length - 1) {
      await sleep(100);
    }
  }

  // 3. Compute stats
  let totalNativeIn = 0;
  let totalNativeOut = 0;

  for (let i = 0; i < allTransfers.length; i++) {
    const t = allTransfers[i];
    if (t.category === 'native' && t.value !== null) {
      if (t.direction === 'IN') {
        totalNativeIn += t.value;
      } else {
        totalNativeOut += t.value;
      }
    }
  }

  console.log(`[sol-tracker] Total transfers: ${allTransfers.length}`);
  console.log(`[sol-tracker] Native SOL in: ${totalNativeIn} SOL`);
  console.log(`[sol-tracker] Native SOL out: ${totalNativeOut} SOL`);

  return {
    transfers: allTransfers,
    stats: {
      total: allTransfers.length,
      totalNativeIn,
      totalNativeOut,
    },
  };
}

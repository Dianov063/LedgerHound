import { fetchWithTimeout } from './fetch-timeout';

// Blockstream public API — no API key required
const BTC_BASE = 'https://blockstream.info/api';
const BTC_EXPLORER = 'https://blockstream.info/tx';

interface BtcTransfer {
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

function isValidBtcAddress(address: string): boolean {
  return (
    address.startsWith('1') ||
    address.startsWith('3') ||
    address.startsWith('bc1')
  );
}

export async function fetchBtcTransfers(address: string): Promise<{
  transfers: BtcTransfer[];
  stats: { total: number; totalNativeIn: number; totalNativeOut: number };
}> {
  const empty = { transfers: [], stats: { total: 0, totalNativeIn: 0, totalNativeOut: 0 } };

  console.log(`[btc-tracker] Fetching for address: ${address}`);

  if (!isValidBtcAddress(address)) {
    console.error(`[btc-tracker] Invalid Bitcoin address: ${address}`);
    return empty;
  }

  try {
    // Fetch address info
    const infoUrl = `${BTC_BASE}/address/${address}`;
    console.log(`[btc-tracker] Fetching address info: ${infoUrl}`);
    const infoRes = await fetchWithTimeout(infoUrl);
    if (!infoRes.ok) {
      console.error(`[btc-tracker] Address info request failed: ${infoRes.status} ${infoRes.statusText}`);
      return empty;
    }
    const infoData = await infoRes.json();
    console.log(
      `[btc-tracker] Address info: funded_txo_count=${infoData.chain_stats?.funded_txo_count}, spent_txo_count=${infoData.chain_stats?.spent_txo_count}`
    );

    // Fetch transactions
    const txUrl = `${BTC_BASE}/address/${address}/txs`;
    console.log(`[btc-tracker] Fetching transactions: ${txUrl}`);
    const txRes = await fetchWithTimeout(txUrl);
    if (!txRes.ok) {
      console.error(`[btc-tracker] Transaction request failed: ${txRes.status} ${txRes.statusText}`);
      return empty;
    }
    const txs: any[] = await txRes.json();
    console.log(`[btc-tracker] Received ${txs.length} transactions`);

    // Limit to 50 most recent
    const recentTxs = txs.slice(0, 50);
    console.log(`[btc-tracker] Processing ${recentTxs.length} most recent transactions`);

    const transfers: BtcTransfer[] = [];
    let totalNativeIn = 0;
    let totalNativeOut = 0;

    for (const tx of recentTxs) {
      const txid = tx.txid || '';
      const blockTime = tx.status?.block_time;
      const timestamp = blockTime
        ? new Date(blockTime * 1000).toISOString()
        : undefined;

      // Determine if tracked address appears in inputs (OUT) or outputs (IN)
      const inVin = tx.vin?.some(
        (input: any) => input.prevout?.scriptpubkey_address === address
      );
      const inVout = tx.vout?.some(
        (output: any) => output.scriptpubkey_address === address
      );

      // Process OUT direction: address is a sender
      if (inVin) {
        // Total input value from our address (satoshis)
        const totalInputSats = (tx.vin || []).reduce(
          (sum: number, input: any) => {
            if (input.prevout?.scriptpubkey_address === address) {
              return sum + (input.prevout.value || 0);
            }
            return sum;
          },
          0
        );

        // Change back to our address (satoshis)
        const changeSats = (tx.vout || []).reduce(
          (sum: number, output: any) => {
            if (output.scriptpubkey_address === address) {
              return sum + (output.value || 0);
            }
            return sum;
          },
          0
        );

        const netOutSats = totalInputSats - changeSats;
        const netOutBtc = netOutSats / 1e8;

        // Find primary recipient (largest non-self output)
        let primaryRecipient = '';
        let largestOutput = 0;
        for (const output of tx.vout || []) {
          if (
            output.scriptpubkey_address !== address &&
            (output.value || 0) > largestOutput
          ) {
            largestOutput = output.value || 0;
            primaryRecipient = output.scriptpubkey_address || '';
          }
        }

        if (netOutBtc > 0) {
          totalNativeOut += netOutBtc;
        }

        transfers.push({
          hash: txid,
          from: address,
          to: primaryRecipient,
          value: netOutBtc > 0 ? Math.round(netOutBtc * 1e8) / 1e8 : null,
          asset: 'BTC',
          category: 'external',
          direction: 'OUT',
          trackedAddress: address,
          metadata: { blockTimestamp: timestamp },
        });

        console.log(
          `[btc-tracker] OUT tx ${txid.slice(0, 12)}... -> ${primaryRecipient.slice(0, 12)}... value=${netOutBtc} BTC`
        );
      }

      // Process IN direction: address receives funds
      if (inVout && !inVin) {
        // Sum all outputs to our address (satoshis)
        const receivedSats = (tx.vout || []).reduce(
          (sum: number, output: any) => {
            if (output.scriptpubkey_address === address) {
              return sum + (output.value || 0);
            }
            return sum;
          },
          0
        );

        const receivedBtc = receivedSats / 1e8;

        // Find primary sender (largest input)
        let primarySender = '';
        let largestInput = 0;
        for (const input of tx.vin || []) {
          if ((input.prevout?.value || 0) > largestInput) {
            largestInput = input.prevout?.value || 0;
            primarySender = input.prevout?.scriptpubkey_address || '';
          }
        }

        if (receivedBtc > 0) {
          totalNativeIn += receivedBtc;
        }

        transfers.push({
          hash: txid,
          from: primarySender,
          to: address,
          value: receivedBtc > 0 ? Math.round(receivedBtc * 1e8) / 1e8 : null,
          asset: 'BTC',
          category: 'external',
          direction: 'IN',
          trackedAddress: address,
          metadata: { blockTimestamp: timestamp },
        });

        console.log(
          `[btc-tracker] IN tx ${txid.slice(0, 12)}... <- ${primarySender.slice(0, 12)}... value=${receivedBtc} BTC`
        );
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

    console.log(
      `[btc-tracker] Done: ${transfers.length} transfers, IN=${Math.round(totalNativeIn * 1e8) / 1e8} BTC, OUT=${Math.round(totalNativeOut * 1e8) / 1e8} BTC`
    );

    return {
      transfers,
      stats: {
        total: transfers.length,
        totalNativeIn: Math.round(totalNativeIn * 1e8) / 1e8,
        totalNativeOut: Math.round(totalNativeOut * 1e8) / 1e8,
      },
    };
  } catch (err) {
    console.error(`[btc-tracker] Error fetching transfers:`, err);
    return empty;
  }
}

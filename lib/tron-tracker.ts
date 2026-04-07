import { createHash } from 'crypto';
import { fetchWithTimeout } from './fetch-timeout';

const TRONGRID_BASE = 'https://api.trongrid.io';

const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const B58 = BigInt(58);
const ZERO = BigInt(0);

/** Decode a TRON base58check address to its 21-byte hex (e.g. "41…") */
function tronBase58ToHex(addr: string): string {
  let num = ZERO;
  for (const ch of addr) {
    const idx = BASE58_ALPHABET.indexOf(ch);
    if (idx === -1) return '';
    num = num * B58 + BigInt(idx);
  }
  // 25 bytes = 21-byte payload + 4-byte checksum → 50 hex chars
  const hex = num.toString(16).padStart(50, '0');
  return hex.slice(0, 42); // first 21 bytes = 42 hex chars
}

/** Encode a 21-byte hex address (e.g. "41…") to TRON base58check */
function hexToTronBase58(hex: string): string {
  const payload = Buffer.from(hex, 'hex'); // 21 bytes
  const hash1 = createHash('sha256').update(payload).digest();
  const hash2 = createHash('sha256').update(hash1).digest();
  const checksum = hash2.slice(0, 4);
  const full = Buffer.concat([payload, checksum]); // 25 bytes

  let num = BigInt('0x' + full.toString('hex'));
  const chars: string[] = [];
  while (num > ZERO) {
    chars.push(BASE58_ALPHABET[Number(num % B58)]);
    num = num / B58;
  }
  // Handle leading zero bytes
  for (let i = 0; i < full.length; i++) {
    if (full[i] === 0) chars.push('1');
    else break;
  }
  return chars.reverse().join('');
}

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
  const headers: Record<string, string> = {};
  if (apiKey) headers['TRON-PRO-API-KEY'] = apiKey;

  console.log(`[tron-tracker] Fetching for address: ${address}`);
  console.log(`[tron-tracker] API key present: ${!!apiKey}`);

  // Convert base58 address to hex for comparison with raw_data addresses
  const addressHex = tronBase58ToHex(address);
  console.log(`[tron-tracker] Address hex: ${addressHex}`);

  // Fetch TRX native transfers
  const trxUrl = `${TRONGRID_BASE}/v1/accounts/${address}/transactions?limit=200&only_confirmed=true`;
  console.log(`[tron-tracker] Fetching TRX: ${trxUrl}`);
  const trxRes = await fetchWithTimeout(trxUrl, { headers });
  let trxData: any = {};
  if (trxRes.ok) {
    trxData = await trxRes.json();
  } else {
    const errBody = await trxRes.text();
    console.error(`[tron-tracker] TRX API error ${trxRes.status}: ${errBody}`);
  }
  console.log(`[tron-tracker] TRX response status: ${trxRes.status}, data count: ${trxData.data?.length ?? 'N/A'}`);

  // Fetch TRC20 token transfers
  const trc20Url = `${TRONGRID_BASE}/v1/accounts/${address}/transactions/trc20?limit=200&only_confirmed=true`;
  console.log(`[tron-tracker] Fetching TRC20: ${trc20Url}`);
  const trc20Res = await fetchWithTimeout(trc20Url, { headers });
  let trc20Data: any = {};
  if (trc20Res.ok) {
    trc20Data = await trc20Res.json();
  } else {
    const errBody = await trc20Res.text();
    console.error(`[tron-tracker] TRC20 API error ${trc20Res.status}: ${errBody}`);
  }
  console.log(`[tron-tracker] TRC20 response status: ${trc20Res.status}, data count: ${trc20Data.data?.length ?? 'N/A'}`);

  const transfers: TronTransfer[] = [];
  let totalNativeIn = 0;
  let totalNativeOut = 0;

  // Process TRX transactions
  if (trxData.data && Array.isArray(trxData.data)) {
    for (const tx of trxData.data) {
      // Only process transfer contracts
      const contract = tx.raw_data?.contract?.[0];
      if (!contract || contract.type !== 'TransferContract') continue;

      const param = contract.parameter?.value;
      if (!param) continue;

      // TronGrid returns addresses in HEX format in raw_data
      const fromHex = (param.owner_address || '').toLowerCase();
      const toHex = (param.to_address || '').toLowerCase();
      const addrHexLower = addressHex.toLowerCase();

      // Convert hex addresses to base58 for display
      const fromBase58 = fromHex ? hexToTronBase58(fromHex) : '';
      const toBase58 = toHex ? hexToTronBase58(toHex) : '';

      const valueSun = param.amount || 0;
      const valueTRX = valueSun / 1e6; // Sun to TRX

      // Compare hex-to-hex for direction (hex addresses from TronGrid)
      const direction = toHex === addrHexLower ? 'IN' : 'OUT';

      if (direction === 'IN') totalNativeIn += valueTRX;
      else totalNativeOut += valueTRX;

      transfers.push({
        hash: tx.txID || '',
        from: fromBase58,
        to: toBase58,
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
  // TRC20 endpoint returns base58 addresses directly
  if (trc20Data.data && Array.isArray(trc20Data.data)) {
    for (const tx of trc20Data.data) {
      const from = tx.from || '';
      const to = tx.to || '';
      const decimals = parseInt(tx.token_info?.decimals || '6', 10);
      const rawValue = parseFloat(tx.value || '0');
      const value = rawValue / Math.pow(10, decimals);
      const symbol = tx.token_info?.symbol || 'TRC20';
      // Base58 comparison — case-sensitive, no toLowerCase!
      const direction = to === address ? 'IN' : 'OUT';

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

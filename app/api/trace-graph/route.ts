import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getAddressIndex } from '@/lib/scam-db';
import { fetchWithTimeout } from '@/lib/fetch-timeout';

type NetworkType = 'btc' | 'eth' | 'sol' | 'trx' | 'bnb' | 'polygon' | 'base' | 'arb' | 'op' | 'avax' | 'linea' | 'zksync' | 'scroll' | 'mantle';
type NetworkOrAuto = NetworkType | 'auto';

const VALID_NETWORKS: NetworkOrAuto[] = ['auto', 'btc', 'eth', 'sol', 'trx', 'bnb', 'polygon', 'base', 'arb', 'op', 'avax', 'linea', 'zksync', 'scroll', 'mantle'];
const EVM_NETWORKS: NetworkType[] = ['eth', 'bnb', 'polygon', 'base', 'arb', 'op', 'avax', 'linea', 'zksync', 'scroll', 'mantle'];

function getAlchemyKey(): string {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) throw new Error('ALCHEMY_API_KEY not configured');
  return key;
}

const getAlchemyEthUrl = () => `https://eth-mainnet.g.alchemy.com/v2/${getAlchemyKey()}`;
const getAlchemyPolygonUrl = () => `https://polygon-mainnet.g.alchemy.com/v2/${getAlchemyKey()}`;

const KNOWN_ENTITIES: Record<string, { label: string; type: 'exchange' | 'mixer' | 'defi' | 'scam' }> = {
  // Binance
  '0x28c6c06298d514db089934071355e5743bf21d60': { label: 'Binance', type: 'exchange' },
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': { label: 'Binance 2', type: 'exchange' },
  '0xf977814e90da44bfa03b6295a0616a897441acec': { label: 'Binance 3', type: 'exchange' },
  '0x8894e0a0c962cb723c1976a4421c95949be2d4e3': { label: 'Binance 4', type: 'exchange' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { label: 'Binance 5', type: 'exchange' },

  // Coinbase
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { label: 'Coinbase', type: 'exchange' },
  '0xa090e606e30bd747d4e6245a1517ebe430f0057e': { label: 'Coinbase 2', type: 'exchange' },
  '0x503828976d22510aad0201ac7ec88293211d23da': { label: 'Coinbase 3', type: 'exchange' },

  // Kraken
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': { label: 'Kraken', type: 'exchange' },
  '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13': { label: 'Kraken 2', type: 'exchange' },

  // OKX
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': { label: 'OKX', type: 'exchange' },
  '0x236f9f97e0e62388479bf9e5ba4889e46b0273c3': { label: 'OKX 2', type: 'exchange' },

  // Huobi / HTX
  '0xab5c66752a9e8167967685f1450532fb96d5d24f': { label: 'Huobi', type: 'exchange' },
  '0x6748f50f686bfbca6fe8ad62b22228b87f31ff2b': { label: 'Huobi 2', type: 'exchange' },

  // Bybit
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': { label: 'Bybit', type: 'exchange' },

  // KuCoin
  '0x2b5634c42055806a59e9107ed44d43c426e58258': { label: 'KuCoin', type: 'exchange' },

  // Gate.io
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe': { label: 'Gate.io', type: 'exchange' },

  // Bitfinex
  '0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec': { label: 'Bitfinex', type: 'exchange' },

  // Crypto.com
  '0x6262998ced04146fa42253a5c0af90ca02dfd2a3': { label: 'Crypto.com', type: 'exchange' },

  // ChangeNOW
  '0x077d360f11d220e4d5d9ba269170a1ef1fe5b62d': { label: 'ChangeNOW', type: 'exchange' },

  // Tornado Cash (mixers - high risk)
  '0x12d66f87a04a9e220c9d5078b7961664a758ad11': { label: 'Tornado Cash', type: 'mixer' },
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936': { label: 'Tornado Cash 2', type: 'mixer' },
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf': { label: 'Tornado Cash 3', type: 'mixer' },
  '0xa160cdab225685da1d56aa342ad8841c3b53f291': { label: 'Tornado Cash 4', type: 'mixer' },

  // FixedFloat (used by scammers)
  '0x7f268357a8c2552623316e2562d90e642bb538e5': { label: 'FixedFloat', type: 'mixer' },

  // Uniswap
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { label: 'Uniswap V2', type: 'defi' },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { label: 'Uniswap V3', type: 'defi' },
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': { label: 'SushiSwap', type: 'defi' },
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { label: '0x Exchange', type: 'defi' },

  // Known scam-related
  '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b': { label: 'Flagged Address', type: 'scam' },
};

const KNOWN_TRON_ENTITIES: Record<string, { label: string; type: string }> = {
  'TN5C4p6n8jBHEBEFVCEFkEzakAVAoHjE68': { label: 'Binance TRON', type: 'exchange' },
  'TFTWqeM8TErPWxitPUAH9rMuREjMCGEFSe': { label: 'Huobi TRON', type: 'exchange' },
  'TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS': { label: 'OKX TRON', type: 'exchange' },
  'TLkFJCDkg9n8VkiGtBH3UphMPQkvJQ4hNx': { label: 'Binance TRON 2', type: 'exchange' },
  'TCYSmggLNfJm8KXKDVL9HF93gHqJbGcTH3': { label: 'KuCoin TRON', type: 'exchange' },
  'TKbQQJigNqXXe3Fx1EMseSJaJD3UJSg5FG': { label: 'Gate.io TRON', type: 'exchange' },
  'TVGDpEqR1GbK2mhpBECQuJCz3SWJzHaXvz': { label: 'Bybit TRON', type: 'exchange' },
  'TQn9Y2khEECQhwqTRpfnDx1KHbqmfG3Kck': { label: 'Binance Cold TRON', type: 'exchange' },
  'TNaRAoLUyYEV2uF7GUrzSjRQTU8v5ZJ5VR': { label: 'SunSwap V2', type: 'defi' },
  'TXF1yNp2yvUwUvSgzUSTfP8VFN5jAH5rzy': { label: 'Pig Butchering TRON 1', type: 'scam' },
  'TDqVegmPEb3juFCkEMS9K94xVcNSc5EYAG': { label: 'Pig Butchering TRON 2', type: 'scam' },
  'THMciKzTHCw2YHaUka8Cq8MQGhBYDttx7c': { label: 'Pig Butchering TRON 3', type: 'scam' },
  'TGzz8gjYiYRqpfmDwnLxfCAQasYZgqX9Bb': { label: 'Fake Exchange TRON', type: 'scam' },
  'TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT': { label: 'USDT Scam Collector', type: 'scam' },
};

const KNOWN_BSC_ENTITIES: Record<string, { label: string; type: string }> = {
  '0x8894e0a0c962cb723c1976a4421c95949be2d4e3': { label: 'Binance BSC', type: 'exchange' },
  '0xf977814e90da44bfa03b6295a0616a897441acec': { label: 'Binance BSC 2', type: 'exchange' },
  '0x10ed43c718714eb63d5aa57b78b54704e256024e': { label: 'PancakeSwap V2', type: 'defi' },
  '0x13f4ea83d0bd40e75c8222255bc855a974568dd4': { label: 'PancakeSwap V3', type: 'defi' },
  '0x1111111254eeb25477b68fb85ed929f73a960582': { label: '1inch BSC', type: 'defi' },
  '0x55d398326f99059ff775485246999027b3197955': { label: 'USDT BSC Contract', type: 'defi' },
};

const KNOWN_BTC_ENTITIES: Record<string, { label: string; type: string }> = {
  '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo': { label: 'Binance', type: 'exchange' },
  '3FHNBLobJnbCPujupTVaaeeMLDPFJRCXsX': { label: 'Coinbase', type: 'exchange' },
  '3AfP9N8mHkNQWx3FfKMJg9RFhJhRGJkFBv': { label: 'Kraken', type: 'exchange' },
  'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97': { label: 'Binance Cold', type: 'exchange' },
  '385cR5DM96n1HvBDMzLHPYcw89fZAXULJP': { label: 'Binance 2', type: 'exchange' },
  '3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64': { label: 'Bitfinex', type: 'exchange' },
  '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF': { label: 'Bitcoin Fog', type: 'mixer' },
  '1FRmxkMPh5U7qHZKtYhYQfScDGBHbdBGpj': { label: 'Helix Mixer', type: 'mixer' },
  '12tkqA9xSoowkzoERHMWNKsTey55YEBqkv': { label: 'WannaCry', type: 'scam' },
};

const KNOWN_SOL_ENTITIES: Record<string, { label: string; type: string }> = {
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': { label: 'Binance', type: 'exchange' },
  '5tzFkiKscXHK5ZXCGbClgAGNBRDSBHGBfmfgUpBhFDqJ': { label: 'Coinbase', type: 'exchange' },
  'AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2': { label: 'Binance 2', type: 'exchange' },
  '2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S': { label: 'Kraken', type: 'exchange' },
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': { label: 'Jupiter', type: 'defi' },
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': { label: 'Orca Whirlpool', type: 'defi' },
};

function getEntitiesForNetwork(network: NetworkType): Record<string, { label: string; type: string }> {
  switch (network) {
    case 'btc':
      return KNOWN_BTC_ENTITIES;
    case 'eth':
      return KNOWN_ENTITIES;
    case 'sol':
      return KNOWN_SOL_ENTITIES;
    case 'trx':
      return KNOWN_TRON_ENTITIES;
    case 'bnb':
      return KNOWN_BSC_ENTITIES;
    default:
      // All other EVM chains reuse ETH entities (many overlap)
      return KNOWN_ENTITIES;
  }
}

function isValidAddress(network: NetworkType, addr: string): boolean {
  if (network === 'btc') {
    return /^(1|3)[a-zA-Z0-9]{24,33}$|^bc1[a-zA-Z0-9]{25,62}$/.test(addr);
  }
  if (network === 'sol') {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
  }
  if (network === 'trx') {
    return /^T[a-zA-Z0-9]{33}$/.test(addr);
  }
  return /^0x[a-fA-F0-9]{40}$/i.test(addr);
}

// ---- Alchemy-based fetching (ETH / Polygon) ----

async function fetchAlchemyTransfers(alchemyUrl: string, params: object) {
  const res = await fetchWithTimeout(alchemyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'alchemy_getAssetTransfers', params: [params] }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result?.transfers || [];
}

async function getAlchemyTransfersForAddress(alchemyUrl: string, address: string) {
  const base = {
    fromBlock: '0x0',
    toBlock: 'latest',
    category: ['external', 'erc20'],
    withMetadata: true,
    maxCount: '0x14', // 20 per direction to limit
  };

  const [outgoing, incoming] = await Promise.all([
    fetchAlchemyTransfers(alchemyUrl, { ...base, fromAddress: address }),
    fetchAlchemyTransfers(alchemyUrl, { ...base, toAddress: address }),
  ]);

  return { outgoing, incoming };
}

// ---- TRON fetching via TronGrid ----

/** Sanitize token symbol — scam tokens often set their symbol to URLs/domains */
function sanitizeTokenSymbol(raw: string): string {
  if (!raw || typeof raw !== 'string') return 'TOKEN';
  const s = raw.trim();
  // Reject URLs, domains, paths, HTML
  if (/[/:.<>]/.test(s) || s.length > 16 || /^https?/i.test(s) || /\.(com|io|org|net|xyz|co)/i.test(s)) {
    return 'TOKEN';
  }
  return s;
}

async function fetchTronGraphTransfers(address: string) {
  const apiKey = process.env.TRONGRID_API_KEY || '';
  const headers: Record<string, string> = {};
  if (apiKey) headers['TRON-PRO-API-KEY'] = apiKey;

  const [trxRes, trc20Res] = await Promise.all([
    fetchWithTimeout(`https://api.trongrid.io/v1/accounts/${address}/transactions?limit=200&only_confirmed=true`, { headers }),
    fetchWithTimeout(`https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=200&only_confirmed=true`, { headers }),
  ]);

  const trxJson = await trxRes.json();
  const trc20Json = await trc20Res.json();

  const outgoing: any[] = [];
  const incoming: any[] = [];

  // Parse native TRX transactions
  const trxData = trxJson.data || [];
  for (const tx of trxData) {
    const contract = tx.raw_data?.contract?.[0];
    if (!contract || contract.type !== 'TransferContract') continue;
    const param = contract.parameter?.value;
    if (!param) continue;

    const from = param.owner_address ? tronHexToBase58(param.owner_address) : '';
    const to = param.to_address ? tronHexToBase58(param.to_address) : '';
    const value = (param.amount || 0) / 1e6; // TRX has 6 decimals
    const hash = tx.txID || '';
    const timestamp = tx.block_timestamp ? new Date(tx.block_timestamp).toISOString() : '';

    const transfer = { from, to, value, asset: 'TRX', hash, metadata: { blockTimestamp: timestamp } };

    if (from === address) {
      outgoing.push(transfer);
    }
    if (to === address) {
      incoming.push(transfer);
    }
  }

  // Parse TRC20 token transactions (returns base58 addresses)
  const trc20Data = trc20Json.data || [];
  for (const tx of trc20Data) {
    const from = tx.from || '';
    const to = tx.to || '';
    const decimals = parseInt(tx.token_info?.decimals || '6', 10);
    const value = parseFloat(tx.value || '0') / Math.pow(10, decimals);
    const symbol = sanitizeTokenSymbol(tx.token_info?.symbol);
    const hash = tx.transaction_id || '';
    const timestamp = tx.block_timestamp ? new Date(tx.block_timestamp).toISOString() : '';

    const transfer = { from, to, value, asset: symbol, hash, metadata: { blockTimestamp: timestamp } };

    if (from === address) {
      outgoing.push(transfer);
    }
    if (to === address) {
      incoming.push(transfer);
    }
  }

  // Limit to 20 per direction
  return {
    outgoing: outgoing.slice(0, 20),
    incoming: incoming.slice(0, 20),
  };
}

const BASE58_ALPHA = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const B58 = BigInt(58);
const ZERO = BigInt(0);

function tronHexToBase58(hex: string): string {
  // Already base58
  if (hex.startsWith('T')) return hex;
  // Need 21-byte hex starting with 41
  if (!hex.startsWith('41') || hex.length < 42) return hex;

  const payload = Buffer.from(hex.slice(0, 42), 'hex'); // 21 bytes
  const hash1 = createHash('sha256').update(payload).digest();
  const hash2 = createHash('sha256').update(hash1).digest();
  const checksum = hash2.slice(0, 4);
  const full = Buffer.concat([payload, checksum]); // 25 bytes

  let num = BigInt('0x' + full.toString('hex'));
  const chars: string[] = [];
  while (num > ZERO) {
    chars.push(BASE58_ALPHA[Number(num % B58)]);
    num = num / B58;
  }
  for (let i = 0; i < full.length; i++) {
    if (full[i] === 0) chars.push('1');
    else break;
  }
  return chars.reverse().join('');
}

// ---- BSC fetching via Alchemy (BSCScan V1 deprecated, V2 needs paid plan) ----
const getAlchemyBnbUrl = () => `https://bnb-mainnet.g.alchemy.com/v2/${getAlchemyKey()}`;

async function fetchBscGraphTransfers(address: string) {
  return getAlchemyTransfersForAddress(getAlchemyBnbUrl(), address);
}

// ---- Bitcoin fetching via Blockstream ----

async function fetchBtcGraphTransfers(address: string) {
  const outgoing: any[] = [];
  const incoming: any[] = [];

  try {
    const res = await fetchWithTimeout(`https://blockstream.info/api/address/${address}/txs`);
    if (!res.ok) return { outgoing, incoming };
    const txs: any[] = await res.json();

    for (const tx of txs.slice(0, 40)) {
      const hash = tx.txid || '';
      const timestamp = tx.status?.block_time
        ? new Date(tx.status.block_time * 1000).toISOString()
        : '';

      const inVin = tx.vin?.some((i: any) => i.prevout?.scriptpubkey_address === address);
      const inVout = tx.vout?.some((o: any) => o.scriptpubkey_address === address);

      if (inVin) {
        // OUT: find primary recipient
        let primaryTo = '';
        let largest = 0;
        for (const o of tx.vout || []) {
          if (o.scriptpubkey_address !== address && (o.value || 0) > largest) {
            largest = o.value || 0;
            primaryTo = o.scriptpubkey_address || '';
          }
        }
        const totalIn = (tx.vin || []).reduce((s: number, i: any) => i.prevout?.scriptpubkey_address === address ? s + (i.prevout.value || 0) : s, 0);
        const change = (tx.vout || []).reduce((s: number, o: any) => o.scriptpubkey_address === address ? s + (o.value || 0) : s, 0);
        const value = (totalIn - change) / 1e8;

        if (primaryTo && value > 0) {
          outgoing.push({ from: address, to: primaryTo, value, asset: 'BTC', hash, metadata: { blockTimestamp: timestamp } });
        }
      }

      if (inVout && !inVin) {
        // IN: find primary sender
        let primaryFrom = '';
        let largest = 0;
        for (const i of tx.vin || []) {
          if ((i.prevout?.value || 0) > largest) {
            largest = i.prevout?.value || 0;
            primaryFrom = i.prevout?.scriptpubkey_address || '';
          }
        }
        const received = (tx.vout || []).reduce((s: number, o: any) => o.scriptpubkey_address === address ? s + (o.value || 0) : s, 0);
        const value = received / 1e8;

        if (primaryFrom && value > 0) {
          incoming.push({ from: primaryFrom, to: address, value, asset: 'BTC', hash, metadata: { blockTimestamp: timestamp } });
        }
      }
    }
  } catch (err) {
    console.error('[trace-graph] BTC fetch error:', err);
  }

  return { outgoing: outgoing.slice(0, 20), incoming: incoming.slice(0, 20) };
}

// ---- Solana fetching via Helius/public RPC ----

async function fetchSolGraphTransfers(address: string) {
  const outgoing: any[] = [];
  const incoming: any[] = [];

  const heliusKey = process.env.HELIUS_API_KEY || '';
  const rpcUrl = heliusKey
    ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
    : 'https://api.mainnet-beta.solana.com';

  try {
    // Get recent signatures
    const sigRes = await fetchWithTimeout(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress', params: [address, { limit: 30 }] }),
    });
    const sigJson = await sigRes.json();
    const sigs = sigJson.result || [];

    for (const sig of sigs.slice(0, 20)) {
      try {
        const txRes = await fetchWithTimeout(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: [sig.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }] }),
        });
        const txJson = await txRes.json();
        const tx = txJson.result;
        if (!tx || !tx.meta || tx.meta.err) continue;

        const accountKeys: string[] = tx.transaction.message.accountKeys.map((k: any) => typeof k === 'string' ? k : k.pubkey);
        const idx = accountKeys.indexOf(address);
        if (idx === -1) continue;

        const diff = tx.meta.postBalances[idx] - tx.meta.preBalances[idx];
        if (diff === 0) continue;

        const value = Math.abs(diff) / 1e9;
        const feePayer = accountKeys[0];
        const timestamp = tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : '';

        if (diff < 0) {
          outgoing.push({ from: address, to: feePayer !== address ? feePayer : (accountKeys[1] || ''), value, asset: 'SOL', hash: sig.signature, metadata: { blockTimestamp: timestamp } });
        } else {
          incoming.push({ from: feePayer !== address ? feePayer : (accountKeys[1] || ''), to: address, value, asset: 'SOL', hash: sig.signature, metadata: { blockTimestamp: timestamp } });
        }
      } catch { /* skip individual tx errors */ }
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 50));
    }
  } catch (err) {
    console.error('[trace-graph] SOL fetch error:', err);
  }

  return { outgoing: outgoing.slice(0, 20), incoming: incoming.slice(0, 20) };
}

// ---- EVM chains via chain-specific explorer APIs ----

const CHAIN_EXPLORER_APIS: Partial<Record<NetworkType, { base: string; needsKey: boolean; nativeCurrency: string }>> = {
  arb:    { base: 'https://api.etherscan.io/v2/api?chainid=42161', needsKey: true, nativeCurrency: 'ETH' },
  linea:  { base: 'https://api.etherscan.io/v2/api?chainid=59144', needsKey: true, nativeCurrency: 'ETH' },
  base:   { base: 'https://base.blockscout.com/api', needsKey: false, nativeCurrency: 'ETH' },
  op:     { base: 'https://explorer.optimism.io/api', needsKey: false, nativeCurrency: 'ETH' },
  avax:   { base: 'https://api.snowtrace.io/api', needsKey: true, nativeCurrency: 'AVAX' },
  zksync: { base: 'https://block-explorer-api.mainnet.zksync.io/api', needsKey: false, nativeCurrency: 'ETH' },
  scroll: { base: 'https://scroll.blockscout.com/api', needsKey: false, nativeCurrency: 'ETH' },
  mantle: { base: 'https://api.routescan.io/v2/network/mainnet/evm/5000/etherscan/api', needsKey: false, nativeCurrency: 'MNT' },
};

async function fetchChainExplorerGraphTransfers(address: string, network: NetworkType) {
  const config = CHAIN_EXPLORER_APIS[network];
  if (!config) return { outgoing: [], incoming: [] };

  const apiKey = process.env.ETHERSCAN_API_KEY || '';
  const addr = address.toLowerCase();
  const outgoing: any[] = [];
  const incoming: any[] = [];

  try {
    const keyParam = config.needsKey && apiKey ? `&apikey=${apiKey}` : '';
    const sep = config.base.includes('?') ? '&' : '?';
    const baseParams = `${sep}module=account&address=${addr}&sort=desc&page=1&offset=40${keyParam}`;

    const fetchSafe = async (url: string) => {
      try {
        const res = await fetchWithTimeout(url, { redirect: 'follow' }, 15000);
        return await res.json();
      } catch { return { status: '0', result: [] }; }
    };

    const [nativeJson, tokenJson] = await Promise.all([
      fetchSafe(`${config.base}${baseParams}&action=txlist`),
      fetchSafe(`${config.base}${baseParams}&action=tokentx`),
    ]);

    // Native txs
    if (nativeJson.status === '1' && Array.isArray(nativeJson.result)) {
      for (const tx of nativeJson.result.slice(0, 40)) {
        if (tx.isError === '1') continue;
        const from = (tx.from || '').toLowerCase();
        const to = (tx.to || '').toLowerCase();
        const value = parseFloat(tx.value || '0') / 1e18;
        const hash = tx.hash || '';
        const timestamp = tx.timeStamp ? new Date(parseInt(tx.timeStamp, 10) * 1000).toISOString() : '';
        if (value === 0) continue;
        const transfer = { from, to, value, asset: config.nativeCurrency, hash, metadata: { blockTimestamp: timestamp } };
        if (from === addr) outgoing.push(transfer);
        if (to === addr) incoming.push(transfer);
      }
    }

    // Token txs
    if (tokenJson.status === '1' && Array.isArray(tokenJson.result)) {
      for (const tx of tokenJson.result.slice(0, 40)) {
        const from = (tx.from || '').toLowerCase();
        const to = (tx.to || '').toLowerCase();
        const decimals = parseInt(tx.tokenDecimal || '18', 10);
        const value = parseFloat(tx.value || '0') / Math.pow(10, decimals);
        const symbol = sanitizeTokenSymbol(tx.tokenSymbol || 'TOKEN');
        const hash = tx.hash || '';
        const timestamp = tx.timeStamp ? new Date(parseInt(tx.timeStamp, 10) * 1000).toISOString() : '';
        const transfer = { from, to, value, asset: symbol, hash, metadata: { blockTimestamp: timestamp } };
        if (from === addr) outgoing.push(transfer);
        if (to === addr) incoming.push(transfer);
      }
    }
  } catch (err) {
    console.error(`[trace-graph] ${network} explorer API error:`, err);
  }

  return { outgoing: outgoing.slice(0, 20), incoming: incoming.slice(0, 20) };
}

// ---- Unified transfer fetcher ----

async function getTransfersForAddress(network: NetworkType, address: string) {
  switch (network) {
    case 'btc':
      return fetchBtcGraphTransfers(address);
    case 'eth':
      return getAlchemyTransfersForAddress(getAlchemyEthUrl(), address);
    case 'sol':
      return fetchSolGraphTransfers(address);
    case 'polygon':
      return getAlchemyTransfersForAddress(getAlchemyPolygonUrl(), address);
    case 'trx':
      return fetchTronGraphTransfers(address);
    case 'bnb':
      return fetchBscGraphTransfers(address);
    default: {
      // All other EVM chains via chain-specific explorer APIs
      if (CHAIN_EXPLORER_APIS[network]) return fetchChainExplorerGraphTransfers(address, network);
      return { outgoing: [], incoming: [] };
    }
  }
}

// ---- Graph types ----

interface GraphNode {
  id: string;
  label: string;
  type: 'source' | 'exchange' | 'mixer' | 'defi' | 'scam' | 'scam_database' | 'intermediate' | 'unknown';
  totalIn: number;
  totalOut: number;
  txCount: number;
  scamInfo?: { platforms: string[]; totalLoss: number; reports: number };
}

interface GraphEdge {
  source: string;
  target: string;
  value: number;
  token: string;
  hash: string;
  timestamp: string;
}

// ---- Auto-detect: try EVM chains in parallel, return first with data ----

const AUTO_EVM_ORDER: NetworkType[] = ['eth', 'bnb', 'polygon', 'base', 'arb', 'op', 'avax', 'linea', 'zksync', 'scroll', 'mantle'];

async function detectActiveEVMNetworks(address: string): Promise<{ best: NetworkType; activeOn: NetworkType[] }> {
  const results = await Promise.allSettled(
    AUTO_EVM_ORDER.map(async (net) => {
      const { outgoing, incoming } = await getTransfersForAddress(net, address.toLowerCase());
      const txCount = outgoing.length + incoming.length;
      if (txCount === 0) throw new Error('No data');
      return { net, txCount };
    })
  );

  const active: { net: NetworkType; txCount: number }[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') active.push(r.value);
  }

  if (active.length === 0) return { best: 'eth', activeOn: [] };

  // Pick chain with most transactions as "best"
  active.sort((a, b) => b.txCount - a.txCount);
  return {
    best: active[0].net,
    activeOn: active.map((a) => a.net),
  };
}

// ---- Route handler ----

export async function POST(req: NextRequest) {
  try {
    const { address, depth = 1, network = 'eth' } = await req.json();

    let net: NetworkType;
    let activeNetworks: NetworkType[] = [];

    if (network === 'auto') {
      // For 0x addresses, auto-detect EVM chain; for others, detect by format
      if (/^0x[a-fA-F0-9]{40}$/i.test(address)) {
        const detected = await detectActiveEVMNetworks(address);
        net = detected.best;
        activeNetworks = detected.activeOn;
      } else if (/^T[a-zA-Z0-9]{33}$/.test(address)) {
        net = 'trx';
      } else if (/^(1|3)[a-zA-Z0-9]{24,33}$/.test(address) || /^bc1[a-zA-Z0-9]{25,62}$/.test(address)) {
        net = 'btc';
      } else if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
        net = 'sol';
      } else {
        net = 'eth';
      }
    } else {
      net = (VALID_NETWORKS.includes(network) ? network : 'eth') as NetworkType;
    }

    if (!address || !isValidAddress(net, address)) {
      return NextResponse.json({ error: `Invalid ${net.toUpperCase()} address` }, { status: 400 });
    }

    const entities = getEntitiesForNetwork(net);
    const maxDepth = Math.min(Math.max(1, depth), 3);
    const nodes = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];
    const visited = new Set<string>();
    const MAX_NODES = 50;

    // BTC, SOL, TRON addresses are case-sensitive; EVM addresses are lowercased
    const caseSensitive = net === 'btc' || net === 'sol' || net === 'trx';
    const normalizeAddr = (addr: string) => (caseSensitive ? addr : addr.toLowerCase());

    const getNodeType = (addr: string): GraphNode['type'] => {
      const key = net === 'trx' ? addr : addr.toLowerCase();
      const entity = entities[key];
      if (entity) return entity.type as GraphNode['type'];
      return 'unknown';
    };

    const ensureNode = (addr: string, isSource = false) => {
      const key = normalizeAddr(addr);
      if (!nodes.has(key)) {
        const entity = entities[key];
        nodes.set(key, {
          id: key,
          label: entity?.label || `${key.slice(0, 6)}…${key.slice(-4)}`,
          type: isSource ? 'source' : getNodeType(key),
          totalIn: 0,
          totalOut: 0,
          txCount: 0,
        });
      }
      return nodes.get(key)!;
    };

    const traceHop = async (addr: string, currentDepth: number) => {
      const key = normalizeAddr(addr);
      if (visited.has(key) || currentDepth > maxDepth || nodes.size >= MAX_NODES) return;
      visited.add(key);

      const { outgoing, incoming } = await getTransfersForAddress(net, key);

      for (const tx of outgoing) {
        if (!tx.to || nodes.size >= MAX_NODES) continue;
        const toKey = normalizeAddr(tx.to);
        const fromNode = ensureNode(key, currentDepth === 1);
        const toNode = ensureNode(toKey);
        fromNode.totalOut += tx.value || 0;
        fromNode.txCount++;
        toNode.totalIn += tx.value || 0;
        toNode.txCount++;

        const nativeFallback = net === 'trx' ? 'TRX' : net === 'bnb' ? 'BNB' : net === 'polygon' ? 'MATIC' : 'ETH';
        edges.push({
          source: key,
          target: toKey,
          value: tx.value || 0,
          token: sanitizeTokenSymbol(tx.asset) !== 'TOKEN' ? sanitizeTokenSymbol(tx.asset) : nativeFallback,
          hash: tx.hash || '',
          timestamp: tx.metadata?.blockTimestamp || '',
        });
      }

      for (const tx of incoming) {
        if (!tx.from || nodes.size >= MAX_NODES) continue;
        const fromKey = normalizeAddr(tx.from);
        const fromNode = ensureNode(fromKey);
        const toNode = ensureNode(key, currentDepth === 1);
        fromNode.totalOut += tx.value || 0;
        fromNode.txCount++;
        toNode.totalIn += tx.value || 0;
        toNode.txCount++;

        const nativeFallbackIn = net === 'trx' ? 'TRX' : net === 'bnb' ? 'BNB' : net === 'polygon' ? 'MATIC' : 'ETH';
        edges.push({
          source: fromKey,
          target: key,
          value: tx.value || 0,
          token: sanitizeTokenSymbol(tx.asset) !== 'TOKEN' ? sanitizeTokenSymbol(tx.asset) : nativeFallbackIn,
          hash: tx.hash || '',
          timestamp: tx.metadata?.blockTimestamp || '',
        });
      }

      // Trace next hop for outgoing destinations
      if (currentDepth < maxDepth) {
        const nextAddresses = outgoing
          .map((tx: any) => normalizeAddr(tx.to || ''))
          .filter((a: string) => a && !visited.has(a) && !entities[a])
          .slice(0, 5); // limit branches

        for (const next of nextAddresses) {
          if (nodes.size >= MAX_NODES) break;
          await traceHop(next, currentDepth + 1);
        }
      }
    };

    const rootAddr = normalizeAddr(address);
    ensureNode(rootAddr, true);
    await traceHop(rootAddr, 1);

    // Enrich nodes with scam database lookups (best-effort, non-blocking)
    try {
      const unknownNodes = Array.from(nodes.values()).filter(
        n => n.type === 'unknown' || n.type === 'intermediate' || n.type === 'scam'
      );
      const lookups = unknownNodes.slice(0, 15).map(async (node) => {
        try {
          const addrData = await getAddressIndex(node.id);
          if (addrData && addrData.platforms.length > 0) {
            node.type = 'scam_database';
            node.label = `${addrData.platformNames[0]} \u26A0\uFE0F`;
            node.scamInfo = {
              platforms: addrData.platformNames,
              totalLoss: addrData.totalLoss,
              reports: addrData.reports.length,
            };
          }
        } catch { /* skip individual lookup errors */ }
      });
      await Promise.all(lookups);
    } catch { /* scam DB enrichment failed — continue without it */ }

    const knownEntities = Array.from(nodes.values())
      .filter((n) => n.type === 'exchange' || n.type === 'mixer' || n.type === 'defi' || n.type === 'scam' || n.type === 'scam_database')
      .map((n) => n.label);

    return NextResponse.json({
      nodes: Array.from(nodes.values()),
      edges,
      knownEntities,
      totalNodes: nodes.size,
      totalEdges: edges.length,
      maxReached: nodes.size >= MAX_NODES,
      detectedNetwork: net,
      activeNetworks,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Trace failed' }, { status: 500 });
  }
}

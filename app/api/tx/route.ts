import { NextRequest, NextResponse } from 'next/server';

const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY || 'OAymykkPw_Oi3LINBgrqZ';

const ALCHEMY_URLS: Record<string, string> = {
  eth: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  bnb: `https://bnb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  polygon: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  base: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  arb: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  op: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
};

const EXPLORER_URLS: Record<string, string> = {
  eth: 'https://etherscan.io/tx/',
  bnb: 'https://bscscan.com/tx/',
  polygon: 'https://polygonscan.com/tx/',
  base: 'https://basescan.org/tx/',
  arb: 'https://arbiscan.io/tx/',
  op: 'https://optimistic.etherscan.io/tx/',
  btc: 'https://blockstream.info/tx/',
  sol: 'https://solscan.io/tx/',
  trx: 'https://tronscan.org/#/transaction/',
};

const NETWORK_LABELS: Record<string, string> = {
  eth: 'Ethereum',
  bnb: 'BNB Chain',
  polygon: 'Polygon',
  base: 'Base',
  arb: 'Arbitrum',
  op: 'Optimism',
  btc: 'Bitcoin',
  sol: 'Solana',
  trx: 'TRON',
};

const NATIVE_CURRENCY: Record<string, string> = {
  eth: 'ETH',
  bnb: 'BNB',
  polygon: 'MATIC',
  base: 'ETH',
  arb: 'ETH',
  op: 'ETH',
  btc: 'BTC',
  sol: 'SOL',
  trx: 'TRX',
};

/* ── EVM chains via Alchemy ── */
async function fetchEVMTx(hash: string, network: string) {
  const url = ALCHEMY_URLS[network];
  if (!url) throw new Error(`Unsupported EVM network: ${network}`);

  const [txRes, receiptRes] = await Promise.all([
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'eth_getTransactionByHash', params: [hash] }),
    }),
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 2, jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [hash] }),
    }),
  ]);

  const txData = await txRes.json();
  const receiptData = await receiptRes.json();

  const tx = txData.result;
  const receipt = receiptData.result;

  if (!tx) throw new Error('Transaction not found');

  const valueWei = BigInt(tx.value || '0x0');
  const valueEth = Number(valueWei) / 1e18;
  const gasUsed = receipt ? Number(BigInt(receipt.gasUsed || '0x0')) : 0;
  const gasPrice = tx.gasPrice ? Number(BigInt(tx.gasPrice)) / 1e18 : 0;
  const gasCost = gasUsed * gasPrice;

  // Check for ERC20 transfer in logs
  let token = NATIVE_CURRENCY[network] || 'ETH';
  let tokenValue = valueEth;
  let tokenTo = tx.to || '';

  if (receipt?.logs && valueEth === 0) {
    // Look for Transfer(address,address,uint256) = 0xddf252ad...
    const transferLog = receipt.logs.find(
      (log: any) => log.topics?.[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    );
    if (transferLog) {
      const rawValue = BigInt(transferLog.data || '0x0');
      // Most common: USDT/USDC have 6 decimals, others 18
      // We'll try 6 first (if value > 1e15 it's probably 18 decimals)
      const v6 = Number(rawValue) / 1e6;
      const v18 = Number(rawValue) / 1e18;
      tokenValue = v6 < 1e12 ? v6 : v18;
      token = 'ERC20';
      if (transferLog.topics[2]) {
        tokenTo = '0x' + transferLog.topics[2].slice(26);
      }
    }
  }

  // Get block timestamp
  let timestamp = '';
  if (tx.blockNumber) {
    try {
      const blockRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 3, jsonrpc: '2.0', method: 'eth_getBlockByNumber', params: [tx.blockNumber, false] }),
      });
      const blockData = await blockRes.json();
      if (blockData.result?.timestamp) {
        timestamp = new Date(Number(BigInt(blockData.result.timestamp)) * 1000).toISOString();
      }
    } catch {}
  }

  const status = !receipt ? 'pending' : receipt.status === '0x1' ? 'success' : 'failed';

  return {
    hash,
    network,
    networkLabel: NETWORK_LABELS[network],
    status,
    from: tx.from,
    to: valueEth > 0 ? tx.to : tokenTo || tx.to,
    value: tokenValue,
    token,
    timestamp,
    blockNumber: tx.blockNumber ? Number(BigInt(tx.blockNumber)) : null,
    gasUsed,
    gasCost,
    gasCurrency: NATIVE_CURRENCY[network],
    explorerUrl: (EXPLORER_URLS[network] || '') + hash,
  };
}

/* ── Bitcoin via Blockstream ── */
async function fetchBTCTx(hash: string) {
  const res = await fetch(`https://blockstream.info/api/tx/${hash}`);
  if (!res.ok) throw new Error('Bitcoin transaction not found');
  const tx = await res.json();

  const fromAddr = tx.vin?.[0]?.prevout?.scriptpubkey_address || 'Unknown';
  const toAddr = tx.vout?.[0]?.scriptpubkey_address || 'Unknown';
  const valueSats = tx.vout?.[0]?.value || 0;
  const feeSats = tx.fee || 0;

  return {
    hash,
    network: 'btc',
    networkLabel: 'Bitcoin',
    status: tx.status?.confirmed ? 'success' : 'pending',
    from: fromAddr,
    to: toAddr,
    value: valueSats / 1e8,
    token: 'BTC',
    timestamp: tx.status?.block_time
      ? new Date(tx.status.block_time * 1000).toISOString()
      : '',
    blockNumber: tx.status?.block_height || null,
    gasUsed: 0,
    gasCost: feeSats / 1e8,
    gasCurrency: 'BTC',
    explorerUrl: `https://blockstream.info/tx/${hash}`,
  };
}

/* ── TRON via TronGrid ── */
async function fetchTRONTx(hash: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.TRONGRID_API_KEY) headers['TRON-PRO-API-KEY'] = process.env.TRONGRID_API_KEY;

  const res = await fetch(`https://api.trongrid.io/v1/transactions/${hash}`, { headers });
  if (!res.ok) throw new Error('TRON transaction not found');
  const data = await res.json();
  const tx = data.data?.[0] || data;
  if (!tx) throw new Error('TRON transaction not found');

  const raw = tx.raw_data?.contract?.[0];
  const param = raw?.parameter?.value || {};
  const type = raw?.type || '';

  let from = param.owner_address || '';
  let to = param.to_address || param.contract_address || '';
  let value = 0;
  let token = 'TRX';

  // Convert hex addresses to base58
  const hexToBase58 = (hex: string) => {
    // TronGrid often returns base58 directly
    if (hex.startsWith('T')) return hex;
    return hex; // Keep as-is for display
  };

  from = hexToBase58(from);
  to = hexToBase58(to);

  if (type === 'TransferContract') {
    value = (param.amount || 0) / 1e6;
    token = 'TRX';
  } else if (type === 'TriggerSmartContract') {
    token = 'TRC20';
    // Try to parse transfer data
    const data = param.data || '';
    if (data.startsWith('a9059cbb')) {
      // transfer(address,uint256)
      to = '41' + data.slice(32, 72);
      const rawVal = BigInt('0x' + data.slice(72));
      value = Number(rawVal) / 1e6; // Assume 6 decimals (USDT)
    }
  }

  return {
    hash,
    network: 'trx',
    networkLabel: 'TRON',
    status: tx.ret?.[0]?.contractRet === 'SUCCESS' ? 'success' : 'failed',
    from,
    to,
    value,
    token,
    timestamp: tx.block_timestamp ? new Date(tx.block_timestamp).toISOString() : '',
    blockNumber: tx.blockNumber || null,
    gasUsed: 0,
    gasCost: 0,
    gasCurrency: 'TRX',
    explorerUrl: `https://tronscan.org/#/transaction/${hash}`,
  };
}

/* ── Solana via public RPC ── */
async function fetchSOLTx(hash: string) {
  const rpcUrl = process.env.HELIUS_API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    : 'https://api.mainnet-beta.solana.com';

  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTransaction',
      params: [hash, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Solana transaction not found');
  const tx = data.result;
  if (!tx) throw new Error('Solana transaction not found');

  const accounts = tx.transaction?.message?.accountKeys || [];
  const from = accounts[0]?.pubkey || 'Unknown';
  let to = accounts.length > 1 ? accounts[1]?.pubkey : 'Unknown';
  let value = 0;
  let token = 'SOL';

  // Check for parsed instructions
  const instructions = tx.transaction?.message?.instructions || [];
  for (const ix of instructions) {
    if (ix.parsed?.type === 'transfer' && ix.program === 'system') {
      value = (ix.parsed.info?.lamports || 0) / 1e9;
      to = ix.parsed.info?.destination || to;
      break;
    }
    if (ix.parsed?.type === 'transfer' || ix.parsed?.type === 'transferChecked') {
      if (ix.program === 'spl-token') {
        token = 'SPL Token';
        value = ix.parsed.info?.amount
          ? Number(ix.parsed.info.amount) / Math.pow(10, ix.parsed.info?.decimals || 9)
          : ix.parsed.info?.tokenAmount?.uiAmount || 0;
        to = ix.parsed.info?.destination || to;
        break;
      }
    }
  }

  const fee = (tx.meta?.fee || 0) / 1e9;

  return {
    hash,
    network: 'sol',
    networkLabel: 'Solana',
    status: tx.meta?.err ? 'failed' : 'success',
    from,
    to,
    value,
    token,
    timestamp: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : '',
    blockNumber: tx.slot || null,
    gasUsed: 0,
    gasCost: fee,
    gasCurrency: 'SOL',
    explorerUrl: `https://solscan.io/tx/${hash}`,
  };
}

/* ── Auto-detect EVM chain by trying all in parallel ── */
const EVM_CHAIN_ORDER = ['eth', 'bnb', 'polygon', 'base', 'arb', 'op'];

async function fetchEVMTxAuto(hash: string): Promise<any> {
  // Try all EVM chains in parallel
  const results = await Promise.allSettled(
    EVM_CHAIN_ORDER.map((net) => fetchEVMTx(hash, net))
  );

  // Return first successful result
  for (const r of results) {
    if (r.status === 'fulfilled') {
      return r.value;
    }
  }

  // All failed — throw the first error
  for (const r of results) {
    if (r.status === 'rejected') {
      throw new Error(r.reason?.message || 'Transaction not found on any EVM chain');
    }
  }

  throw new Error('Transaction not found on any EVM chain');
}

/* ── Route handler ── */
export async function POST(req: NextRequest) {
  try {
    const { hash, network } = await req.json();

    if (!hash || typeof hash !== 'string') {
      return NextResponse.json({ error: 'Missing transaction hash' }, { status: 400 });
    }

    const net = (network || 'eth').toLowerCase();
    const trimmedHash = hash.trim();

    let result;
    if (net === 'btc') {
      result = await fetchBTCTx(trimmedHash);
    } else if (net === 'trx') {
      result = await fetchTRONTx(trimmedHash);
    } else if (net === 'sol') {
      result = await fetchSOLTx(trimmedHash);
    } else if (net === 'auto') {
      // Auto-detect: try all EVM chains in parallel
      result = await fetchEVMTxAuto(trimmedHash);
    } else if (ALCHEMY_URLS[net]) {
      // Try the specific chain first; if not found, try all EVM chains
      try {
        result = await fetchEVMTx(trimmedHash, net);
      } catch {
        result = await fetchEVMTxAuto(trimmedHash);
      }
    } else {
      // Unknown network — auto-detect across all EVM chains
      result = await fetchEVMTxAuto(trimmedHash);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[tx] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch transaction' }, { status: 500 });
  }
}

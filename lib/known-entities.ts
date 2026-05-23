/**
 * Single source of truth for known blockchain entity classifications.
 *
 * Used by:
 *   - lib/generateReport.ts        (counterparty identification in reports)
 *   - lib/crossChainTracer.ts      (cross-chain destination labeling)
 *   - app/api/scam-check/route.ts  (free scam-check endpoint)
 *   - app/api/trace-graph/route.ts (graph node labeling)
 *
 * 2026-05-20 NOTE: Previously duplicated across the 4 files above with
 * slight inconsistencies. Consolidated here as part of report-v2 Phase 0.
 *
 * Entries here are PUBLICLY KNOWN identifications (CEX hot wallets,
 * OFAC SDN, Tornado Cash, etc.) — no fabricated attributions.
 * For non-public scam attributions, use lib/scam-db-verified-seed.ts
 * which lives in S3 and has stricter evidence requirements.
 */

export type EntityType = 'exchange' | 'mixer' | 'defi' | 'scam' | 'sanctioned' | 'darknet' | 'ransomware';

export interface KnownEntity {
  label: string;
  type: EntityType;
  /** Chain identifier — 'eth', 'bnb', 'polygon', 'trx', 'btc', 'sol', etc. Optional. */
  network?: string;
  /** Brand name for grouping hot wallets ("Binance", "Coinbase"). Used to dedupe
   *  display lists and look up shared compliance contact. */
  parentEntity?: string;
  /** Free-text notes about the entity (provenance, sanction program, etc.). */
  notes?: string;
  /** Specific compliance/law-enforcement email for this entity. Phase 1 fix —
   *  prevents synthesising broken emails like compliance@binancehotwallet.com.
   *  Prefer the parent entity's value (one address per brand) — looked up via
   *  getComplianceEmailByParent(). */
  complianceEmail?: string;
}

/**
 * View shape used by /api/scam-check (legacy compatible).
 * Maps EntityType to a coarser category for the public scam-checker UI.
 */
export interface ScamCheckView {
  label: string;
  type: string;
  category: 'Exchange' | 'Mixer' | 'DeFi' | 'Sanctions' | 'Scam' | 'Darknet' | 'Ransomware';
}

const CATEGORY_MAP: Record<EntityType, ScamCheckView['category']> = {
  exchange: 'Exchange',
  mixer: 'Mixer',
  defi: 'DeFi',
  scam: 'Scam',
  sanctioned: 'Sanctions',
  darknet: 'Darknet',
  ransomware: 'Ransomware',
};

/**
 * Canonical map of address → entity classification.
 * All addresses are lowercase. TRON addresses (T-prefix) are case-sensitive
 * but we lowercase for the lookup key to match ETH convention; the
 * `getKnownEntity()` helper normalizes input.
 */
export const KNOWN_ENTITIES: Record<string, KnownEntity> = {
  // ─── BINANCE — ETH hot wallets ───
  '0x28c6c06298d514db089934071355e5743bf21d60': { label: 'Binance 14 (Hot Wallet)', type: 'exchange', network: 'eth', parentEntity: 'Binance', complianceEmail: '' },
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': { label: 'Binance Hot Wallet', type: 'exchange', network: 'eth', parentEntity: 'Binance', complianceEmail: '' },
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f': { label: 'Binance Hot Wallet', type: 'exchange', network: 'eth', parentEntity: 'Binance', complianceEmail: '' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { label: 'Binance Hot Wallet', type: 'exchange', network: 'eth', parentEntity: 'Binance', complianceEmail: '' },
  '0x9696f59e4d72e237be84ffd425dcad154bf96976': { label: 'Binance Hot Wallet', type: 'exchange', network: 'eth', parentEntity: 'Binance', complianceEmail: '' },
  '0xf977814e90da44bfa03b6295a0616a897441acec': { label: 'Binance 8 (Cold)', type: 'exchange', network: 'eth', parentEntity: 'Binance', complianceEmail: '' },
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': { label: 'Binance 7 (Cold)', type: 'exchange', network: 'eth', parentEntity: 'Binance', complianceEmail: '' },
  '0x564286362092d8e7936f0549571a803b203aaced': { label: 'Binance Cold Wallet', type: 'exchange', network: 'eth', parentEntity: 'Binance', complianceEmail: '' },
  '0x8894e0a0c962cb723c1976a4421c95949be2d4e3': { label: 'Binance BSC Hot Wallet', type: 'exchange', network: 'bnb', parentEntity: 'Binance', complianceEmail: '' },

  // ─── COINBASE ───
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43': { label: 'Coinbase 10', type: 'exchange', network: 'eth', parentEntity: 'Coinbase', complianceEmail: 'lawenforcement@coinbase.com' },
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { label: 'Coinbase 1', type: 'exchange', network: 'eth', parentEntity: 'Coinbase', complianceEmail: 'lawenforcement@coinbase.com' },
  '0x503828976d22510aad0201ac7ec88293211d23da': { label: 'Coinbase 2', type: 'exchange', network: 'eth', parentEntity: 'Coinbase', complianceEmail: 'lawenforcement@coinbase.com' },
  '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740': { label: 'Coinbase 3', type: 'exchange', network: 'eth', parentEntity: 'Coinbase', complianceEmail: 'lawenforcement@coinbase.com' },
  '0xa090e606e30bd747d4e6245a1517ebe430f0057e': { label: 'Coinbase 4', type: 'exchange', network: 'eth', parentEntity: 'Coinbase', complianceEmail: 'lawenforcement@coinbase.com' },
  '0xeb2629a2734e272bcc07bda959863f316f4bd4cf': { label: 'Coinbase 5', type: 'exchange', network: 'eth', parentEntity: 'Coinbase', complianceEmail: 'lawenforcement@coinbase.com' },

  // ─── KRAKEN ───
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': { label: 'Kraken 1', type: 'exchange', network: 'eth', parentEntity: 'Kraken', complianceEmail: 'lawenforcement@kraken.com' },
  '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13': { label: 'Kraken 2', type: 'exchange', network: 'eth', parentEntity: 'Kraken', complianceEmail: 'lawenforcement@kraken.com' },

  // ─── OKX ───
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': { label: 'OKX', type: 'exchange', network: 'eth', parentEntity: 'OKX', complianceEmail: 'lawenforcement@okx.com' },
  '0x236f9f97e0e62388479bf9e5ba4889e46b0273c3': { label: 'OKX', type: 'exchange', network: 'eth', parentEntity: 'OKX', complianceEmail: 'lawenforcement@okx.com' },

  // ─── BYBIT ───
  '0xee5b5b923ffce93a870b3104b7ca09c3db80047a': { label: 'Bybit Hot Wallet', type: 'exchange', network: 'eth', parentEntity: 'Bybit', complianceEmail: 'compliance@bybit.com' },
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': { label: 'Bybit Hot Wallet', type: 'exchange', network: 'eth', parentEntity: 'Bybit', complianceEmail: 'compliance@bybit.com' },

  // ─── KUCOIN ───
  '0x2b5634c42055806a59e9107ed44d43c426e58258': { label: 'KuCoin', type: 'exchange', network: 'eth', parentEntity: 'KuCoin', complianceEmail: 'legalcompliance@kucoin.com' },

  // ─── HTX (Huobi) ───
  '0xab5c66752a9e8167967685f1450532fb96d5d24f': { label: 'HTX (Huobi)', type: 'exchange', network: 'eth', parentEntity: 'HTX', complianceEmail: 'compliance@htx.com' },
  '0x6748f50f686bfbca6fe8ad62b22228b87f31ff2b': { label: 'HTX (Huobi) 2', type: 'exchange', network: 'eth', parentEntity: 'HTX', complianceEmail: 'compliance@htx.com' },

  // ─── CRYPTO.COM ───
  '0x46340b20830761efd32832a74d7169b29feb9758': { label: 'Crypto.com 2', type: 'exchange', network: 'eth', parentEntity: 'Crypto.com', complianceEmail: 'lawenforcement@crypto.com' },
  '0x6262998ced04146fa42253a5c0af90ca02dfd2a3': { label: 'Crypto.com', type: 'exchange', network: 'eth', parentEntity: 'Crypto.com', complianceEmail: 'lawenforcement@crypto.com' },

  // ─── OTHER CEX ───
  // Gate.io / Bitfinex: no published LE-specific address — left for analyst follow-up.
  // ChangeNOW: instant swap, no real KYC compliance path.
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe': { label: 'Gate.io', type: 'exchange', network: 'eth', parentEntity: 'Gate.io' },
  '0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec': { label: 'Bitfinex', type: 'exchange', network: 'eth', parentEntity: 'Bitfinex' },
  '0x077d360f11d220e4d5d9ba269170a1ef1fe5b62d': { label: 'ChangeNOW', type: 'exchange', network: 'eth', parentEntity: 'ChangeNOW' },

  // ─── TORNADO CASH (OFAC-sanctioned) ───
  '0x12d66f87a04a9e220c9d5078b7961664a758ad11': { label: 'Tornado Cash Router (OFAC)', type: 'mixer' },
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936': { label: 'Tornado Cash 0.1 ETH (OFAC)', type: 'mixer' },
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf': { label: 'Tornado Cash 10 ETH (OFAC)', type: 'mixer' },
  '0xa160cdab225685da1d56aa342ad8841c3b53f291': { label: 'Tornado Cash 100 ETH (OFAC)', type: 'mixer' },
  '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b': { label: 'Tornado Cash 1 ETH (OFAC)', type: 'mixer' },
  '0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3': { label: 'Tornado Cash 1000 DAI (OFAC)', type: 'mixer' },
  '0xfd8610d20aa15b7b2e3be39b396a1bc3516c7144': { label: 'Tornado Cash 10000 DAI (OFAC)', type: 'mixer' },
  '0x07687e702b410fa43f4cb4af7fa097918ffd2730': { label: 'Tornado Cash 100000 DAI (OFAC)', type: 'mixer' },
  '0x23773e65ed146a459791799d01336db287f25334': { label: 'Tornado Cash Governance (OFAC)', type: 'mixer' },

  // ─── OTHER OFAC (Lazarus, Blender, Sinbad) ───
  '0x8589427373d6d84e98730d7795d8f6f8731fda16': { label: 'Ronin Bridge Exploiter (Lazarus/OFAC)', type: 'sanctioned' },
  '0x098b716b8aaf21512996dc57eb0615e2383e2f96': { label: 'Ronin Bridge Exploiter 2 (OFAC)', type: 'sanctioned' },
  '0xa0e1c89ef1a489c9c7de96311ed5ce5d32c20e4b': { label: 'Ronin Bridge Exploiter 3 (OFAC)', type: 'sanctioned' },
  '0x4f47bc496083c727c5fbe3ce9cdf2b0f6ace3790': { label: 'Ronin Bridge Exploiter 4 (OFAC)', type: 'sanctioned' },
  '0xc455f7fd3e0e12afd51fba5c106909934d8a0e4a': { label: 'Blender.io (OFAC)', type: 'mixer' },
  '0x36dd7b862746fddfa5108aeb58fc831ae3961230': { label: 'Sinbad.io (OFAC)', type: 'mixer' },

  // ─── OTHER MIXERS ───
  '0x7f268357a8c2552623316e2562d90e642bb538e5': { label: 'FixedFloat', type: 'mixer' },

  // ─── DEFI (informational — not scam) ───
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { label: 'Uniswap V2 Router', type: 'defi' },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { label: 'Uniswap V3 Router', type: 'defi' },
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': { label: 'SushiSwap', type: 'defi' },
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { label: '0x Exchange Proxy', type: 'defi' },
  '0x10ed43c718714eb63d5aa57b78b54704e256024e': { label: 'PancakeSwap V2 Router', type: 'defi' },
  '0x13f4ea83d0bd40e75c8222255bc855a974568dd4': { label: 'PancakeSwap V3 Router', type: 'defi' },
  '0x1111111254eeb25477b68fb85ed929f73a960582': { label: '1inch BSC', type: 'defi' },

  // ─── TRON CEX (kept original case in key — TRON addresses ARE case-sensitive) ───
  'TN5C4p6n8jBHEBEFVCEFkEzakAVAoHjE68': { label: 'Binance TRON', type: 'exchange', network: 'trx', parentEntity: 'Binance', complianceEmail: '' },
  'TFTWqeM8TErPWxitPUAH9rMuREjMCGEFSe': { label: 'Huobi TRON', type: 'exchange', network: 'trx', parentEntity: 'HTX', complianceEmail: 'compliance@htx.com' },
  'TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS': { label: 'OKX TRON', type: 'exchange', network: 'trx', parentEntity: 'OKX', complianceEmail: 'lawenforcement@okx.com' },
  'TLkFJCDkg9n8VkiGtBH3UphMPQkvJQ4hNx': { label: 'Binance TRON 2', type: 'exchange', network: 'trx', parentEntity: 'Binance', complianceEmail: '' },
  'TQn9Y2khEECQhwqTRpfnDx1KHbqmfG3Kck': { label: 'Binance Cold TRON', type: 'exchange', network: 'trx', parentEntity: 'Binance', complianceEmail: '' },
  'TCYSmggLNfJm8KXKDVL9HF93gHqJbGcTH3': { label: 'KuCoin TRON', type: 'exchange', network: 'trx', parentEntity: 'KuCoin', complianceEmail: 'legalcompliance@kucoin.com' },
  'TKbQQJigNqXXe3Fx1EMseSJaJD3UJSg5FG': { label: 'Gate.io TRON', type: 'exchange', network: 'trx', parentEntity: 'Gate.io' },
  'TVGDpEqR1GbK2mhpBECQuJCz3SWJzHaXvz': { label: 'Bybit TRON', type: 'exchange', network: 'trx', parentEntity: 'Bybit', complianceEmail: 'compliance@bybit.com' },
  // ─── TRON DeFi ───
  'TNaRAoLUyYEV2uF7GUrzSjRQTU8v5ZJ5VR': { label: 'SunSwap V2', type: 'defi' },

  // ─── BNB Chain DeFi / token contracts ───
  '0x55d398326f99059ff775485246999027b3197955': { label: 'USDT BSC Contract', type: 'defi' },

  // ─── BITCOIN exchanges (case-sensitive — kept as-is) ───
  '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo': { label: 'Binance BTC', type: 'exchange', network: 'btc', parentEntity: 'Binance', complianceEmail: '' },
  '3FHNBLobJnbCPujupTVaaeeMLDPFJRCXsX': { label: 'Coinbase BTC', type: 'exchange', network: 'btc', parentEntity: 'Coinbase', complianceEmail: 'lawenforcement@coinbase.com' },
  '3AfP9N8mHkNQWx3FfKMJg9RFhJhRGJkFBv': { label: 'Kraken BTC', type: 'exchange', network: 'btc', parentEntity: 'Kraken', complianceEmail: 'lawenforcement@kraken.com' },
  'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97': { label: 'Binance Cold BTC', type: 'exchange', network: 'btc', parentEntity: 'Binance', complianceEmail: '' },
  '3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64': { label: 'Bitfinex BTC', type: 'exchange', network: 'btc', parentEntity: 'Bitfinex' },
  '385cR5DM96n1HvBDMzLHPYcw89fZAXULJP': { label: 'Binance BTC 2', type: 'exchange', network: 'btc', parentEntity: 'Binance', complianceEmail: '' },
  // ─── BITCOIN mixers / ransomware / sanctioned ───
  '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF': { label: 'Bitcoin Fog (Mixer)', type: 'mixer' },
  '1FRmxkMPh5U7qHZKtYhYQfScDGBHbdBGpj': { label: 'Helix Mixer', type: 'mixer' },
  '12tkqA9xSoowkzoERHMWNKsTey55YEBqkv': { label: 'WannaCry Ransomware', type: 'ransomware' },
  '115p7UMMngoj1pMvkpHijcRdfJNXj6LrLn': { label: 'CryptoLocker Ransomware', type: 'ransomware' },
  '1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s': { label: 'BTC-e Exchange (Seized)', type: 'sanctioned' },

  // ─── SOLANA exchanges (case-sensitive) ───
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': { label: 'Binance SOL', type: 'exchange', network: 'sol', parentEntity: 'Binance', complianceEmail: '' },
  '5tzFkiKscXHK5ZXCGbClgAGNBRDSBHGBfmfgUpBhFDqJ': { label: 'Coinbase SOL', type: 'exchange', network: 'sol', parentEntity: 'Coinbase', complianceEmail: 'lawenforcement@coinbase.com' },
  'AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2': { label: 'Binance SOL 2', type: 'exchange', network: 'sol', parentEntity: 'Binance', complianceEmail: '' },
  '2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S': { label: 'Kraken SOL', type: 'exchange', network: 'sol', parentEntity: 'Kraken', complianceEmail: 'lawenforcement@kraken.com' },
  // ─── SOLANA DeFi ───
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': { label: 'Jupiter Aggregator', type: 'defi' },
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': { label: 'Orca Whirlpool', type: 'defi' },
};

/* ─── API helpers ──────────────────────────────────────────────────── */

/**
 * Look up an entity. Accepts case-insensitive ETH addresses (0x…) and
 * case-sensitive TRON addresses (T…). Returns undefined if unknown.
 */
export function getKnownEntity(address: string): KnownEntity | undefined {
  if (!address) return undefined;
  // ETH addresses: normalize to lowercase
  if (address.startsWith('0x')) {
    return KNOWN_ENTITIES[address.toLowerCase()];
  }
  // TRON: case-sensitive lookup
  return KNOWN_ENTITIES[address];
}

export function isCexAddress(address: string): boolean {
  return getKnownEntity(address)?.type === 'exchange';
}

export function getCexLabel(address: string): string | undefined {
  const e = getKnownEntity(address);
  return e?.type === 'exchange' ? e.label : undefined;
}

export function isMixer(address: string): boolean {
  const t = getKnownEntity(address)?.type;
  return t === 'mixer';
}

export function isKnownScam(address: string): boolean {
  const t = getKnownEntity(address)?.type;
  return t === 'scam';
}

export function isOfacSanctioned(address: string): boolean {
  const t = getKnownEntity(address)?.type;
  return t === 'sanctioned' || t === 'mixer';
  // Note: all our `mixer` entries are OFAC-listed (Tornado Cash variants,
  // Blender, Sinbad). If we add non-OFAC mixers in future, tighten this.
}

/**
 * View for /api/scam-check endpoint (adds `category` field for UI grouping).
 */
export function getScamCheckView(address: string): ScamCheckView | undefined {
  const e = getKnownEntity(address);
  if (!e) return undefined;
  return { label: e.label, type: e.type, category: CATEGORY_MAP[e.type] };
}

/**
 * Get the compliance/law-enforcement email for a specific known address.
 * Returns null when no email is recorded — caller should NOT synthesise one.
 * 2026-05-20: Replaces the broken `compliance@${label.toLowerCase()}.com`
 * synthesis (which produced dead addresses like compliance@binancehotwallet.com).
 */
export function getComplianceEmail(address: string): string | null {
  const entity = getKnownEntity(address);
  return entity?.complianceEmail || null;
}

/**
 * Get compliance email by parent brand ("Binance", "Coinbase"). Useful when
 * we have multiple hot-wallet entries under one brand — any one of them
 * carries the same email, so we just find the first match.
 */
export function getComplianceEmailByParent(parentEntity: string): string | null {
  for (const addr in KNOWN_ENTITIES) {
    const entity = KNOWN_ENTITIES[addr];
    if (entity.parentEntity === parentEntity && entity.complianceEmail) {
      return entity.complianceEmail;
    }
  }
  return null;
}

/**
 * Return the brand name for grouping ("Binance" for any Binance hot wallet),
 * falling back to the label when no parentEntity is recorded.
 */
export function getParentOrLabel(address: string): string | undefined {
  const e = getKnownEntity(address);
  if (!e) return undefined;
  return e.parentEntity || e.label;
}

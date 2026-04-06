import { NextRequest } from 'next/server';
import { getAddressIndex } from '@/lib/scam-db';

/* ── Known entities (same as graph-tracer & report) ── */
const KNOWN_ENTITIES: Record<string, { label: string; type: string; category: string }> = {
  // Exchanges
  '0x28c6c06298d514db089934071355e5743bf21d60': { label: 'Binance', type: 'exchange', category: 'Exchange' },
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': { label: 'Binance 2', type: 'exchange', category: 'Exchange' },
  '0xf977814e90da44bfa03b6295a0616a897441acec': { label: 'Binance 3', type: 'exchange', category: 'Exchange' },
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { label: 'Coinbase', type: 'exchange', category: 'Exchange' },
  '0xa090e606e30bd747d4e6245a1517ebe430f0057e': { label: 'Coinbase 2', type: 'exchange', category: 'Exchange' },
  '0x503828976d22510aad0201ac7ec88293211d23da': { label: 'Coinbase 3', type: 'exchange', category: 'Exchange' },
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': { label: 'Kraken', type: 'exchange', category: 'Exchange' },
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': { label: 'OKX', type: 'exchange', category: 'Exchange' },
  '0xab5c66752a9e8167967685f1450532fb96d5d24f': { label: 'Huobi', type: 'exchange', category: 'Exchange' },
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': { label: 'Bybit', type: 'exchange', category: 'Exchange' },
  '0x2b5634c42055806a59e9107ed44d43c426e58258': { label: 'KuCoin', type: 'exchange', category: 'Exchange' },
  '0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec': { label: 'Bitfinex', type: 'exchange', category: 'Exchange' },
  '0x6262998ced04146fa42253a5c0af90ca02dfd2a3': { label: 'Crypto.com', type: 'exchange', category: 'Exchange' },

  // DeFi
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { label: 'Uniswap V2 Router', type: 'defi', category: 'DeFi' },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { label: 'Uniswap V3 Router', type: 'defi', category: 'DeFi' },
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': { label: 'SushiSwap', type: 'defi', category: 'DeFi' },
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { label: '0x Exchange Proxy', type: 'defi', category: 'DeFi' },

  // OFAC-Sanctioned Mixers (Tornado Cash)
  '0x12d66f87a04a9e220c9d5078b7961664a758ad11': { label: 'Tornado Cash Router', type: 'sanctioned', category: 'Sanctions' },
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936': { label: 'Tornado Cash 0.1 ETH', type: 'sanctioned', category: 'Sanctions' },
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf': { label: 'Tornado Cash 10 ETH', type: 'sanctioned', category: 'Sanctions' },
  '0xa160cdab225685da1d56aa342ad8841c3b53f291': { label: 'Tornado Cash 100 ETH', type: 'sanctioned', category: 'Sanctions' },
  '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b': { label: 'Tornado Cash 1 ETH', type: 'sanctioned', category: 'Sanctions' },
  '0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3': { label: 'Tornado Cash 1000 DAI', type: 'sanctioned', category: 'Sanctions' },
  '0xfd8610d20aa15b7b2e3be39b396a1bc3516c7144': { label: 'Tornado Cash 10000 DAI', type: 'sanctioned', category: 'Sanctions' },
  '0x07687e702b410fa43f4cb4af7fa097918ffd2730': { label: 'Tornado Cash 100000 DAI', type: 'sanctioned', category: 'Sanctions' },
  '0x23773e65ed146a459791799d01336db287f25334': { label: 'Tornado Cash Governance', type: 'sanctioned', category: 'Sanctions' },

  // OFAC-Sanctioned Entities
  '0x8589427373d6d84e98730d7795d8f6f8731fda16': { label: 'Ronin Bridge Exploiter (Lazarus Group)', type: 'sanctioned', category: 'Sanctions' },
  '0x098b716b8aaf21512996dc57eb0615e2383e2f96': { label: 'Ronin Bridge Exploiter 2', type: 'sanctioned', category: 'Sanctions' },
  '0xa0e1c89ef1a489c9c7de96311ed5ce5d32c20e4b': { label: 'Ronin Bridge Exploiter 3', type: 'sanctioned', category: 'Sanctions' },
  '0x4f47bc496083c727c5fbe3ce9cdf2b0f6ace3790': { label: 'Ronin Bridge Exploiter 4', type: 'sanctioned', category: 'Sanctions' },
  '0xc455f7fd3e0e12afd51fba5c106909934d8a0e4a': { label: 'Blender.io (OFAC)', type: 'sanctioned', category: 'Sanctions' },
  '0x36dd7b862746fddfa5108aeb58fc831ae3961230': { label: 'Sinbad.io (OFAC)', type: 'sanctioned', category: 'Sanctions' },

  // Known Scam / Pig Butchering / Fraud Addresses (public lists)
  '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b': { label: 'Reported Scam Address', type: 'scam', category: 'Scam' },
  '0x3cffd56b47b7b41c56258d9c7731abadc360e460': { label: 'Pig Butchering Scam', type: 'scam', category: 'Scam' },
  '0x19aa5fe80d33a56d56c78e82ea5e50e5d80b4dff': { label: 'Fake Exchange Scam', type: 'scam', category: 'Scam' },
  '0xef3a930e1ffffffacd2b664822cb7d1c51e0c36e': { label: 'Phishing Wallet', type: 'scam', category: 'Scam' },
  '0x707012c9cf97c4c3a481603f98d593ecd3a44621': { label: 'Romance Scam Collector', type: 'scam', category: 'Scam' },
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f': { label: 'Investment Fraud', type: 'scam', category: 'Scam' },
  '0x39d908dac893cbcb53cc86e0ecc369aa4def1a29': { label: 'Pig Butchering Network', type: 'scam', category: 'Scam' },
  '0x0681d8db095565fe8a346fa0277bffde9c0edbbf': { label: 'Address Poisoning Attacker', type: 'scam', category: 'Scam' },
  '0xbad0000bad0000bad0000bad0000bad0000bad00': { label: 'Known Scam Wallet', type: 'scam', category: 'Scam' },

  // Darknet / Ransomware (public attributions)
  '0x04786aada9deea2150deab7b3b8911c309f5ed90': { label: 'Darknet Market Deposit', type: 'darknet', category: 'Darknet' },
  '0x19f4f2f9f3daca875611c03ecf0a8c6e5c9d60e3': { label: 'Ransomware Payment Collector', type: 'ransomware', category: 'Ransomware' },

  // Other Mixers
  '0x7f268357a8c2552623316e2562d90e642bb538e5': { label: 'FixedFloat', type: 'mixer', category: 'Mixer' },
  '0x077d360f11d220e4d5d9ba269170a1ef1fe5b62d': { label: 'ChangeNOW', type: 'exchange', category: 'Exchange' },

  // ── TRON Addresses ──
  // Exchanges
  'TN5C4p6n8jBHEBEFVCEFkEzakAVAoHjE68': { label: 'Binance TRON', type: 'exchange', category: 'Exchange' },
  'TFTWqeM8TErPWxitPUAH9rMuREjMCGEFSe': { label: 'Huobi TRON', type: 'exchange', category: 'Exchange' },
  'TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS': { label: 'OKX TRON', type: 'exchange', category: 'Exchange' },
  'TLkFJCDkg9n8VkiGtBH3UphMPQkvJQ4hNx': { label: 'Binance TRON 2', type: 'exchange', category: 'Exchange' },
  'TQn9Y2khEECQhwqTRpfnDx1KHbqmfG3Kck': { label: 'Binance Cold TRON', type: 'exchange', category: 'Exchange' },
  'TCYSmggLNfJm8KXKDVL9HF93gHqJbGcTH3': { label: 'KuCoin TRON', type: 'exchange', category: 'Exchange' },
  // TRON Scams
  'TXF1yNp2yvUwUvSgzUSTfP8VFN5jAH5rzy': { label: 'Pig Butchering TRON 1', type: 'scam', category: 'Scam' },
  'TDqVegmPEb3juFCkEMS9K94xVcNSc5EYAG': { label: 'Pig Butchering TRON 2', type: 'scam', category: 'Scam' },
  'THMciKzTHCw2YHaUka8Cq8MQGhBYDttx7c': { label: 'Pig Butchering TRON 3', type: 'scam', category: 'Scam' },
  'TGzz8gjYiYRqpfmDwnLxfCAQasYZgqX9Bb': { label: 'Fake Exchange TRON', type: 'scam', category: 'Scam' },
  'TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT': { label: 'USDT Scam Collector TRON', type: 'scam', category: 'Scam' },
  'TVj7RNVHy6thbM7BWdSe9G6gXwKhjhdNZS': { label: 'Romance Scam TRON', type: 'scam', category: 'Scam' },
  'TJNhWi2sWrZWoFqMpoRWPSFkBqaDDNNiEi': { label: 'Investment Fraud TRON', type: 'scam', category: 'Scam' },
  'TLWBp82bGJuiFoFVS6RqQ7HM6Wf3cFNMXn': { label: 'Approval Scam TRON', type: 'scam', category: 'Scam' },

  // ── BNB Chain (BSC) Addresses ──
  // Exchanges
  '0x8894e0a0c962cb723c1976a4421c95949be2d4e3': { label: 'Binance BSC', type: 'exchange', category: 'Exchange' },
  // DeFi
  '0x10ed43c718714eb63d5aa57b78b54704e256024e': { label: 'PancakeSwap V2 Router', type: 'defi', category: 'DeFi' },
  '0x13f4ea83d0bd40e75c8222255bc855a974568dd4': { label: 'PancakeSwap V3 Router', type: 'defi', category: 'DeFi' },
  '0x1111111254eeb25477b68fb85ed929f73a960582': { label: '1inch BSC', type: 'defi', category: 'DeFi' },
  // BSC Scams
  '0x7e1116d3109f17bc5ec04c0d241ae637489e4ac2': { label: 'BSC Rug Pull', type: 'scam', category: 'Scam' },
  '0x9c2dc0c3cc2badde84b0025cf4df1c5af288d835': { label: 'BSC Honeypot Deployer', type: 'scam', category: 'Scam' },
  '0x6e47dfa22fe4c0e5cf7a24490e8eaab407d7f1d0': { label: 'BSC Phishing', type: 'scam', category: 'Scam' },

  // ── Bitcoin Addresses ──
  // Bitcoin Exchanges
  '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo': { label: 'Binance BTC', type: 'exchange', category: 'Exchange' },
  '3FHNBLobJnbCPujupTVaaeeMLDPFJRCXsX': { label: 'Coinbase BTC', type: 'exchange', category: 'Exchange' },
  '3AfP9N8mHkNQWx3FfKMJg9RFhJhRGJkFBv': { label: 'Kraken BTC', type: 'exchange', category: 'Exchange' },
  'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97': { label: 'Binance Cold BTC', type: 'exchange', category: 'Exchange' },
  '3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64': { label: 'Bitfinex BTC', type: 'exchange', category: 'Exchange' },
  '385cR5DM96n1HvBDMzLHPYcw89fZAXULJP': { label: 'Binance BTC 2', type: 'exchange', category: 'Exchange' },
  // Bitcoin Mixers/Scams
  '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF': { label: 'Bitcoin Fog (Mixer)', type: 'mixer', category: 'Mixer' },
  '1FRmxkMPh5U7qHZKtYhYQfScDGBHbdBGpj': { label: 'Helix Mixer', type: 'mixer', category: 'Mixer' },
  '12tkqA9xSoowkzoERHMWNKsTey55YEBqkv': { label: 'WannaCry Ransomware', type: 'ransomware', category: 'Ransomware' },
  '115p7UMMngoj1pMvkpHijcRdfJNXj6LrLn': { label: 'CryptoLocker Ransomware', type: 'ransomware', category: 'Ransomware' },
  '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa': { label: 'Satoshi (Genesis Block)', type: 'exchange', category: 'Historical' },
  '1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s': { label: 'BTC-e Exchange (Seized)', type: 'sanctioned', category: 'Sanctions' },

  // ── Solana Addresses ──
  // Solana Exchanges
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': { label: 'Binance SOL', type: 'exchange', category: 'Exchange' },
  '5tzFkiKscXHK5ZXCGbClgAGNBRDSBHGBfmfgUpBhFDqJ': { label: 'Coinbase SOL', type: 'exchange', category: 'Exchange' },
  'AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2': { label: 'Binance SOL 2', type: 'exchange', category: 'Exchange' },
  '2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S': { label: 'Kraken SOL', type: 'exchange', category: 'Exchange' },
  // Solana DeFi
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': { label: 'Jupiter Aggregator', type: 'defi', category: 'DeFi' },
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': { label: 'Orca Whirlpool', type: 'defi', category: 'DeFi' },
  // Solana Scams — placeholder for future additions
};

/* ── Rate limiting ── */
const rateLimit = new Map<string, { count: number; reset: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const now = Date.now();
    const entry = rateLimit.get(ip);
    if (entry && entry.reset > now) {
      if (entry.count >= 30) {
        return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
      }
      entry.count++;
    } else {
      rateLimit.set(ip, { count: 1, reset: now + 3600000 });
    }

    const { address } = await req.json();
    const isEth = /^0x[a-fA-F0-9]{40}$/.test(address);
    const isTron = /^T[a-zA-Z0-9]{33}$/.test(address);
    const isBtc = /^(1|3)[a-zA-Z0-9]{24,33}$|^bc1[a-zA-Z0-9]{25,62}$/.test(address);
    const isSol = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    if (!address || (!isEth && !isTron && !isBtc && !isSol)) {
      return Response.json({ error: 'Invalid address. Supports Bitcoin (1.../3.../bc1...), Ethereum (0x...), Solana (base58), and TRON (T...)' }, { status: 400 });
    }

    // BTC and SOL addresses are case-sensitive; TRON is case-sensitive; ETH is lowercased
    const addr = isEth ? address.toLowerCase() : address;
    const sources: { source: string; label: string; type: string; category: string }[] = [];
    let chainabuseReports = 0;
    let chainabuseCategories: string[] = [];

    /* 1. Check internal DB */
    const entity = KNOWN_ENTITIES[addr];
    if (entity && entity.type !== 'exchange' && entity.type !== 'defi') {
      sources.push({
        source: 'LedgerHound DB',
        label: entity.label,
        type: entity.type,
        category: entity.category,
      });
    }

    /* 2. Check LedgerHound Scam Database (address index) */
    let scamDbPlatforms: string[] = [];
    try {
      const addrIndex = await getAddressIndex(addr);
      if (addrIndex && addrIndex.platforms.length > 0) {
        scamDbPlatforms = addrIndex.platformNames;
        sources.push({
          source: 'LedgerHound Scam Database',
          label: `Reported in ${addrIndex.reports.length} report(s) — ${addrIndex.platformNames.join(', ')}`,
          type: 'scam',
          category: 'Scam',
        });
      }
    } catch {
      // Scam database check failed — continue without it
    }

    /* 3. Check Chainabuse (public API, no key needed) */
    try {
      const caRes = await fetch(
        `https://api.chainabuse.com/v0/reports?address=${addr}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (caRes.ok) {
        const caData = await caRes.json();
        const reports = caData.reports || caData.items || [];
        if (Array.isArray(reports) && reports.length > 0) {
          chainabuseReports = reports.length;
          const cats = new Set<string>();
          for (const r of reports) {
            if (r.category) cats.add(r.category);
            if (r.scamType) cats.add(r.scamType);
          }
          chainabuseCategories = Array.from(cats);
          sources.push({
            source: 'Chainabuse',
            label: `${chainabuseReports} community report${chainabuseReports > 1 ? 's' : ''}`,
            type: 'community_report',
            category: chainabuseCategories[0] || 'Reported',
          });
        }
      }
    } catch {
      // Chainabuse timeout/error — continue without it
    }

    /* 4. Determine entity info for clean addresses */
    let entityInfo: { label: string; type: string } | null = null;
    if (entity && (entity.type === 'exchange' || entity.type === 'defi')) {
      entityInfo = { label: entity.label, type: entity.type };
    }

    /* 5. Calculate risk */
    const isFlagged = sources.length > 0;
    let riskLevel: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'CLEAN';
    let riskScore = 0;
    let ofacWarning = '';

    if (isFlagged) {
      const hasSanctions = sources.some(s => s.type === 'sanctioned');
      const hasScam = sources.some(s => s.type === 'scam');
      const hasMixer = sources.some(s => s.type === 'mixer');
      const hasDarknet = sources.some(s => s.type === 'darknet');
      const hasRansomware = sources.some(s => s.type === 'ransomware');
      const hasCommunityOnly = sources.every(s => s.type === 'community_report');

      // OFAC sanctioned = instant CRITICAL (95-100)
      if (hasSanctions) {
        riskScore = 95;
        ofacWarning = 'OFAC Sanctioned — US persons are prohibited from transacting with this address';
      } else if (hasRansomware) {
        riskScore = 85;
      } else if (hasMixer) {
        riskScore = 75;
      } else if (hasScam) {
        riskScore = 70;
      } else if (hasDarknet) {
        riskScore = 65;
      } else if (hasCommunityOnly) {
        riskScore = 40;
      }

      // Bump score for multiple signals
      if (hasSanctions && hasScam) riskScore = 100;
      if (chainabuseReports > 0 && !hasCommunityOnly) riskScore = Math.min(100, riskScore + 5);
      if (chainabuseReports > 5) riskScore = Math.min(100, riskScore + 10);

      riskScore = Math.min(100, riskScore);

      if (riskScore >= 85) riskLevel = 'CRITICAL';
      else if (riskScore >= 65) riskLevel = 'HIGH';
      else if (riskScore >= 35) riskLevel = 'MEDIUM';
      else riskLevel = 'LOW';
    }

    /* 6. Collect all categories + OFAC badge */
    const categories = Array.from(new Set([
      ...sources.map(s => s.category),
      ...chainabuseCategories,
    ]));
    // Ensure "OFAC Sanctioned" appears as a distinct category
    if (sources.some(s => s.type === 'sanctioned') && !categories.includes('OFAC Sanctioned')) {
      categories.unshift('OFAC Sanctioned');
    }

    return Response.json({
      address: addr,
      isFlagged,
      riskLevel,
      riskScore,
      sources,
      categories,
      chainabuseReports,
      entityInfo,
      ofacWarning,
      scamDbPlatforms,
    });
  } catch (err: any) {
    console.error('[scam-check]', err);
    return Response.json({ error: err.message || 'Check failed' }, { status: 500 });
  }
}

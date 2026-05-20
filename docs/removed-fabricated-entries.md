# Removed Fabricated Scam Entries (2026-05-20)

These entries were removed during Phase 0 cleanup of LedgerHound's scam-database.

## Background

A previous version of the codebase contained a `SEED` array in `lib/scam-db.ts`
populated with 10 fictional scam platforms (marketing/demo data, no real research
backing). These platforms — and a separate hardcoded map in
`app/api/scam-check/route.ts` — created false-positive scam attributions that
were publicly indexed on `ledgerhound.vip/scam-database/platform/*`.

The most critical case: **`0x56eddb7aa87536c09ccc2793473599fd21a8b17f`** was
falsely labeled "CryptoYield Platform — Ponzi scheme — $4.18M losses — 800+
victims" while in reality this is a **public Binance hot wallet**. This was a
direct defamation risk against Binance and against the credibility of
LedgerHound as a forensic service.

The cleanup deleted all 22 fabricated entries (10 platforms + 9 ETH addresses +
8 TRON addresses + 3 BSC addresses + 2 darknet/ransomware + 1 placeholder) plus
24 corresponding S3 objects.

## Audit trail — do not re-add without verification

If any of these addresses **later** turn out to be genuine scam wallets via a
legitimate source (Etherscan tag, OFAC SDN, Chainabuse report, on-chain
forensic analysis, court filing), re-add them through
`lib/scam-db-verified-seed.ts` **with a full evidence chain**:

1. Real on-chain evidence (TXIDs, blockchain analysis)
2. External corroborating source (link to Etherscan tag / OFAC entry / etc.)
3. Documented research process (link to `docs/scam-research/<slug>.md`)

## Removed entries

### ETH addresses — fabricated SEED platforms (Tier A, 9 addresses)

| Address | Original false label / "Platform" | Real identity (where known) |
|---|---|---|
| `0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b` | "Reported Scam Address" / "CryptoTrade Pro pig_butchering" | Unverified — random-looking address |
| `0x3cffd56b47b7b41c56258d9c7731abadc360e460` | "Pig Butchering Scam" / "BitInvestment Club" | Unverified |
| `0x19aa5fe80d33a56d56c78e82ea5e50e5d80b4dff` | "Fake Exchange Scam" / "MetaTrader Crypto Pro" | Unverified |
| `0xef3a930e1ffffffacd2b664822cb7d1c51e0c36e` | "Phishing Wallet" / "CoinBase Pro Trade" | Pattern `1ffffff` suggests crafted address |
| `0x707012c9cf97c4c3a481603f98d593ecd3a44621` | "Romance Scam Collector" / "BTC Cloud Mining Pro" | Unverified |
| `0x56eddb7aa87536c09ccc2793473599fd21a8b17f` | "Investment Fraud" / "CryptoYield Platform Ponzi $4.18M" | ⚠ **Public Binance hot wallet** |
| `0x39d908dac893cbcb53cc86e0ecc369aa4def1a29` | "Pig Butchering Network" / "CryptoFX Global Markets" | Unverified |
| `0x0681d8db095565fe8a346fa0277bffde9c0edbbf` | "Address Poisoning Attacker" / "DeFi Yield Optimizer" | Unverified |
| `0xbad0000bad0000bad0000bad0000bad0000bad00` | "Known Scam Wallet" | ⚠ Obvious placeholder (vanity `bad000...`) |

### TRON addresses — fabricated SEED + scam-check (Tier B, 8 addresses)

| Address | Original false label |
|---|---|
| `TXF1yNp2yvUwUvSgzUSTfP8VFN5jAH5rzy` | "Pig Butchering TRON 1" / "CoinProfit AI" |
| `TDqVegmPEb3juFCkEMS9K94xVcNSc5EYAG` | "Pig Butchering TRON 2" / "TradingPro.ai" |
| `THMciKzTHCw2YHaUka8Cq8MQGhBYDttx7c` | "Pig Butchering TRON 3" |
| `TGzz8gjYiYRqpfmDwnLxfCAQasYZgqX9Bb` | "Fake Exchange TRON" |
| `TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT` | "USDT Scam Collector TRON" |
| `TVj7RNVHy6thbM7BWdSe9G6gXwKhjhdNZS` | "Romance Scam TRON" |
| `TJNhWi2sWrZWoFqMpoRWPSFkBqaDDNNiEi` | "Investment Fraud TRON" |
| `TLWBp82bGJuiFoFVS6RqQ7HM6Wf3cFNMXn` | "Approval Scam TRON" |

### BSC addresses — fabricated scam-check (Tier B, 3 addresses)

| Address | Original false label |
|---|---|
| `0x7e1116d3109f17bc5ec04c0d241ae637489e4ac2` | "BSC Rug Pull" |
| `0x9c2dc0c3cc2badde84b0025cf4df1c5af288d835` | "BSC Honeypot Deployer" |
| `0x6e47dfa22fe4c0e5cf7a24490e8eaab407d7f1d0` | "BSC Phishing" |

### ETH darknet/ransomware (Tier B, 2 addresses)

| Address | Original false label |
|---|---|
| `0x04786aada9deea2150deab7b3b8911c309f5ed90` | "Darknet Market Deposit" |
| `0x19f4f2f9f3daca875611c03ecf0a8c6e5c9d60e3` | "Ransomware Payment Collector" |

## Platforms removed (10)

| Slug | Name | Falsely-attributed loss |
|---|---|---|
| `cryptotrade-pro` | CryptoTrade Pro | $2.26M |
| `bitinvestment-club` | BitInvestment Club | $874k |
| `coinprofit-ai` | CoinProfit AI | $1.40M |
| `metatrader-crypto-pro` | MetaTrader Crypto Pro | $558k |
| `cryptoyield-platform` | CryptoYield Platform | $4.18M *(falsely tied to Binance hot wallet)* |
| `tradingproai` | TradingPro.ai | $780k |
| `coinbase-pro-trade` | CoinBase Pro Trade | $3.10M |
| `btc-cloud-mining-pro` | BTC Cloud Mining Pro | $6.70M |
| `cryptofx-global-markets` | CryptoFX Global Markets | $1.09M |
| `defi-yield-optimizer` | DeFi Yield Optimizer | $8.93M |

**Total fabricated "losses": ~$29.9M across ~882 fictional "victims" — none of which were real.**

## Cleanup actions performed

- ✅ Removed `SEED` array from `lib/scam-db.ts` (lines 561-572 in pre-cleanup version)
- ✅ Removed dependent code from `seedDatabase()` function (now reads from `lib/scam-db-verified-seed.ts`)
- ✅ Removed 9 ETH + 8 TRON + 3 BSC + 2 darknet entries from `app/api/scam-check/route.ts`
- ✅ Cleared `seedPlatformSlugs` in `app/sitemap.ts`
- ✅ Deleted 22 S3 objects under `scam-database/` (10 platforms + 10 address indexes + 2 indexes regenerated empty)
- ✅ Added 60 redirects to `next.config.js` (10 slugs × 6 locales → `/scam-database`)
- ✅ Backup saved to `./backups/scam-db-pre-cleanup-2026-05-20/` + `scam-db-backup-2026-05-20.tar.gz` (NOT committed to git)

## Next steps

1. **Submit URL removal request** to Google Search Console for prefix
   `https://ledgerhound.vip/scam-database/platform/` — removes indexed
   fabricated URLs within hours (the 301 redirects handle long-term).
2. **Phase 4** of report-v2 will populate `lib/scam-db-verified-seed.ts`
   with the first verified entry (DZHLWK FINTECH LTD from case LH-MPD8HYCY).

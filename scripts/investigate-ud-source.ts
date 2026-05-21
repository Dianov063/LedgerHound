/**
 * Investigation 1: where does "UD" / Lisu spoof come from?
 *
 * Strategy:
 *   1. Public Etherscan API → token transfers for Elayne wallet.
 *      (No key required for low-volume reads.) Etherscan reads
 *      `symbol()` directly from the token contract, so this is the
 *      canonical source-of-truth for what the contract reports.
 *   2. For any transfer with a non-ASCII symbol OR a suspiciously short
 *      symbol (≤3 chars, not in the well-known list), print the raw
 *      symbol + codepoints + contract address + tx hash so we can compare
 *      to what our Alchemy-fed pipeline currently sees ("UD" in the PDF).
 *
 * Run: npx tsx scripts/investigate-ud-source.ts
 */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const ELAYNE = '0xbc8996a9a5ff12ebf8702e857cc0faa451dc9569';

interface EtherscanErc20Transfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
}

const KNOWN_SHORT_OK = new Set(['ETH', 'BNB', 'BTC', 'DAI', 'UNI', 'AVE', 'GRT', 'OP', 'ARB', 'MNT', 'TRX', 'SOL', 'XRP', 'LTC', 'BCH', 'ADA', 'XLM', 'XMR', 'DOT', 'EUR', 'USD']);

function codepoints(s: string): string {
  return Array.from(s)
    .map((c) => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`)
    .join(' ');
}

function hasNonAscii(s: string): boolean {
  return /[^\x00-\x7F]/.test(s);
}

async function fetchEtherscan(): Promise<EtherscanErc20Transfer[]> {
  // Use Blockscout (eth.blockscout.com) which mirrors mainnet and exposes
  // an Etherscan-v1-compatible API without auth. The schema returned is
  // close enough that we can reuse the EtherscanErc20Transfer shape.
  // Authoritative source — Blockscout reads `symbol()` from the contract
  // and returns its raw output.
  const url =
    `https://eth.blockscout.com/api?module=account&action=tokentx` +
    `&address=${ELAYNE}` +
    `&startblock=0&endblock=99999999&sort=asc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Blockscout HTTP ${res.status}`);
  const data = await res.json();
  if (data.status === '0' && data.message !== 'OK') {
    throw new Error(`Blockscout error: ${data.message} / ${data.result}`);
  }
  return Array.isArray(data.result) ? data.result : [];
}

async function main() {
  console.log('═'.repeat(70));
  console.log('  Investigation 1: where does "UD" come from?');
  console.log(`  Subject: ${ELAYNE}`);
  console.log('═'.repeat(70));
  console.log();

  let transfers: EtherscanErc20Transfer[];
  try {
    transfers = await fetchEtherscan();
  } catch (e: any) {
    console.error('Etherscan fetch failed:', e?.message || e);
    process.exit(1);
  }

  console.log(`Total ERC-20 transfers fetched: ${transfers.length}`);
  console.log();

  // Group by (tokenSymbol, contractAddress) so we count distinct tokens.
  const byKey = new Map<string, {
    tokenSymbol: string;
    tokenName: string;
    contractAddress: string;
    occurrences: number;
    firstHash: string;
    firstTime: string;
    senders: Set<string>;
  }>();

  for (const t of transfers) {
    const key = `${t.tokenSymbol}|${t.contractAddress.toLowerCase()}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.occurrences += 1;
      existing.senders.add(t.from.toLowerCase());
    } else {
      byKey.set(key, {
        tokenSymbol: t.tokenSymbol,
        tokenName: t.tokenName,
        contractAddress: t.contractAddress.toLowerCase(),
        occurrences: 1,
        firstHash: t.hash,
        firstTime: new Date(Number(t.timeStamp) * 1000).toISOString(),
        senders: new Set([t.from.toLowerCase()]),
      });
    }
  }

  // Surface anything suspicious.
  console.log('─ Suspicious tokens (non-ASCII symbol OR short non-standard) ─');
  console.log();

  let suspectCount = 0;
  for (const entry of Array.from(byKey.values()).sort((a, b) => b.occurrences - a.occurrences)) {
    const sym = entry.tokenSymbol;
    const nonAscii = hasNonAscii(sym);
    const shortOdd = sym.length > 0 && sym.length <= 3 && !KNOWN_SHORT_OK.has(sym.toUpperCase());
    if (!nonAscii && !shortOdd) continue;

    suspectCount += 1;
    console.log(`  symbol (raw):       ${JSON.stringify(sym)}`);
    console.log(`  symbol codepoints:  ${codepoints(sym)}`);
    console.log(`  tokenName:          ${JSON.stringify(entry.tokenName)}`);
    console.log(`  contract:           ${entry.contractAddress}`);
    console.log(`  occurrences:        ${entry.occurrences}`);
    console.log(`  distinct senders:   ${entry.senders.size}`);
    console.log(`  first tx:           ${entry.firstHash}`);
    console.log(`  first time:         ${entry.firstTime}`);
    console.log(`  etherscan:          https://etherscan.io/tx/${entry.firstHash}`);
    console.log(`  flags: ${[nonAscii && 'non-ASCII', shortOdd && 'short-non-standard'].filter(Boolean).join(', ')}`);
    console.log();
  }

  console.log(`Suspicious symbol groups: ${suspectCount}`);
  console.log(`Total distinct (symbol, contract) pairs: ${byKey.size}`);
  console.log();

  // For comparison: list ALL distinct symbols seen (so we can compare to the
  // "HEX, UD" string in the existing production PDF).
  console.log('─ All distinct token symbols seen (Etherscan view) ─');
  const allSymbols = Array.from(new Set(Array.from(byKey.values()).map((e) => e.tokenSymbol)));
  console.log(`  ${allSymbols.length} unique: ${allSymbols.map((s) => JSON.stringify(s)).join(', ')}`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});

/**
 * Verify that the hardcoded scam-check map no longer contains fabricated entries.
 * Reads app/api/scam-check/route.ts as source and asserts removed addresses
 * are absent. Pure static check — no server required.
 *
 * Run: npx tsx scripts/verify-scam-check-cleanup.ts
 */

import fs from 'fs';
import path from 'path';

const REMOVED_ETH = [
  '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b',
  '0x3cffd56b47b7b41c56258d9c7731abadc360e460',
  '0x19aa5fe80d33a56d56c78e82ea5e50e5d80b4dff',
  '0xef3a930e1ffffffacd2b664822cb7d1c51e0c36e',
  '0x707012c9cf97c4c3a481603f98d593ecd3a44621',
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f',
  '0x39d908dac893cbcb53cc86e0ecc369aa4def1a29',
  '0x0681d8db095565fe8a346fa0277bffde9c0edbbf',
  '0xbad0000bad0000bad0000bad0000bad0000bad00',
  '0x04786aada9deea2150deab7b3b8911c309f5ed90',
  '0x19f4f2f9f3daca875611c03ecf0a8c6e5c9d60e3',
  '0x7e1116d3109f17bc5ec04c0d241ae637489e4ac2',
  '0x9c2dc0c3cc2badde84b0025cf4df1c5af288d835',
  '0x6e47dfa22fe4c0e5cf7a24490e8eaab407d7f1d0',
];
const REMOVED_TRON = [
  'TXF1yNp2yvUwUvSgzUSTfP8VFN5jAH5rzy',
  'TDqVegmPEb3juFCkEMS9K94xVcNSc5EYAG',
  'THMciKzTHCw2YHaUka8Cq8MQGhBYDttx7c',
  'TGzz8gjYiYRqpfmDwnLxfCAQasYZgqX9Bb',
  'TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT',
  'TVj7RNVHy6thbM7BWdSe9G6gXwKhjhdNZS',
  'TJNhWi2sWrZWoFqMpoRWPSFkBqaDDNNiEi',
  'TLWBp82bGJuiFoFVS6RqQ7HM6Wf3cFNMXn',
];

const ALSO_FORBIDDEN = ['CryptoYield', 'CryptoTrade Pro', 'BitInvestment Club'];

const SOURCE = fs.readFileSync(
  path.join(process.cwd(), 'app/api/scam-check/route.ts'),
  'utf-8',
);

let fail = 0;
let pass = 0;

console.log('Checking app/api/scam-check/route.ts...');
console.log();

for (const addr of [...REMOVED_ETH, ...REMOVED_TRON]) {
  // Match within string literal context — addresses appearing as KEYS in the map
  const re = new RegExp(`['"]${addr.replace(/[.*+?^${}()|[\\\]]/g, '\\$&')}['"]\\s*:`, 'i');
  if (re.test(SOURCE)) {
    console.log(`❌ Address STILL in scam-check map: ${addr}`);
    fail++;
  } else {
    pass++;
  }
}

// Also check the SEED platform names are gone from scam-db.ts
const SCAM_DB = fs.readFileSync(
  path.join(process.cwd(), 'lib/scam-db.ts'),
  'utf-8',
);

for (const name of ALSO_FORBIDDEN) {
  // Should appear ONLY in audit comment, never in data
  const allMatches = (SCAM_DB.match(new RegExp(name, 'gi')) || []).length;
  // The cleanup comment in scam-db.ts mentions CryptoYield/CryptoTrade Pro/BitInvestment Club — that's OK.
  // Anything more than 1-2 mentions = data still there.
  if (allMatches > 2) {
    console.log(`❌ "${name}" appears ${allMatches} times in lib/scam-db.ts (expected ≤ 2 — only in cleanup audit comment)`);
    fail++;
  } else {
    pass++;
  }
}

console.log();
console.log('═'.repeat(70));
console.log(`Result: ${pass} pass / ${fail} fail`);
console.log(`(Expected: ${REMOVED_ETH.length + REMOVED_TRON.length + ALSO_FORBIDDEN.length} pass, 0 fail)`);
console.log('═'.repeat(70));
process.exit(fail > 0 ? 1 : 0);

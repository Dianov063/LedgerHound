/**
 * One-shot refactor: replace `title:` + `description:` (and `keywords:`) inside
 * makeMetadata() calls with the new `metadataKey:` API.
 *
 * Run with: node scripts/refactor-metadata-calls.js
 *
 * Strategy:
 *  - Scan every file containing `makeMetadata(`
 *  - Read the existing `path: '...'` value
 *  - Look up the corresponding metadataKey
 *  - If found → strip title/description/keywords lines and inject metadataKey
 *  - If not found → leave the file alone (legacy raw strings keep working)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// path → metadataKey mapping
const PATH_TO_KEY = {
  '': 'home',
  '/about': 'about',
  '/pricing': 'pricing',
  '/services': 'services.index',
  '/services/crypto-tracing': 'services.cryptoTracing',
  '/services/romance-scams': 'services.romanceScams',
  '/services/divorce-crypto': 'services.divorceCrypto',
  '/services/litigation': 'services.litigation',
  '/services/corporate-fraud': 'services.corporateFraud',
  '/cases': 'cases',
  '/contact': 'contact',
  '/blog': 'blog.index',
  '/wallet-tracker': 'tools.walletTracker',
  '/graph-tracer': 'tools.graphTracer',
  '/recovery-calculator': 'tools.recoveryCalculator',
  '/scam-checker': 'tools.scamChecker',
  '/tx-lookup': 'tools.txLookup',
  '/tools/exchange-letter': 'tools.exchangeLetter',
  '/scam-database': 'scamDatabase.index',
  '/scam-database/report': 'scamDatabase.report',
  '/report': 'report',
  '/free-evaluation': 'freeEvaluation',
  '/emergency': 'emergency',
  '/investigators': 'investigators.index',
  '/join-network': 'joinNetwork',
  '/legal/investigator-agreement': 'legal.investigatorAgreement',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/disclaimer': 'disclaimer',
};

// List all files that import makeMetadata (recursive walk of app/)
function walkApp(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkApp(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const allFiles = walkApp(path.join(process.cwd(), 'app'));
const files = allFiles
  .filter((f) => fs.readFileSync(f, 'utf-8').includes('makeMetadata'))
  .map((f) => path.relative(process.cwd(), f).replace(/\\/g, '/'));

let updated = 0;
let skipped = 0;
let unmapped = [];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  const original = fs.readFileSync(filePath, 'utf-8');

  // Find makeMetadata({ ... }) call — match the call body
  const callRe = /makeMetadata\(\s*\{([\s\S]*?)\}\s*\)/g;

  const newSource = original.replace(callRe, (full, body) => {
    // Already uses metadataKey? skip
    if (/metadataKey\s*:/.test(body)) return full;

    // Extract path
    const pathMatch = body.match(/path\s*:\s*['"]([^'"]*)['"]/);
    if (!pathMatch) return full;
    const pathValue = pathMatch[1];

    const metadataKey = PATH_TO_KEY[pathValue];
    if (!metadataKey) {
      unmapped.push({ file, path: pathValue });
      return full; // leave as-is, legacy fallback
    }

    // Strip title/description/keywords lines
    let newBody = body
      .replace(/^\s*title\s*:\s*[\s\S]*?,\s*$/gm, '')
      .replace(/^\s*description\s*:\s*[\s\S]*?,\s*$/gm, '')
      .replace(/^\s*keywords\s*:\s*\[[\s\S]*?\]\s*,?\s*$/gm, '')
      .replace(/\n\s*\n/g, '\n');

    // Inject metadataKey after path
    newBody = newBody.replace(
      /(path\s*:\s*['"][^'"]*['"]\s*,)/,
      `$1\n    metadataKey: '${metadataKey}',`,
    );

    return `makeMetadata({${newBody}})`;
  });

  if (newSource !== original) {
    fs.writeFileSync(filePath, newSource);
    updated++;
    console.log(`  ✓ ${file}`);
  } else {
    skipped++;
  }
}

console.log(`\n✅ Updated ${updated} files`);
console.log(`⏭  Skipped ${skipped} files (no change needed)`);
if (unmapped.length > 0) {
  console.log(`\n⚠️  ${unmapped.length} files have unmapped paths (kept as legacy raw strings):`);
  unmapped.forEach(({ file, path }) => console.log(`   ${file}: path="${path}"`));
}

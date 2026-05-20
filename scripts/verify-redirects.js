/**
 * Verify next.config.js redirects via static inspection.
 * Run: node scripts/verify-redirects.js
 */
const config = require('../next.config.js');

const FABRICATED_SLUGS = [
  'cryptotrade-pro', 'bitinvestment-club', 'coinprofit-ai', 'metatrader-crypto-pro',
  'cryptoyield-platform', 'tradingproai', 'coinbase-pro-trade', 'btc-cloud-mining-pro',
  'cryptofx-global-markets', 'defi-yield-optimizer',
];
const LOCALES = ['en', 'ru', 'es', 'zh', 'fr', 'ar'];

(async () => {
  const redirects = await config.redirects();
  const map = new Map(redirects.map(r => [r.source, r]));

  let pass = 0;
  let fail = 0;
  for (const slug of FABRICATED_SLUGS) {
    for (const locale of LOCALES) {
      const source = locale === 'en'
        ? `/scam-database/platform/${slug}`
        : `/${locale}/scam-database/platform/${slug}`;
      const expectedDest = locale === 'en' ? '/scam-database' : `/${locale}/scam-database`;
      const match = map.get(source);
      if (!match) {
        console.log(`❌ Missing redirect: ${source}`);
        fail++;
      } else if (!match.permanent) {
        console.log(`❌ Not 301 (permanent=false): ${source}`);
        fail++;
      } else if (match.destination !== expectedDest) {
        console.log(`❌ Wrong destination ${source} → ${match.destination} (expected ${expectedDest})`);
        fail++;
      } else {
        pass++;
      }
    }
  }
  console.log();
  console.log(`Result: ${pass} pass, ${fail} fail`);
  console.log(`(Expected: 60 pass, 0 fail)`);
  process.exit(fail > 0 ? 1 : 0);
})();

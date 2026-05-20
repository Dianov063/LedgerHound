const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

// ─── 2026-05-20 CLEANUP: fabricated scam-database platforms ───
// 10 fabricated slugs were removed from the codebase + S3.
// These slugs were publicly indexed by Google with false defamatory content.
// 301 → /scam-database for all 6 locales (60 redirects total) to:
//   - Preserve link equity
//   - Signal Google that content is gone
//   - Avoid 404s on previously-indexed URLs
// See docs/removed-fabricated-entries.md for full context.
const FABRICATED_PLATFORM_SLUGS = [
  'cryptotrade-pro',
  'bitinvestment-club',
  'coinprofit-ai',
  'metatrader-crypto-pro',
  'cryptoyield-platform',
  'tradingproai',
  'coinbase-pro-trade',
  'btc-cloud-mining-pro',
  'cryptofx-global-markets',
  'defi-yield-optimizer',
];

const SUPPORTED_LOCALES = ['ru', 'es', 'zh', 'fr', 'ar'];

const fabricatedPlatformRedirects = [
  // English (root): /scam-database/platform/<slug> → /scam-database
  ...FABRICATED_PLATFORM_SLUGS.map((slug) => ({
    source: `/scam-database/platform/${slug}`,
    destination: '/scam-database',
    permanent: true,
  })),
  // Other locales: /<locale>/scam-database/platform/<slug> → /<locale>/scam-database
  ...FABRICATED_PLATFORM_SLUGS.flatMap((slug) =>
    SUPPORTED_LOCALES.map((locale) => ({
      source: `/${locale}/scam-database/platform/${slug}`,
      destination: `/${locale}/scam-database`,
      permanent: true,
    })),
  ),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  async redirects() {
    return [
      // ─── /en/* → /* ───
      // localePrefix: 'as-needed' means English uses the root URL (no /en prefix).
      // /en and /en/* are not real routes — collapse them to root to prevent
      // duplicate-content signals and the "Page with redirect" GSC warning.
      {
        source: '/en',
        destination: '/',
        permanent: true,
      },
      {
        source: '/en/:path*',
        destination: '/:path*',
        permanent: true,
      },
      // ─── Fabricated scam-db platforms (10 slugs × 6 locales = 60 redirects) ───
      ...fabricatedPlatformRedirects,
      // ─── Legacy redirects for non-existent blog posts (GSC 404s) ───
      // TODO(2026-06-09): Remove these after Google has had 30+ days to recrawl.
      // Cross-links to these slugs were removed from internal pages on 2026-05-09;
      // these redirects only catch old external bookmarks / Google cache hits.
      {
        source: '/blog/how-crypto-scammers-launder-money',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/blog/crypto-ransomware-payment-tracing',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/:locale/blog/how-crypto-scammers-launder-money',
        destination: '/:locale/blog',
        permanent: true,
      },
      {
        source: '/:locale/blog/crypto-ransomware-payment-tracing',
        destination: '/:locale/blog',
        permanent: true,
      },
      {
        source: '/blog/crypto-divorce-hidden-assets',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/:locale/blog/crypto-divorce-hidden-assets',
        destination: '/:locale/blog',
        permanent: true,
      },
      // Old scam-database slug pattern → new platform/ pattern
      {
        source: '/scam-database/is-:slug-a-scam',
        destination: '/scam-database/platform/:slug',
        permanent: true,
      },
      {
        source: '/:locale/scam-database/is-:slug-a-scam',
        destination: '/:locale/scam-database/platform/:slug',
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);

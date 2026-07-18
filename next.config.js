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
const ALL_LOCALES = ['en', ...SUPPORTED_LOCALES];

const LEGACY_BLOG_SLUGS = [
  'how-crypto-scammers-launder-money',
  'crypto-ransomware-payment-tracing',
  'crypto-divorce-hidden-assets',
];

const fabricatedPlatformRedirects = [
  // English (root): /scam-database/platform/<slug> → /scam-database
  ...FABRICATED_PLATFORM_SLUGS.map((slug) => ({
    source: `/scam-database/platform/${slug}`,
    destination: '/scam-database',
    permanent: true,
  })),
  // Explicit /en cleanup before the broad /en/* canonical redirect runs.
  ...FABRICATED_PLATFORM_SLUGS.map((slug) => ({
    source: `/en/scam-database/platform/${slug}`,
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

const fabricatedOldPatternRedirects = [
  ...FABRICATED_PLATFORM_SLUGS.flatMap((slug) =>
    ALL_LOCALES.map((locale) => ({
      source:
        locale === 'en'
          ? `/scam-database/is-${slug}-a-scam`
          : `/${locale}/scam-database/is-${slug}-a-scam`,
      destination: locale === 'en' ? '/scam-database' : `/${locale}/scam-database`,
      permanent: true,
    })),
  ),
  // Some Google-discovered URLs include /en even though English is served at root.
  ...FABRICATED_PLATFORM_SLUGS.map((slug) => ({
    source: `/en/scam-database/is-${slug}-a-scam`,
    destination: '/scam-database',
    permanent: true,
  })),
];

const legacyBlogRedirects = LEGACY_BLOG_SLUGS.flatMap((slug) => [
  {
    source: `/blog/${slug}`,
    destination: '/blog',
    permanent: true,
  },
  {
    source: `/en/blog/${slug}`,
    destination: '/blog',
    permanent: true,
  },
  ...SUPPORTED_LOCALES.map((locale) => ({
    source: `/${locale}/blog/${slug}`,
    destination: `/${locale}/blog`,
    permanent: true,
  })),
]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  async redirects() {
    return [
      // Direct one-hop fixes for old indexed URLs. Keep these before the broad
      // /en/* canonicalization and before the generic old slug pattern below.
      ...fabricatedOldPatternRedirects,
      ...legacyBlogRedirects,
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

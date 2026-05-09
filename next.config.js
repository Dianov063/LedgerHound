const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

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

const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  async redirects() {
    return [
      // 301 redirects for non-existent blog posts (GSC 404s)
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

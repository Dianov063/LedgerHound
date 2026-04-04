import { MetadataRoute } from 'next';
import { locales } from '@/i18n';

const baseUrl = 'https://www.ledgerhound.vip';

const pages = [
  { path: '', priority: 1.0, changeFreq: 'weekly' },
  { path: '/services', priority: 0.9, changeFreq: 'weekly' },
  { path: '/services/crypto-tracing', priority: 0.9, changeFreq: 'weekly' },
  { path: '/services/romance-scams', priority: 0.9, changeFreq: 'weekly' },
  { path: '/services/divorce-crypto', priority: 0.8, changeFreq: 'weekly' },
  { path: '/services/litigation', priority: 0.8, changeFreq: 'weekly' },
  { path: '/services/corporate-fraud', priority: 0.8, changeFreq: 'weekly' },
  { path: '/cases', priority: 0.8, changeFreq: 'monthly' },
  { path: '/pricing', priority: 0.9, changeFreq: 'monthly' },
  { path: '/about', priority: 0.7, changeFreq: 'monthly' },
  { path: '/blog', priority: 0.8, changeFreq: 'daily' },
  { path: '/contact', priority: 0.7, changeFreq: 'monthly' },
  { path: '/free-evaluation', priority: 1.0, changeFreq: 'weekly' },
  { path: '/wallet-tracker', priority: 0.9, changeFreq: 'weekly' },
  { path: '/graph-tracer', priority: 0.9, changeFreq: 'weekly' },
];

const blogPosts = [
  '/blog/how-to-trace-stolen-bitcoin',
  '/blog/pig-butchering-scam-recovery',
  '/blog/crypto-divorce-hidden-assets',
  '/blog/blockchain-evidence-court',
  '/blog/how-crypto-scammers-launder-money',
  '/blog/fake-crypto-trading-platforms-2026',
  '/blog/crypto-ransomware-payment-tracing',
  '/blog/subpoena-crypto-exchange',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    for (const locale of locales) {
      const localePath = locale === 'en' ? '' : `/${locale}`;
      urls.push({
        url: `${baseUrl}${localePath}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFreq as any,
        priority: page.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              `${baseUrl}${l === 'en' ? '' : `/${l}`}${page.path}`,
            ])
          ),
        },
      });
    }
  }

  // Published blog posts — all locales with hreflang
  const publishedPosts = [
    '/blog/how-to-trace-stolen-bitcoin',
    '/blog/pig-butchering-scam-recovery',
  ];

  for (const post of publishedPosts) {
    for (const locale of locales) {
      const localePath = locale === 'en' ? '' : `/${locale}`;
      urls.push({
        url: `${baseUrl}${localePath}${post}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              `${baseUrl}${l === 'en' ? '' : `/${l}`}${post}`,
            ])
          ),
        },
      });
    }
  }

  // Placeholder blog posts (English only for now)
  const placeholderPosts = blogPosts.filter((p) => !publishedPosts.includes(p));
  for (const post of placeholderPosts) {
    urls.push({
      url: `${baseUrl}${post}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return urls;
}

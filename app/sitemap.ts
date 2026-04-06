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
  { path: '/recovery-calculator', priority: 0.9, changeFreq: 'weekly' },
  { path: '/report', priority: 0.9, changeFreq: 'weekly' },
  { path: '/scam-checker', priority: 0.9, changeFreq: 'weekly' },
  { path: '/tx-lookup', priority: 0.9, changeFreq: 'weekly' },
  { path: '/privacy', priority: 0.3, changeFreq: 'yearly' },
  { path: '/terms', priority: 0.3, changeFreq: 'yearly' },
  { path: '/disclaimer', priority: 0.3, changeFreq: 'yearly' },
];

const blogPosts = [
  '/blog/usdt-trc20-scam-recovery-guide-2026',
  '/blog/how-to-identify-fake-crypto-trading-platform',
  '/blog/how-to-trace-stolen-bitcoin',
  '/blog/pig-butchering-scam-recovery',
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

  for (const post of blogPosts) {
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

  return urls;
}

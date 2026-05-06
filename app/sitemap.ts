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
  { path: '/investigators', priority: 0.8, changeFreq: 'weekly' },
  { path: '/join-network', priority: 0.7, changeFreq: 'monthly' },
  { path: '/legal/investigator-agreement', priority: 0.4, changeFreq: 'yearly' },
  { path: '/free-evaluation', priority: 1.0, changeFreq: 'weekly' },
  { path: '/wallet-tracker', priority: 0.9, changeFreq: 'weekly' },
  { path: '/graph-tracer', priority: 0.9, changeFreq: 'weekly' },
  { path: '/recovery-calculator', priority: 0.9, changeFreq: 'weekly' },
  { path: '/report', priority: 0.9, changeFreq: 'weekly' },
  { path: '/scam-checker', priority: 0.9, changeFreq: 'weekly' },
  { path: '/tx-lookup', priority: 0.9, changeFreq: 'weekly' },
  { path: '/scam-database', priority: 0.9, changeFreq: 'daily' },
  { path: '/scam-database/report', priority: 0.8, changeFreq: 'weekly' },
  { path: '/privacy', priority: 0.3, changeFreq: 'yearly' },
  { path: '/terms', priority: 0.3, changeFreq: 'yearly' },
  { path: '/disclaimer', priority: 0.3, changeFreq: 'yearly' },
];

const blogPosts = [
  '/blog/northeast-cartel-casinos-crypto-forensics-2026',
  '/blog/ai-fueling-crypto-fraud-irs-investigators-2026',
  '/blog/usdt-trc20-scam-recovery-guide-2026',
  '/blog/how-to-identify-fake-crypto-trading-platform',
  '/blog/how-to-trace-stolen-bitcoin',
  '/blog/pig-butchering-scam-recovery',
];

/* Seed platform slugs — always included even if S3 is unavailable at build time */
const seedPlatformSlugs = [
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

/* Try to fetch dynamic platforms from S3 at build time */
async function getDynamicPlatforms(): Promise<{ slug: string; lastReported?: string }[]> {
  try {
    const { getPlatformIndex } = await import('@/lib/scam-db');
    const platforms = await getPlatformIndex();
    if (platforms.length > 0) {
      return platforms.map(p => ({ slug: p.slug, lastReported: p.lastReported }));
    }
  } catch {
    // S3 not available at build time — fall back to seed list
  }
  return seedPlatformSlugs.map(slug => ({ slug }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];

  // Static pages
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

  // Blog posts
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

  // Investigator profile pages (dynamic from S3 + seed)
  try {
    const { listApproved } = await import('@/lib/investigators/storage');
    const investigators = await listApproved();
    for (const inv of investigators) {
      const path = `/investigators/${inv.id}`;
      for (const locale of locales) {
        const localePath = locale === 'en' ? '' : `/${locale}`;
        urls.push({
          url: `${baseUrl}${localePath}${path}`,
          lastModified: inv.updatedAt ? new Date(inv.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
          alternates: {
            languages: Object.fromEntries(
              locales.map((l) => [l, `${baseUrl}${l === 'en' ? '' : `/${l}`}${path}`]),
            ),
          },
        });
      }
    }
  } catch (err) {
    console.warn('[sitemap] Failed to load investigators:', err);
  }

  // Scam database platform pages (dynamic from S3 + seed fallback)
  const dynamicPlatforms = await getDynamicPlatforms();
  for (const { slug, lastReported } of dynamicPlatforms) {
    const path = `/scam-database/platform/${slug}`;
    for (const locale of locales) {
      const localePath = locale === 'en' ? '' : `/${locale}`;
      urls.push({
        url: `${baseUrl}${localePath}${path}`,
        lastModified: lastReported ? new Date(lastReported) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [
              l,
              `${baseUrl}${l === 'en' ? '' : `/${l}`}${path}`,
            ])
          ),
        },
      });
    }
  }

  return urls;
}

import { MetadataRoute } from 'next';
import { locales } from '@/i18n';
import { BLOG_POSTS } from '@/lib/blog/posts';

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

// Blog posts are read from single source of truth in lib/blog/posts.ts
// to keep sitemap, blog index, and related-posts in sync.
const blogPosts = BLOG_POSTS.map((p) => `/blog/${p.slug}`);

/* Seed platform slugs — always included even if S3 is unavailable at build time.
 *
 * 2026-05-20 CLEANUP: removed 10 fabricated slugs that pointed to non-existent
 * platforms (defamation risk). Sitemap now derives platforms exclusively from
 * S3 at build time. If S3 is unavailable, no fabricated URLs are emitted —
 * better to skip platforms than to mis-index. See docs/removed-fabricated-entries.md.
 */
const seedPlatformSlugs: string[] = [];

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

/**
 * Build the alternates.languages map for a given path, including x-default.
 * Google requires x-default to indicate the fallback locale (here: English root).
 */
function buildLanguages(pathname: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of locales) {
    map[l] = `${baseUrl}${l === 'en' ? '' : `/${l}`}${pathname}`;
  }
  map['x-default'] = `${baseUrl}${pathname}`;
  return map;
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
        alternates: { languages: buildLanguages(page.path) },
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
        alternates: { languages: buildLanguages(post) },
      });
    }
  }

  // Investigator profile pages (dynamic from S3 + seed)
  try {
    const { listApproved } = await import('@/lib/investigators/storage');
    const investigators = await listApproved();
    for (const inv of investigators) {
      const profilePath = `/investigators/${inv.id}`;
      for (const locale of locales) {
        const localePath = locale === 'en' ? '' : `/${locale}`;
        urls.push({
          url: `${baseUrl}${localePath}${profilePath}`,
          lastModified: inv.updatedAt ? new Date(inv.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
          alternates: { languages: buildLanguages(profilePath) },
        });
      }
    }
  } catch (err) {
    console.warn('[sitemap] Failed to load investigators:', err);
  }

  // Scam database platform pages (dynamic from S3 + seed fallback)
  const dynamicPlatforms = await getDynamicPlatforms();
  for (const { slug, lastReported } of dynamicPlatforms) {
    const platformPath = `/scam-database/platform/${slug}`;
    for (const locale of locales) {
      const localePath = locale === 'en' ? '' : `/${locale}`;
      urls.push({
        url: `${baseUrl}${localePath}${platformPath}`,
        lastModified: lastReported ? new Date(lastReported) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: { languages: buildLanguages(platformPath) },
      });
    }
  }

  return urls;
}

import { getAllBlogPosts, type BlogPostMeta } from './posts';

export interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogPostMeta['category'];
  readMinutes: number;   // localized at render via t('blog.min_read', {count})
  date: string;          // ISO YYYY-MM-DD, localized at render via Intl.DateTimeFormat
}

/**
 * Returns N relevant posts, excluding the current one.
 * Priority: same category first → then most recent.
 * Guarantees all returned posts exist (no dead links possible).
 */
export function getRelatedPosts(
  currentSlug: string,
  locale: string = 'en',
  count: number = 3,
): RelatedPost[] {
  const all = getAllBlogPosts(locale);
  const current = all.find((p) => p.slug === currentSlug);

  // Exclude current
  const candidates = all.filter((p) => p.slug !== currentSlug);

  // Prefer same category first, then others — preserve array order (newest first)
  let ranked: BlogPostMeta[];
  if (current?.category) {
    const sameCat = candidates.filter((p) => p.category === current.category);
    const others = candidates.filter((p) => p.category !== current.category);
    ranked = [...sameCat, ...others];
  } else {
    ranked = candidates;
  }

  return ranked.slice(0, count).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    readMinutes: p.readMinutes,
    date: p.date,
  }));
}

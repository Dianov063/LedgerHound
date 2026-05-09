/**
 * Updater for lib/blog/posts.ts — the single source of truth for blog posts.
 * Inserts a new entry at the TOP of the BLOG_POSTS array.
 *
 * After this update:
 *   - Blog index (app/[locale]/blog/page.tsx) picks it up automatically (it imports BLOG_POSTS)
 *   - Sitemap (app/sitemap.ts) picks it up automatically
 *   - Related-posts helper (lib/blog/get-related-posts.ts) picks it up automatically
 */

import type { BlogArticle } from './schema';

function escapeStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Insert a new blog post entry at the top of BLOG_POSTS in lib/blog/posts.ts.
 * Pattern matched: `export const BLOG_POSTS: BlogPostMeta[] = [\n`
 */
export function updateBlogIndex(source: string, article: BlogArticle): string {
  const newEntry = `  {
    slug: '${escapeStr(article.slug)}',
    category: '${escapeStr(article.category)}',
    title: '${escapeStr(article.title)}',
    excerpt: '${escapeStr(article.excerpt)}',
    date: '${escapeStr(article.date)}',
    readTime: '${escapeStr(article.readTime)}',
    featured: true,
  },`;

  // Find the BLOG_POSTS array opening
  const re = /(export\s+const\s+BLOG_POSTS\s*:\s*BlogPostMeta\[\]\s*=\s*\[\s*\n)/;
  if (!re.test(source)) {
    throw new Error('Could not find BLOG_POSTS array in lib/blog/posts.ts');
  }

  // Check for duplicate slug
  const slugRe = new RegExp(`slug:\\s*['"]${article.slug}['"]`);
  if (slugRe.test(source)) {
    return source; // already exists, no-op
  }

  return source.replace(re, `$1${newEntry}\n`);
}

/**
 * @deprecated — sitemap now reads from BLOG_POSTS automatically.
 * Kept as a no-op for backward compatibility with publish API.
 */
export function updateSitemap(source: string, _article: BlogArticle): string {
  return source;
}

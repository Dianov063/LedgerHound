/**
 * Updaters for the blog list and sitemap source files.
 * Inserts a new entry at the TOP of the existing arrays — string manipulation,
 * because we don't have an AST parser available server-side.
 */

import type { BlogArticle } from './schema';

function escapeStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Insert a new blog post entry at the top of the blogPosts array
 * in app/[locale]/blog/page.tsx.
 *
 * Pattern matched: `const blogPosts = [\n  {\n    slug: ...`
 * Inserts a new entry right after the opening `[`.
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

  // Find the blogPosts array opening
  const re = /(const\s+blogPosts\s*=\s*\[\s*\n)/;
  if (!re.test(source)) {
    throw new Error('Could not find blogPosts array in blog index file');
  }

  // Check for duplicate slug
  const slugRe = new RegExp(`slug:\\s*['"]${article.slug}['"]`);
  if (slugRe.test(source)) {
    // Already exists — return source unchanged
    return source;
  }

  return source.replace(re, `$1${newEntry}\n`);
}

/**
 * Insert a new blog post slug at the top of the blogPosts array in app/sitemap.ts.
 * Pattern: `const blogPosts = [\n  '/blog/...'`
 */
export function updateSitemap(source: string, article: BlogArticle): string {
  const path = `/blog/${article.slug}`;

  // Check duplicate
  const dupRe = new RegExp(`['"]${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
  if (dupRe.test(source)) {
    return source;
  }

  const re = /(const\s+blogPosts\s*=\s*\[\s*\n)/;
  if (!re.test(source)) {
    throw new Error('Could not find blogPosts array in sitemap.ts');
  }
  return source.replace(re, `$1  '${path}',\n`);
}

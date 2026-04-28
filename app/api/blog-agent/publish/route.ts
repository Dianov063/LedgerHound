/**
 * POST /api/blog-agent/publish
 *
 * Body: { translations: BlogArticleTranslations }
 * Auth: x-admin-key header (matches ADMIN_PASSWORD env var)
 *
 * Generates all required TSX files and commits them atomically via GitHub API.
 * Vercel auto-deploys from the new commit.
 */

import logger from '@/lib/logger';
import { renderContentFile, contentComponentName } from '@/lib/blog-render/renderer';
import { renderPageFile, renderLayoutFile } from '@/lib/blog-render/templates';
import { updateBlogIndex, updateSitemap } from '@/lib/blog-render/updaters';
import { commitFiles, getFileContent } from '@/lib/github/commit';
import type { BlogArticle, BlogArticleTranslations, BlogLocale } from '@/lib/blog-render/schema';

export const maxDuration = 60;

const LOCALES: BlogLocale[] = ['en', 'ru', 'es', 'zh', 'fr', 'ar'];

function validateArticle(a: BlogArticle, locale: string): string | null {
  if (!a) return `${locale}: missing article`;
  if (!a.slug || !/^[a-z0-9-]+$/.test(a.slug)) return `${locale}: invalid slug`;
  if (!a.title) return `${locale}: missing title`;
  if (!a.excerpt) return `${locale}: missing excerpt`;
  if (!a.metaTitle) return `${locale}: missing metaTitle`;
  if (!a.metaDescription) return `${locale}: missing metaDescription`;
  if (!Array.isArray(a.intro) || a.intro.length === 0) return `${locale}: empty intro`;
  if (!Array.isArray(a.sections) || a.sections.length === 0) return `${locale}: empty sections`;
  if (!a.sources) return `${locale}: missing sources`;
  if (!a.category) return `${locale}: missing category`;
  if (!a.date) return `${locale}: missing date`;
  if (!a.readTime) return `${locale}: missing readTime`;
  return null;
}

function pascalCaseFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('') + 'Article';
}

export async function POST(request: Request) {
  // Auth
  const adminKey = request.headers.get('x-admin-key');
  if (!process.env.ADMIN_PASSWORD || adminKey !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Required env
  if (!process.env.GITHUB_TOKEN) {
    return Response.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 });
  }
  if (!process.env.GITHUB_REPO) {
    return Response.json({ error: 'GITHUB_REPO not configured (expected "owner/name")' }, { status: 500 });
  }

  let body: { translations?: BlogArticleTranslations };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const translations = body.translations;
  if (!translations) {
    return Response.json({ error: 'Missing translations' }, { status: 400 });
  }

  // Validate all locales present + structure
  for (const loc of LOCALES) {
    if (!translations[loc]) {
      return Response.json({ error: `Missing translation for locale: ${loc}` }, { status: 400 });
    }
    const err = validateArticle(translations[loc], loc);
    if (err) return Response.json({ error: `Validation: ${err}` }, { status: 400 });
  }

  // All locales must share the same slug
  const slug = translations.en.slug;
  for (const loc of LOCALES) {
    if (translations[loc].slug !== slug) {
      return Response.json({ error: `Slug mismatch in ${loc}: expected ${slug}, got ${translations[loc].slug}` }, { status: 400 });
    }
  }

  logger.info({ slug }, '[blog-publish] Starting publish');

  try {
    // 1. Render content/{locale}.tsx for each locale
    const contentFiles = LOCALES.map((loc) => ({
      path: `app/[locale]/blog/${slug}/content/${loc}.tsx`,
      content: renderContentFile(translations[loc], contentComponentName(loc)),
    }));

    // 2. Render page.tsx and layout.tsx (one each, shared across locales)
    const componentName = pascalCaseFromSlug(slug);
    const pageFile = {
      path: `app/[locale]/blog/${slug}/page.tsx`,
      content: renderPageFile(translations, componentName),
    };
    const layoutFile = {
      path: `app/[locale]/blog/${slug}/layout.tsx`,
      content: renderLayoutFile(translations),
    };

    // 3. Fetch existing blog index + sitemap, then patch them
    const [blogIndexSrc, sitemapSrc] = await Promise.all([
      getFileContent('app/[locale]/blog/page.tsx'),
      getFileContent('app/sitemap.ts'),
    ]);

    if (!blogIndexSrc) {
      return Response.json({ error: 'Could not fetch app/[locale]/blog/page.tsx from repo' }, { status: 500 });
    }
    if (!sitemapSrc) {
      return Response.json({ error: 'Could not fetch app/sitemap.ts from repo' }, { status: 500 });
    }

    const newBlogIndex = updateBlogIndex(blogIndexSrc, translations.en);
    const newSitemap = updateSitemap(sitemapSrc, translations.en);

    // 4. Commit all files atomically
    const allFiles = [
      ...contentFiles,
      pageFile,
      layoutFile,
      { path: 'app/[locale]/blog/page.tsx', content: newBlogIndex },
      { path: 'app/sitemap.ts', content: newSitemap },
    ];

    const result = await commitFiles({
      files: allFiles,
      message: `Add blog post: ${translations.en.title}\n\nGenerated by LedgerHound Blog Agent.\nSlug: ${slug}\nLocales: ${LOCALES.join(', ')}`,
    });

    logger.info({ slug, sha: result.sha }, '[blog-publish] Published');

    return Response.json({
      ok: true,
      slug,
      commit: { sha: result.sha, url: result.url },
      filesCount: allFiles.length,
      // URL will be live after Vercel deploys (~2 min)
      previewUrl: `https://www.ledgerhound.vip/blog/${slug}`,
    });
  } catch (err: any) {
    logger.error({ err: err.message, stack: err.stack }, '[blog-publish] Failed');
    return Response.json({ error: err.message || 'Publish failed' }, { status: 500 });
  }
}

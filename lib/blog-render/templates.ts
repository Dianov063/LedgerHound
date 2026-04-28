/**
 * Templates for the per-post page.tsx and layout.tsx files.
 * These are static wrappers that load the per-locale content components.
 */

import type { BlogArticle, BlogArticleTranslations } from './schema';

function escapeStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

/**
 * Generate the page.tsx file for a blog post.
 * The TOC, related posts, and structure follow the existing
 * pig-butchering-scam-recovery pattern.
 */
export function renderPageFile(
  translations: BlogArticleTranslations,
  componentName: string,
): string {
  const en = translations.en;

  // TOC: derived from EN sections (ids are the same across locales)
  const tocItems = en.sections
    .map((s) => `  { id: '${escapeStr(s.id)}', label: '${escapeStr(s.heading)}' }`)
    .join(',\n');

  // Related posts (slugs only — title/category/readTime resolved client-side)
  const related = (en.relatedSlugs || [])
    .slice(0, 3)
    .map((slug) => `  '${escapeStr(slug)}'`)
    .join(',\n');

  // Per-locale content imports + map
  const localeImports = (['en', 'ru', 'es', 'zh', 'fr', 'ar'] as const)
    .map((loc) => `import ContentEn${loc === 'en' ? '' : '_' + loc.toUpperCase()} from './content/${loc}';`)
    .map((line, i) => {
      const loc = (['en', 'ru', 'es', 'zh', 'fr', 'ar'] as const)[i];
      const cn = 'Content' + loc.charAt(0).toUpperCase() + loc.slice(1);
      return `import ${cn} from './content/${loc}';`;
    })
    .join('\n');

  const localeMap = (['en', 'ru', 'es', 'zh', 'fr', 'ar'] as const)
    .map((loc) => {
      const cn = 'Content' + loc.charAt(0).toUpperCase() + loc.slice(1);
      return `  ${loc}: ${cn},`;
    })
    .join('\n');

  // Locale-specific titles/categories/readtimes for header rendering
  const titleMap = (['en', 'ru', 'es', 'zh', 'fr', 'ar'] as const)
    .map((loc) => `  ${loc}: '${escapeStr(translations[loc].title)}'`)
    .join(',\n');

  const readTimeMap = (['en', 'ru', 'es', 'zh', 'fr', 'ar'] as const)
    .map((loc) => `  ${loc}: '${escapeStr(translations[loc].readTime)}'`)
    .join(',\n');

  return `'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight, Clock, Calendar, User, Tag, ChevronRight, Share2, Link2, Check, Shield } from 'lucide-react';
import { blogUI, type BlogLocale } from '@/lib/blog-translations';

import ContentEn from './content/en';
import ContentRu from './content/ru';
import ContentEs from './content/es';
import ContentZh from './content/zh';
import ContentFr from './content/fr';
import ContentAr from './content/ar';

const contentByLocale = {
  en: ContentEn,
  ru: ContentRu,
  es: ContentEs,
  zh: ContentZh,
  fr: ContentFr,
  ar: ContentAr,
};

const titleByLocale: Record<BlogLocale, string> = {
${titleMap},
};

const readTimeByLocale: Record<BlogLocale, string> = {
${readTimeMap},
};

const tocItems = [
${tocItems},
];

const relatedSlugs = [
${related},
];

const categoryColors: Record<string, string> = {
  Guide: 'bg-blue-50 text-blue-700 border-blue-100',
  Legal: 'bg-violet-50 text-violet-700 border-violet-100',
  'Case Study': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Education: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function ${componentName}() {
  const locale = useLocale() as BlogLocale;
  const base = locale === 'en' ? '' : \`/\${locale}\`;
  const ui = blogUI[locale] || blogUI.en;
  const Content = contentByLocale[locale] || ContentEn;
  const title = titleByLocale[locale] || titleByLocale.en;
  const readTime = readTimeByLocale[locale] || readTimeByLocale.en;

  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : '';

  const shareTwitter = () => {
    if (typeof window === 'undefined') return;
    window.open(\`https://twitter.com/intent/tweet?text=\${encodeURIComponent(title)}&url=\${encodeURIComponent(url)}\`, '_blank');
  };
  const shareLinkedIn = () => {
    if (typeof window === 'undefined') return;
    window.open(\`https://www.linkedin.com/sharing/share-offsite/?url=\${encodeURIComponent(url)}\`, '_blank');
  };
  const copyLink = async () => {
    if (typeof window === 'undefined') return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const category = '${escapeStr(en.category)}';
  const date = '${escapeStr(en.date)}';

  return (
    <>
      <Navbar />
      <article className="pt-28 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            <Link href={\`\${base}/\`} className="hover:text-brand-600">{ui.home}</Link>
            <ChevronRight size={12} />
            <Link href={\`\${base}/blog\`} className="hover:text-brand-600">{ui.blog}</Link>
            <ChevronRight size={12} />
            <span className="text-slate-600 truncate">{title}</span>
          </nav>

          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className={\`text-xs font-bold px-3 py-1.5 rounded-full border \${categoryColors[category] || categoryColors.Guide}\`}>
              {category}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1.5"><Clock size={12} />{readTime}</span>
          </div>

          <h1 className="font-display font-bold text-3xl lg:text-[2.75rem] lg:leading-tight text-slate-900 mb-5">
            {title}
          </h1>

          <div className="flex items-center gap-5 text-sm text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5"><User size={14} />{ui.author}</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} />{date}</span>
          </div>

          <div className="flex items-center gap-2 mt-6 flex-wrap">
            <button onClick={shareTwitter} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 text-slate-600 transition-colors">𝕏 Twitter</button>
            <button onClick={shareLinkedIn} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 text-slate-600 transition-colors">in LinkedIn</button>
            <button onClick={copyLink} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 text-slate-600 transition-colors flex items-center gap-1.5">
              {copied ? <><Check size={12} />{ui.copied}</> : <><Link2 size={12} />{ui.copyLink}</>}
            </button>
          </div>
        </div>
      </article>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{ui.tableOfContents}</p>
              <nav className="space-y-0.5">
                {tocItems.map((item) => (
                  <a key={item.id} href={\`#\${item.id}\`} className="block text-sm text-slate-500 hover:text-brand-600 py-1.5 border-l-2 border-transparent hover:border-brand-500 pl-3 transition-colors">
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-8 p-4 bg-brand-50 border border-brand-100 rounded-xl">
                <p className="text-xs font-bold text-brand-700 mb-1">{ui.needHelp}</p>
                <p className="text-xs text-slate-600 mb-3">{ui.needHelpDesc}</p>
                <Link href={\`\${base}/free-evaluation\`} className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
                  {ui.getFreeEvaluation} <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Article */}
          <div className="flex-1 max-w-3xl">
            <div className="prose prose-slate max-w-none prose-headings:font-display prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-800">
              <Content base={base} />
            </div>

            {/* Bottom CTA */}
            <div className="not-prose mt-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
              <Shield size={28} className="text-white mx-auto mb-3" />
              <h3 className="font-display font-bold text-2xl text-white mb-2">{ui.ctaTitle}</h3>
              <p className="text-brand-100 text-sm mb-5">{ui.ctaDesc}</p>
              <Link href={\`\${base}/free-evaluation\`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
                {ui.ctaBtn} <ArrowRight size={14} />
              </Link>
              <p className="text-brand-200 text-xs mt-3">{ui.phone}</p>
            </div>

            {/* Sources */}
            <div className="mt-10 pt-8 border-t border-slate-200">
              <p className="text-xs text-slate-400 italic">{${'`' + escapeStr(en.sources) + '`'}}</p>
              <p className="text-xs text-slate-400 italic mt-2">{ui.legalNote}</p>
            </div>

            {/* Share again */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 mr-1">{ui.shareArticle}:</span>
              <button onClick={shareTwitter} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 text-slate-600 transition-colors">𝕏 Twitter</button>
              <button onClick={shareLinkedIn} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 text-slate-600 transition-colors">in LinkedIn</button>
              <button onClick={copyLink} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 text-slate-600 transition-colors flex items-center gap-1.5">
                {copied ? <><Check size={12} />{ui.copied}</> : <><Link2 size={12} />{ui.copyLink}</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {relatedSlugs.length > 0 && (
        <div className="py-16 bg-slate-50 border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="font-display font-bold text-2xl text-slate-900 mb-6">{ui.relatedArticles}</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {relatedSlugs.map((slug) => (
                <Link key={slug} href={\`\${base}/blog/\${slug}\`} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-200 transition-colors block">
                  <p className="font-display font-bold text-slate-900 capitalize">{slug.replace(/-/g, ' ')}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
`;
}

/**
 * Generate the layout.tsx file for a blog post.
 * Sets per-locale metadata via makeMetadata helper.
 */
export function renderLayoutFile(translations: BlogArticleTranslations): string {
  const en = translations.en;

  // metaTitle / metaDescription / keywords map per locale
  const titleMap = (['en', 'ru', 'es', 'zh', 'fr', 'ar'] as const)
    .map((loc) => `  ${loc}: '${escapeStr(translations[loc].metaTitle)}'`)
    .join(',\n');
  const descMap = (['en', 'ru', 'es', 'zh', 'fr', 'ar'] as const)
    .map((loc) => `  ${loc}: '${escapeStr(translations[loc].metaDescription)}'`)
    .join(',\n');
  const keywordsArr = en.keywords.map((k) => `'${escapeStr(k)}'`).join(', ');

  return `import { makeMetadata } from '@/lib/metadata';

const titles: Record<string, string> = {
${titleMap},
};
const descriptions: Record<string, string> = {
${descMap},
};

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/blog/${escapeStr(en.slug)}',
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    keywords: [${keywordsArr}],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
`;
}

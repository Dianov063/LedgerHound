'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
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
  en: 'How New York AG\'s $5M Uphold Settlement Exposes Crypto Platform Liability',
  ru: 'Как урегулирование NY AG с Uphold на $5 млн раскрывает ответственность криптоплатформ',
  es: 'Cómo el Acuerdo de $5M de Uphold con la Fiscalía de Nueva York Expone la Responsabilidad de las Plataformas Cripto',
  zh: '纽约总检察长与Uphold达成500万美元和解，揭示加密平台责任',
  fr: 'Comment le règlement de 5 M$ entre le NY AG et Uphold expose la responsabilité des plateformes crypto',
  ar: 'كيف تكشف تسوية نيويورك بقيمة 5 ملايين دولار مع Uphold مسؤولية منصات العملات المشفرة',
};

const READ_MINUTES = 10;

const tocItems = [
  { id: 'what-happened', label: 'What the Uphold Settlement Actually Says' },
  { id: 'platform-liability', label: 'Platform Liability: The New Normal for Crypto Exchanges' },
  { id: 'cred-scam', label: 'The Cred Scam: A Case Study in Red Flags' },
  { id: 'due-diligence', label: 'What Exchanges Must Do Now: A Due Diligence Checklist' },
  { id: 'recovery', label: 'How to Recover Funds After a Platform-Linked Scam' },
  { id: 'regulatory-trends', label: 'Regulatory Trends: What\'s Coming Next' },
];

const relatedSlugs = [
  'how-to-identify-fake-crypto-trading-platform',
  'pig-butchering-scam-recovery',
  'usdt-trc20-scam-recovery-guide-2026',
];

const categoryColors: Record<string, string> = {
  Guide: 'bg-blue-50 text-blue-700 border-blue-100',
  Legal: 'bg-violet-50 text-violet-700 border-violet-100',
  'Case Study': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Education: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function NewYorkAgUpholdSettlementCryptoPlatformLiability2026Article() {
  const locale = useLocale() as BlogLocale;
  const base = locale === 'en' ? '' : `/${locale}`;
  const ui = blogUI[locale] || blogUI.en;
  const Content = contentByLocale[locale] || ContentEn;
  const title = titleByLocale[locale] || titleByLocale.en;
  const tBlog = useTranslations('blog');
  const readTime = tBlog('min_read', { count: READ_MINUTES });

  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : '';

  const shareTwitter = () => {
    if (typeof window === 'undefined') return;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
  };
  const shareLinkedIn = () => {
    if (typeof window === 'undefined') return;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };
  const copyLink = async () => {
    if (typeof window === 'undefined') return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const category = 'Legal';
  const date = '2026-05-19';

  return (
    <>
      <Navbar />
      <article className="pt-28 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            <Link href={`${base}/`} className="hover:text-brand-600">{ui.home}</Link>
            <ChevronRight size={12} />
            <Link href={`${base}/blog`} className="hover:text-brand-600">{ui.blog}</Link>
            <ChevronRight size={12} />
            <span className="text-slate-600 truncate">{title}</span>
          </nav>

          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${categoryColors[category] || categoryColors.Guide}`}>
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
                  <a key={item.id} href={`#${item.id}`} className="block text-sm text-slate-500 hover:text-brand-600 py-1.5 border-l-2 border-transparent hover:border-brand-500 pl-3 transition-colors">
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-8 p-4 bg-brand-50 border border-brand-100 rounded-xl">
                <p className="text-xs font-bold text-brand-700 mb-1">{ui.needHelp}</p>
                <p className="text-xs text-slate-600 mb-3">{ui.needHelpDesc}</p>
                <Link href={`${base}/free-evaluation`} className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
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
              <Link href={`${base}/free-evaluation`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
                {ui.ctaBtn} <ArrowRight size={14} />
              </Link>
              <p className="text-brand-200 text-xs mt-3">{ui.phone}</p>
            </div>

            {/* Sources */}
            <div className="mt-10 pt-8 border-t border-slate-200">
              <p className="text-xs text-slate-400 italic">{`Sources: [New York AG Secures Over $5M from Uphold - National Law Review](https://natlawreview.com/article/new-york-ag-secures-over-5m-crypto-platform-alleged-promotion-fraudulent-investment); [Robert Dunlap Sentenced to 23 Years for Meta 1 Coin Scam - Yahoo News Malaysia](https://malaysia.news.yahoo.com/robert-dunlap-sentenced-23-years-153051688.html); [FBI IC3 2025 Report](https://www.ic3.gov/); [SEC Enforcement Actions 2025](https://www.sec.gov/).`}</p>
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
                <Link key={slug} href={`${base}/blog/${slug}`} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-200 transition-colors block">
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

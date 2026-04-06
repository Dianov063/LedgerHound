'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ArrowRight,
  Clock,
  Calendar,
  User,
  Tag,
  ChevronRight,
  Share2,
  Link2,
  Check,
  Shield,
} from 'lucide-react';
import { blogUI, type BlogLocale } from '@/lib/blog-translations';
import ContentEn from './content/en';
import ContentRu from './content/ru';
import ContentEs from './content/es';
import ContentZh from './content/zh';
import ContentFr from './content/fr';
import ContentAr from './content/ar';

const contentByLocale: Record<string, React.ComponentType<{ base: string }>> = {
  en: ContentEn,
  ru: ContentRu,
  es: ContentEs,
  zh: ContentZh,
  fr: ContentFr,
  ar: ContentAr,
};

const tocItems = [
  { id: 'what-is', label: 'What Is a Pig Butchering Scam?' },
  { id: 'how-it-works', label: 'How They Work: The Full Playbook' },
  { id: 'who-are-scammers', label: 'Who Are the Scammers?' },
  { id: 'warning-signs', label: 'Warning Signs' },
  { id: 'what-to-do', label: 'What To Do If You\'ve Been Scammed' },
  { id: 'recovery', label: 'Can You Get Your Money Back?' },
  { id: 'law-enforcement', label: 'Law Enforcement Progress' },
  { id: 'getting-help', label: 'Getting Help' },
];

const relatedPosts = [
  {
    slug: 'how-to-trace-stolen-bitcoin',
    title: 'How to Trace Stolen Bitcoin: A Step-by-Step Overview',
    category: 'Guide',
    readTime: '8 min read',
  },
  {
    slug: 'how-crypto-scammers-launder-money',
    title: 'How Crypto Scammers Launder Money: Mixers, Chains, and Exchanges',
    category: 'Education',
    readTime: '10 min read',
  },
  {
    slug: 'fake-crypto-trading-platforms-2026',
    title: 'How to Identify a Fake Crypto Trading Platform in 2026',
    category: 'Guide',
    readTime: '7 min read',
  },
];

const categoryColors: Record<string, string> = {
  Guide: 'bg-blue-50 text-blue-700 border-blue-100',
  Legal: 'bg-violet-50 text-violet-700 border-violet-100',
  'Case Study': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Education: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function PigButcheringArticle() {
  const locale = useLocale() as BlogLocale;
  const base = locale === 'en' ? '' : `/${locale}`;
  const ui = blogUI[locale] || blogUI.en;
  const Content = contentByLocale[locale] || ContentEn;
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = 'Pig Butchering Scams in 2026: What They Are, How They Work, and What To Do';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="pt-28 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8">
            <Link href={base || '/'} className="hover:text-brand-600 transition-colors">{ui.home}</Link>
            <ChevronRight size={12} />
            <Link href={`${base}/blog`} className="hover:text-brand-600 transition-colors">{ui.blog}</Link>
            <ChevronRight size={12} />
            <span className="text-slate-600">Pig Butchering Scams</span>
          </nav>

          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100">
              Guide
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock size={11} /> 9 {ui.minRead}
            </span>
          </div>

          <h1 className="font-display font-bold text-3xl lg:text-[2.75rem] lg:leading-tight text-slate-900 mb-5">
            Pig Butchering Scams in 2026: What They Are, How They Work, and What To Do If You're a Victim
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <User size={14} /> {ui.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> March 15, 2026
            </span>
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-2 mt-6">
            <span className="text-xs text-slate-400 mr-1">{ui.shareArticle}</span>
            <button onClick={shareTwitter} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-3 py-1.5 rounded-full transition-colors">
              𝕏 Twitter
            </button>
            <button onClick={shareLinkedIn} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-3 py-1.5 rounded-full transition-colors">
              in LinkedIn
            </button>
            <button onClick={copyLink} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-3 py-1.5 rounded-full transition-colors">
              {copied ? <><Check size={12} className="text-emerald-500" /> {ui.copied}</> : <><Link2 size={12} /> {ui.copyLink}</>}
            </button>
          </div>
        </div>
      </div>

      {/* Content with sidebar TOC */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          {/* Sticky TOC - desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{ui.tableOfContents}</p>
              <nav className="space-y-1">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-slate-500 hover:text-brand-600 py-1.5 border-l-2 border-transparent hover:border-brand-500 pl-3 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-8 p-4 bg-brand-50 border border-brand-100 rounded-xl">
                <p className="text-xs font-bold text-brand-700 mb-2">{ui.needHelp}</p>
                <p className="text-xs text-brand-600 mb-3">{ui.needHelpDesc}</p>
                <Link
                  href={`${base}/free-evaluation`}
                  className="flex items-center justify-center gap-1.5 bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors w-full"
                >
                  {ui.getFreeEvaluation} <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Article */}
          <article className="flex-1 max-w-3xl">
            <div className="prose prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-800">
              <Content base={base} />
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
              <Shield className="mx-auto text-brand-200 mb-3" size={32} />
              <h3 className="font-display font-bold text-2xl text-white mb-2">{ui.ctaTitle}</h3>
              <p className="text-brand-100 text-sm mb-5 max-w-lg mx-auto">{ui.ctaDesc}</p>
              <Link
                href={`${base}/free-evaluation`}
                className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors"
              >
                {ui.ctaBtn} <ArrowRight size={16} />
              </Link>
              <p className="text-brand-200 text-xs mt-4">{ui.phone} · {ui.speakRussian}</p>
            </div>

            {/* Sources */}
            <div className="mt-10 pt-8 border-t border-slate-200">
              <p className="text-xs text-slate-400 italic">
                Sources: FBI IC3 2024 Annual Report, Chainalysis 2026 Crypto Crime Report, TRM Labs 2026 Crypto Crime Report, AMLBot Crypto Crime Report 2025–2026, FBI Operation Level Up.
              </p>
              <p className="text-xs text-slate-400 italic mt-2">
                LedgerHound is a blockchain forensics firm. We are not a law firm and do not provide legal advice. Forensic investigation services only.
              </p>
            </div>

            {/* Share again */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-3">
              <span className="text-sm text-slate-500">{ui.shareArticle}</span>
              <button onClick={shareTwitter} className="text-xs text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-3 py-1.5 rounded-full transition-colors">
                𝕏 Twitter
              </button>
              <button onClick={shareLinkedIn} className="text-xs text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-3 py-1.5 rounded-full transition-colors">
                in LinkedIn
              </button>
              <button onClick={copyLink} className="text-xs text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 px-3 py-1.5 rounded-full transition-colors">
                {copied ? <><Check size={12} className="text-emerald-500" /> {ui.copied}</> : <><Link2 size={12} /> {ui.copyLink}</>}
              </button>
            </div>
          </article>
        </div>
      </div>

      {/* Related Articles */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-bold text-2xl text-slate-900 mb-8">{ui.relatedArticles}</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {relatedPosts.map((post) => (
              <Link key={post.slug} href={`${base}/blog/${post.slug}`} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-200 transition-colors group">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${categoryColors[post.category]}`}>
                  {post.category}
                </span>
                <h3 className="font-display font-bold text-slate-900 mt-3 mb-2 group-hover:text-brand-600 transition-colors">
                  {post.title}
                </h3>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={11} /> {post.readTime}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

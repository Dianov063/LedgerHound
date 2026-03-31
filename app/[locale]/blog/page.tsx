import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight, Clock, Tag } from 'lucide-react';

const blogPosts = [
  {
    slug: 'how-to-trace-stolen-bitcoin',
    category: 'Guide',
    title: 'How to Trace Stolen Bitcoin: A Step-by-Step Overview',
    excerpt: 'Every Bitcoin transaction leaves a permanent record on the blockchain. Learn how certified investigators use this data to follow stolen funds and build court-ready evidence.',
    date: 'March 15, 2026',
    readTime: '8 min read',
    featured: true,
  },
  {
    slug: 'pig-butchering-scam-recovery',
    category: 'Case Study',
    title: 'Pig Butchering Scams: Can Victims Recover Their Funds?',
    excerpt: 'Pig butchering (shā zhū pán) scams cost victims billions annually. We break down how these schemes work, what forensic investigation can achieve, and real case outcomes.',
    date: 'March 8, 2026',
    readTime: '6 min read',
    featured: true,
  },
  {
    slug: 'crypto-divorce-hidden-assets',
    category: 'Legal',
    title: 'Hidden Crypto in Divorce: What Attorneys Need to Know',
    excerpt: 'Spouses hiding cryptocurrency during divorce proceedings is increasingly common. This guide explains how blockchain forensic analysis uncovers undisclosed digital assets.',
    date: 'February 22, 2026',
    readTime: '7 min read',
    featured: true,
  },
  {
    slug: 'blockchain-evidence-court',
    category: 'Legal',
    title: 'Is Blockchain Evidence Admissible in US Courts?',
    excerpt: 'Understanding how courts treat blockchain forensic evidence, what makes a report legally defensible, and how expert testimony works in cryptocurrency fraud cases.',
    date: 'February 14, 2026',
    readTime: '9 min read',
    featured: false,
  },
  {
    slug: 'how-crypto-scammers-launder-money',
    category: 'Education',
    title: 'How Crypto Scammers Launder Money: Mixers, Chains, and Exchanges',
    excerpt: 'A technical deep dive into the money laundering techniques used by crypto fraudsters — and how investigators detect and trace these patterns.',
    date: 'February 5, 2026',
    readTime: '10 min read',
    featured: false,
  },
  {
    slug: 'fake-crypto-trading-platforms-2026',
    category: 'Guide',
    title: 'How to Identify a Fake Crypto Trading Platform in 2026',
    excerpt: 'Fraudulent trading platforms are behind billions in losses. Learn the warning signs, technical red flags, and what to do if you\'ve already sent money.',
    date: 'January 28, 2026',
    readTime: '7 min read',
    featured: false,
  },
  {
    slug: 'crypto-ransomware-payment-tracing',
    category: 'Case Study',
    title: 'Ransomware Payments: Can Businesses Recover Crypto Paid to Hackers?',
    excerpt: 'When businesses pay ransomware attackers in cryptocurrency, what are the chances of tracing and recovering those funds? Real cases and outcomes.',
    date: 'January 15, 2026',
    readTime: '8 min read',
    featured: false,
  },
  {
    slug: 'subpoena-crypto-exchange',
    category: 'Legal',
    title: 'How to Subpoena a Cryptocurrency Exchange: Attorney\'s Guide',
    excerpt: 'A practical guide for attorneys on identifying the right exchange to subpoena, what data is available, and how blockchain forensic reports support the process.',
    date: 'January 8, 2026',
    readTime: '11 min read',
    featured: false,
  },
];

const categories = ['All', 'Guide', 'Legal', 'Case Study', 'Education'];
const categoryColors: Record<string, string> = {
  Guide: 'bg-blue-50 text-blue-700 border-blue-100',
  Legal: 'bg-violet-50 text-violet-700 border-violet-100',
  'Case Study': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Education: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function BlogPage() {
  const t = useTranslations('blog');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const featured = blogPosts.filter((p) => p.featured);
  const rest = blogPosts.filter((p) => !p.featured);

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-tag">{t('tag')}</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-3">{t('title')}</h1>
              <p className="text-slate-600 max-w-xl">{t('subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button key={cat} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${cat === 'All' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-bold text-xl text-slate-900 mb-6 flex items-center gap-2">
            <Tag size={16} className="text-brand-600" /> Featured Articles
          </h2>
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {featured.map((post) => (
              <Link key={post.slug} href={`${base}/blog/${post.slug}`} className="card group hover:border-brand-200 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${categoryColors[post.category]}`}>
                    {post.category}
                  </span>
                </div>
                <h3 className="font-display font-bold text-slate-900 mb-2 leading-snug group-hover:text-brand-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock size={11} /> {post.readTime}</span>
                  <span className="text-brand-600 font-semibold">{t('read_more')} →</span>
                </div>
              </Link>
            ))}
          </div>

          <h2 className="font-display font-bold text-xl text-slate-900 mb-6">All Articles</h2>
          <div className="space-y-4">
            {rest.map((post) => (
              <Link key={post.slug} href={`${base}/blog/${post.slug}`} className="card group hover:border-brand-200 transition-colors flex gap-5 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${categoryColors[post.category]}`}>
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-400">{post.date}</span>
                  </div>
                  <h3 className="font-display font-bold text-slate-900 mb-1.5 group-hover:text-brand-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{post.excerpt}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <Clock size={11} /> {post.readTime}
                  <ArrowRight size={14} className="text-brand-400 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-2xl text-slate-900 mb-3">Stay Updated on Crypto Fraud</h2>
          <p className="text-slate-600 text-sm mb-6">Get our latest guides, case studies, and fraud alerts delivered to your inbox. No spam, unsubscribe anytime.</p>
          <div className="flex gap-3">
            <input type="email" placeholder="Your email address" className="input flex-1" />
            <button className="btn-primary whitespace-nowrap">Subscribe</button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

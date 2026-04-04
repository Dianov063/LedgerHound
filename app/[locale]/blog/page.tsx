import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Clock } from 'lucide-react';

const blogPosts = [
  {
    slug: 'how-to-trace-stolen-bitcoin',
    category: 'Guide',
    title: 'How to Trace Stolen Bitcoin and Cryptocurrency: A Step-by-Step Guide',
    excerpt: 'Despite the common perception that crypto is untraceable, the opposite is true. Learn exactly how investigators trace stolen funds step by step — from transaction mapping to exchange subpoenas.',
    date: 'March 28, 2026',
    readTime: '10 min read',
    featured: true,
  },
  {
    slug: 'pig-butchering-scam-recovery',
    category: 'Guide',
    title: 'Pig Butchering Scams in 2026: What They Are, How They Work, and What To Do',
    excerpt: 'The most financially devastating form of crypto fraud. $9.3 billion in reported losses in 2024 alone. Learn the full playbook, warning signs, and what to do if you\'re a victim.',
    date: 'March 15, 2026',
    readTime: '9 min read',
    featured: true,
  },
];

const categoryColors: Record<string, string> = {
  Guide: 'bg-blue-50 text-blue-700 border-blue-100',
};

export default function BlogPage() {
  const t = useTranslations('blog');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-tag">{t('tag')}</p>
          <div>
            <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-3">{t('title')}</h1>
            <p className="text-slate-600 max-w-xl">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Articles */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`${base}/blog/${post.slug}`} className="card group hover:border-brand-200 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${categoryColors[post.category]}`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-slate-400">{post.date}</span>
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2 leading-snug group-hover:text-brand-600 transition-colors">
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

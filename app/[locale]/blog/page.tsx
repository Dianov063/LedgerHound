import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Clock } from 'lucide-react';
import { makeMetadata } from '@/lib/metadata';
import { BLOG_POSTS } from '@/lib/blog/posts';
import { formatBlogDate, categoryKey } from '@/lib/blog/format-blog-meta';

const blogPosts = BLOG_POSTS;

const categoryColors: Record<string, string> = {
  Guide: 'bg-blue-50 text-blue-700 border-blue-100',
  'Case Study': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Legal: 'bg-violet-50 text-violet-700 border-violet-100',
  Education: 'bg-amber-50 text-amber-700 border-amber-100',
};


export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return await makeMetadata({
    locale,
    path: '/blog',
    metadataKey: 'blog.index',
});
}

export default function BlogPage() {
  const t = useTranslations('blog');
  const tp = useTranslations('blog_page');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
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
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${categoryColors[post.category] || categoryColors.Guide}`}>
                    {t(`category_${categoryKey(post.category)}`)}
                  </span>
                  <span className="text-xs text-slate-400">{formatBlogDate(post.date, locale)}</span>
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2 leading-snug group-hover:text-brand-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock size={11} /> {t('min_read', { count: post.readMinutes })}</span>
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
          <h2 className="font-display font-bold text-2xl text-slate-900 mb-3">{tp('newsletter_title')}</h2>
          <p className="text-slate-600 text-sm mb-6">{tp('newsletter_desc')}</p>
          <div className="flex gap-3">
            <input type="email" placeholder={tp('newsletter_placeholder')} className="input flex-1" />
            <button className="btn-primary whitespace-nowrap">{tp('newsletter_btn')}</button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

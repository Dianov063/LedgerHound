import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Search, Scale, Heart, Shield, Building2, Users,
  ArrowRight, CheckCircle2, ChevronRight, Star,
  Clock, FileText, Phone, Lock
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const services = [
    { icon: Search, key: 'tracing', href: `${base}/services/crypto-tracing` },
    { icon: Scale, key: 'litigation', href: `${base}/services/litigation` },
    { icon: Heart, key: 'romance', href: `${base}/services/romance-scams` },
    { icon: Shield, key: 'law_enforcement', href: `${base}/services/litigation` },
    { icon: Building2, key: 'corporate', href: `${base}/services/corporate-fraud` },
    { icon: Users, key: 'divorce', href: `${base}/services/divorce-crypto` },
  ];

  const howSteps = ['step1', 'step2', 'step3', 'step4'];
  const whyItems = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6'];
  const whyIcons = ['💰', '⚡', '🌐', '📋', '🔗', '🤝'];

  const cases = [
    { key: 'case1', colorClass: 'bg-blue-50 border-blue-100', amountClass: 'text-blue-700' },
    { key: 'case2', colorClass: 'bg-emerald-50 border-emerald-100', amountClass: 'text-emerald-700' },
    { key: 'case3', colorClass: 'bg-violet-50 border-violet-100', amountClass: 'text-violet-700' },
  ];

  const blogPosts = [
    {
      slug: 'how-to-trace-stolen-bitcoin',
      category: 'Guide',
      title: 'How to Trace Stolen Bitcoin: A Step-by-Step Overview',
      excerpt: 'Every Bitcoin transaction leaves a permanent record on the blockchain. Learn how investigators use this data to follow stolen funds.',
      date: 'March 2026',
      readTime: '8 min read',
    },
    {
      slug: 'pig-butchering-scam-recovery',
      category: 'Case Study',
      title: 'Pig Butchering Scams: Can Victims Recover Their Funds?',
      excerpt: 'Pig butchering scams cost victims billions annually. We break down how these schemes work and what forensic investigation can achieve.',
      date: 'February 2026',
      readTime: '6 min read',
    },
    {
      slug: 'crypto-divorce-hidden-assets',
      category: 'Legal',
      title: 'Hidden Crypto in Divorce: What Attorneys Need to Know',
      excerpt: 'Spouses hiding cryptocurrency is increasingly common. This guide explains how forensic blockchain analysis uncovers undisclosed assets.',
      date: 'January 2026',
      readTime: '7 min read',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-100 rounded-full opacity-40 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-sky-100 rounded-full opacity-30 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                {t('hero.badge')}
              </div>

              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-[1.05] tracking-tight mb-6">
                {t('hero.title').split('\n').map((line, i) => (
                  <span key={i}>
                    {i === 1
                      ? <span className="text-brand-600">{line}</span>
                      : line}
                    {i < 2 && <br />}
                  </span>
                ))}
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-lg">
                {t('hero.subtitle')}
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                <Link href={`${base}/free-evaluation`} className="btn-primary">
                  {t('hero.cta_primary')}
                  <ArrowRight size={16} />
                </Link>
                <Link href={`#how`} className="btn-secondary">
                  {t('hero.cta_secondary')}
                </Link>
              </div>

              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Lock size={13} className="text-brand-500 flex-shrink-0" />
                {t('hero.note')}
              </p>
            </div>

            {/* Right — workflow card */}
            <div className="relative">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
                  Live Case Workflow
                </p>
                <div className="space-y-0 divide-y divide-slate-50">
                  {[
                    { n: '01', title: 'Wallet Address Submitted', sub: 'Client provides tx hash & timeline' },
                    { n: '02', title: 'Blockchain Analysis Started', sub: 'Mapping fund flow across 10+ chains' },
                    { n: '03', title: 'Exchange Identified', sub: 'KYC-compliant VASP located' },
                    { n: '04', title: 'Court-Ready Report', sub: 'Evidence package for attorney / law enforcement' },
                  ].map((step) => (
                    <div key={step.n} className="flex items-start gap-4 py-4">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-600 font-display font-bold text-xs">{step.n}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{step.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Funds Located · Exchange Identified</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Attorney filed freezing injunction within 72 hours</p>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white border border-slate-100 shadow-lg rounded-xl px-3 py-2 flex items-center gap-2">
                <Star size={13} className="text-amber-500 fill-amber-500" />
                <span className="text-xs font-semibold text-slate-700">CTCE Certified</span>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-brand-600 text-white shadow-lg rounded-xl px-3 py-2">
                <p className="text-xs font-semibold">48–72h Report</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <div className="border-y border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { icon: Shield, label: t('trust.certified') },
              { icon: FileText, label: t('trust.court') },
              { icon: Building2, label: t('trust.entity') },
              { icon: Clock, label: t('trust.speed') },
              { icon: Phone, label: t('trust.russian') },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-slate-600">
                <Icon size={14} className="text-brand-500" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── STATS ─── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: t('stats.illicit'), label: t('stats.illicit_label') },
              { num: t('stats.searches'), label: t('stats.searches_label') },
              { num: t('stats.hours'), label: t('stats.hours_label') },
              { num: t('stats.chains'), label: t('stats.chains_label') },
            ].map(({ num, label }) => (
              <div key={label} className="text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="font-display font-bold text-3xl lg:text-4xl text-brand-600 mb-2">{num}</div>
                <div className="text-xs text-slate-500 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="py-20 bg-white" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-tag">{t('services.tag')}</p>
            <h2 className="section-title text-3xl lg:text-4xl mb-4">
              {t('services.title').split('\n').map((l, i) => (
                <span key={i}>{l}{i === 0 && <br />}</span>
              ))}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">{t('services.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {services.map(({ icon: Icon, key, href }) => (
              <Link key={key} href={href} className="group card hover:border-brand-200 p-6">
                <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                  <Icon size={20} className="text-brand-600" />
                </div>
                <h3 className="font-display font-bold text-slate-900 mb-2">
                  {t(`services.${key}.title`)}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {t(`services.${key}.desc`)}
                </p>
                <span className="inline-block text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
                  {t(`services.${key}.tag`)}
                </span>
              </Link>
            ))}
          </div>

          {/* Russian banner */}
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="text-4xl">🇷🇺</span>
              <div>
                <h3 className="font-display font-bold text-white text-xl mb-1">
                  {t('russian_banner.title')}
                </h3>
                <p className="text-brand-100 text-sm max-w-xl">
                  {t('russian_banner.desc')}
                </p>
              </div>
            </div>
            <Link
              href={`${base}/free-evaluation`}
              className="flex-shrink-0 bg-white text-brand-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-50 transition-colors text-sm"
            >
              {t('russian_banner.cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 bg-slate-50" id="how">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <p className="section-tag">{t('how.tag')}</p>
              <h2 className="section-title text-3xl lg:text-4xl mb-4">
                {t('how.title').split('\n').map((l, i) => (
                  <span key={i}>{l}{i === 0 && <br />}</span>
                ))}
              </h2>
              <p className="text-slate-600 leading-relaxed">{t('how.subtitle')}</p>
            </div>
            <div className="space-y-0 divide-y divide-slate-200">
              {howSteps.map((step, i) => (
                <div key={step} className="flex gap-5 py-6">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600 text-white font-display font-bold text-sm flex items-center justify-center mt-0.5">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-slate-900 mb-2">
                      {t(`how.${step}_title`)}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {t(`how.${step}_desc`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CASES ─── */}
      <section className="py-20 bg-white" id="cases">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-tag">{t('cases.tag')}</p>
            <h2 className="section-title text-3xl lg:text-4xl mb-4">
              {t('cases.title').split('\n').map((l, i) => (
                <span key={i}>{l}{i === 0 && <br />}</span>
              ))}
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">{t('cases.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {cases.map(({ key, colorClass, amountClass }) => (
              <div key={key} className={`rounded-2xl border p-6 ${colorClass}`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  {t(`cases.${key}_type`)}
                </p>
                <p className={`font-display font-bold text-3xl mb-3 ${amountClass}`}>
                  {t(`cases.${key}_amount`)}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {t(`cases.${key}_desc`)}
                </p>
                <div className="flex items-start gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{t(`cases.${key}_result`)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="py-20 bg-slate-50" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-tag">{t('pricing.tag')}</p>
            <h2 className="section-title text-3xl lg:text-4xl mb-4">
              {t('pricing.title').split('\n').map((l, i) => (
                <span key={i}>{l}{i === 0 && <br />}</span>
              ))}
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">{t('pricing.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {/* Basic */}
            <div className="card">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('pricing.basic_name')}</p>
              <div className="mb-1">
                <span className="font-display font-bold text-3xl text-slate-900">{t('pricing.basic_price')}</span>
                <span className="text-slate-500 text-sm ml-2">{t('pricing.basic_period')}</span>
              </div>
              <p className="text-sm text-slate-500 mb-5">{t('pricing.basic_desc')}</p>
              <ul className="space-y-2.5 mb-6">
                {['basic_f1', 'basic_f2', 'basic_f3', 'basic_f4'].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    {t(`pricing.${f}`)}
                  </li>
                ))}
              </ul>
              <Link href={`${base}/free-evaluation`} className="btn-outline">{t('pricing.cta')}</Link>
            </div>

            {/* Full - Featured */}
            <div className="relative card border-brand-200 bg-brand-50 shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                {t('pricing.full_badge')}
              </div>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3">{t('pricing.full_name')}</p>
              <div className="mb-1">
                <span className="font-display font-bold text-3xl text-slate-900">{t('pricing.full_price')}</span>
                <span className="text-slate-500 text-sm ml-2">{t('pricing.full_period')}</span>
              </div>
              <p className="text-sm text-slate-500 mb-5">{t('pricing.full_desc')}</p>
              <ul className="space-y-2.5 mb-6">
                {['full_f1', 'full_f2', 'full_f3', 'full_f4', 'full_f5'].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="text-brand-600 mt-0.5 flex-shrink-0" />
                    {t(`pricing.${f}`)}
                  </li>
                ))}
              </ul>
              <Link href={`${base}/free-evaluation`} className="btn-primary w-full justify-center">
                {t('pricing.cta')}
              </Link>
            </div>

            {/* Expert */}
            <div className="card">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('pricing.expert_name')}</p>
              <div className="mb-1">
                <span className="font-display font-bold text-3xl text-slate-900">{t('pricing.expert_price')}</span>
                <span className="text-slate-500 text-sm ml-2">{t('pricing.expert_period')}</span>
              </div>
              <p className="text-sm text-slate-500 mb-5">{t('pricing.expert_desc')}</p>
              <ul className="space-y-2.5 mb-6">
                {['expert_f1', 'expert_f2', 'expert_f3', 'expert_f4'].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    {t(`pricing.${f}`)}
                  </li>
                ))}
              </ul>
              <Link href={`${base}/contact`} className="btn-outline">{t('pricing.cta_quote')}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY US ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-tag">{t('why.tag')}</p>
            <h2 className="section-title text-3xl lg:text-4xl">
              {t('why.title').split('\n').map((l, i) => (
                <span key={i}>{l}{i === 0 && <br />}</span>
              ))}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {whyItems.map((key, i) => (
              <div key={key} className="card flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl flex-shrink-0">
                  {whyIcons[i]}
                </div>
                <div>
                  <h4 className="font-display font-bold text-slate-900 mb-2">{t(`why.${key}_title`)}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{t(`why.${key}_desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BLOG ─── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-tag">{t('blog.tag')}</p>
              <h2 className="section-title text-3xl">{t('blog.title')}</h2>
            </div>
            <Link href={`${base}/blog`} className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
              {t('blog.view_all')} <ChevronRight size={15} />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`${base}/blog/${post.slug}`} className="card group hover:border-brand-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100">
                    {post.category}
                  </span>
                  <span className="text-xs text-slate-400">{post.date}</span>
                </div>
                <h3 className="font-display font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{post.readTime}</span>
                  <span className="text-brand-600 font-semibold group-hover:underline">{t('blog.read_more')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 bg-gradient-to-br from-brand-600 to-brand-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-500 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-700 rounded-full opacity-20 blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <p className="text-brand-200 text-xs font-bold tracking-widest uppercase mb-4">{t('cta.tag')}</p>
          <h2 className="font-display font-bold text-4xl lg:text-5xl text-white leading-tight mb-5">
            {t('cta.title').split('\n').map((l, i) => (
              <span key={i}>{l}{i === 0 && <br />}</span>
            ))}
          </h2>
          <p className="text-brand-100 text-lg leading-relaxed mb-8">{t('cta.desc')}</p>

          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4">
            <input
              type="email"
              placeholder={t('cta.email_placeholder')}
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-brand-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <Link
              href={`${base}/free-evaluation`}
              className="bg-white text-brand-700 font-semibold px-5 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm whitespace-nowrap"
            >
              {t('cta.button')}
            </Link>
          </form>

          <p className="flex items-center justify-center gap-2 text-xs text-brand-200 mb-5">
            <Lock size={12} /> {t('cta.privacy')}
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap text-sm">
            <span className="text-brand-200">{t('cta.phone_label')}</span>
            <a href="tel:+18335591334" className="text-white font-bold hover:underline">{t('cta.phone')}</a>
            <span className="text-brand-300 hidden sm:block">·</span>
            <span className="text-brand-200">{t('cta.russian_label')}</span>
            <span className="text-white font-bold">{t('cta.russian_value')}</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

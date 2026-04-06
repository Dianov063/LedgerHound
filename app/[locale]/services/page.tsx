import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, Scale, Heart, Shield, Building2, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { makeMetadata } from '@/lib/metadata';



export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/services',
    title: "Blockchain Investigation Services | LedgerHound",
    description: "Comprehensive blockchain forensics services: crypto tracing, fraud investigation, divorce crypto analysis, litigation support, and romance scam recovery.",
    keywords: ["blockchain investigation services","crypto forensics services"],
  });
}

export default function ServicesPage() {
  const t = useTranslations('services');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const services = [
    {
      icon: Search,
      key: 'tracing',
      href: `${base}/services/crypto-tracing`,
      features: ['Bitcoin, Ethereum, Tron, BNB, Solana', 'Transaction mapping & cluster analysis', 'Exchange identification', 'Court-ready PDF report'],
      price: 'From $1,500',
    },
    {
      icon: Heart,
      key: 'romance',
      href: `${base}/services/romance-scams`,
      features: ['Pig butchering investigations', 'Fake trading platform analysis', 'Fund flow tracing', 'Law enforcement referral support'],
      price: 'From $1,500',
    },
    {
      icon: Scale,
      key: 'litigation',
      href: `${base}/services/litigation`,
      features: ['Expert witness reports', 'Deposition support', 'Court testimony', 'Attorney co-counsel collaboration'],
      price: 'Custom quote',
    },
    {
      icon: Users,
      key: 'divorce',
      href: `${base}/services/divorce-crypto`,
      features: ['Hidden wallet discovery', 'Asset valuation', 'Transfer history documentation', 'Family law attorney support'],
      price: 'From $1,500',
    },
    {
      icon: Building2,
      key: 'corporate',
      href: `${base}/services/corporate-fraud`,
      features: ['Employee theft investigations', 'Ransomware payment tracing', 'Investment fraud analysis', 'Chain-of-custody documentation'],
      price: 'From $3,500',
    },
    {
      icon: Shield,
      key: 'law_enforcement',
      href: `${base}/services/litigation`,
      features: ['Blockchain analysis reports', 'Subpoena target identification', 'OSINT investigations', 'Expert testimony support'],
      price: 'Custom quote',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="section-tag">{t('tag')}</p>
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-4">
            {t('title').split('\n').map((l, i) => (
              <span key={i}>{l}{i === 0 && <br />}</span>
            ))}
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">{t('subtitle')}</p>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            {services.map(({ icon: Icon, key, href, features, price }) => (
              <div key={key} className="card border border-slate-100 hover:border-brand-200 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                      <Icon size={20} className="text-brand-600" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-slate-900">{t(`${key}.title`)}</h2>
                      <span className="text-xs text-brand-600 font-semibold">{t(`${key}.tag`)}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">{price}</span>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{t(`${key}.desc`)}</p>
                <ul className="space-y-1.5 mb-5">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Learn more <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-brand-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl text-white mb-4">Not sure which service you need?</h2>
          <p className="text-brand-100 mb-6">Start with a free case evaluation. We'll assess your situation and recommend the right approach.</p>
          <Link href={`${base}/free-evaluation`} className="bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors inline-flex items-center gap-2">
            Get Free Evaluation <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

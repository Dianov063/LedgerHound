'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ChevronRight, ArrowRight, FileText, Lock } from 'lucide-react';
import ContentEn, { toc as tocEn, faq as faqEn } from './content/en';
import ContentEs, { toc as tocEs, faq as faqEs } from './content/es';

const SITE_URL = 'https://www.ledgerhound.vip';

const byLocale = {
  en: { Content: ContentEn, toc: tocEn, faq: faqEn },
  es: { Content: ContentEs, toc: tocEs, faq: faqEs },
} as const;

const ui = {
  en: {
    home: 'Home',
    crumb: "What's Included",
    badge: 'Product Guide',
    title: "What's Included in Your Forensic Report",
    subtitle: 'Every section of the $49 LedgerHound blockchain forensic report — and how each is meant to be used.',
    toc: 'On this page',
    helpTitle: 'Have a case?',
    helpDesc: 'Generate a full forensic report in minutes.',
    helpBtn: 'Get your report',
    ctaTitle: 'Get your forensic report',
    ctaDesc: 'Risk scoring, attack-technique documentation, and ready-to-use complaint templates — delivered in minutes.',
    ctaBtn: 'Generate report — $49',
    disclaimer: 'LedgerHound provides blockchain forensic analysis. We are not a law firm and do not provide legal advice. We do not guarantee fund recovery.',
  },
  es: {
    home: 'Inicio',
    crumb: 'Qué Incluye',
    badge: 'Guía del Producto',
    title: 'Qué Incluye Tu Informe Forense',
    subtitle: 'Cada sección del informe forense blockchain de $49 de LedgerHound — y para qué sirve cada una.',
    toc: 'En esta página',
    helpTitle: '¿Tiene un caso?',
    helpDesc: 'Genere un informe forense completo en minutos.',
    helpBtn: 'Obtener informe',
    ctaTitle: 'Obtenga su informe forense',
    ctaDesc: 'Puntuación de riesgo, documentación de técnicas de ataque y plantillas de denuncia listas para usar — entregadas en minutos.',
    ctaBtn: 'Generar informe — $49',
    disclaimer: 'LedgerHound brinda análisis forense blockchain. No somos un estudio de abogados ni damos asesoría legal. No garantizamos la recuperación de fondos.',
  },
} as const;

export default function WhatsIncludedPage() {
  const rawLocale = useLocale();
  const locale: 'en' | 'es' = rawLocale === 'es' ? 'es' : 'en';
  const base = rawLocale === 'en' ? '' : `/${rawLocale}`;
  const { Content, toc, faq } = byLocale[locale];
  const u = ui[locale];

  const pageUrl = `${SITE_URL}${base}/whats-included`;

  // Product + FAQPage structured data (single source: the locale's faq array).
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: locale === 'es' ? 'Informe Forense Blockchain LedgerHound' : 'LedgerHound Blockchain Forensic Report',
    description: u.subtitle,
    brand: { '@type': 'Brand', name: 'LedgerHound' },
    url: pageUrl,
    offers: {
      '@type': 'Offer',
      price: '49',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}${base}/report`,
    },
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Hero */}
      <div className="pt-32 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8">
            <Link href={base || '/'} className="hover:text-brand-600 transition-colors">{u.home}</Link>
            <ChevronRight size={12} />
            <span className="text-slate-600">{u.crumb}</span>
          </nav>

          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-blue-50 text-blue-700 border-blue-100">
              {u.badge}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <FileText size={11} /> $49
            </span>
          </div>

          <h1 className="font-display font-bold text-3xl lg:text-[2.75rem] lg:leading-tight text-slate-900 mb-5">
            {u.title}
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl">{u.subtitle}</p>
        </div>
      </div>

      {/* Content with sidebar TOC */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{u.toc}</p>
              <nav className="space-y-1">
                {toc.map((item) => (
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
                <p className="text-xs font-bold text-brand-700 mb-2">{u.helpTitle}</p>
                <p className="text-xs text-brand-600 mb-3">{u.helpDesc}</p>
                <Link
                  href={`${base}/report`}
                  className="flex items-center justify-center gap-1.5 bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors w-full"
                >
                  {u.helpBtn} <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </aside>

          <article className="flex-1 max-w-3xl">
            <div className="prose prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-800">
              <Content base={base} />
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
              <FileText className="mx-auto text-brand-200 mb-3" size={32} />
              <h3 className="font-display font-bold text-2xl text-white mb-2">{u.ctaTitle}</h3>
              <p className="text-brand-100 text-sm mb-5 max-w-lg mx-auto">{u.ctaDesc}</p>
              <Link
                href={`${base}/report`}
                className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors"
              >
                <Lock size={16} /> {u.ctaBtn}
              </Link>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-200">
              <p className="text-xs text-slate-400 italic">{u.disclaimer}</p>
            </div>
          </article>
        </div>
      </div>

      <Footer />
    </div>
  );
}

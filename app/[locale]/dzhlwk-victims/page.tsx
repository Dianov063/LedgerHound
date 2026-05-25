'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ChevronRight, ArrowRight, ShieldAlert, Mail } from 'lucide-react';
import ContentEn, { toc as tocEn, faq as faqEn } from './content/en';
import ContentEs, { toc as tocEs, faq as faqEs } from './content/es';
import ContentZh, { toc as tocZh, faq as faqZh } from './content/zh';
import ContentFr, { toc as tocFr, faq as faqFr } from './content/fr';
import ContentAr, { toc as tocAr, faq as faqAr } from './content/ar';
import ContentRu, { toc as tocRu, faq as faqRu } from './content/ru';

const SITE_URL = 'https://www.ledgerhound.vip';
const MAILTO = 'mailto:contact@ledgerhound.vip?subject=DZHLWK%20Victim%20Report';

type Loc = 'en' | 'es' | 'zh' | 'fr' | 'ar' | 'ru';

const byLocale = {
  en: { Content: ContentEn, toc: tocEn, faq: faqEn },
  es: { Content: ContentEs, toc: tocEs, faq: faqEs },
  zh: { Content: ContentZh, toc: tocZh, faq: faqZh },
  fr: { Content: ContentFr, toc: tocFr, faq: faqFr },
  ar: { Content: ContentAr, toc: tocAr, faq: faqAr },
  ru: { Content: ContentRu, toc: tocRu, faq: faqRu },
} as const;

const ui: Record<Loc, {
  home: string; crumb: string; badge: string; title: string; subtitle: string;
  toc: string; cta: string; helpTitle: string; helpDesc: string; disclaimer: string;
}> = {
  en: {
    home: 'Home', crumb: 'DZHLWK Victims', badge: 'Active Investigation',
    title: 'DZHLWK Cryptocurrency Scam: Victim Identification & Coordinated Investigation',
    subtitle: 'Victim of DZHLWK (sometimes "DZHLWK Fintech")? Join the coordinated forensic investigation. Free case submission — no upfront fees, ever.',
    toc: 'On this page', cta: 'Submit your DZHLWK case — free',
    helpTitle: 'Are you a victim?', helpDesc: 'Free case submission. We never ask for passwords, seed phrases, or fees.',
    disclaimer: 'LedgerHound provides blockchain forensic analysis. We are not a law firm and do not guarantee fund recovery. Case submission is free; we never request passwords, seed phrases, private keys, or upfront fees.',
  },
  es: {
    home: 'Inicio', crumb: 'Víctimas DZHLWK', badge: 'Investigación Activa',
    title: 'Estafa Cripto DZHLWK: Identificación de Víctimas e Investigación Coordinada',
    subtitle: '¿Víctima de DZHLWK (a veces "DZHLWK Fintech")? Únase a la investigación forense coordinada. Registro de caso gratuito — nunca pagos adelantados.',
    toc: 'En esta página', cta: 'Registre su caso DZHLWK — gratis',
    helpTitle: '¿Es usted una víctima?', helpDesc: 'Registro gratuito. Nunca pedimos contraseñas, frases semilla ni pagos.',
    disclaimer: 'LedgerHound brinda análisis forense blockchain. No somos un estudio de abogados ni garantizamos la recuperación de fondos. El registro del caso es gratuito; nunca pedimos contraseñas, frases semilla, claves privadas ni pagos adelantados.',
  },
  zh: {
    home: '首页', crumb: 'DZHLWK 受害者', badge: '调查进行中',
    title: 'DZHLWK 加密货币诈骗：受害者识别与协同调查',
    subtitle: '您是 DZHLWK（有时称为 “DZHLWK Fintech”）的受害者吗？加入协同区块链取证调查。免费提交案件——绝不收取预付费用。',
    toc: '本页内容', cta: '免费提交您的 DZHLWK 案件',
    helpTitle: '您是受害者吗？', helpDesc: '免费提交。我们绝不索要密码、助记词或任何费用。',
    disclaimer: 'LedgerHound 提供区块链取证分析。我们不是律师事务所，也不保证资金追回。案件提交免费；我们绝不索要密码、助记词、私钥或预付费用。',
  },
  fr: {
    home: 'Accueil', crumb: 'Victimes DZHLWK', badge: 'Enquête en cours',
    title: 'Arnaque Crypto DZHLWK : Identification des Victimes et Enquête Coordonnée',
    subtitle: "Victime de DZHLWK (parfois « DZHLWK Fintech ») ? Rejoignez l'enquête forensique coordonnée. Soumission de dossier gratuite — jamais de frais initiaux.",
    toc: 'Sur cette page', cta: 'Soumettez votre dossier DZHLWK — gratuit',
    helpTitle: 'Êtes-vous une victime ?', helpDesc: 'Soumission gratuite. Nous ne demandons jamais de mots de passe, phrases de récupération ou frais.',
    disclaimer: "LedgerHound fournit une analyse forensique blockchain. Nous ne sommes pas un cabinet d'avocats et ne garantissons pas la récupération des fonds. La soumission est gratuite ; nous ne demandons jamais de mots de passe, phrases de récupération, clés privées ou frais initiaux.",
  },
  ar: {
    home: 'الرئيسية', crumb: 'ضحايا DZHLWK', badge: 'تحقيق جارٍ',
    title: 'احتيال العملات الرقمية DZHLWK: تحديد الضحايا والتحقيق المنسّق',
    subtitle: 'هل أنت ضحية لـ DZHLWK (يظهر أحياناً باسم «DZHLWK Fintech»)؟ انضم إلى التحقيق الجنائي الرقمي المنسّق. تقديم الحالة مجاني — بدون أي رسوم مُقدّمة على الإطلاق.',
    toc: 'في هذه الصفحة', cta: 'قدّم حالتك مع DZHLWK — مجاناً',
    helpTitle: 'هل أنت ضحية؟', helpDesc: 'تقديم مجاني. لا نطلب أبداً كلمات مرور أو عبارات استرداد أو رسوماً.',
    disclaimer: 'تقدّم LedgerHound تحليلاً جنائياً رقمياً للبلوكشين. لسنا مكتب محاماة ولا نضمن استرداد الأموال. تقديم الحالة مجاني؛ لا نطلب أبداً كلمات مرور أو عبارات استرداد أو مفاتيح خاصة أو رسوماً مُقدّمة.',
  },
  ru: {
    home: 'Главная', crumb: 'Пострадавшие DZHLWK', badge: 'Активное расследование',
    title: 'Криптомошенничество DZHLWK: идентификация жертв и скоординированное расследование',
    subtitle: 'Пострадали от DZHLWK (иногда «DZHLWK Fintech»)? Присоединяйтесь к скоординированному форензик-расследованию. Подача заявки бесплатна — никаких предоплат.',
    toc: 'На этой странице', cta: 'Подать заявку по DZHLWK — бесплатно',
    helpTitle: 'Вы пострадавший?', helpDesc: 'Бесплатная подача. Мы никогда не просим пароли, seed-фразы или оплату.',
    disclaimer: 'LedgerHound предоставляет форензик-анализ блокчейна. Мы не юридическая фирма и не гарантируем возврат средств. Подача заявки бесплатна; мы никогда не запрашиваем пароли, seed-фразы, приватные ключи или предоплаты.',
  },
};

export default function DzhlwkVictimsPage() {
  const raw = useLocale();
  const locale: Loc = (['en', 'es', 'zh', 'fr', 'ar', 'ru'] as const).includes(raw as Loc) ? (raw as Loc) : 'en';
  const base = raw === 'en' ? '' : `/${raw}`;
  const { Content, toc, faq } = byLocale[locale];
  const u = ui[locale];
  const pageUrl = `${SITE_URL}${base}/dzhlwk-victims`;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: u.title,
    inLanguage: locale,
    datePublished: '2026-05-24',
    dateModified: '2026-05-24',
    author: { '@type': 'Organization', name: 'LedgerHound', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'LedgerHound', url: SITE_URL },
    mainEntityOfPage: pageUrl,
    about: { '@type': 'Thing', name: 'DZHLWK Cryptocurrency Investment Scam' },
    mentions: [
      { '@type': 'Thing', name: 'Pig butchering scam' },
      { '@type': 'Thing', name: 'Address poisoning attack' },
    ],
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Hero */}
      <div className="pt-32 pb-12 bg-gradient-to-br from-red-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8">
            <Link href={base || '/'} className="hover:text-brand-600 transition-colors">{u.home}</Link>
            <ChevronRight size={12} />
            <span className="text-slate-600">{u.crumb}</span>
          </nav>

          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-red-50 text-red-700 border-red-100 flex items-center gap-1.5">
              <ShieldAlert size={12} /> {u.badge}
            </span>
          </div>

          <h1 className="font-display font-bold text-3xl lg:text-[2.5rem] lg:leading-tight text-slate-900 mb-5">
            {u.title}
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mb-6">{u.subtitle}</p>
          <a
            href={MAILTO}
            className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-3.5 rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Mail size={16} /> {u.cta}
          </a>
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
              <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-xs font-bold text-red-700 mb-2">{u.helpTitle}</p>
                <p className="text-xs text-red-600 mb-3">{u.helpDesc}</p>
                <a
                  href={MAILTO}
                  className="flex items-center justify-center gap-1.5 bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors w-full"
                >
                  {u.cta} <ArrowRight size={12} />
                </a>
              </div>
            </div>
          </aside>

          <article className="flex-1 max-w-3xl">
            <div className="prose prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-800">
              <Content base={base} mailto={MAILTO} />
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

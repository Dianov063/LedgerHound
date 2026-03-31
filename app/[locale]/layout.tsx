import type { Metadata } from 'next';
import { Inter, Syne } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { locales, rtlLocales, type Locale } from '@/i18n';
import '../globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const titles: Record<string, string> = {
    en: 'LedgerHound | Crypto Asset Tracing & Blockchain Forensics',
    ru: 'LedgerHound | Трассировка криптоактивов и блокчейн-форензика',
    es: 'LedgerHound | Rastreo de Activos Cripto y Forensia Blockchain',
    zh: 'LedgerHound | 加密资产追踪与区块链取证',
    fr: 'LedgerHound | Traçage d\'Actifs Crypto et Forensique Blockchain',
    ar: 'LedgerHound | تتبع الأصول المشفرة والطب الشرعي للبلوكشين',
  };

  const descriptions: Record<string, string> = {
    en: 'Certified blockchain investigators tracing stolen cryptocurrency for fraud victims, attorneys, and businesses. Court-ready reports. Free case evaluation.',
    ru: 'Сертифицированные блокчейн-следователи для трассировки украденной криптовалюты. Работаем на русском языке. Бесплатная оценка кейса.',
    es: 'Investigadores blockchain certificados que rastrean criptomonedas robadas. Evaluación gratuita del caso.',
    zh: '认证区块链调查员追踪被盗加密货币。法庭就绪报告。免费案例评估。',
    fr: 'Enquêteurs blockchain certifiés traçant les cryptomonnaies volées. Évaluation gratuite du cas.',
    ar: 'محققون معتمدون في البلوكشين لتتبع العملات المشفرة المسروقة. تقييم مجاني للقضية.',
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical: `https://ledgerhound.com/${locale === 'en' ? '' : locale}`,
      languages: {
        'en': 'https://ledgerhound.com',
        'ru': 'https://ledgerhound.com/ru',
        'es': 'https://ledgerhound.com/es',
        'zh': 'https://ledgerhound.com/zh',
        'fr': 'https://ledgerhound.com/fr',
        'ar': 'https://ledgerhound.com/ar',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();

  setRequestLocale(locale);

  const messages = await getMessages();
  const isRtl = rtlLocales.includes(locale as Locale);

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${inter.variable} ${syne.variable}`}
    >
      <body className="font-sans antialiased bg-white text-slate-900">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

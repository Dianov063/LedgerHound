import type { Metadata } from 'next';

const SITE_URL = 'https://www.ledgerhound.vip';
const locales = ['en', 'ru', 'es', 'zh', 'fr', 'ar'] as const;

/**
 * Generate metadata with proper canonical URL and hreflang alternates.
 * Usage in server component pages:
 *   export function generateMetadata({ params: { locale } }) {
 *     return makeMetadata({ locale, path: '/about', title: '...', description: '...' });
 *   }
 * For client component pages, use this in a sibling layout.tsx.
 */
export function makeMetadata({
  locale,
  path,
  title,
  description,
  keywords,
  noIndex,
}: {
  locale: string;
  path: string;          // e.g. '/about', '/services/divorce-crypto', '' for homepage
  title: string;
  description: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  // Build canonical: /en is root, others get /ru/about etc.
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const canonical = locale === 'en'
    ? `${SITE_URL}${cleanPath || '/'}`
    : `${SITE_URL}/${locale}${cleanPath}`;

  // Build hreflang alternates for all locales
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = loc === 'en'
      ? `${SITE_URL}${cleanPath || '/'}`
      : `${SITE_URL}/${loc}${cleanPath}`;
  }
  languages['x-default'] = `${SITE_URL}${cleanPath || '/'}`;

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'LedgerHound',
      type: 'website',
      locale: locale === 'en' ? 'en_US' : locale,
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

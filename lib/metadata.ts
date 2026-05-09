import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

const SITE_URL = 'https://www.ledgerhound.vip';
const LOCALES = ['en', 'ru', 'es', 'zh', 'fr', 'ar'] as const;

/**
 * Build canonical + hreflang map for a given path.
 * Honors next-intl `localePrefix: 'as-needed'` — en is at root, others get a prefix.
 */
function buildAlternates(currentLocale: string, cleanPath: string) {
  const buildUrl = (loc: string) =>
    loc === 'en'
      ? `${SITE_URL}${cleanPath || '/'}`
      : `${SITE_URL}/${loc}${cleanPath}`;

  const canonical = buildUrl(currentLocale);
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) languages[loc] = buildUrl(loc);
  languages['x-default'] = buildUrl('en');

  return { canonical, languages };
}

interface MakeMetadataParams {
  locale: string;
  /** Path WITHOUT locale prefix, e.g. '/about', '/services/divorce-crypto', '' for home. */
  path: string;

  /** PREFERRED: key into messages/<locale>.json `metadata` namespace, e.g. 'about', 'services.divorceCrypto'. */
  metadataKey?: string;

  /** Legacy: explicit raw strings. Used for dynamic pages (blog posts, investigator profiles)
   *  where translations live elsewhere. Falls back to these when metadataKey is omitted. */
  title?: string;
  description?: string;
  keywords?: string[];

  noIndex?: boolean;
  ogImage?: string;
}

/**
 * Generate Next.js Metadata with localized title/description and canonical/hreflang.
 *
 * USAGE:
 *
 * (1) Dictionary-driven (PREFERRED for static pages):
 *
 *   export async function generateMetadata({ params: { locale } }) {
 *     return makeMetadata({ locale, path: '/about', metadataKey: 'about' });
 *   }
 *
 *   This pulls title/description from messages/<locale>.json under metadata.about.
 *
 * (2) Legacy / dynamic pages (blog posts, investigator profiles):
 *
 *   return makeMetadata({
 *     locale, path: `/blog/${slug}`,
 *     title: post.title, description: post.excerpt,
 *   });
 */
export async function makeMetadata(params: MakeMetadataParams): Promise<Metadata> {
  const { locale, path, metadataKey, title: rawTitle, description: rawDesc, keywords, noIndex, ogImage } = params;

  const cleanPath = !path ? '' : (path.startsWith('/') ? path : `/${path}`);
  const { canonical, languages } = buildAlternates(locale, cleanPath);

  let title: string;
  let description: string;

  if (metadataKey) {
    // Dictionary-driven path
    const t = await getTranslations({ locale, namespace: 'metadata' });
    try {
      title = t(`${metadataKey}.title` as any);
      description = t(`${metadataKey}.description` as any);
    } catch (err) {
      // If the key is missing in this locale, fall back to raw strings or English defaults
      console.warn(`[makeMetadata] Missing key "${metadataKey}" for locale "${locale}":`, (err as Error).message);
      title = rawTitle || 'LedgerHound';
      description = rawDesc || '';
    }
  } else {
    // Legacy path — use raw strings
    title = rawTitle || 'LedgerHound';
    description = rawDesc || '';
  }

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
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
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

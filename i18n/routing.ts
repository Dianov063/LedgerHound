import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from '@/i18n';
import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME } from './locale-cookie';

/** One routing definition for the proxy (locale negotiation, redirects) and for navigation (links, language switch). */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  // next-intl 4 makes NEXT_LOCALE a session cookie by default. The site has always remembered the
  // visitor's language for a year; keep that.
  localeCookie: { name: LOCALE_COOKIE_NAME, maxAge: LOCALE_COOKIE_MAX_AGE },
});

import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'ru', 'es', 'zh', 'fr', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const rtlLocales: Locale[] = ['ar'];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  /* Anything that is not a known locale falls back instead of throwing.
   *
   * Requests the middleware matcher skips — /favicon.ico is the everyday one —
   * still reach the [locale] route with the filename as the locale param. The
   * bare template literal then tried to import ./messages/favicon.ico.json and
   * threw inside generateMetadata on every page load. The response was fine;
   * the logs were not. */
  const locale = locales.includes(requested as Locale) ? (requested as Locale) : defaultLocale;
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

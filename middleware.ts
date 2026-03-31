import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // English has no prefix: /about, Russian: /ru/about
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

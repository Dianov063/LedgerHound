/**
 * Language switch by a full page load to the final address (client-safe; no Node modules).
 *
 * Why not a client-side navigation: next-intl switches to the default language through
 * /en/<path>, which this site redirects to /<path> and the proxy rewrites back to /en/<path>.
 * On Next 16 that soft navigation was unreliable in the browser: the #fragment was dropped, the
 * address bar sometimes stayed on /en/<path>, and now and then the page re-requested the menu
 * links without end. A language switch re-renders the whole page anyway, so it is done as a
 * plain document navigation: the cookie is set first, then the browser loads the final address
 * itself. Query string and fragment are passed through unchanged; no redirect is involved.
 */
import { defaultLocale } from '@/i18n';
import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME } from '@/i18n/locale-cookie';
import { hardNavigate } from '@/lib/hard-navigate';

/** The address of `pathname` (without a language prefix, as next-intl's usePathname gives it) in `locale`. */
export function localeSwitchUrl(locale: string, pathname: string, search = '', hash = ''): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`;
  const path = pathname === '/' ? '' : pathname;
  return `${prefix}${path || (prefix ? '' : '/')}${search}${hash}`;
}

/** The cookie the proxy reads, written as next-intl writes it (i18n/routing.ts sets the same lifetime). */
export function localeCookie(locale: string): string {
  return `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

export function switchLocale(newLocale: string, currentLocale: string, pathname: string): void {
  if (newLocale === currentLocale) return;
  // Query and fragment verbatim from the address bar, so repeated keys and encoded values survive.
  const { search, hash } = window.location;
  // Without the cookie the proxy would send an unprefixed (English) address back to the old language.
  document.cookie = localeCookie(newLocale);
  hardNavigate(localeSwitchUrl(newLocale, pathname, search, hash));
}

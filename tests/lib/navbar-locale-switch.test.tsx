import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import Navbar from '@/components/Navbar';
import { localeCookie, localeSwitchUrl } from '@/lib/locale-switch';
import { LOCALE_COOKIE_MAX_AGE } from '@/i18n/locale-cookie';
import { routing } from '@/i18n/routing';
import en from '@/messages/en.json';
import ru from '@/messages/ru.json';
import ar from '@/messages/ar.json';

/* The switch is a full page load to the final address (lib/locale-switch.ts). jsdom does not
   navigate, so the navigation itself is replaced and its target is checked. */
const hardNavigate = vi.fn();
vi.mock('@/lib/hard-navigate', () => ({ hardNavigate: (url: string) => hardNavigate(url) }));
let pathname = '/payment-safety';
vi.mock('@/i18n/navigation', () => ({ usePathname: () => pathname }));
vi.mock('next/image', () => ({ default: () => null }));

const MESSAGES = { en, ru, ar } as const;
const NAMES = { en: 'English', ru: 'Русский', ar: 'العربية' } as const;

// Made-up values: repeated keys, an encoded Cyrillic word with a space, an encoded & and =, and an empty value.
const QUERY = '?mode=report&category=ticket_scam&tag=a&tag=b&q=%D1%82%D0%B5%D1%81%D1%82%20x%26y%3Dz&empty=';
const HASH = '#check';
const prefixOf = (locale: string) => (locale === 'en' ? '' : `/${locale}`);
const cookieValue = () => document.cookie.split('; ').find((c) => c.startsWith('NEXT_LOCALE='));

function renderIn(locale: keyof typeof MESSAGES, address: string) {
  window.history.pushState({}, '', address);
  return render(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      <Navbar />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  hardNavigate.mockClear();
  pathname = '/payment-safety';
  window.history.pushState({}, '', '/');
  document.cookie = 'NEXT_LOCALE=; path=/; max-age=0';
});

describe('language switcher', () => {
  it.each([
    ['en', 'ru'],
    ['ru', 'ar'],
    ['ar', 'en'],
    ['ru', 'en'], // to English: straight to the unprefixed address, never through /en/…
  ] as const)('from %s to %s: one full navigation to the final address with path, query and fragment', (from, to) => {
    renderIn(from, `${prefixOf(from)}/payment-safety${QUERY}${HASH}`);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(MESSAGES[from].nav.select_language) }));
    fireEvent.click(screen.getByRole('option', { name: new RegExp(NAMES[to]) }));
    expect(hardNavigate).toHaveBeenCalledTimes(1);
    expect(hardNavigate).toHaveBeenCalledWith(`${prefixOf(to)}/payment-safety${QUERY}${HASH}`);
    expect(hardNavigate.mock.calls[0][0]).not.toMatch(/^\/en(\/|$|\?|#)/);
    // the choice is stored before the navigation, or the proxy would send an English address back
    expect(cookieValue()).toBe(`NEXT_LOCALE=${to}`);
  });

  it('the mobile menu switches the same way', () => {
    pathname = '/payment-scam/ticket-payment-scam';
    renderIn('en', `/payment-scam/ticket-payment-scam${QUERY}`);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(en.nav.toggle_menu) }));
    const mobileOption = screen.getAllByRole('button', { name: new RegExp(NAMES.ru) }).at(-1)!;
    fireEvent.click(mobileOption);
    expect(hardNavigate).toHaveBeenCalledWith(`/ru/payment-scam/ticket-payment-scam${QUERY}`);
    expect(cookieValue()).toBe('NEXT_LOCALE=ru');
  });

  it('a page without query or fragment switches on the bare path', () => {
    renderIn('en', '/payment-safety');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(en.nav.select_language) }));
    fireEvent.click(screen.getByRole('option', { name: new RegExp(NAMES.ar) }));
    expect(hardNavigate).toHaveBeenCalledWith('/ar/payment-safety');
  });

  it('the home page: /ru to English is "/", English to Russian is "/ru"', () => {
    pathname = '/';
    renderIn('ru', `/ru${HASH}`);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(ru.nav.select_language) }));
    fireEvent.click(screen.getByRole('option', { name: new RegExp(NAMES.en) }));
    expect(hardNavigate).toHaveBeenLastCalledWith(`/${HASH}`);
    cleanup();
    renderIn('en', '/?utm=1');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(en.nav.select_language) }));
    fireEvent.click(screen.getByRole('option', { name: new RegExp(NAMES.ru) }));
    expect(hardNavigate).toHaveBeenLastCalledWith('/ru?utm=1');
  });

  it('choosing the language already shown does nothing: no navigation, no cookie', () => {
    renderIn('ru', `/ru/payment-safety${QUERY}${HASH}`);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(ru.nav.select_language) }));
    fireEvent.click(screen.getByRole('option', { name: new RegExp(NAMES.ru) }));
    expect(hardNavigate).not.toHaveBeenCalled();
    expect(cookieValue()).toBeUndefined();
  });

  it('nothing is kept in session storage for the switch', () => {
    renderIn('ru', `/ru/payment-safety${QUERY}${HASH}`);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(ru.nav.select_language) }));
    fireEvent.click(screen.getByRole('option', { name: new RegExp(NAMES.en) }));
    expect(sessionStorage.length).toBe(0);
  });
});

describe('address and cookie of a language switch', () => {
  it.each([
    ['en', '/', '', '', '/'],
    ['en', '/', '?a=1', '#x', '/?a=1#x'],
    ['ru', '/', '', '', '/ru'],
    ['ru', '/', '?a=1', '#x', '/ru?a=1#x'],
    ['en', '/pricing', '', '#plans', '/pricing#plans'],
    ['zh', '/services/litigation', '?q=%D1%82', '', '/zh/services/litigation?q=%D1%82'],
  ])('%s %s%s%s -> %s', (locale, path, search, hash, expected) => {
    expect(localeSwitchUrl(locale, path, search, hash)).toBe(expected);
  });

  it('the cookie is the one next-intl is configured with: same name, path, lifetime and SameSite', () => {
    expect(localeCookie('fr')).toBe(`NEXT_LOCALE=fr; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`);
    expect(LOCALE_COOKIE_MAX_AGE).toBe(31536000);
    expect(routing.localeCookie).toMatchObject({ name: 'NEXT_LOCALE', maxAge: LOCALE_COOKIE_MAX_AGE });
  });
});

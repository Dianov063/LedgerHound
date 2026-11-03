import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import Navbar from '@/components/Navbar';
import en from '@/messages/en.json';
import ru from '@/messages/ru.json';
import ar from '@/messages/ar.json';

const replace = vi.fn();
let pathname = '/payment-safety';
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}));
vi.mock('next/image', () => ({ default: () => null }));

const MESSAGES = { en, ru, ar } as const;
const NAMES = { en: 'English', ru: 'Русский', ar: 'العربية' } as const;

// Made-up values: repeated keys, an encoded Cyrillic word with a space, an encoded & and =, and an empty value.
const QUERY = '?mode=report&category=ticket_scam&tag=a&tag=b&q=%D1%82%D0%B5%D1%81%D1%82%20x%26y%3Dz&empty=';
const HASH = '#check';

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
  replace.mockClear();
  pathname = '/payment-safety';
  window.history.pushState({}, '', '/');
});

describe('language switcher', () => {
  it.each([
    ['en', '', 'ru'],
    ['ru', '/ru', 'ar'],
    ['ar', '/ar', 'en'],
  ] as const)('from %s keeps the path, query and fragment when switching', (from, prefix, to) => {
    renderIn(from, `${prefix}/payment-safety${QUERY}${HASH}`);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(MESSAGES[from].nav.select_language) }));
    fireEvent.click(screen.getByRole('option', { name: new RegExp(NAMES[to]) }));
    expect(replace).toHaveBeenCalledWith(`/payment-safety${QUERY}${HASH}`, { locale: to });
  });

  it('the mobile menu keeps them too', () => {
    pathname = '/payment-scam/ticket-payment-scam';
    renderIn('en', `/payment-scam/ticket-payment-scam${QUERY}`);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(en.nav.toggle_menu) }));
    const mobileOption = screen.getAllByRole('button', { name: new RegExp(NAMES.ru) }).at(-1)!;
    fireEvent.click(mobileOption);
    expect(replace).toHaveBeenCalledWith(`/payment-scam/ticket-payment-scam${QUERY}`, { locale: 'ru' });
  });

  it('a page without query or fragment switches on the bare path', () => {
    renderIn('en', '/payment-safety');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(en.nav.select_language) }));
    fireEvent.click(screen.getByRole('option', { name: new RegExp(NAMES.ar) }));
    expect(replace).toHaveBeenCalledWith('/payment-safety', { locale: 'ar' });
  });
});

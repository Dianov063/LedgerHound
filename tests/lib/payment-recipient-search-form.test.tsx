import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PaymentSafetyPage from '@/app/[locale]/payment-safety/page';
import { SEARCH_COUNTRY_REQUIRED } from '@/lib/payment-recipient-search';
import { translatePaymentSafety } from '@/lib/payment-safety-i18n';
import { locales } from '@/i18n';

let locale = 'en';
vi.mock('next-intl', () => ({ useLocale: () => locale }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/TurnstileWidget', () => ({ default: () => null }));
let calls: string[];
let matches: unknown[];
const result = (country: string, rail: string, count: number) => ({
  identityHash: `${country}-${rail}`, country, rail, identityMask: `${rail} email se***@example.invalid`,
  categories: ['fake_service'], paymentMethodDetails: [], categoryDetails: [], reportCount: count,
  independentReporters: count, paymentProofCount: 0, totalReportedAmount: 100, currency: 'USD',
});
beforeEach(() => {
  locale = 'en'; calls = []; matches = []; localStorage.clear();
  window.history.replaceState({}, '', '/payment-safety');
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify(String(url).includes('/search?') ? { matched: matches.length > 0, identities: matches } : {}), { status: 200 });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('recipient search form', () => {
  it('starts with all countries and methods and sends the expanded search', async () => {
    const { container } = render(<PaymentSafetyPage />);
    expect(screen.getByLabelText('Country')).toHaveValue('all');
    expect(screen.getByLabelText('Payment method')).toHaveValue('all');
    fireEvent.change(screen.getByLabelText('Recipient identifier'), { target: { value: 'seller@example.invalid' } });
    fireEvent.submit(container.querySelector('form')!);
    await screen.findByText('No matching reports found');
    const params = new URL(calls.find(u => u.includes('/search?'))!, 'http://localhost').searchParams;
    expect(params.get('country')).toBe('all'); expect(params.get('rail')).toBe('all');
  });
  it('renders every match with its own country, method and report count', async () => {
    matches = [result('US', 'paypal', 3), result('GB', 'email', 5)];
    const { container } = render(<PaymentSafetyPage />);
    fireEvent.change(screen.getByLabelText('Recipient identifier'), { target: { value: 'seller@example.invalid' } });
    fireEvent.submit(container.querySelector('form')!);
    await screen.findByText('United States (US) / PayPal');
    expect(screen.getByText('United Kingdom (GB) / Email')).toBeInTheDocument();
    const cards = container.querySelectorAll('aside');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('3'); expect(cards[1]).toHaveTextContent('5');
    expect(screen.queryByText('8')).not.toBeInTheDocument();
  });
  it('asks for the country before searching a local number, then allows the corrected search', async () => {
    const { container } = render(<PaymentSafetyPage />);
    fireEvent.change(screen.getByLabelText('Recipient identifier'), { target: { value: '2125550199' } });
    fireEvent.submit(container.querySelector('form')!);
    await screen.findByText(SEARCH_COUNTRY_REQUIRED);
    expect(calls.some(u => u.includes('/search?'))).toBe(false);
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'US' } });
    fireEvent.submit(container.querySelector('form')!);
    await screen.findByText('No matching reports found');
  });
  it('keeps report-country and report-method concrete, without adding all to the intake', async () => {
    const { container } = render(<PaymentSafetyPage />);
    fireEvent.click(screen.getByText('Report recipient'));
    await waitFor(() => expect(container.querySelector('select[name="country"]')).not.toBeNull());
    const country = container.querySelector('select[name="country"]')!;
    const rail = container.querySelector('select[name="rail"]')!;
    expect(country).toHaveValue('US'); expect(rail).toHaveValue('zelle');
    expect(country.querySelector('option[value="all"]')).toBeNull();
    expect(rail.querySelector('option[value="all"]')).toBeNull();
  });
  it.each(locales.filter(l => l !== 'en'))('%s translates the expanded search labels and errors', (language) => {
    locale = language; render(<PaymentSafetyPage />);
    for (const text of ['All countries', 'All payment methods', SEARCH_COUNTRY_REQUIRED, 'Results are shown separately by country and payment method.']) {
      expect(translatePaymentSafety(language, text)).not.toBe(text);
    }
    expect(screen.getByLabelText(translatePaymentSafety(language, 'Country'))).toHaveValue('all');
  });
});

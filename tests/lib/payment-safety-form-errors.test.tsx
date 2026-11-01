import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { locales } from '@/i18n';
import { translatePaymentSafety } from '@/lib/payment-safety-i18n';
import PaymentSafetyPage from '@/app/[locale]/payment-safety/page';
import PaymentSafetyCorrectionPage from '@/app/[locale]/payment-safety/correction/page';

let currentLocale = 'en';
vi.mock('next-intl', () => ({ useLocale: () => currentLocale }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/TurnstileWidget', () => ({
  default: function TurnstileStub({ onToken }: { onToken: (token: string) => void }) {
    useEffect(() => onToken('test-token'), [onToken]);
    return null;
  },
}));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

type Failure = 'rejected' | 'not-json' | 'known' | 'unknown';
const RAW_NETWORK = 'Failed to fetch';
const RAW_INTERNAL = 'dynamodb node-7 exploded';

/** What the failing endpoint answers in each state. */
const failing = (failure: Failure, knownMessage: string) => {
  if (failure === 'rejected') return Promise.reject(new TypeError(RAW_NETWORK));
  if (failure === 'not-json') return Promise.resolve(new Response('<html>Bad gateway</html>', { status: 502 }));
  if (failure === 'known') return Promise.resolve(json({ error: knownMessage }, 400));
  return Promise.resolve(json({ error: RAW_INTERNAL }, 500));
};

/** English source of what the visitor should see: the API message if known, else the operation's fallback. */
const source = (failure: Failure, fallback: string, known: string) => (failure === 'known' ? known : fallback);

const errorBox = (container: HTMLElement) => container.querySelector('.bg-red-50');
const FAILURES: Failure[] = ['rejected', 'not-json', 'known', 'unknown'];
// English shows the API's own text: the API answers in English with messages written for visitors.
const CASES = locales
  .flatMap((locale) => FAILURES.map((failure) => [locale, failure] as const))
  .filter(([locale, failure]) => !(locale === 'en' && failure === 'unknown'));

const expectSafeMessage = (box: Element | null, locale: string, english: string) => {
  const message = translatePaymentSafety(locale, english);
  if (locale !== 'en') expect(message).not.toBe(english);
  expect(box).toHaveTextContent(message);
  expect(box?.textContent).not.toContain(RAW_NETWORK);
  expect(box?.textContent).not.toContain(RAW_INTERNAL);
  expect(box?.textContent).not.toMatch(/Unexpected token|is not valid JSON/);
};

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
  window.history.pushState({}, '', '/');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('recipient search', () => {
  const KNOWN = 'Rate limit exceeded';

  it.each(CASES)('%s shows a safe message on %s and can search again', async (locale, failure) => {
    currentLocale = locale;
    let fail = true;
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (!String(url).includes('/search?')) return Promise.resolve(json({}));
      return fail ? failing(failure, KNOWN) : Promise.resolve(json({ matched: false }));
    }));
    const { container } = render(<PaymentSafetyPage />);
    const form = container.querySelector('main form') as HTMLFormElement;
    const input = form.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '+15551234567' } });
    fireEvent.submit(form);

    await waitFor(() => expect(errorBox(container)).not.toBeNull());
    expectSafeMessage(errorBox(container), locale, source(failure, 'Search failed', KNOWN));
    const button = form.querySelector('button[type=submit]') as HTMLButtonElement;
    expect(button).toBeEnabled();
    expect(form.querySelector('.animate-spin')).toBeNull();

    fail = false;
    fireEvent.submit(form);
    await screen.findByText(translatePaymentSafety(locale, 'No matching reports found'));
    expect(errorBox(container)).toBeNull();
  });
});

const saveCompleteDraft = () => {
  localStorage.setItem('ledgerhound:payment-report-draft:v2', JSON.stringify({
    step: 5,
    updatedAt: new Date().toISOString(),
    fields: {
      country: 'US',
      rail: 'bank_account',
      category: 'ticket_scam',
      saleChannel: 'telegram',
      communityLanguage: 'english',
      itemOrService: 'Concert ticket',
      paymentIdentifier: 'recipient@example.invalid',
      description: 'x'.repeat(100),
      reporterEmail: 'qa@example.invalid',
      refundRequested: false,
    },
  }));
  window.history.pushState({}, '', '/?mode=report');
};

describe('report submission', () => {
  const DUPLICATE = 'A report from this email about this recipient was already received in the last 24 hours.';

  const start = async (locale: string, routes: (url: string, init?: RequestInit) => Promise<Response>) => {
    currentLocale = locale;
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => routes(String(url), init)));
    saveCompleteDraft();
    const view = render(<PaymentSafetyPage />);
    fireEvent.click(await screen.findByText(translatePaymentSafety(locale, 'Continue draft')));
    const form = view.container.querySelector('form[class*="scroll-mt"]') as HTMLFormElement;
    await waitFor(() => expect(form.querySelector('button[type=submit]')).toBeEnabled());
    return { ...view, form };
  };

  it.each(CASES)('%s shows a safe message on %s and recovers', async (locale, failure) => {
    const { container, form } = await start(locale, (url, init) => {
      if (url.includes('/challenge') && init?.method === 'POST') return Promise.resolve(json({ submissionToken: 'sub' }));
      if (url.includes('/report')) return failing(failure, DUPLICATE);
      return Promise.resolve(json({}));
    });
    fireEvent.submit(form);

    await waitFor(() => expect(errorBox(container)).not.toBeNull());
    expectSafeMessage(errorBox(container), locale, source(failure, 'Report failed', DUPLICATE));
    expect(form.querySelector('.animate-spin')).toBeNull();
    expect(form.querySelector('.bg-blue-50')).toBeNull();
    await waitFor(() => expect(form.querySelector('button[type=submit]')).toBeEnabled());
  });

  it.each(locales)('%s shows the report message when the security check request fails', async (locale) => {
    const { container, form } = await start(locale, (url, init) => {
      if (url.includes('/challenge') && init?.method === 'POST') return Promise.reject(new TypeError(RAW_NETWORK));
      return Promise.resolve(json({}));
    });
    fireEvent.submit(form);

    await waitFor(() => expect(errorBox(container)).not.toBeNull());
    expectSafeMessage(errorBox(container), locale, 'Report failed');
  });

  it.each(locales)('%s shows a translated API message from the security check', async (locale) => {
    const { container, form } = await start(locale, (url, init) => {
      if (url.includes('/challenge') && init?.method === 'POST') return Promise.resolve(json({ error: 'Security check failed.' }, 400));
      return Promise.resolve(json({}));
    });
    fireEvent.submit(form);

    await waitFor(() => expect(errorBox(container)).not.toBeNull());
    expectSafeMessage(errorBox(container), locale, 'Security check failed.');
  });

  describe('resending the verification email', () => {
    const RESEND_KNOWN = 'Email is already verified';

    it.each(CASES)('%s shows a safe message on %s', async (locale, failure) => {
      const { container, form } = await start(locale, (url, init) => {
        if (url.includes('/challenge') && init?.method === 'POST') return Promise.resolve(json({ submissionToken: 'sub' }));
        if (url.includes('/report')) return Promise.resolve(json({ reportId: 'RPT-42', verificationEmailSent: false }));
        if (url.includes('/verify-email')) return failing(failure, RESEND_KNOWN);
        return Promise.resolve(json({}));
      });
      fireEvent.submit(form);
      const resend = await screen.findByText(translatePaymentSafety(locale, 'Resend verification email'));
      fireEvent.click(resend);

      await waitFor(() => expect(errorBox(container)).not.toBeNull());
      expectSafeMessage(errorBox(container), locale, source(failure, 'Unable to resend verification email', RESEND_KNOWN));
      expect(resend).toBeEnabled();
    });
  });
});

describe('correction request', () => {
  const KNOWN = 'Explanation must be at least 200 characters.';
  const FALLBACK = 'Unable to submit correction request';

  const start = (locale: string, routes: () => Promise<Response>) => {
    currentLocale = locale;
    vi.stubGlobal('fetch', vi.fn(routes));
    const view = render(<PaymentSafetyCorrectionPage />);
    return { ...view, form: view.container.querySelector('form') as HTMLFormElement };
  };

  it.each(CASES)('%s shows a safe message on %s and can submit again', async (locale, failure) => {
    let fail = true;
    const { container, form } = start(locale, () => (
      fail ? failing(failure, KNOWN) : Promise.resolve(json({ correctionId: 'COR-1' }))
    ));
    fireEvent.submit(form);

    await waitFor(() => expect(errorBox(container)).not.toBeNull());
    expectSafeMessage(errorBox(container), locale, source(failure, FALLBACK, KNOWN));
    const button = form.querySelector('button[type=submit]') as HTMLButtonElement;
    expect(button).toBeEnabled();
    expect(form.querySelector('.animate-spin')).toBeNull();

    fail = false;
    fireEvent.submit(form);
    await screen.findByText('COR-1');
    expect(errorBox(container)).toBeNull();
  });

  it.each(locales)('%s reports success and clears the form', async (locale) => {
    const { container, form } = start(locale, () => Promise.resolve(json({ correctionId: 'COR-2' })));
    const identifier = form.elements.namedItem('paymentIdentifier') as HTMLInputElement;
    fireEvent.change(identifier, { target: { value: '+15551234567' } });
    fireEvent.submit(form);

    await screen.findByText('COR-2');
    expect(errorBox(container)).toBeNull();
    expect(identifier.value).toBe('');
  });
});

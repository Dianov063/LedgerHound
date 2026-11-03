import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import EmergencyPage from '@/app/[locale]/emergency/page';
import en from '@/messages/en.json';
import ru from '@/messages/ru.json';
import ar from '@/messages/ar.json';

vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));

const MESSAGES = { en, ru, ar } as const;
type Locale = keyof typeof MESSAGES;
const flow = (locale: Locale) => MESSAGES[locale].emergency_flow;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const ANALYSIS = {
  route: 'URGENT',
  caseId: 'EMG-TEST',
  caseSecret: 'secret',
  analysis: { recoveryScore: 62, exchange: null, daysSince: 1, scamDbMatch: null, victimCount: 3, totalLoss: 42000, threshold: 500000 },
};

type Routes = Partial<Record<'analyze' | 'checkout' | 'join', () => Promise<Response>>>;

function stubFetch(routes: Routes) {
  const calls: string[] = [];
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    const name = (['analyze', 'checkout', 'join'] as const).find((key) => String(url).includes(key === 'join' ? 'join-group' : key));
    calls.push(name || String(url));
    return name && routes[name] ? routes[name]!() : Promise.resolve(json({}));
  }));
  return calls;
}

function renderIn(locale: Locale, ui: ReactElement) {
  return render(<NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>{ui}</NextIntlClientProvider>);
}

/** Fill steps 1–3 the way a visitor does and stop on the analyze button. */
function reachStepThree(locale: Locale, platformName = 'Example Exchange') {
  const view = renderIn(locale, <EmergencyPage />);
  fireEvent.change(document.querySelector('#country')!, { target: { value: 'US' } });
  fireEvent.change(document.querySelector('input[type=number]')!, { target: { value: '5000' } });
  fireEvent.click(screen.getByRole('button', { name: new RegExp(flow(locale).analyze_cta) }));
  fireEvent.change(document.querySelector('#walletAddress')!, { target: { value: '0x2222222222222222222222222222222222222222' } });
  fireEvent.change(document.querySelector('#txDate')!, { target: { value: '2026-10-20' } });
  if (platformName) {
    fireEvent.change(screen.getByPlaceholderText(flow(locale).platform_placeholder), { target: { value: platformName } });
  }
  fireEvent.click(screen.getByRole('button', { name: new RegExp(flow(locale).next) }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(flow(locale).scam_types.romance) }));
  fireEvent.change(document.querySelector('#description')!, { target: { value: 'x'.repeat(120) } });
  fireEvent.change(document.querySelector('#email')!, { target: { value: 'qa@example.invalid' } });
  return view;
}

const analyzeButton = (locale: Locale) => screen.getByRole('button', { name: new RegExp(flow(locale).analyze_cta) });

async function reachResults(locale: Locale) {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  fireEvent.click(analyzeButton(locale));
  await screen.findByText(flow(locale).analysis_title);
  await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
  await screen.findByText(flow(locale).urgent_title);
}

beforeEach(() => {
  window.history.pushState({}, '', '/');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Emergency analysis failures', () => {
  const failures: [string, () => Promise<Response>, keyof ReturnType<typeof flow>][] = [
    ['server error', () => Promise.resolve(json({ error: 'Failed to analyze emergency case' }, 500)), 'error_analyze'],
    ['rate limit', () => Promise.resolve(json({ error: 'Rate limit exceeded. Try again later.' }, 429)), 'error_rate_limited'],
    ['network failure', () => Promise.reject(new TypeError('Failed to fetch')), 'error_analyze'],
    ['unreadable answer', () => Promise.resolve(new Response('<html>Bad gateway</html>', { status: 502 })), 'error_analyze'],
    ['answer without a route', () => Promise.resolve(json({ caseId: 'x' })), 'error_analyze'],
  ];

  it.each((['en', 'ru', 'ar'] as Locale[]).flatMap((locale) => failures.map(([name, answer, key]) => [locale, name, answer, key] as const)))(
    '%s: %s keeps the answers and shows a message instead of a result',
    async (locale, _name, answer, key) => {
      stubFetch({ analyze: answer });
      reachStepThree(locale);
      fireEvent.click(analyzeButton(locale));

      expect(await screen.findByRole('alert')).toHaveTextContent(flow(locale)[key] as string);
      // Still on step 3 with the visitor's answers; no invented score or route.
      expect(screen.getByText(flow(locale).story_title)).toBeInTheDocument();
      expect((document.querySelector('#email') as HTMLInputElement).value).toBe('qa@example.invalid');
      expect(screen.queryByText(flow(locale).analysis_title)).toBeNull();
      expect(screen.queryByText('35%')).toBeNull();
      expect(analyzeButton(locale)).toBeEnabled();
    },
  );

  it('a retry after the failure reaches the analysis', async () => {
    let fail = true;
    stubFetch({ analyze: () => (fail ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve(json(ANALYSIS))) });
    reachStepThree('en');
    fireEvent.click(analyzeButton('en'));
    await screen.findByRole('alert');
    fail = false;
    fireEvent.click(analyzeButton('en'));
    expect(await screen.findByText(flow('en').analysis_title)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Emergency checkout and group failures', () => {
  const checkout: [string, () => Promise<Response>, keyof ReturnType<typeof flow>][] = [
    ['server error', () => Promise.resolve(json({ error: 'Unable to start checkout. Please try again.' }, 500)), 'error_checkout'],
    ['missing case', () => Promise.resolve(json({ error: 'Missing caseId' }, 400)), 'error_checkout'],
    ['already paid', () => Promise.resolve(json({ error: 'This case has already been paid.' }, 409)), 'error_already_paid'],
    ['rate limit', () => Promise.resolve(json({ error: 'Rate limit exceeded.' }, 429)), 'error_rate_limited'],
    ['network failure', () => Promise.reject(new TypeError('Failed to fetch')), 'error_checkout'],
    ['answer without a URL', () => Promise.resolve(json({})), 'error_checkout'],
  ];

  it.each(checkout)('checkout %s shows a message and re-enables the button', async (_name, answer, key) => {
    stubFetch({ analyze: () => Promise.resolve(json(ANALYSIS)), checkout: answer });
    reachStepThree('ru');
    await reachResults('ru');
    const buy = screen.getByRole('button', { name: new RegExp(flow('ru').get_documents) });
    fireEvent.click(buy);
    expect(await screen.findByRole('alert')).toHaveTextContent(flow('ru')[key] as string);
    await waitFor(() => expect(screen.getByRole('button', { name: new RegExp(flow('ru').get_documents) })).toBeEnabled());
  });

  it.each([
    ['server error', () => Promise.resolve(json({ error: 'Failed to join group' }, 500)), 'error_join'],
    ['rate limit', () => Promise.resolve(json({ error: 'Rate limit exceeded.' }, 429)), 'error_rate_limited'],
    ['network failure', () => Promise.reject(new TypeError('Failed to fetch')), 'error_join'],
  ] as const)('joining the group: %s shows a message', async (_name, answer, key) => {
    stubFetch({ analyze: () => Promise.resolve(json(ANALYSIS)), join: answer });
    reachStepThree('ar');
    await reachResults('ar');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(flow('ar').join_group_link) }));
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(flow('ar').join_group) }));
    expect(await screen.findByRole('alert')).toHaveTextContent(flow('ar')[key]);
  });

  it('joining without a platform name asks for it and sends nothing', async () => {
    const calls = stubFetch({ analyze: () => Promise.resolve(json(ANALYSIS)), join: () => Promise.resolve(json({ success: true })) });
    reachStepThree('en', '');
    await reachResults('en');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(flow('en').join_group_link) }));
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(flow('en').join_group) }));
    expect(await screen.findByRole('alert')).toHaveTextContent(flow('en').error_join_platform);
    expect(calls).not.toContain('join');
  });

  it('switching to the group view clears a checkout error', async () => {
    stubFetch({ analyze: () => Promise.resolve(json(ANALYSIS)), checkout: () => Promise.reject(new TypeError('Failed to fetch')) });
    reachStepThree('en');
    await reachResults('en');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(flow('en').get_documents) }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(flow('en').join_group_link) }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});

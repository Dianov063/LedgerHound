import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import EmergencyPage from '@/app/[locale]/emergency/page';
import en from '@/messages/en.json';
import ar from '@/messages/ar.json';

vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));

const MESSAGES = { en, ar } as const;
type Locale = keyof typeof MESSAGES;
const flow = (locale: Locale) => MESSAGES[locale].emergency_flow;
const WALLET = '0x2222222222222222222222222222222222222222';

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

/** Answer steps 1–3, run the analysis with this answer and wait for the results. */
async function showResults(locale: Locale, route: string, analysis: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(json({ route, caseId: 'EMG-TEST', caseSecret: 's', analysis }))));
  render(<NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}><EmergencyPage /></NextIntlClientProvider>);
  const f = flow(locale);
  fireEvent.change(document.querySelector('#country')!, { target: { value: 'US' } });
  fireEvent.change(document.querySelector('input[type=number]')!, { target: { value: '5000' } });
  fireEvent.click(screen.getByRole('button', { name: new RegExp(f.analyze_cta) }));
  fireEvent.change(document.querySelector('#walletAddress')!, { target: { value: WALLET } });
  fireEvent.change(document.querySelector('#txDate')!, { target: { value: '2026-10-20' } });
  fireEvent.change(screen.getByPlaceholderText(f.platform_placeholder), { target: { value: 'Demo Platform' } });
  fireEvent.click(screen.getByRole('button', { name: new RegExp(f.next) }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(f.scam_types.romance) }));
  fireEvent.change(document.querySelector('#description')!, { target: { value: 'x'.repeat(120) } });
  fireEvent.change(document.querySelector('#email')!, { target: { value: 'qa@example.invalid' } });
  vi.useFakeTimers({ shouldAdvanceTime: true });
  fireEvent.click(screen.getByRole('button', { name: new RegExp(f.analyze_cta) }));
  await screen.findByText(f.analysis_title);
  await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
  await screen.findByText(f.facts_checks);
}

/** Text of the step 5 results, without the progress bar above them. */
const results = () => screen.getByRole('heading', { level: 2 }).parentElement!.parentElement!.textContent;

/** The value shown next to a label in the results. */
const fact = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent;

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Emergency results', () => {
  it('shows the answers apart from the checks, without a score or countdown', async () => {
    await showResults('en', 'EMERGENCY', {
      exchange: 'Binance', daysSince: 2, ofacStatus: 'clear', scamDbStatus: 'match',
      scamDbMatch: { slug: 'demo-platform', name: 'Demo Platform', victims: 4, totalLoss: 90000 },
    });
    const f = flow('en');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('The receiving address matches a known exchange: Binance');
    expect(fact(f.fact_sent)).toBe('2 days ago');
    expect(fact(f.fact_address)).toBe(WALLET);
    expect(fact(f.fact_exchange)).toBe("Matches Binance in LedgerHound's reference list of exchange addresses");
    expect(fact(f.fact_ofac)).toBe(f.fact_ofac_clear);
    expect(fact(f.fact_scam_db)).toBe('Demo Platform: 4 reports');
    expect(screen.getByText(f.fact_exchange_note)).toBeInTheDocument();
    expect(screen.getByText(f.act_text)).toBeInTheDocument();
    expect(results()).not.toMatch(/\d+%|hours?\b|Recovery Score|500\+/i);
  });

  it('lists only the documents the pack contains', async () => {
    await showResults('en', 'URGENT', { exchange: null, daysSince: 5, ofacStatus: 'clear', scamDbStatus: 'no_match' });
    const f = flow('en');
    const items = within(screen.getByText(f.pack_title).closest('div')!.parentElement!).getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual([
      f.pack_forensic,
      'Police Report (FBI IC3)',
      'Preservation Letter for Exchange',
      f.pack_regulator,
      f.pack_steps,
    ]);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(f.result_no_exchange_title);
  });

  it('never shows an unreadable source as clean', async () => {
    await showResults('en', 'URGENT', { exchange: null, daysSince: 5, ofacStatus: 'unavailable', scamDbStatus: 'unavailable' });
    const f = flow('en');
    expect(fact(f.fact_ofac)).toBe(f.fact_ofac_unavailable);
    expect(fact(f.fact_scam_db)).toBe(f.fact_scam_db_unavailable);
    expect(screen.queryByText(f.fact_ofac_clear)).toBeNull();
  });

  it('shows an answer without statuses as not checked', async () => {
    await showResults('en', 'URGENT', { exchange: null, daysSince: 0 });
    const f = flow('en');
    expect(fact(f.fact_sent)).toBe(f.fact_sent_today);
    expect(fact(f.fact_ofac)).toBe(f.fact_ofac_not_checked);
    expect(fact(f.fact_scam_db)).toBe(f.fact_scam_db_not_checked);
  });

  it('offers the list without a threshold or a notification promise', async () => {
    await showResults('en', 'AGGREGATOR', { exchange: null, daysSince: 30, ofacStatus: 'clear', scamDbStatus: 'no_match' });
    const f = flow('en');
    expect(screen.getByText(f.group_text)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(f.join_group) })).toBeInTheDocument();
    expect(screen.queryByText(f.pack_title)).toBeNull();
    expect(results()).not.toMatch(/threshold|notify|%/i);
  });

  it('uses the Arabic plural forms', async () => {
    await showResults('ar', 'URGENT', { exchange: null, daysSince: 1, ofacStatus: 'clear', scamDbStatus: 'no_match' });
    expect(fact(flow('ar').fact_sent)).toBe('قبل يوم واحد');
  });
});

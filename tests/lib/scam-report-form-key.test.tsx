/**
 * Package 58 (Codex round 5, follow-up): the scam report form sends ONE submission key with every
 * attempt of a submission, so a retry after an error completes the earlier report on the server
 * (tests/api/scam-report-submission-key.test.ts) instead of adding a second one.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SUBMISSION_KEY_PATTERN } from '@/lib/submission-key';
import ReportScamPage from '@/app/[locale]/scam-database/report/page';

vi.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => (key: string) => key }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const DESCRIPTION = 'Synthetic complaint for the form key test. Every detail is fictional and nothing here refers to a real person or company.';

/** Fill the required fields and go to the last step. */
function fillForm() {
  fireEvent.change(screen.getByPlaceholderText('field_platform_name_ph'), { target: { value: 'QA Form Key Exchange' } });
  fireEvent.click(screen.getByText('Fake Exchange'));
  fireEvent.change(screen.getByPlaceholderText('field_description_ph'), { target: { value: DESCRIPTION } });
  for (let i = 0; i < 3; i++) fireEvent.click(screen.getByText('btn_next'));
}

const submittedKeys = (fetchMock: ReturnType<typeof vi.fn>) => fetchMock.mock.calls
  .filter(([url]) => String(url) === '/api/scam-database/report')
  .map(([, init]) => JSON.parse(String((init as RequestInit).body)).submissionKey as string);

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('scam report form: submission key', () => {
  it('a retry after a server error sends the same key; the success screen shows the report', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ error: 'Failed to submit report' }, 500))
      .mockResolvedValueOnce(json({ reportId: 'SB0000000000-000000', trustTier: 1, verified: false, recoveryScore: null }));
    vi.stubGlobal('fetch', fetchMock);
    render(<ReportScamPage />);
    fillForm();

    fireEvent.click(screen.getByText('btn_submit'));
    await screen.findByText('Failed to submit report');
    fireEvent.click(screen.getByText('btn_submit'));
    await screen.findByText('report_submitted_title');

    const keys = submittedKeys(fetchMock);
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(SUBMISSION_KEY_PATTERN);
    expect(keys[1]).toBe(keys[0]);
  });

  it('a network failure, then editing a field, then a retry: still the same key', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(json({ reportId: 'SB0000000000-000001', trustTier: 1, verified: false, recoveryScore: null }));
    vi.stubGlobal('fetch', fetchMock);
    render(<ReportScamPage />);
    fillForm();
    fireEvent.click(screen.getByText('btn_submit'));
    await screen.findByText('Failed to submit report. Please try again.');
    fireEvent.change(screen.getByPlaceholderText('your@email.com (optional)'), { target: { value: 'later@qa-mail.invalid' } });
    fireEvent.click(screen.getByText('btn_submit'));
    await waitFor(() => expect(submittedKeys(fetchMock)).toHaveLength(2));
    const [first, second] = submittedKeys(fetchMock);
    expect(second).toBe(first);
  });

  it('a new form (a new submission) gets a new key', async () => {
    const keys: string[] = [];
    for (let i = 0; i < 2; i++) {
      const fetchMock = vi.fn().mockResolvedValue(json({ reportId: `SB000000000${i}-000000`, trustTier: 1, verified: false, recoveryScore: null }));
      vi.stubGlobal('fetch', fetchMock);
      render(<ReportScamPage />);
      fillForm();
      fireEvent.click(screen.getByText('btn_submit'));
      await screen.findByText('report_submitted_title');
      keys.push(...submittedKeys(fetchMock));
      cleanup();
    }
    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toBe(keys[1]);
  });
});

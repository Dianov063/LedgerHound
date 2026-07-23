import { describe, expect, it } from 'vitest';
import { locales } from '@/i18n';
import { translatePaymentSafety } from '@/lib/payment-safety-i18n';

const REQUIRED_TRANSLATIONS = [
  'Payment Recipient Safety Check | LedgerHound',
  'Payment recipient safety',
  'Check a payment recipient before sending money.',
  'Report a payment recipient',
  'Country',
  'Security check',
  'Complete the security check before submitting.',
  'Security check expired. Please try again.',
  'Security check unavailable. Refresh the page and try again.',
  'European Union',
  'Other territory',
  'Payment method',
  'Category',
  'Community language',
  'Popular languages',
  'More languages',
  'Group or channel name',
  'What happened?',
  'Who did you send the money to?',
  'Wise email, phone, or recipient account',
  'Your quick report is ready to review',
  'Check the answers below, add anything useful, and submit when you are ready.',
  'Review and send',
  'Finish later',
  'Did you report it anywhere else?',
  'Submit private report',
  'Public payment warnings',
];

describe('payment safety localization', () => {
  it('translates the reporting flow for every non-English locale', () => {
    for (const locale of locales.filter((value) => value !== 'en')) {
      for (const source of REQUIRED_TRANSLATIONS) {
        expect(translatePaymentSafety(locale, source), `${locale}: ${source}`).not.toBe(source);
      }
    }
  });

  it('keeps English and unsupported locales stable', () => {
    expect(translatePaymentSafety('en', 'Country')).toBe('Country');
    expect(translatePaymentSafety('unsupported', 'Country')).toBe('Country');
  });
});

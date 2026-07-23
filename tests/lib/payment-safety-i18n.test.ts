import { describe, expect, it } from 'vitest';
import { locales } from '@/i18n';
import { translatePaymentSafety } from '@/lib/payment-safety-i18n';

const REQUIRED_TRANSLATIONS = [
  'Payment Recipient Safety Check | LedgerHound',
  'Payment recipient safety',
  'Check a payment recipient before sending money.',
  'Report a payment recipient',
  'Country',
  'Payment method',
  'Category',
  'Community language',
  'Group or channel name',
  'What happened?',
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

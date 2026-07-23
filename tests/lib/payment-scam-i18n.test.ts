import { describe, expect, it } from 'vitest';
import { locales } from '@/i18n';
import { getTelegramScamCopy } from '@/lib/payment-scam-i18n';

describe('Telegram scam localization', () => {
  it('provides complete content for every supported locale', () => {
    const english = getTelegramScamCopy('en');

    for (const locale of locales) {
      const copy = getTelegramScamCopy(locale);

      expect(copy.title).toBeTruthy();
      expect(copy.description).toBeTruthy();
      expect(copy.metadataTitle).toContain('LedgerHound');
      expect(copy.examples).toHaveLength(3);
      expect(copy.collect).toHaveLength(5);
      expect(copy.faqPublicQuestion).toBeTruthy();
      expect(copy.faqMethodsAnswer).toBeTruthy();

      if (locale !== 'en') {
        expect(copy.title).not.toBe(english.title);
        expect(copy.description).not.toBe(english.description);
      }
    }
  });

  it('falls back to English for unsupported locales', () => {
    expect(getTelegramScamCopy('unsupported')).toEqual(getTelegramScamCopy('en'));
  });
});

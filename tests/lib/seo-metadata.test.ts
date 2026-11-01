// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { locales } from '@/i18n';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { generateMetadata as safetyMetadata } from '@/app/[locale]/payment-safety/layout';
import { generateMetadata as correctionMetadata } from '@/app/[locale]/payment-safety/correction/layout';
import { generateMetadata as scenarioMetadata } from '@/app/[locale]/payment-scam/[scenario]/layout';
import { generateMetadata as reportMetadata } from '@/app/[locale]/payment-scam-report/layout';
import { generateMetadata as emergencyMetadata } from '@/app/[locale]/emergency/layout';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
  getRequestConfig: (fn: unknown) => fn,
}));
vi.mock('@/lib/investigators/storage', () => ({
  listApproved: async () => [
    { id: 'with-date', updatedAt: '2026-03-01T00:00:00.000Z' },
    { id: 'no-date' },
  ],
}));
vi.mock('@/lib/scam-db', () => ({
  getPlatformIndex: async () => [
    { slug: 'with-date', lastReported: '2026-04-01T00:00:00.000Z' },
    { slug: 'no-date' },
  ],
}));

const SITE = 'https://www.ledgerhound.vip';
const TELEGRAM = '/payment-scam/telegram-payment-scams';
const SCENARIOS = [
  'telegram-payment-scams',
  'marketplace-payment-scam',
  'ticket-payment-scam',
  'goods-not-delivered-payment-scam',
  'fake-local-service-scam',
];
const TRANSLATED_PATHS = ['/payment-safety', '/crypto', '/emergency', '/payment-scam-report', ...SCENARIOS.map((slug) => `/payment-scam/${slug}`)];
const urlFor = (locale: string, path: string) => `${SITE}${locale === 'en' ? '' : `/${locale}`}${path}`;
const hreflang = (path: string) => ({
  ...Object.fromEntries(locales.map((l) => [l, urlFor(l, path)])),
  'x-default': `${SITE}${path}`,
});

describe('sitemap', () => {
  it('lists translated pages for every locale with reciprocal hreflang', async () => {
    const entries = await sitemap();
    for (const path of TRANSLATED_PATHS) {
      for (const locale of locales) {
        const entry = entries.find((e) => e.url === urlFor(locale, path));
        expect(entry?.alternates?.languages).toEqual(hreflang(path));
      }
    }
  });

  it('has no duplicate URLs', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('sets lastModified only from real change dates', async () => {
    const entries = await sitemap();
    const dated = entries.filter((e) => e.lastModified !== undefined);
    expect(dated.length).toBe(locales.length * 2);
    expect(dated.every((e) => /\/(investigators|scam-database\/platform)\/with-date$/.test(e.url))).toBe(true);
    expect(entries.find((e) => e.url === `${SITE}/investigators/with-date`)?.lastModified).toEqual(new Date('2026-03-01T00:00:00.000Z'));
    expect(entries.find((e) => e.url === `${SITE}/scam-database/platform/with-date`)?.lastModified).toEqual(new Date('2026-04-01T00:00:00.000Z'));
  });
});

describe('page metadata', () => {
  it.each(locales)('/payment-safety in %s has its own canonical and all hreflang', async (locale) => {
    const m = await safetyMetadata({ params: { locale } });
    expect(m.alternates?.canonical).toBe(urlFor(locale, '/payment-safety'));
    expect(m.alternates?.languages).toEqual(hreflang('/payment-safety'));
    expect(m.robots).toBeUndefined();
    expect(m.title).toBeTruthy();
  });

  it('/payment-safety keeps its translated title', async () => {
    const en = await safetyMetadata({ params: { locale: 'en' } });
    const ru = await safetyMetadata({ params: { locale: 'ru' } });
    expect(ru.title).not.toBe(en.title);
  });

  it.each(locales)('the noindex correction page in %s does not inherit canonical or hreflang', async (locale) => {
    const m = await correctionMetadata({ params: { locale } });
    expect(m.robots).toEqual({ index: false, follow: false });
    expect(m.alternates).toBeNull();
  });

  it('the correction page keeps a translated title', async () => {
    const en = await correctionMetadata({ params: { locale: 'en' } });
    const ar = await correctionMetadata({ params: { locale: 'ar' } });
    expect(ar.title).not.toBe(en.title);
  });

  it('the correction page is not listed in the sitemap', async () => {
    expect((await sitemap()).filter((e) => e.url.includes('/correction'))).toEqual([]);
  });

  describe.each(SCENARIOS)('scenario %s', (slug) => {
    const path = `/payment-scam/${slug}`;

    it.each(locales)('in %s has its own canonical, all hreflang and its own copy', async (locale) => {
      const { getScenarioCopy } = await import('@/lib/payment-scam-i18n');
      const m = await scenarioMetadata({ params: { locale, scenario: slug } });
      expect(m.alternates?.canonical).toBe(urlFor(locale, path));
      expect(m.alternates?.languages).toEqual(hreflang(path));
      expect(m.title).toBe(getScenarioCopy(slug, locale).metadataTitle);
      expect(m.description).toBe(getScenarioCopy(slug, locale).metadataDescription);
    });
  });

  it('the old Telegram alias resolves to the same canonical', async () => {
    const m = await scenarioMetadata({ params: { locale: 'ru', scenario: 'telegram-russian-community-scams' } });
    expect(m.alternates?.canonical).toBe(urlFor('ru', TELEGRAM));
  });

  it('the Telegram scenario keeps its localized title and description', async () => {
    const { getTelegramScamCopy } = await import('@/lib/payment-scam-i18n');
    const m = await scenarioMetadata({ params: { locale: 'ru', scenario: 'telegram-payment-scams' } });
    expect(m.title).toBe(getTelegramScamCopy('ru').metadataTitle);
    expect(m.description).toBe(getTelegramScamCopy('ru').metadataDescription);
  });

  it.each(locales)('/payment-scam-report in %s has its own canonical and all hreflang', async (locale) => {
    const m = await reportMetadata({ params: { locale } });
    expect(m.alternates?.canonical).toBe(urlFor(locale, '/payment-scam-report'));
    expect(m.alternates?.languages).toEqual(hreflang('/payment-scam-report'));
    expect(m.title).toBe('paymentScamReport.title');
  });

  it.each(locales)('/emergency in %s has its own canonical and all hreflang', async (locale) => {
    const m = await emergencyMetadata({ params: { locale } });
    expect(m.alternates?.canonical).toBe(urlFor(locale, '/emergency'));
    expect(m.alternates?.languages).toEqual(hreflang('/emergency'));
    expect(m.robots).toBeUndefined();
  });
});

describe('robots', () => {
  it('lets crawlers fetch the CSS and JS needed to render, and keeps /api/ closed', () => {
    const rule = (robots().rules as { disallow: string[]; allow: string }[])[0];
    expect(rule.disallow).toEqual(['/api/']);
    expect(rule.allow).toBe('/');
  });
});

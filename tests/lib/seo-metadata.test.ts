// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { locales } from '@/i18n';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { generateMetadata as safetyMetadata } from '@/app/[locale]/payment-safety/layout';
import { metadata as correctionMetadata } from '@/app/[locale]/payment-safety/correction/layout';
import { generateMetadata as scenarioMetadata } from '@/app/[locale]/payment-scam/[scenario]/layout';
import { metadata as reportMetadata } from '@/app/[locale]/payment-scam-report/layout';
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
const urlFor = (locale: string, path: string) => `${SITE}${locale === 'en' ? '' : `/${locale}`}${path}`;
const hreflang = (path: string) => ({
  ...Object.fromEntries(locales.map((l) => [l, urlFor(l, path)])),
  'x-default': `${SITE}${path}`,
});

describe('sitemap', () => {
  it('lists English-only pages once, on the English URL, without hreflang', async () => {
    const entries = await sitemap();
    for (const path of ['/emergency', '/payment-scam-report', '/payment-scam/ticket-payment-scam', '/payment-scam/marketplace-payment-scam', '/payment-scam/goods-not-delivered-payment-scam', '/payment-scam/fake-local-service-scam']) {
      const matches = entries.filter((e) => e.url.endsWith(path));
      expect(matches.map((e) => e.url)).toEqual([`${SITE}${path}`]);
      expect(matches[0].alternates).toBeUndefined();
    }
  });

  it('lists translated pages for every locale with reciprocal hreflang', async () => {
    const entries = await sitemap();
    for (const path of ['/payment-safety', TELEGRAM, '/crypto']) {
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

  it('the noindex correction page does not inherit canonical or hreflang', () => {
    expect(correctionMetadata.robots).toEqual({ index: false, follow: false });
    expect(correctionMetadata.alternates).toBeNull();
  });

  it.each(locales)('the Telegram scenario in %s has its own canonical and all hreflang', async (locale) => {
    const m = await scenarioMetadata({ params: { locale, scenario: 'telegram-payment-scams' } });
    expect(m.alternates?.canonical).toBe(urlFor(locale, TELEGRAM));
    expect(m.alternates?.languages).toEqual(hreflang(TELEGRAM));
  });

  it('the Telegram scenario keeps its localized title and description', async () => {
    const { getTelegramScamCopy } = await import('@/lib/payment-scam-i18n');
    const m = await scenarioMetadata({ params: { locale: 'ru', scenario: 'telegram-payment-scams' } });
    expect(m.title).toBe(getTelegramScamCopy('ru').metadataTitle);
    expect(m.description).toBe(getTelegramScamCopy('ru').metadataDescription);
  });

  it.each(['en', 'ru'])('an English scenario under %s points to the English URL without hreflang', async (locale) => {
    const m = await scenarioMetadata({ params: { locale, scenario: 'ticket-payment-scam' } });
    expect(m.alternates?.canonical).toBe('/payment-scam/ticket-payment-scam');
    expect(m.alternates?.languages).toBeUndefined();
  });

  it('/payment-scam-report points to the English URL without hreflang', () => {
    expect(reportMetadata.alternates?.canonical).toBe('/payment-scam-report');
    expect(reportMetadata.alternates?.languages).toBeUndefined();
  });

  it.each(locales)('/emergency in %s points to the English URL without hreflang', async (locale) => {
    const m = await emergencyMetadata({ params: { locale } });
    expect(m.alternates?.canonical).toBe(`${SITE}/emergency`);
    expect(m.alternates?.languages).toBeUndefined();
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

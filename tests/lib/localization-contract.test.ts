// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { locales } from '@/i18n';
import { translateApiError, translatePaymentSafety } from '@/lib/payment-safety-i18n';
import { getScenarioCopy, TRANSLATED_SCENARIO_SLUGS } from '@/lib/payment-scam-i18n';
import { PAYMENT_SCAM_SCENARIOS } from '@/lib/payment-scam-scenarios';
import en from '@/messages/en.json';
import ru from '@/messages/ru.json';
import es from '@/messages/es.json';
import zh from '@/messages/zh.json';
import fr from '@/messages/fr.json';
import ar from '@/messages/ar.json';

const dictionaries: Record<string, unknown> = { ru, es, zh, fr, ar };
const targets = locales.filter((locale) => locale !== 'en');

type Tree = { [key: string]: string | Tree };
const flatten = (tree: Tree, prefix = ''): Record<string, string> =>
  Object.entries(tree).reduce<Record<string, string>>((all, [key, value]) => (
    typeof value === 'string'
      ? { ...all, [`${prefix}${key}`]: value }
      : { ...all, ...flatten(value, `${prefix}${key}.`) }
  ), {});

/** Argument names in an ICU message, without the words inside plural branches. */
const placeholders = (message: string) =>
  Array.from(new Set(Array.from(message.matchAll(/\{(\w+)(?=[,}])/g)).map((match) => match[1]))).sort();

const NEW_NAMESPACES = ['emergency_flow', 'payment_scam_report', 'error_page'] as const;
const NEW_KEYS = {
  nav: ['payment_check', 'badge_new', 'tools', 'language', 'select_language', 'available_languages', 'toggle_menu'],
  footer: ['investigators', 'join_network', 'operating_under', 'rights', 'brand_note'],
  metadata: ['paymentScamReport', 'emergencySuccess'],
};

const strings = (dictionary: unknown): Record<string, string> => {
  const source = dictionary as Record<string, Tree>;
  const picked: Tree = {};
  for (const namespace of NEW_NAMESPACES) picked[namespace] = source[namespace];
  for (const [namespace, keys] of Object.entries(NEW_KEYS)) {
    picked[namespace] = Object.fromEntries(keys.map((key) => [key, source[namespace][key]]));
  }
  return flatten(picked);
};

/* Spelled the same in a target language, or a label that is the same word there. */
const SAME_AS_ENGLISH = new Set([
  'emergency_flow.description_counter',
  'emergency_flow.destination',
  'emergency_flow.countries.AU',
  'emergency_flow.countries.CA',
  'emergency_flow.countries.FR',
  'emergency_flow.countries.KZ',
  'emergency_flow.countries.UA',
  'emergency_flow.pack_exchange_fallback',
]);

describe('page dictionaries', () => {
  const source = strings(en);

  it.each(targets)('%s has every key with the same placeholders', (locale) => {
    const target = strings(dictionaries[locale]);
    expect(Object.keys(target).sort()).toEqual(Object.keys(source).sort());
    for (const [key, message] of Object.entries(source)) {
      expect(placeholders(target[key]), `${locale} ${key}`).toEqual(placeholders(message));
    }
  });

  it.each(targets)('%s does not fall back to English text', (locale) => {
    const target = strings(dictionaries[locale]);
    const untranslated = Object.keys(source).filter(
      (key) => target[key] === source[key] && !SAME_AS_ENGLISH.has(key),
    );
    expect(untranslated).toEqual([]);
  });

  it('keeps emergency prices out of the translated text', () => {
    for (const dictionary of [en, ...Object.values(dictionaries)]) {
      const flow = (dictionary as typeof en).emergency_flow;
      expect(flow.get_documents).not.toContain('$');
      expect(flow.summary_report).toContain('{price}');
    }
    const page = readFileSync('app/[locale]/emergency/page.tsx', 'utf8');
    expect(page).toContain("price: '$19'");
    expect(page.split("$79 &mdash; {t('get_documents')}").length - 1).toBe(2);
  });
});

describe('technical values', () => {
  const emergency = readFileSync('app/[locale]/emergency/page.tsx', 'utf8');
  const correction = readFileSync('app/[locale]/payment-safety/correction/page.tsx', 'utf8');

  it('sends the same emergency ids and country codes', () => {
    for (const id of ['romance', 'fake_platform', 'ponzi', 'phishing', 'rug_pull', 'other']) {
      expect(emergency).toContain(`id: '${id}'`);
    }
    for (const code of ['US', 'UK', 'DE', 'FR', 'CA', 'AU', 'NL', 'ES', 'IT', 'CH', 'RU', 'UA', 'KZ', 'AE', 'SG']) {
      expect(emergency).toContain(`code: '${code}'`);
      expect(en.emergency_flow.countries).toHaveProperty(code);
    }
    for (const method of ['Email', 'Phone Call', 'Website Ad', 'LinkedIn', 'Other']) {
      expect(emergency).toContain(`'${method}'`);
    }
    expect(emergency).toContain('<option key={m} value={m}>');
  });

  it('sends the same correction values', () => {
    for (const value of ['account_owner', 'authorized_representative', 'affected_person', 'wrong_recipient', 'inaccurate_information', 'identifier_reassigned', 'false_or_duplicate_reports']) {
      expect(correction).toContain(`value="${value}"`);
    }
    expect(correction).toContain('<option value="OTHER">');
  });

  it('keeps scenario routing values', () => {
    expect(Object.fromEntries(PAYMENT_SCAM_SCENARIOS.map((s) => [s.slug, [s.category, s.channel]]))).toEqual({
      'telegram-payment-scams': ['marketplace_scam', 'telegram'],
      'marketplace-payment-scam': ['marketplace_scam', undefined],
      'ticket-payment-scam': ['ticket_scam', undefined],
      'goods-not-delivered-payment-scam': ['non_delivery_goods', undefined],
      'fake-local-service-scam': ['fake_service', undefined],
    });
  });
});

describe('scenario copy', () => {
  const others = PAYMENT_SCAM_SCENARIOS.filter((scenario) => scenario.slug !== 'telegram-payment-scams');

  it('is registered for every scenario', () => {
    expect([...TRANSLATED_SCENARIO_SLUGS].sort()).toEqual(PAYMENT_SCAM_SCENARIOS.map((s) => s.slug).sort());
  });

  it.each(others.map((s) => s.slug))('%s has its own text in every locale', (slug) => {
    const english = getScenarioCopy(slug, 'en');
    const telegram = getScenarioCopy('telegram-payment-scams', 'en');
    expect(english.title).not.toBe(telegram.title);
    expect(english.eyebrow).not.toContain('Telegram');
    expect(english.actionsText).not.toContain('Telegram');
    for (const locale of targets) {
      const copy = getScenarioCopy(slug, locale);
      expect(copy.title).not.toBe(english.title);
      expect(copy.description).not.toBe(english.description);
      expect(copy.metadataDescription).toBe(copy.description);
      expect(copy.metadataTitle).toContain('LedgerHound');
      expect(copy.examples).toHaveLength(english.examples.length);
      expect(copy.collect).toHaveLength(english.collect.length);
      expect(copy.actionsText).not.toContain('Telegram');
      expect(copy.faqPublicQuestion).toBe(getScenarioCopy('telegram-payment-scams', locale).faqPublicQuestion);
    }
  });
});

describe('payment safety strings', () => {
  const page = readFileSync('app/[locale]/payment-safety/page.tsx', 'utf8');
  const correction = readFileSync('app/[locale]/payment-safety/correction/page.tsx', 'utf8');
  const quoted = "'((?:[^'\\\\]|\\\\.)*)'";

  const used = new Set<string>();
  const collect = (text: string, pattern: RegExp) => {
    for (const match of Array.from(text.matchAll(pattern))) used.add(match[1].replace(/\\'/g, "'"));
  };
  for (const text of [page, correction]) {
    collect(text, new RegExp(`\\bt\\(${quoted}\\)`, 'g'));
    collect(text, new RegExp(`translatePaymentSafety\\(locale, ${quoted}\\)`, 'g'));
    collect(text, new RegExp(`(?:label|instruction|linkLabel): ${quoted}`, 'g'));
  }
  collect(
    page.slice(page.indexOf('const paymentRecipientHint'), page.indexOf('async function handleCheck')),
    new RegExp(`^\\s+\\w+: ${quoted},\\r?$`, 'gm'),
  );

  /* Product names and codes shown as-is in every language. */
  const AS_IS = new Set([
    'Zelle', 'Cash App', 'Venmo', 'PayPal', 'Apple Cash', 'Chime', 'Wise', 'Revolut', 'IBAN',
    'Facebook Marketplace', 'Instagram', 'TikTok', 'Craigslist', 'OfferUp', 'Nextdoor', 'Telegram', 'Discord',
    'FTC', 'IC3', 'EU', 'OTHER',
    // The same word in some target languages (ru "Email", es/fr "Marketplace").
    'Email', 'Marketplace',
  ]);

  it('finds the strings the pages use', () => {
    expect(used.size).toBeGreaterThan(190);
    expect(used).toContain('Zelle email or phone number');
    expect(used).toContain('Submit correction request');
  });

  it.each(targets)('%s translates every string the pages use', (locale) => {
    const missing = Array.from(used).filter(
      (text) => !AS_IS.has(text) && translatePaymentSafety(locale, text) === text,
    );
    expect(missing).toEqual([]);
  });

  it.each(targets)('%s keeps placeholders in formatted strings', (locale) => {
    for (const text of ['Uploading {count} evidence file(s)...', 'Failed to upload {file}', 'Unable to upload {file}']) {
      expect(placeholders(translatePaymentSafety(locale, text))).toEqual(placeholders(text));
    }
  });

  it('shows known API errors translated and hides the rest', () => {
    expect(translateApiError('ru', 'File too large. Maximum 10MB.', 'x')).toBe(
      translatePaymentSafety('ru', 'File too large. Maximum 10MB.'),
    );
    expect(translateApiError('ru', 'File too large. Maximum 10MB.', 'x')).not.toBe('File too large. Maximum 10MB.');
    expect(translateApiError('ru', 'Invalid payment rail. Must be one of: zelle', 'fallback')).toBe('fallback');
    expect(translateApiError('ru', undefined, 'fallback')).toBe('fallback');
    expect(translateApiError('en', 'Upload failed.', 'fallback')).toBe('Upload failed.');
  });
});

/**
 * Helpers for rendering BlogPostMeta fields in the user's locale.
 * Keep these tiny and pure — they're called inside JSX render paths.
 */

import type { BlogPostMeta } from './posts';

/**
 * Format an ISO date (YYYY-MM-DD) for display in the given locale.
 * Examples:
 *   en:  "May 5, 2026"
 *   ru:  "5 мая 2026 г."
 *   fr:  "5 mai 2026"
 *   zh:  "2026年5月5日"
 *   ar:  "٥ مايو ٢٠٢٦"
 *
 * Falls back to the raw string if Date parsing fails.
 */
export function formatBlogDate(isoDate: string, locale: string): string {
  if (!isoDate) return '';
  // ISO YYYY-MM-DD parses safely as UTC midnight in any JS runtime.
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  // map next-intl locale codes to BCP-47 tags Intl recognizes
  const bcp47: Record<string, string> = {
    en: 'en-US', ru: 'ru-RU', es: 'es-ES', fr: 'fr-FR', zh: 'zh-CN', ar: 'ar',
  };
  return new Intl.DateTimeFormat(bcp47[locale] || locale, {
    year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'UTC',  // avoid off-by-one due to local TZ
  }).format(d);
}

/**
 * Map a category enum to its translation key suffix.
 * "Case Study" → "case_study" (snake_case for stable keys)
 */
export function categoryKey(category: BlogPostMeta['category']): string {
  return category.toLowerCase().replace(/[\s/]+/g, '_');
}

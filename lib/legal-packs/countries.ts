export interface CountryConfig {
  code: string;
  name: string;
  lang: string;
  flag: string;
  priority: 1 | 2 | 3;
}

export const COUNTRIES: CountryConfig[] = [
  { code: 'US', name: 'United States', lang: 'en', flag: '\u{1F1FA}\u{1F1F8}', priority: 1 },
  { code: 'UK', name: 'United Kingdom', lang: 'en', flag: '\u{1F1EC}\u{1F1E7}', priority: 1 },
  { code: 'DE', name: 'Germany', lang: 'de', flag: '\u{1F1E9}\u{1F1EA}', priority: 1 },
  { code: 'FR', name: 'France', lang: 'fr', flag: '\u{1F1EB}\u{1F1F7}', priority: 1 },
  { code: 'CA', name: 'Canada', lang: 'en', flag: '\u{1F1E8}\u{1F1E6}', priority: 1 },
  { code: 'AU', name: 'Australia', lang: 'en', flag: '\u{1F1E6}\u{1F1FA}', priority: 1 },
  { code: 'NL', name: 'Netherlands', lang: 'nl', flag: '\u{1F1F3}\u{1F1F1}', priority: 2 },
  { code: 'ES', name: 'Spain', lang: 'es', flag: '\u{1F1EA}\u{1F1F8}', priority: 2 },
  { code: 'IT', name: 'Italy', lang: 'it', flag: '\u{1F1EE}\u{1F1F9}', priority: 2 },
  { code: 'CH', name: 'Switzerland', lang: 'de', flag: '\u{1F1E8}\u{1F1ED}', priority: 2 },
  { code: 'RU', name: 'Russia', lang: 'ru', flag: '\u{1F1F7}\u{1F1FA}', priority: 1 },
  { code: 'UA', name: 'Ukraine', lang: 'uk', flag: '\u{1F1FA}\u{1F1E6}', priority: 2 },
  { code: 'KZ', name: 'Kazakhstan', lang: 'ru', flag: '\u{1F1F0}\u{1F1FF}', priority: 2 },
  { code: 'AE', name: 'UAE', lang: 'en', flag: '\u{1F1E6}\u{1F1EA}', priority: 2 },
  { code: 'SG', name: 'Singapore', lang: 'en', flag: '\u{1F1F8}\u{1F1EC}', priority: 2 },
];

export function getCountry(code: string): CountryConfig | undefined {
  return COUNTRIES.find(c => c.code === code.toUpperCase());
}

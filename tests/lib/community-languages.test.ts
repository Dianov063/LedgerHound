import { describe, expect, it } from 'vitest';
import {
  COMMUNITY_LANGUAGES,
  COMMUNITY_LANGUAGE_OPTIONS,
  ISO_639_1_LANGUAGE_CODES,
  isCommunityLanguage,
} from '@/lib/community-languages';

describe('community language directory', () => {
  it('covers the full ISO 639-1 language list without duplicate choices', () => {
    expect(ISO_639_1_LANGUAGE_CODES).toHaveLength(184);
    expect(new Set(ISO_639_1_LANGUAGE_CODES).size).toBe(184);
    expect(COMMUNITY_LANGUAGE_OPTIONS).toHaveLength(185);
    expect(new Set(COMMUNITY_LANGUAGES).size).toBe(COMMUNITY_LANGUAGES.length);
  });

  it('keeps legacy popular values and accepts additional ISO languages', () => {
    expect(isCommunityLanguage('english')).toBe(true);
    expect(isCommunityLanguage('russian')).toBe(true);
    expect(isCommunityLanguage('de')).toBe(true);
    expect(isCommunityLanguage('ja')).toBe(true);
    expect(isCommunityLanguage('sw')).toBe(true);
    expect(isCommunityLanguage('not-a-language')).toBe(false);
  });

  it('keeps popular languages at the top of the directory', () => {
    expect(COMMUNITY_LANGUAGE_OPTIONS.slice(0, 4).map((language) => language.value)).toEqual([
      'english',
      'russian',
      'spanish',
      'chinese',
    ]);
  });

  it('provides readable fallbacks for languages missing from browser dictionaries', () => {
    expect(COMMUNITY_LANGUAGE_OPTIONS.find((language) => language.value === 'vo')?.fallbackLabel).toBe('Volapük');
    expect(COMMUNITY_LANGUAGE_OPTIONS.find((language) => language.value === 'za')?.fallbackLabel).toBe('Zhuang');
  });
});

export const ISO_639_1_LANGUAGE_CODES = [
  'aa', 'ab', 'ae', 'af', 'ak', 'am', 'an', 'ar', 'as', 'av', 'ay', 'az',
  'ba', 'be', 'bg', 'bh', 'bi', 'bm', 'bn', 'bo', 'br', 'bs',
  'ca', 'ce', 'ch', 'co', 'cr', 'cs', 'cu', 'cv', 'cy',
  'da', 'de', 'dv', 'dz',
  'ee', 'el', 'en', 'eo', 'es', 'et', 'eu',
  'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy',
  'ga', 'gd', 'gl', 'gn', 'gu', 'gv',
  'ha', 'he', 'hi', 'ho', 'hr', 'ht', 'hu', 'hy', 'hz',
  'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'io', 'is', 'it', 'iu',
  'ja', 'jv',
  'ka', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky',
  'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv',
  'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my',
  'na', 'nb', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny',
  'oc', 'oj', 'om', 'or', 'os',
  'pa', 'pi', 'pl', 'ps', 'pt',
  'qu',
  'rm', 'rn', 'ro', 'ru', 'rw',
  'sa', 'sc', 'sd', 'se', 'sg', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw',
  'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty',
  'ug', 'uk', 'ur', 'uz',
  've', 'vi', 'vo',
  'wa', 'wo',
  'xh',
  'yi', 'yo',
  'za', 'zh', 'zu',
] as const;

type IsoLanguageCode = typeof ISO_639_1_LANGUAGE_CODES[number];

const ENGLISH_LANGUAGE_NAME_FALLBACKS: Partial<Record<IsoLanguageCode, string>> = {
  aa: 'Afar',
  ab: 'Abkhazian',
  ae: 'Avestan',
  av: 'Avaric',
  ba: 'Bashkir',
  bi: 'Bislama',
  bo: 'Tibetan',
  ce: 'Chechen',
  ch: 'Chamorro',
  cr: 'Cree',
  cu: 'Church Slavic',
  cv: 'Chuvash',
  dz: 'Dzongkha',
  ff: 'Fulah',
  fj: 'Fijian',
  gv: 'Manx',
  ho: 'Hiri Motu',
  hz: 'Herero',
  ie: 'Interlingue',
  ii: 'Sichuan Yi',
  ik: 'Inupiaq',
  io: 'Ido',
  iu: 'Inuktitut',
  kg: 'Kongo',
  ki: 'Kikuyu',
  kj: 'Kuanyama',
  kl: 'Kalaallisut',
  kr: 'Kanuri',
  ks: 'Kashmiri',
  kv: 'Komi',
  kw: 'Cornish',
  li: 'Limburgish',
  lu: 'Luba-Katanga',
  mh: 'Marshallese',
  na: 'Nauru',
  nd: 'North Ndebele',
  ng: 'Ndonga',
  nr: 'South Ndebele',
  nv: 'Navajo',
  oj: 'Ojibwa',
  os: 'Ossetian',
  pi: 'Pali',
  rn: 'Rundi',
  sc: 'Sardinian',
  se: 'Northern Sami',
  sg: 'Sango',
  ss: 'Swati',
  ty: 'Tahitian',
  ve: 'Venda',
  vo: 'Volapük',
  za: 'Zhuang',
};

const POPULAR_COMMUNITY_LANGUAGES = [
  { value: 'english', code: 'en', fallbackLabel: 'English', popular: true },
  { value: 'russian', code: 'ru', fallbackLabel: 'Russian', popular: true },
  { value: 'spanish', code: 'es', fallbackLabel: 'Spanish', popular: true },
  { value: 'chinese', code: 'zh', fallbackLabel: 'Chinese', popular: true },
  { value: 'arabic', code: 'ar', fallbackLabel: 'Arabic', popular: true },
  { value: 'french', code: 'fr', fallbackLabel: 'French', popular: true },
  { value: 'portuguese', code: 'pt', fallbackLabel: 'Portuguese', popular: true },
  { value: 'ukrainian', code: 'uk', fallbackLabel: 'Ukrainian', popular: true },
  { value: 'vietnamese', code: 'vi', fallbackLabel: 'Vietnamese', popular: true },
  { value: 'hindi', code: 'hi', fallbackLabel: 'Hindi', popular: true },
] as const;

const popularCodes = new Set<string>(POPULAR_COMMUNITY_LANGUAGES.map((language) => language.code));
const remainingLanguages = ISO_639_1_LANGUAGE_CODES
  .filter((code) => !popularCodes.has(code))
  .map((code) => ({
    value: code,
    code,
    fallbackLabel: ENGLISH_LANGUAGE_NAME_FALLBACKS[code] || code.toUpperCase(),
    popular: false,
  } as const));

export const COMMUNITY_LANGUAGE_OPTIONS = [
  ...POPULAR_COMMUNITY_LANGUAGES,
  ...remainingLanguages,
  { value: 'other', code: null, fallbackLabel: 'Other language', popular: false },
] as const;

export type CommunityLanguage = typeof COMMUNITY_LANGUAGE_OPTIONS[number]['value'];

export const COMMUNITY_LANGUAGES = COMMUNITY_LANGUAGE_OPTIONS.map(
  (language) => language.value,
) as readonly CommunityLanguage[];

export function isCommunityLanguage(value: unknown): value is CommunityLanguage {
  return typeof value === 'string'
    && (COMMUNITY_LANGUAGES as readonly string[]).includes(value);
}

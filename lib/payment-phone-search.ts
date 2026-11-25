import { isSupportedCountry, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max';

// These rails have an existing phone-specific storage normalization. A numeric
// username, bank account or generic recipient reference must not gain phone aliases.
// Chime is also excluded: the old writer drops '$' from a numeric ChimeSign,
// leaving the same stored key as a local phone. Query syntax cannot recover it.
const PHONE_RAILS = new Set(['phone', 'zelle', 'apple_cash']);

export function isPhoneFormatSearch(rail: string, raw: string): boolean {
  return PHONE_RAILS.has(rail) && /^\+?[\d\s().-]+$/.test(raw.trim()) && /\d/.test(raw);
}

/** Search aliases only: never change stored identifiers, hashes or complaint groups.
 * Every derived national/dialling form must round-trip to the SAME valid E.164
 * number in the record's country. This protects national trunk zeros (Italy vs
 * GB/France), shared calling codes, and records tagged with a foreign country.
 */
export function phoneSearchIdentifiers(rail: string, raw: string, country: string): string[] {
  if (!isPhoneFormatSearch(rail, raw)) return [raw];
  const code = country.toUpperCase() as CountryCode;
  const defaultCountry = isSupportedCountry(code) ? code : undefined;
  const parse = (value: string) => parsePhoneNumberFromString(value, { defaultCountry, extract: false });
  const number = parse(raw);
  if (!number?.isValid()) return [raw]; // Exact legacy lookup remains available.
  const variants = new Set<string>([raw, number.number]);
  const proposed = [
    number.number.slice(1),
    number.nationalNumber,
    number.formatNational().replace(/\D/g, ''),
    ...(defaultCountry ? [number.format('IDD', { fromCountry: defaultCountry }).replace(/\D/g, '')] : []),
  ];
  for (const value of proposed) {
    const candidate = parse(value);
    if (candidate?.isValid() && candidate.number === number.number) variants.add(value);
  }
  return [...variants];
}

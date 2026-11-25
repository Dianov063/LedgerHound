/** Search-only options. Reports always retain a concrete country and payment method. */
export const ALL_PAYMENT_SEARCH = 'all';

export const PAYMENT_SEARCH_RAILS = [
  'zelle', 'cashapp', 'venmo', 'paypal', 'apple_cash', 'chime', 'wise',
  'revolut', 'iban', 'bank_account', 'phone', 'email', 'social_handle',
  'marketplace_profile', 'other',
] as const;

export const SEARCH_COUNTRY_REQUIRED = 'Select a country for a local phone number or bank account. For an international phone number, include + and the country code.';

/** In an all-method search, preserve the meaning of visible identifier syntax.
 * In particular, stripping digits out of an email or a $handle must not turn it
 * into an unrelated phone/account match. Explicit method searches keep their
 * existing method-specific normalization.
 */
export function paymentSearchSupportsFormat(rail: string, identifier: string): boolean {
  const value = identifier.trim();
  if (value.startsWith('$')) return ['cashapp', 'chime', 'other'].includes(rail);
  if (value.startsWith('@')) return ['venmo', 'social_handle', 'revolut', 'marketplace_profile', 'other'].includes(rail);
  if (value.includes('@')) return !['phone', 'iban', 'bank_account', 'social_handle', 'marketplace_profile'].includes(rail);
  if (/^[+\d\s().\-_/]+$/.test(value)) return !['email', 'iban', 'social_handle', 'marketplace_profile'].includes(rail);
  return !['phone', 'zelle', 'apple_cash'].includes(rail);
}

export function paymentSearchNeedsCountry(country: string | undefined, rail: string | undefined, identifier: string): boolean {
  if (country && country.toLowerCase() !== ALL_PAYMENT_SEARCH) return false;
  if (rail === 'bank_account') return true;
  const value = identifier.trim();
  // A bare local number is not globally unique. Do not silently search its
  // digits across countries (or assume the visitor's country).
  if (/^[+\d\s().\-_/]+$/.test(value) && /\d/.test(value)) {
    const compact = value.replace(/[\s().-]/g, '');
    return !/^\+[1-9]\d{6,14}$/.test(compact);
  }
  return false;
}

import { describe, expect, it } from 'vitest';
import { phoneSearchIdentifiers } from '@/lib/payment-phone-search';

describe('country-aware phone search aliases', () => {
  it.each([
    ['US', '2125550199', '+12125550199', '12125550199'],
    ['CA', '4165550199', '+14165550199', '14165550199'],
    ['GB', '02079460958', '+442079460958', '2079460958'],
    ['FR', '0612345678', '+33612345678', '612345678'],
    ['DE', '030901820', '+4930901820', '30901820'],
    ['IT', '0669821234', '+390669821234', '0669821234'],
    ['RU', '84951234567', '+74951234567', '4951234567'],
    ['IN', '9876543210', '+919876543210', '919876543210'],
    ['NG', '08031234567', '+2348031234567', '8031234567'],
  ])('%s maps valid national/trunk/code forms to the same destination', (country, local, international, national) => {
    const fromLocal = phoneSearchIdentifiers('phone', local, country);
    expect(fromLocal).toContain(international);
    const fromInternational = phoneSearchIdentifiers('phone', international, country);
    expect(fromInternational).toContain(local);
    expect(fromInternational).toContain(national);
  });
  it('does not reinterpret the national part in a different calling-code country', () => {
    const variants = phoneSearchIdentifiers('phone', '+442079460958', 'US');
    expect(variants).not.toContain('2079460958');
    expect(variants).not.toContain('02079460958');
    expect(variants).toContain('+442079460958');
    expect(variants).toContain('011442079460958');
  });
  it('preserves Italy’s significant leading zero', () => {
    expect(phoneSearchIdentifiers('phone', '+390669821234', 'IT')).not.toContain('669821234');
  });
  it.each(['OTHER', 'EU', 'ZZ', 'USA'])('does not guess a national numbering plan for %s', (country) => {
    expect(phoneSearchIdentifiers('phone', '2125550199', country)).toEqual(['2125550199']);
    expect(phoneSearchIdentifiers('phone', '+12125550199', country)).toEqual(['+12125550199']);
  });
  it.each(['bank_account', 'iban', 'cashapp', 'chime', 'venmo', 'wise', 'revolut', 'social_handle', 'other'])('does not give %s account names or references phone aliases', (rail) => {
    expect(phoneSearchIdentifiers(rail, '2125550199', 'US')).toEqual(['2125550199']);
  });
  it.each(['seller2125550199@example.invalid', '$2125550199', '@2125550199', '2125550199 ext 123', 'GB82 WEST 1234 5698 7654 32', '123', '+999123456789'])('keeps non-phone or invalid input exact: %s', (value) => {
    expect(phoneSearchIdentifiers('phone', value, 'US')).toEqual([value]);
  });
  it('supports international access prefixes with an explicit country', () => {
    expect(phoneSearchIdentifiers('phone', '00442079460958', 'FR')).toContain('+442079460958');
    expect(phoneSearchIdentifiers('phone', '011442079460958', 'US')).toContain('+442079460958');
  });
});

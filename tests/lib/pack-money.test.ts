import { describe, expect, it } from 'vitest';
import { fmtMoney } from '@/lib/legal-packs/templates';

describe('loss amount in the Emergency Pack documents', () => {
  it('prints a stated loss', () => {
    expect(fmtMoney(2500, 'USD')).toBe('USD 2,500.00');
  });

  it.each([null, undefined, 0, Number.NaN])('leaves %s as a blank to fill in, never a substitute figure', (amount) => {
    expect(fmtMoney(amount as number | null | undefined, 'EUR')).toBe('EUR ____________');
  });
});

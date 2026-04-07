import { describe, it, expect } from 'vitest';
import { slugify, calcRecoveryScore } from '@/lib/scam-db';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('CryptoTrade Pro')).toBe('cryptotrade-pro');
  });

  it('handles simple names', () => {
    expect(slugify('Binance')).toBe('binance');
  });

  it('strips special characters', () => {
    expect(slugify('My Platform!@#$%')).toBe('my-platform');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('a   b---c')).toBe('a-b-c');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify(' -hello- ')).toBe('hello');
  });

  it('truncates to 60 characters', () => {
    const long = 'a'.repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });
});

describe('calcRecoveryScore', () => {
  it('returns baseline score for minimal input', () => {
    const result = calcRecoveryScore({ blockchainConfirmed: false });
    expect(result.score).toBeGreaterThanOrEqual(5);
    expect(result.score).toBeLessThanOrEqual(85);
    expect(result.label).toBeDefined();
    expect(result.details).toBeInstanceOf(Array);
  });

  it('gives higher score for recent reports', () => {
    const recent = calcRecoveryScore({
      blockchainConfirmed: true,
      lossDate: new Date().toISOString(),
      network: 'eth',
      lossAmount: 50000,
    });
    const old = calcRecoveryScore({
      blockchainConfirmed: false,
      lossDate: new Date(Date.now() - 365 * 86400000).toISOString(),
    });
    expect(recent.score).toBeGreaterThan(old.score);
  });

  it('caps score at 85', () => {
    const result = calcRecoveryScore({
      blockchainConfirmed: true,
      lossDate: new Date().toISOString(),
      network: 'eth',
      lossAmount: 100000,
    });
    expect(result.score).toBeLessThanOrEqual(85);
  });

  it('returns Good label for high scores', () => {
    const result = calcRecoveryScore({
      blockchainConfirmed: true,
      lossDate: new Date().toISOString(),
      network: 'eth',
      lossAmount: 50000,
    });
    expect(result.label).toBe('Good recovery potential');
  });
});

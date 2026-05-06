import type { Investigator } from './schema';

/**
 * Seed data — shown when S3 returns empty/unavailable.
 * Includes the in-house LedgerHound team as the first entry.
 */
export const SEED_INVESTIGATORS: Investigator[] = [
  {
    id: 'inv-team-001',
    name: 'LedgerHound Investigations Team',
    email: 'contact@ledgerhound.vip',
    phone: '+1 (833) 559-1334',
    photo: null,
    city: 'New York',
    country: 'United States',
    countryCode: 'US',
    certifications: ['CTCE', 'CFE', 'CAMS'],
    specializations: [
      'Pig Butchering / Romance Scams',
      'Exchange Compliance / Subpoenas',
      'Cross-Chain Tracing',
      'Expert Witness / Litigation Support',
    ],
    languages: ['EN', 'RU', 'ES', 'ZH', 'FR', 'AR'],
    yearsExperience: '5-10',
    bio: 'Our in-house team of certified blockchain forensics experts handles complex crypto fraud cases worldwide. Multilingual support across 6 languages, court-ready reports, expert witness testimony.',
    linkedinUrl: 'https://www.linkedin.com/company/ledgerhound',
    websiteUrl: 'https://www.ledgerhound.vip',
    availability: 'available',
    isApproved: true,
    isActive: true,
    isTeam: true,
    identityVerified: true,
    certificationVerified: true,
    topInvestigator: true,
    showStats: true,
    casesCompleted: 250,
    recoveryRatePercent: 41,
    avgResponseHours: 4,
    expertWitnessIn: ['United States', 'United Kingdom', 'Canada'],
    appliedAt: '2025-01-01T00:00:00.000Z',
    approvedAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  },
];

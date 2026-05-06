/**
 * Investigator Network — data types.
 */

export type Certification =
  | 'CTCE'   // Certified Cryptocurrency Tracing Expert
  | 'CFE'    // Certified Fraud Examiner
  | 'CAMS'   // Certified Anti-Money Laundering Specialist
  | 'EnCE'   // EnCase Certified Examiner
  | 'GCFE'   // GIAC Certified Forensic Examiner
  | 'CCE'    // Certified Computer Examiner
  | 'Other';

export type Specialization =
  | 'Pig Butchering / Romance Scams'
  | 'Exchange Compliance / Subpoenas'
  | 'DeFi / Smart Contract Forensics'
  | 'NFT Fraud'
  | 'Ransomware Tracing'
  | 'Corporate Fraud / Embezzlement'
  | 'Divorce / Hidden Assets'
  | 'Cross-Chain Tracing'
  | 'Expert Witness / Litigation Support';

export type Language = 'EN' | 'RU' | 'ES' | 'ZH' | 'FR' | 'AR' | 'DE' | 'JA' | 'PT' | 'IT';

export type YearsExperience = '1-2' | '3-5' | '5-10' | '10+';

export type Availability = 'available' | 'limited' | 'unavailable';

export interface Investigator {
  id: string;

  // Identity
  name: string;
  email: string;          // PRIVATE — never returned by public API
  phone?: string;         // PRIVATE
  photo?: string | null;  // S3 URL or null (renders initials)

  // Location
  city: string;
  country: string;        // ISO-3166 country name (e.g., "United States")
  countryCode?: string;   // 2-letter ISO code for flag/filter

  // Professional
  certifications: Certification[];
  certificationsOther?: string;  // free-text when "Other" selected
  specializations: Specialization[];
  languages: Language[];
  yearsExperience: YearsExperience;
  bio: string;                   // max 500 chars

  // External links
  linkedinUrl?: string;
  websiteUrl?: string;

  // Visibility & status
  availability: Availability;
  isApproved: boolean;
  isActive: boolean;             // toggled in admin
  isTeam?: boolean;              // LedgerHound in-house team flag

  // Verification badges
  identityVerified: boolean;     // KYC'd through LedgerHound
  certificationVerified: boolean; // we verified the cert
  topInvestigator: boolean;      // 10+ cases delivered

  // Stats (opt-in display)
  showStats: boolean;
  casesCompleted?: number;
  recoveryRatePercent?: number;
  avgResponseHours?: number;

  // Pricing (PRIVATE — admin only)
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  minCaseSize?: number;          // USD
  acceptsContingency?: boolean;

  // Jurisdictions
  licensedIn?: string[];         // countries where licensed to operate
  expertWitnessIn?: string[];    // countries where can testify

  // Application data
  sampleCaseStudy?: string;      // anonymized
  resumeS3Key?: string;          // private S3 key
  ndaSignedAt?: string;          // ISO date when NDA signed (deferred to phase 2)
  agreementAcceptedAt?: string;  // ISO date

  // Source tracking
  howDidYouHear?: string;

  // Meta
  appliedAt: string;             // ISO date
  approvedAt?: string;
  updatedAt: string;
}

/**
 * Public-safe view of an Investigator (sensitive fields stripped).
 * Returned by /api/investigators/list and /api/investigators/[id].
 */
export interface PublicInvestigator {
  id: string;
  name: string;
  photo?: string | null;
  city: string;
  country: string;
  countryCode?: string;
  certifications: Certification[];
  certificationsOther?: string;
  specializations: Specialization[];
  languages: Language[];
  yearsExperience: YearsExperience;
  bio: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  availability: Availability;
  isTeam?: boolean;
  identityVerified: boolean;
  certificationVerified: boolean;
  topInvestigator: boolean;
  showStats: boolean;
  casesCompleted?: number;
  recoveryRatePercent?: number;
  avgResponseHours?: number;
  expertWitnessIn?: string[];
}

/**
 * Application payload from /join-network form.
 */
export interface InvestigatorApplication {
  // Identity
  name: string;
  email: string;
  phone?: string;
  city: string;
  country: string;
  linkedinUrl?: string;
  websiteUrl?: string;

  // Professional
  certifications: Certification[];
  certificationsOther?: string;
  yearsExperience: YearsExperience;
  specializations: Specialization[];
  languages: Language[];
  bio: string;

  // Pricing
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  minCaseSize?: number;
  acceptsContingency?: boolean;

  // Jurisdictions
  licensedIn?: string[];
  expertWitnessIn?: string[];

  // Sample work
  sampleCaseStudy?: string;

  // Resume
  resumeBase64?: string;        // base64-encoded PDF (optional)
  resumeFileName?: string;

  // Source
  howDidYouHear?: string;

  // Agreement
  agreementAccepted: boolean;
}

/**
 * Convert a full Investigator record to a public-safe view.
 */
export function toPublic(inv: Investigator): PublicInvestigator {
  return {
    id: inv.id,
    name: inv.name,
    photo: inv.photo,
    city: inv.city,
    country: inv.country,
    countryCode: inv.countryCode,
    certifications: inv.certifications,
    certificationsOther: inv.certificationsOther,
    specializations: inv.specializations,
    languages: inv.languages,
    yearsExperience: inv.yearsExperience,
    bio: inv.bio,
    linkedinUrl: inv.linkedinUrl,
    websiteUrl: inv.websiteUrl,
    availability: inv.availability,
    isTeam: inv.isTeam,
    identityVerified: inv.identityVerified,
    certificationVerified: inv.certificationVerified,
    topInvestigator: inv.topInvestigator,
    showStats: inv.showStats,
    casesCompleted: inv.showStats ? inv.casesCompleted : undefined,
    recoveryRatePercent: inv.showStats ? inv.recoveryRatePercent : undefined,
    avgResponseHours: inv.showStats ? inv.avgResponseHours : undefined,
    expertWitnessIn: inv.expertWitnessIn,
  };
}

/* ── Constants for UI dropdowns ── */

export const CERTIFICATIONS: { value: Certification; label: string; full: string }[] = [
  { value: 'CTCE', label: 'CTCE', full: 'Certified Cryptocurrency Tracing Expert' },
  { value: 'CFE', label: 'CFE', full: 'Certified Fraud Examiner' },
  { value: 'CAMS', label: 'CAMS', full: 'Certified Anti-Money Laundering Specialist' },
  { value: 'EnCE', label: 'EnCE', full: 'EnCase Certified Examiner' },
  { value: 'GCFE', label: 'GCFE', full: 'GIAC Certified Forensic Examiner' },
  { value: 'CCE', label: 'CCE', full: 'Certified Computer Examiner' },
  { value: 'Other', label: 'Other', full: 'Other certification' },
];

export const SPECIALIZATIONS: Specialization[] = [
  'Pig Butchering / Romance Scams',
  'Exchange Compliance / Subpoenas',
  'DeFi / Smart Contract Forensics',
  'NFT Fraud',
  'Ransomware Tracing',
  'Corporate Fraud / Embezzlement',
  'Divorce / Hidden Assets',
  'Cross-Chain Tracing',
  'Expert Witness / Litigation Support',
];

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'EN', label: 'English', flag: '🇬🇧' },
  { code: 'RU', label: 'Russian', flag: '🇷🇺' },
  { code: 'ES', label: 'Spanish', flag: '🇪🇸' },
  { code: 'ZH', label: 'Chinese', flag: '🇨🇳' },
  { code: 'FR', label: 'French', flag: '🇫🇷' },
  { code: 'AR', label: 'Arabic', flag: '🇸🇦' },
  { code: 'DE', label: 'German', flag: '🇩🇪' },
  { code: 'JA', label: 'Japanese', flag: '🇯🇵' },
  { code: 'PT', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'IT', label: 'Italian', flag: '🇮🇹' },
];

export const YEARS_EXPERIENCE_OPTIONS: YearsExperience[] = ['1-2', '3-5', '5-10', '10+'];

export const HOW_HEARD_OPTIONS = [
  'Search engine',
  'LinkedIn',
  'Referral from a colleague',
  'Industry event / conference',
  'LedgerHound blog',
  'Other',
] as const;

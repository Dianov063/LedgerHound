import { createHash, randomBytes } from 'crypto';
import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  COMMUNITY_LANGUAGES,
  isCommunityLanguage,
  type CommunityLanguage,
} from '@/lib/community-languages';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;
const PREFIX = 'non-crypto-scam-database';

export type PaymentRail =
  | 'zelle'
  | 'cashapp'
  | 'venmo'
  | 'paypal'
  | 'apple_cash'
  | 'chime'
  | 'wise'
  | 'revolut'
  | 'iban'
  | 'bank_account'
  | 'phone'
  | 'email'
  | 'social_handle'
  | 'marketplace_profile'
  | 'other';

export type NonCryptoScamCategory =
  | 'non_delivery_goods'
  | 'fake_service'
  | 'deposit_advance_fee'
  | 'rental_scam'
  | 'ticket_scam'
  | 'marketplace_scam'
  | 'employment_scam'
  | 'other';

export type EvidenceType =
  | 'payment_receipt'
  | 'chat_screenshot'
  | 'invoice'
  | 'delivery_promise'
  | 'marketplace_listing'
  | 'other';

export const SALE_CHANNELS = [
  'facebook_marketplace',
  'instagram',
  'tiktok',
  'craigslist',
  'offerup',
  'nextdoor',
  'telegram',
  'discord',
  'direct_website',
  'text_message',
  'other',
] as const;

export type SaleChannel = typeof SALE_CHANNELS[number];

export const REPORT_DESTINATIONS = [
  'payment_provider',
  'bank_or_card_issuer',
  'marketplace',
  'ftc',
  'state_attorney_general',
  'ic3',
] as const;

export type ReportDestination = typeof REPORT_DESTINATIONS[number];

export { COMMUNITY_LANGUAGES, type CommunityLanguage };

export type PaymentSafetyRiskFlag =
  | 'shared_network'
  | 'duplicate_transaction_reference'
  | 'duplicate_evidence';

export interface PaymentSafetyAuditEvent {
  id: string;
  createdAt: string;
  action: 'report_status' | 'identity_staff_review' | 'correction_status';
  entityId: string;
  fromStatus?: string;
  toStatus?: string;
  actorHash: string;
  note?: string;
}

export type PaymentSafetyCorrectionStatus = 'pending' | 'under_review' | 'resolved' | 'rejected';

export interface PaymentSafetyCorrection {
  id: string;
  createdAt: string;
  country: string;
  rail: PaymentRail;
  identityHash: string;
  identityMask: string;
  privateIdentifier: string;
  contactName: string;
  contactEmail: string;
  relationship: 'account_owner' | 'authorized_representative' | 'affected_person' | 'other';
  reason: 'wrong_recipient' | 'inaccurate_information' | 'identifier_reassigned' | 'false_or_duplicate_reports' | 'other';
  explanation: string;
  evidenceFiles: string[];
  status: PaymentSafetyCorrectionStatus;
  resolutionNote?: string;
  updatedAt?: string;
}

interface EmailVerificationRecord {
  reportId: string;
  email: string;
  locale: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
}

export type PublicWarningLevel =
  | 'private_intake'
  | 'internal_watch'
  | 'multiple_reports'
  | 'payment_proof_cluster'
  | 'staff_reviewed';

export interface NormalizedPaymentIdentity {
  country: string;
  rail: PaymentRail;
  normalized: string;
  hash: string;
  mask: string;
}

export interface NonCryptoScamReport {
  id: string;
  createdAt: string;
  country: string;
  rail: PaymentRail;
  paymentMethodDetails?: string;
  identityHash: string;
  identityMask: string;
  privateIdentifier: string;
  recipientName?: string;
  businessName?: string;
  aliases?: string[];
  category: NonCryptoScamCategory;
  categoryDetails?: string;
  amount?: number;
  currency?: string;
  incidentDate?: string;
  saleChannel?: SaleChannel;
  saleChannelDetails?: string;
  usState?: string;
  communityLanguage?: CommunityLanguage;
  communityName?: string;
  sellerProfile?: string;
  listingUrl?: string;
  itemOrService?: string;
  promisedDeliveryDate?: string;
  refundRequested?: boolean;
  refundRequestDate?: string;
  lastContactDate?: string;
  privateTransactionReference?: string;
  transactionReferenceHash?: string;
  reportedTo?: ReportDestination[];
  externalReportReference?: string;
  duplicateTransactionReference?: boolean;
  description: string;
  reporterEmail?: string;
  reporterEmailVerifiedAt?: string;
  reporterFingerprint: string;
  reporterNetworkFingerprint?: string;
  evidenceTypes: EvidenceType[];
  evidenceFiles: string[];
  hasPaymentProof: boolean;
  riskFlags?: PaymentSafetyRiskFlag[];
  status: 'pending' | 'accepted' | 'rejected';
}

export interface PaymentIdentitySummary {
  identityHash: string;
  country: string;
  rail: PaymentRail;
  identityMask: string;
  categories: NonCryptoScamCategory[];
  paymentMethodDetails: string[];
  categoryDetails: string[];
  aliases: string[];
  states: string[];
  reportIds: string[];
  reportCount: number;
  independentReporterKeys: string[];
  independentReporters: number;
  paymentProofCount: number;
  totalReportedAmount: number;
  currency: string;
  firstReported: string;
  lastReported: string;
  publicLevel: PublicWarningLevel;
  publicEligible: boolean;
  indexedEligible: boolean;
  publicationPaused?: boolean;
}

export interface PaymentIdentityPublicView {
  identityHash: string;
  country: string;
  rail: PaymentRail;
  identityMask: string;
  categories: NonCryptoScamCategory[];
  paymentMethodDetails: string[];
  categoryDetails: string[];
  aliases: string[];
  states: string[];
  reportCount: number;
  independentReporters: number;
  paymentProofCount: number;
  totalReportedAmount: number;
  currency: string;
  firstReported: string;
  lastReported: string;
  publicLevel: PublicWarningLevel;
  publicEligible: boolean;
  indexedEligible: boolean;
  publicationPaused?: boolean;
}

export interface NonCryptoStats {
  totalReports: number;
  totalIdentities: number;
  publicEligibleIdentities: number;
  indexedEligibleIdentities: number;
  paymentProofReports: number;
  updatedAt: string;
}

export interface NonCryptoAdminSnapshot {
  reports: NonCryptoScamReport[];
  identities: PaymentIdentitySummary[];
  corrections: PaymentSafetyCorrection[];
  auditEvents: PaymentSafetyAuditEvent[];
  stats: NonCryptoStats;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function normalizeCountry(country: string | undefined): string {
  const c = (country || 'OTHER').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return c.length >= 2 && c.length <= 3 ? c : 'OTHER';
}

export function normalizeUsState(value: string | undefined): string | undefined {
  const state = (value || '').trim().toUpperCase();
  const valid = new Set([
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
    'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM',
    'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA',
    'WV', 'WI', 'WY', 'PR',
  ]);
  return valid.has(state) ? state : undefined;
}

function collapseSpaces(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizePhoneLike(value: string): string {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  return hasPlus ? `+${digits}` : digits;
}

export function normalizePaymentIdentifier(
  rail: PaymentRail,
  rawIdentifier: string,
  country = 'OTHER',
): NormalizedPaymentIdentity {
  const c = normalizeCountry(country);
  const raw = rawIdentifier || '';
  let normalized = '';

  switch (rail) {
    case 'email':
    case 'paypal':
      normalized = raw.trim().toLowerCase();
      break;
    case 'zelle':
    case 'apple_cash':
      normalized = raw.includes('@') ? raw.trim().toLowerCase() : normalizePhoneLike(raw);
      break;
    case 'phone':
      normalized = normalizePhoneLike(raw);
      break;
    case 'cashapp':
      normalized = raw.trim().toLowerCase().replace(/\s+/g, '').replace(/^\$+/, '');
      break;
    case 'chime': {
      const trimmed = raw.trim();
      if (trimmed.includes('@')) {
        normalized = trimmed.toLowerCase();
      } else if (!trimmed.startsWith('$') && /^\+?[\d\s().-]{7,}$/.test(trimmed)) {
        normalized = normalizePhoneLike(trimmed);
      } else {
        normalized = trimmed.toLowerCase().replace(/\s+/g, '').replace(/^\$+/, '');
      }
      break;
    }
    case 'venmo':
    case 'social_handle':
      normalized = raw.trim().toLowerCase().replace(/\s+/g, '').replace(/^@+/, '');
      break;
    case 'iban':
      normalized = raw.toUpperCase().replace(/[\s-]/g, '');
      break;
    case 'bank_account':
      normalized = raw.trim().toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '');
      break;
    case 'wise':
    case 'revolut':
    case 'marketplace_profile':
    case 'other':
    default:
      normalized = collapseSpaces(raw).toLowerCase();
      break;
  }

  const hash = sha256(`lh-payment-identity:v1:${c}:${rail}:${normalized}`);
  return {
    country: c,
    rail,
    normalized,
    hash,
    mask: maskPaymentIdentifier(rail, normalized, c),
  };
}

export function maskPaymentIdentifier(rail: PaymentRail, normalized: string, country = 'OTHER'): string {
  const c = normalizeCountry(country);
  if (!normalized) return `${rail} identifier (${c})`;

  if (normalized.includes('@')) {
    const [name, domain = ''] = normalized.split('@');
    const safeName = name.length <= 2 ? `${name[0] || '*'}***` : `${name.slice(0, 2)}***`;
    const label = rail === 'apple_cash' ? 'Apple Cash' : rail === 'chime' ? 'Chime' : rail;
    return `${label} email ${safeName}@${domain}`;
  }

  if (rail === 'cashapp') return `Cash App $${maskHandle(normalized)}`;
  if (rail === 'venmo') return `Venmo @${maskHandle(normalized)}`;
  if (rail === 'chime' && !/^\+?\d{7,}$/.test(normalized)) return `Chime $${maskHandle(normalized)}`;
  if (rail === 'social_handle') return `social @${maskHandle(normalized)}`;
  if (rail === 'iban') return `IBAN ending ${normalized.slice(-4)} (${c})`;
  if (rail === 'bank_account') return `bank account ending ${normalized.slice(-4)} (${c})`;

  if (['zelle', 'apple_cash', 'phone'].includes(rail) || /^\+?\d{7,}$/.test(normalized)) {
    const label = rail === 'apple_cash' ? 'Apple Cash' : rail === 'chime' ? 'Chime' : rail;
    return `${label} phone ending ${normalized.slice(-4)}`;
  }

  return `${rail} ending ${normalized.slice(-4)} (${c})`;
}

function maskHandle(value: string): string {
  if (value.length <= 3) return `${value[0] || '*'}***`;
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

export function publicView(summary: PaymentIdentitySummary): PaymentIdentityPublicView {
  const {
    reportIds,
    independentReporterKeys,
    ...safe
  } = summary;
  return {
    ...safe,
    categories: safe.categories || [],
    paymentMethodDetails: safe.paymentMethodDetails || [],
    categoryDetails: safe.categoryDetails || [],
    aliases: safe.aliases || [],
    states: safe.states || [],
  };
}

export function derivePublicLevel(summary: Pick<PaymentIdentitySummary, 'independentReporters' | 'paymentProofCount'>): {
  publicLevel: PublicWarningLevel;
  publicEligible: boolean;
  indexedEligible: boolean;
} {
  const { independentReporters, paymentProofCount } = summary;
  if (independentReporters >= 5 || (independentReporters >= 3 && paymentProofCount >= 3)) {
    return {
      publicLevel: paymentProofCount >= 3 ? 'payment_proof_cluster' : 'multiple_reports',
      publicEligible: true,
      indexedEligible: true,
    };
  }
  if (independentReporters >= 3) {
    return { publicLevel: 'multiple_reports', publicEligible: true, indexedEligible: false };
  }
  if (independentReporters >= 2) {
    return { publicLevel: 'internal_watch', publicEligible: false, indexedEligible: false };
  }
  return { publicLevel: 'private_intake', publicEligible: false, indexedEligible: false };
}

function reporterFingerprint(email: string | undefined, ip: string): string {
  const key = email?.trim().toLowerCase() || ip || 'unknown';
  return sha256(`lh-non-crypto-reporter:v1:${key}`);
}

function reporterNetworkFingerprint(ip: string): string | undefined {
  const normalized = ip.trim().toLowerCase();
  if (!normalized || normalized === 'unknown') return undefined;
  return sha256(`lh-non-crypto-network:v1:${normalized}`);
}

export function evidenceFingerprint(key: string): string | undefined {
  const match = key.match(/\/([a-f0-9]{64})\.(?:pdf|png|jpg|webp)$/i);
  return match?.[1]?.toLowerCase();
}

export function independentReportIds(reports: NonCryptoScamReport[]): string[] {
  const seenReporters = new Set<string>();
  const seenNetworks = new Set<string>();
  const seenTransactions = new Set<string>();
  const seenEvidence = new Set<string>();
  const independent: string[] = [];

  for (const report of [...reports].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const fileFingerprints = (report.evidenceFiles || [])
      .map(evidenceFingerprint)
      .filter((value): value is string => !!value);
    const canCount = !seenReporters.has(report.reporterFingerprint)
      && (!report.reporterNetworkFingerprint || !seenNetworks.has(report.reporterNetworkFingerprint))
      && (!report.transactionReferenceHash || !seenTransactions.has(report.transactionReferenceHash))
      && !fileFingerprints.some((fingerprint) => seenEvidence.has(fingerprint));

    seenReporters.add(report.reporterFingerprint);
    if (report.reporterNetworkFingerprint) seenNetworks.add(report.reporterNetworkFingerprint);
    if (report.transactionReferenceHash) seenTransactions.add(report.transactionReferenceHash);
    fileFingerprints.forEach((fingerprint) => seenEvidence.add(fingerprint));
    if (canCount) independent.push(report.id);
  }
  return independent;
}

async function streamToString(stream: any): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function s3Get<T>(key: string): Promise<T | null> {
  try {
    const data = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: `${PREFIX}/${key}` }));
    return JSON.parse(await streamToString(data.Body)) as T;
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

async function s3Put(key: string, data: unknown): Promise<void> {
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: `${PREFIX}/${key}`,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
    ServerSideEncryption: 'aws:kms',
  }));
}

async function s3ListJson<T>(prefix: string): Promise<T[]> {
  const out: T[] = [];
  let continuationToken: string | undefined;

  do {
    const resp = await getS3().send(new ListObjectsV2Command({
      Bucket: bucket(),
      Prefix: `${PREFIX}/${prefix}`,
      ContinuationToken: continuationToken,
    }));
    const keys = (resp.Contents || [])
      .map((obj) => obj.Key)
      .filter((key): key is string => !!key && key.endsWith('.json'));
    const settled = await Promise.allSettled(keys.map(async (key) => {
      const data = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
      return JSON.parse(await streamToString(data.Body)) as T;
    }));

    for (const item of settled) {
      if (item.status === 'fulfilled') out.push(item.value);
    }
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);

  return out;
}

function defaultStats(): NonCryptoStats {
  return {
    totalReports: 0,
    totalIdentities: 0,
    publicEligibleIdentities: 0,
    indexedEligibleIdentities: 0,
    paymentProofReports: 0,
    updatedAt: new Date().toISOString(),
  };
}

function addUnique<T>(items: T[], item: T): void {
  if (!items.includes(item)) items.push(item);
}

function cleanShortText(value: string | undefined, maxLength = 80): string | undefined {
  const clean = collapseSpaces(value || '').slice(0, maxLength);
  return clean.length >= 3 ? clean : undefined;
}

function cleanDate(value: string | undefined): string | undefined {
  const clean = (value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return undefined;
  const parsed = new Date(`${clean}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === clean ? clean : undefined;
}

export function sanitizeHttpUrl(value: string | undefined): string | undefined {
  const clean = (value || '').trim().slice(0, 500);
  if (!clean) return undefined;
  try {
    const parsed = new URL(clean);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function normalizeTransactionReference(
  rail: PaymentRail,
  value: string | undefined,
): { privateValue?: string; hash?: string } {
  const privateValue = collapseSpaces(value || '').slice(0, 160);
  const normalized = privateValue.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.length < 3) return {};
  return {
    privateValue,
    hash: sha256(`lh-payment-transaction-reference:v1:${rail}:${normalized}`),
  };
}

export function hasUploadedPaymentProof(evidenceTypes: EvidenceType[], evidenceFiles: string[]): boolean {
  return evidenceTypes.includes('payment_receipt')
    && evidenceFiles.some((file) => file.startsWith(`${PREFIX}/evidence/`));
}

function recalculateIdentity(summary: PaymentIdentitySummary): PaymentIdentitySummary {
  summary.reportCount = summary.reportIds.length;
  summary.independentReporters = summary.independentReporterKeys.length;
  Object.assign(summary, derivePublicLevel(summary));
  return summary;
}

export async function saveNonCryptoReport(input: {
  country?: string;
  rail: PaymentRail;
  paymentMethodDetails?: string;
  paymentIdentifier: string;
  recipientName?: string;
  businessName?: string;
  aliases?: string[];
  category: NonCryptoScamCategory;
  categoryDetails?: string;
  amount?: number;
  currency?: string;
  incidentDate?: string;
  saleChannel?: SaleChannel;
  saleChannelDetails?: string;
  usState?: string;
  communityLanguage?: CommunityLanguage;
  communityName?: string;
  sellerProfile?: string;
  listingUrl?: string;
  itemOrService?: string;
  promisedDeliveryDate?: string;
  refundRequested?: boolean;
  refundRequestDate?: string;
  lastContactDate?: string;
  transactionReference?: string;
  reportedTo?: ReportDestination[];
  externalReportReference?: string;
  description: string;
  reporterEmail?: string;
  evidenceTypes?: EvidenceType[];
  evidenceFiles?: string[];
  ip?: string;
}): Promise<{ id: string; report: NonCryptoScamReport; identity: PaymentIdentityPublicView }> {
  const identity = normalizePaymentIdentifier(input.rail, input.paymentIdentifier, input.country);
  if (!identity.normalized) throw new Error('Payment identifier is required');

  const now = new Date().toISOString();
  const id = generateId();
  const evidenceTypes = input.evidenceTypes || [];
  const evidenceFiles = input.evidenceFiles
    ?.map((file) => file.trim())
    .filter((file) => file.startsWith(`${PREFIX}/evidence/`))
    .slice(0, 5) || [];
  const hasPaymentProof = hasUploadedPaymentProof(evidenceTypes, evidenceFiles);
  const reporterKey = reporterFingerprint(input.reporterEmail, input.ip || 'unknown');
  const reporterNetworkKey = reporterNetworkFingerprint(input.ip || 'unknown');
  const paymentMethodDetails = input.rail === 'other' ? cleanShortText(input.paymentMethodDetails) : undefined;
  const categoryDetails = input.category === 'other' ? cleanShortText(input.categoryDetails) : undefined;
  const saleChannel = input.saleChannel && SALE_CHANNELS.includes(input.saleChannel) ? input.saleChannel : undefined;
  const saleChannelDetails = saleChannel === 'other' ? cleanShortText(input.saleChannelDetails, 120) : undefined;
  const transactionReference = normalizeTransactionReference(input.rail, input.transactionReference);
  const reportedTo = Array.from(new Set(
    (input.reportedTo || []).filter((destination): destination is ReportDestination => REPORT_DESTINATIONS.includes(destination)),
  ));

  const report: NonCryptoScamReport = {
    id,
    createdAt: now,
    country: identity.country,
    rail: input.rail,
    paymentMethodDetails,
    identityHash: identity.hash,
    identityMask: identity.mask,
    privateIdentifier: identity.normalized,
    recipientName: input.recipientName?.trim() || undefined,
    businessName: input.businessName?.trim() || undefined,
    aliases: input.aliases?.map(a => a.trim()).filter(Boolean) || [],
    category: input.category,
    categoryDetails,
    amount: typeof input.amount === 'number' ? input.amount : undefined,
    currency: input.currency || 'USD',
    incidentDate: cleanDate(input.incidentDate),
    saleChannel,
    saleChannelDetails,
    usState: identity.country === 'US' ? normalizeUsState(input.usState) : undefined,
    communityLanguage: isCommunityLanguage(input.communityLanguage)
      ? input.communityLanguage
      : undefined,
    communityName: cleanShortText(input.communityName, 160),
    sellerProfile: cleanShortText(input.sellerProfile, 200),
    listingUrl: sanitizeHttpUrl(input.listingUrl),
    itemOrService: cleanShortText(input.itemOrService, 120),
    promisedDeliveryDate: cleanDate(input.promisedDeliveryDate),
    refundRequested: !!input.refundRequested,
    refundRequestDate: input.refundRequested ? cleanDate(input.refundRequestDate) : undefined,
    lastContactDate: cleanDate(input.lastContactDate),
    privateTransactionReference: transactionReference.privateValue,
    transactionReferenceHash: transactionReference.hash,
    reportedTo,
    externalReportReference: cleanShortText(input.externalReportReference, 160),
    description: input.description.trim(),
    reporterEmail: input.reporterEmail?.trim() || undefined,
    reporterFingerprint: reporterKey,
    reporterNetworkFingerprint: reporterNetworkKey,
    evidenceTypes,
    evidenceFiles,
    hasPaymentProof,
    status: 'pending',
  };

  await s3Put(`reports/${id}.json`, report);
  await refreshNonCryptoIndexes();

  const acceptedSummary = await s3Get<PaymentIdentitySummary>(`identities/${identity.hash}.json`);
  const pendingView: PaymentIdentitySummary = acceptedSummary || {
    identityHash: identity.hash,
    country: identity.country,
    rail: input.rail,
    identityMask: identity.mask,
    categories: [],
    paymentMethodDetails: [],
    categoryDetails: [],
    aliases: [],
    states: [],
    reportIds: [],
    reportCount: 0,
    independentReporterKeys: [],
    independentReporters: 0,
    paymentProofCount: 0,
    totalReportedAmount: 0,
    currency: input.currency || 'USD',
    firstReported: now,
    lastReported: now,
    publicLevel: 'private_intake',
    publicEligible: false,
    indexedEligible: false,
  };

  return { id, report, identity: publicView(pendingView) };
}

export async function createNonCryptoEmailVerification(
  reportId: string,
  email: string,
  locale = 'en',
): Promise<{ token: string; expiresAt: string }> {
  const report = await s3Get<NonCryptoScamReport>(`reports/${reportId}.json`);
  if (!report) throw new Error('Report not found');
  if (!report.reporterEmail || report.reporterEmail.toLowerCase() !== email.trim().toLowerCase()) {
    throw new Error('Report email does not match');
  }
  if (report.reporterEmailVerifiedAt) throw new Error('Email is already verified');

  const token = randomBytes(32).toString('hex');
  const tokenHash = sha256(`lh-payment-email-verification:v1:${token}`);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const record: EmailVerificationRecord = {
    reportId,
    email: report.reporterEmail,
    locale: /^[a-z]{2}$/i.test(locale) ? locale.toLowerCase() : 'en',
    createdAt: createdAt.toISOString(),
    expiresAt,
  };
  await s3Put(`email-verifications/${tokenHash}.json`, record);
  return { token, expiresAt };
}

export async function verifyNonCryptoEmailToken(token: string): Promise<{ reportId: string; locale: string }> {
  if (!/^[a-f0-9]{64}$/i.test(token)) throw new Error('Invalid verification token');
  const tokenHash = sha256(`lh-payment-email-verification:v1:${token}`);
  const record = await s3Get<EmailVerificationRecord>(`email-verifications/${tokenHash}.json`);
  if (!record || record.usedAt) throw new Error('Verification link is invalid or already used');
  if (new Date(record.expiresAt).getTime() < Date.now()) throw new Error('Verification link has expired');

  const report = await s3Get<NonCryptoScamReport>(`reports/${record.reportId}.json`);
  if (!report || report.reporterEmail?.toLowerCase() !== record.email.toLowerCase()) {
    throw new Error('Report verification failed');
  }

  const verifiedAt = new Date().toISOString();
  report.reporterEmailVerifiedAt = verifiedAt;
  record.usedAt = verifiedAt;
  await Promise.all([
    s3Put(`reports/${report.id}.json`, report),
    s3Put(`email-verifications/${tokenHash}.json`, record),
  ]);
  await refreshNonCryptoIndexes();
  return { reportId: report.id, locale: record.locale };
}

export async function savePaymentSafetyCorrection(input: {
  country?: string;
  rail: PaymentRail;
  paymentIdentifier: string;
  contactName: string;
  contactEmail: string;
  relationship: PaymentSafetyCorrection['relationship'];
  reason: PaymentSafetyCorrection['reason'];
  explanation: string;
  evidenceFiles?: string[];
}): Promise<PaymentSafetyCorrection> {
  const identity = normalizePaymentIdentifier(input.rail, input.paymentIdentifier, input.country);
  if (!identity.normalized) throw new Error('Payment identifier is required');
  const now = new Date().toISOString();
  const correction: PaymentSafetyCorrection = {
    id: `COR-${generateId()}`,
    createdAt: now,
    country: identity.country,
    rail: input.rail,
    identityHash: identity.hash,
    identityMask: identity.mask,
    privateIdentifier: identity.normalized,
    contactName: cleanShortText(input.contactName, 120) || '',
    contactEmail: input.contactEmail.trim().toLowerCase().slice(0, 254),
    relationship: input.relationship,
    reason: input.reason,
    explanation: input.explanation.trim().slice(0, 5000),
    evidenceFiles: input.evidenceFiles
      ?.map((file) => file.trim())
      .filter((file) => file.startsWith(`${PREFIX}/evidence/`))
      .slice(0, 5) || [],
    status: 'pending',
  };
  await s3Put(`corrections/${correction.id}.json`, correction);
  return correction;
}

export async function updatePaymentSafetyCorrectionStatus(
  correctionId: string,
  status: PaymentSafetyCorrectionStatus,
  resolutionNote?: string,
  actorSource = 'system',
): Promise<PaymentSafetyCorrection> {
  if (!['pending', 'under_review', 'resolved', 'rejected'].includes(status)) {
    throw new Error('Invalid correction status');
  }
  const correction = await s3Get<PaymentSafetyCorrection>(`corrections/${correctionId}.json`);
  if (!correction) throw new Error('Correction request not found');
  const previousStatus = correction.status;
  correction.status = status;
  correction.resolutionNote = cleanShortText(resolutionNote, 1000);
  correction.updatedAt = new Date().toISOString();
  await s3Put(`corrections/${correction.id}.json`, correction);
  await refreshNonCryptoIndexes();
  await recordPaymentSafetyAuditEvent({
    action: 'correction_status',
    entityId: correction.id,
    fromStatus: previousStatus,
    toStatus: status,
    actorSource,
    note: resolutionNote,
  });
  return correction;
}

export async function searchPaymentIdentity(input: {
  country?: string;
  rail: PaymentRail;
  paymentIdentifier: string;
}): Promise<PaymentIdentityPublicView | null> {
  const identity = normalizePaymentIdentifier(input.rail, input.paymentIdentifier, input.country);
  const summary = await s3Get<PaymentIdentitySummary>(`identities/${identity.hash}.json`);
  return summary ? publicView(summary) : null;
}

export async function getNonCryptoStats(): Promise<NonCryptoStats> {
  return (await s3Get<NonCryptoStats>('index/stats.json')) || defaultStats();
}

export async function getPublicPaymentIdentityIndex(): Promise<PaymentIdentityPublicView[]> {
  const index = (await s3Get<PaymentIdentityPublicView[]>('index/identities.json')) || [];
  return index.filter((i) => i.publicEligible);
}

export async function getNonCryptoAdminSnapshot(): Promise<NonCryptoAdminSnapshot> {
  const [reports, identities, corrections, auditEvents, stats] = await Promise.all([
    s3ListJson<NonCryptoScamReport>('reports/'),
    s3ListJson<PaymentIdentitySummary>('identities/'),
    s3ListJson<PaymentSafetyCorrection>('corrections/'),
    s3ListJson<PaymentSafetyAuditEvent>('audit/'),
    getNonCryptoStats(),
  ]);

  reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const transactionReferenceCounts = new Map<string, number>();
  const evidenceCounts = new Map<string, number>();
  const networkCounts = new Map<string, number>();
  for (const report of reports) {
    if (report.status !== 'rejected' && report.transactionReferenceHash) {
      transactionReferenceCounts.set(
        report.transactionReferenceHash,
        (transactionReferenceCounts.get(report.transactionReferenceHash) || 0) + 1,
      );
    }
    if (report.status !== 'rejected' && report.reporterNetworkFingerprint) {
      const key = `${report.identityHash}:${report.reporterNetworkFingerprint}`;
      networkCounts.set(key, (networkCounts.get(key) || 0) + 1);
    }
    if (report.status !== 'rejected') {
      for (const file of report.evidenceFiles || []) {
        const fingerprint = evidenceFingerprint(file);
        if (fingerprint) evidenceCounts.set(fingerprint, (evidenceCounts.get(fingerprint) || 0) + 1);
      }
    }
  }
  for (const report of reports) {
    report.duplicateTransactionReference = !!report.transactionReferenceHash
      && (transactionReferenceCounts.get(report.transactionReferenceHash) || 0) > 1;
    const flags: PaymentSafetyRiskFlag[] = [];
    if (report.duplicateTransactionReference) flags.push('duplicate_transaction_reference');
    if (report.reporterNetworkFingerprint
      && (networkCounts.get(`${report.identityHash}:${report.reporterNetworkFingerprint}`) || 0) > 1) {
      flags.push('shared_network');
    }
    if ((report.evidenceFiles || []).some((file) => {
      const fingerprint = evidenceFingerprint(file);
      return !!fingerprint && (evidenceCounts.get(fingerprint) || 0) > 1;
    })) {
      flags.push('duplicate_evidence');
    }
    report.riskFlags = flags;
  }
  const activeIdentities = identities
    .filter((identity) => identity.reportCount > 0)
    .sort((a, b) => b.lastReported.localeCompare(a.lastReported));
  corrections.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  auditEvents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { reports, identities: activeIdentities, corrections, auditEvents: auditEvents.slice(0, 250), stats };
}

export async function recordPaymentSafetyAuditEvent(input: {
  action: PaymentSafetyAuditEvent['action'];
  entityId: string;
  fromStatus?: string;
  toStatus?: string;
  actorSource: string;
  note?: string;
}): Promise<PaymentSafetyAuditEvent> {
  const createdAt = new Date().toISOString();
  const event: PaymentSafetyAuditEvent = {
    id: `AUD-${generateId()}`,
    createdAt,
    action: input.action,
    entityId: input.entityId,
    fromStatus: cleanShortText(input.fromStatus, 80),
    toStatus: cleanShortText(input.toStatus, 80),
    actorHash: sha256(`lh-payment-safety-admin:v1:${input.actorSource || 'unknown'}`),
    note: cleanShortText(input.note, 500),
  };
  await s3Put(`audit/${createdAt.replace(/[:.]/g, '-')}-${event.id}.json`, event);
  return event;
}

export async function updateNonCryptoReportStatus(
  reportId: string,
  status: NonCryptoScamReport['status'],
  actorSource = 'system',
): Promise<NonCryptoScamReport> {
  if (!['pending', 'accepted', 'rejected'].includes(status)) {
    throw new Error('Invalid report status');
  }

  const report = await s3Get<NonCryptoScamReport>(`reports/${reportId}.json`);
  if (!report) throw new Error('Report not found');
  if (status === 'accepted' && !report.reporterEmailVerifiedAt) {
    throw new Error('Reporter email must be verified before acceptance');
  }

  const previousStatus = report.status;
  report.status = status;
  await s3Put(`reports/${reportId}.json`, report);

  await refreshNonCryptoIndexes();
  await recordPaymentSafetyAuditEvent({
    action: 'report_status',
    entityId: report.id,
    fromStatus: previousStatus,
    toStatus: status,
    actorSource,
  });
  return report;
}

export async function markNonCryptoIdentityStaffReviewed(
  identityHash: string,
  actorSource = 'system',
): Promise<PaymentIdentityPublicView> {
  const summary = await s3Get<PaymentIdentitySummary>(`identities/${identityHash}.json`);
  if (!summary) throw new Error('Identity not found');
  if (summary.independentReporters < 3) {
    throw new Error('At least three independent verified reports are required before staff review');
  }

  summary.publicLevel = 'staff_reviewed';
  summary.publicEligible = true;
  await s3Put(`identities/${identityHash}.json`, summary);
  await refreshNonCryptoIndexes();
  await recordPaymentSafetyAuditEvent({
    action: 'identity_staff_review',
    entityId: identityHash,
    fromStatus: 'corroborated',
    toStatus: 'staff_reviewed',
    actorSource,
  });
  return publicView(summary);
}

function rebuildIdentitySummary(
  existing: PaymentIdentitySummary | undefined,
  reports: NonCryptoScamReport[],
): PaymentIdentitySummary {
  const first = reports[0];
  const now = new Date().toISOString();
  const summary: PaymentIdentitySummary = {
    identityHash: first?.identityHash || existing?.identityHash || '',
    country: first?.country || existing?.country || 'OTHER',
    rail: first?.rail || existing?.rail || 'other',
    identityMask: first?.identityMask || existing?.identityMask || 'payment identifier',
    categories: [],
    paymentMethodDetails: [],
    categoryDetails: [],
    aliases: [],
    states: [],
    reportIds: [],
    reportCount: 0,
    independentReporterKeys: [],
    independentReporters: 0,
    paymentProofCount: 0,
    totalReportedAmount: 0,
    currency: first?.currency || existing?.currency || 'USD',
    firstReported: first?.createdAt || existing?.firstReported || now,
    lastReported: first?.createdAt || existing?.lastReported || now,
    publicLevel: 'private_intake',
    publicEligible: false,
    indexedEligible: false,
  };

  const independentIds = new Set(independentReportIds(reports));

  for (const report of [...reports].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    addUnique(summary.categories, report.category);
    if (report.paymentMethodDetails) addUnique(summary.paymentMethodDetails, report.paymentMethodDetails);
    if (report.categoryDetails) addUnique(summary.categoryDetails, report.categoryDetails);
    for (const alias of [report.recipientName, report.businessName, ...(report.aliases || [])]) {
      if (alias) addUnique(summary.aliases, alias);
    }
    if (report.usState) addUnique(summary.states, report.usState);
    addUnique(summary.reportIds, report.id);

    if (independentIds.has(report.id)) {
      addUnique(summary.independentReporterKeys, report.reporterFingerprint);
      summary.paymentProofCount += report.hasPaymentProof ? 1 : 0;
    }
    summary.totalReportedAmount += report.amount || 0;
    summary.firstReported = summary.firstReported < report.createdAt ? summary.firstReported : report.createdAt;
    summary.lastReported = summary.lastReported > report.createdAt ? summary.lastReported : report.createdAt;
  }

  recalculateIdentity(summary);
  if (summary.independentReporters >= 3 && existing?.publicLevel === 'staff_reviewed') {
    summary.publicLevel = 'staff_reviewed';
    summary.publicEligible = true;
  }
  return summary;
}

async function refreshNonCryptoIndexes(): Promise<void> {
  const [reports, identities, corrections] = await Promise.all([
    s3ListJson<NonCryptoScamReport>('reports/'),
    s3ListJson<PaymentIdentitySummary>('identities/'),
    s3ListJson<PaymentSafetyCorrection>('corrections/'),
  ]);
  const pausedIdentityHashes = new Set(
    corrections.filter((correction) => correction.status === 'under_review').map((correction) => correction.identityHash),
  );
  const existingByHash = new Map(identities.map((identity) => [identity.identityHash, identity]));
  const acceptedByHash = new Map<string, NonCryptoScamReport[]>();
  for (const report of reports) {
    if (report.status !== 'accepted' || !report.reporterEmailVerifiedAt) continue;
    const group = acceptedByHash.get(report.identityHash) || [];
    group.push(report);
    acceptedByHash.set(report.identityHash, group);
  }

  const identityHashes = Array.from(new Set([
    ...Array.from(existingByHash.keys()),
    ...Array.from(acceptedByHash.keys()),
  ]));
  const rebuilt: PaymentIdentitySummary[] = [];
  for (const identityHash of identityHashes) {
    const summary = rebuildIdentitySummary(existingByHash.get(identityHash), acceptedByHash.get(identityHash) || []);
    summary.publicationPaused = pausedIdentityHashes.has(identityHash);
    if (summary.publicationPaused) {
      summary.publicEligible = false;
      summary.indexedEligible = false;
    }
    await s3Put(`identities/${identityHash}.json`, summary);
    if (summary.reportCount > 0) rebuilt.push(summary);
  }

  const safe = rebuilt.map(publicView);
  await s3Put('index/identities.json', safe);

  const stats: NonCryptoStats = {
    totalReports: reports.length,
    totalIdentities: rebuilt.length,
    publicEligibleIdentities: safe.filter((i) => i.publicEligible).length,
    indexedEligibleIdentities: safe.filter((i) => i.indexedEligible).length,
    paymentProofReports: rebuilt.reduce((total, identity) => total + identity.paymentProofCount, 0),
    updatedAt: new Date().toISOString(),
  };
  await s3Put('index/stats.json', stats);
}

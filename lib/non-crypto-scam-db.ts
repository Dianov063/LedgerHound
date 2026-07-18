import { createHash } from 'crypto';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

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
  description: string;
  reporterEmail?: string;
  reporterFingerprint: string;
  evidenceTypes: EvidenceType[];
  hasPaymentProof: boolean;
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
}

export interface NonCryptoStats {
  totalReports: number;
  totalIdentities: number;
  publicEligibleIdentities: number;
  indexedEligibleIdentities: number;
  paymentProofReports: number;
  updatedAt: string;
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
      normalized = raw.includes('@') ? raw.trim().toLowerCase() : normalizePhoneLike(raw);
      break;
    case 'phone':
      normalized = normalizePhoneLike(raw);
      break;
    case 'cashapp':
      normalized = raw.trim().toLowerCase().replace(/\s+/g, '').replace(/^\$+/, '');
      break;
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
    return `${rail} email ${safeName}@${domain}`;
  }

  if (rail === 'cashapp') return `Cash App $${maskHandle(normalized)}`;
  if (rail === 'venmo') return `Venmo @${maskHandle(normalized)}`;
  if (rail === 'social_handle') return `social @${maskHandle(normalized)}`;
  if (rail === 'iban') return `IBAN ending ${normalized.slice(-4)} (${c})`;
  if (rail === 'bank_account') return `bank account ending ${normalized.slice(-4)} (${c})`;

  if (['zelle', 'phone'].includes(rail) || /^\+?\d{7,}$/.test(normalized)) {
    return `${rail} phone ending ${normalized.slice(-4)}`;
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
  description: string;
  reporterEmail?: string;
  evidenceTypes?: EvidenceType[];
  ip?: string;
}): Promise<{ id: string; report: NonCryptoScamReport; identity: PaymentIdentityPublicView }> {
  const identity = normalizePaymentIdentifier(input.rail, input.paymentIdentifier, input.country);
  if (!identity.normalized) throw new Error('Payment identifier is required');

  const now = new Date().toISOString();
  const id = generateId();
  const evidenceTypes = input.evidenceTypes || [];
  const hasPaymentProof = evidenceTypes.includes('payment_receipt');
  const reporterKey = reporterFingerprint(input.reporterEmail, input.ip || 'unknown');
  const paymentMethodDetails = input.rail === 'other' ? cleanShortText(input.paymentMethodDetails) : undefined;
  const categoryDetails = input.category === 'other' ? cleanShortText(input.categoryDetails) : undefined;

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
    incidentDate: input.incidentDate,
    description: input.description.trim(),
    reporterEmail: input.reporterEmail?.trim() || undefined,
    reporterFingerprint: reporterKey,
    evidenceTypes,
    hasPaymentProof,
    status: 'pending',
  };

  await s3Put(`reports/${id}.json`, report);

  const existing = await s3Get<PaymentIdentitySummary>(`identities/${identity.hash}.json`);
  const summary: PaymentIdentitySummary = existing || {
    identityHash: identity.hash,
    country: identity.country,
    rail: input.rail,
    identityMask: identity.mask,
    categories: [],
    paymentMethodDetails: [],
    categoryDetails: [],
    aliases: [],
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

  addUnique(summary.categories, input.category);
  summary.paymentMethodDetails ||= [];
  summary.categoryDetails ||= [];
  if (paymentMethodDetails) addUnique(summary.paymentMethodDetails, paymentMethodDetails);
  if (categoryDetails) addUnique(summary.categoryDetails, categoryDetails);
  for (const alias of [input.recipientName, input.businessName, ...(input.aliases || [])]) {
    const clean = alias?.trim();
    if (clean) addUnique(summary.aliases, clean);
  }
  addUnique(summary.reportIds, id);
  addUnique(summary.independentReporterKeys, reporterKey);
  summary.reportCount = summary.reportIds.length;
  summary.independentReporters = summary.independentReporterKeys.length;
  summary.paymentProofCount += hasPaymentProof ? 1 : 0;
  summary.totalReportedAmount += input.amount || 0;
  summary.currency = input.currency || summary.currency || 'USD';
  summary.firstReported = summary.firstReported < now ? summary.firstReported : now;
  summary.lastReported = now;
  Object.assign(summary, derivePublicLevel(summary));

  await s3Put(`identities/${identity.hash}.json`, summary);

  const index = (await s3Get<PaymentIdentityPublicView[]>('index/identities.json')) || [];
  const safeSummary = publicView(summary);
  const idx = index.findIndex((i) => i.identityHash === identity.hash);
  if (idx >= 0) index[idx] = safeSummary;
  else index.push(safeSummary);
  await s3Put('index/identities.json', index);

  const stats = (await s3Get<NonCryptoStats>('index/stats.json')) || defaultStats();
  stats.totalReports += 1;
  stats.totalIdentities = index.length;
  stats.publicEligibleIdentities = index.filter((i) => i.publicEligible).length;
  stats.indexedEligibleIdentities = index.filter((i) => i.indexedEligible).length;
  stats.paymentProofReports += hasPaymentProof ? 1 : 0;
  stats.updatedAt = now;
  await s3Put('index/stats.json', stats);

  return { id, report, identity: safeSummary };
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

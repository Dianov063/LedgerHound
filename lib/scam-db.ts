import { createHash } from 'crypto';
import { VERIFIED_SEED_PLATFORMS } from './scam-db-verified-seed';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';

/* ── S3 client ── */
const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;
const PREFIX = 'scam-database';

/* ── Types ── */
export type ScamType = 'fake_exchange' | 'pig_butchering' | 'rug_pull' | 'phishing' | 'ponzi' | 'other';

/**
 * External corroborating source for a platform entry. This is the legal spine of
 * the public scam-database: every seeded platform states WHO flagged it and WHERE,
 * so an entry is a factual restatement of a published third-party finding — not
 * LedgerHound's own accusation. Ordered by evidentiary weight in getSourceWeight.
 */
export type PlatformSourceType =
  | 'regulator_warning'   // FCA / SEC / CFTC / ASIC / CSA warning or alert list
  | 'ofac_sdn'            // US Treasury OFAC sanctions listing
  | 'court_doj'           // DOJ indictment / court filing / law-enforcement action
  | 'etherscan_tag'       // Etherscan Fake_Phishing#### address tag
  | 'onchain_forensic'    // LedgerHound forensic case (own analysis, with case ID)
  | 'community_report';   // Chainabuse / community corroboration (secondary)

export interface PlatformSource {
  type: PlatformSourceType;
  /** Issuing authority as published, e.g. "FCA (UK)", "SEC (US)", "OFAC", "Etherscan". */
  authority: string;
  /** Reference/ID at the source: warning slug, case number, Fake_Phishing####, or TXID. */
  reference?: string;
  /** Direct link to the PRIMARY source page (regulator's own URL, not a blog). */
  url: string;
  /** Date the source published/listed it (ISO). Regulator warnings can be withdrawn — date matters. */
  date: string;
  /** Factual restatement of the source's finding, verbatim-ish. NOT our own claim. */
  note?: string;
  /** For clone-firm warnings: the LEGITIMATE firm being impersonated (must never be
   *  listed as the scam itself). Present ⇒ the entry is the impersonator, not this firm. */
  clonesLegitimate?: string;
}

export interface ScamReport {
  id: string;
  createdAt: string;
  platformName: string;
  platformUrl?: string;
  platformUrls?: string[];
  platformType: ScamType;
  scamAddress?: string;
  network?: string;
  txHash?: string;
  lossAmount?: number;
  lossCurrency?: string;
  lossDate?: string;
  verified: boolean;
  verifiedAt?: string;
  blockchainConfirmed: boolean;
  reporterEmail?: string;
  description?: string;
  status: 'pending' | 'verified' | 'rejected';
  trustTier: 1 | 2 | 3;
}

export interface ScamPlatform {
  slug: string;
  name: string;
  urls: string[];
  types: ScamType[];
  reportIds: string[];
  totalLoss: number;
  lossCurrency: string;
  victims: number;
  addresses: string[];
  verified: boolean;
  trustScore: number;
  staffVerified: boolean;
  blockchainVerifiedCount: number;
  firstReported: string;
  lastReported: string;
  /** External corroborating sources (regulator warnings, OFAC, Etherscan, etc.).
   *  Optional for legacy/community entries; REQUIRED for seeded platforms. */
  sources?: PlatformSource[];
  /** Seed values recorded before the first report was added (see toPublicPlatform). */
  seedBaseline?: SeedBaseline;
}

/** The part of a seeded platform that came from the verified seed, not from reports. */
export interface SeedBaseline {
  victims: number;
  totalLoss: number;
  blockchainVerifiedCount: number;
  addresses: string[];
  urls: string[];
  types: ScamType[];
  staffVerified: boolean;
  verified: boolean;
  trustScore: number;
  firstReported: string;
  lastReported: string;
}

export const seedBaselineFrom = (p: ScamPlatform): SeedBaseline => ({
  victims: p.victims,
  totalLoss: p.totalLoss,
  blockchainVerifiedCount: p.blockchainVerifiedCount,
  addresses: [...p.addresses],
  urls: [...p.urls],
  types: [...p.types],
  staffVerified: p.staffVerified,
  verified: p.verified,
  trustScore: p.trustScore,
  firstReported: p.firstReported,
  lastReported: p.lastReported,
});

export interface PlatformIndexEntry {
  slug: string;
  name: string;
  victims: number;
  totalLoss: number;
  /** Public count of blockchain-confirmed reports (absent on entries written before). */
  blockchainVerifiedCount?: number;
  verified: boolean;
  trustScore: number;
  types: ScamType[];
  urls: string[];
  lastReported: string;
  addresses: string[];
}

export interface AddressIndex {
  address: string;
  platforms: string[];
  platformNames: string[];
  reports: string[];
  totalLoss: number;
  networks: string[];
  firstSeen: string;
  lastSeen: string;
}

export interface ScamStats {
  totalReports: number;
  totalPlatforms: number;
  totalLoss: number;
  blockchainVerified: number;
  updatedAt: string;
}

export interface ScamDispute {
  id: string;
  createdAt: string;
  platformSlug?: string;
  reportId?: string;
  contactEmail: string;
  reason: string;
  relationship?: string;
  evidenceType?: string;
  evidenceFiles?: string[];
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

/* ── Helpers ── */
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

async function streamToString(stream: any): Promise<string> {
  // SDK v3 response bodies can convert themselves; fall back to reading the stream.
  if (typeof stream?.transformToString === 'function') return stream.transformToString();
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function s3Get(key: string): Promise<any | null> {
  try {
    const data = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: `${PREFIX}/${key}` }));
    const str = await streamToString(data.Body);
    return JSON.parse(str);
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

async function s3Put(key: string, data: any): Promise<void> {
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: `${PREFIX}/${key}`,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
  }));
}

/* ── Conditional writes (optimistic concurrency) ──
   Shared files (platform, address, public index, stats, a report being moderated) are changed by
   read -> change -> write. Without a condition two concurrent writers overwrite each other and
   one change is lost (reports accepted with 200 but never linked to their platform, platforms
   missing from the index). Every such write now carries If-Match with the ETag that was read
   (If-None-Match: * when the file did not exist); S3 refuses it with 412 when the file changed in
   between, and the change is recomputed from a fresh read. Works across processes and instances. */
const CONDITIONAL_ATTEMPTS = 40;

const isWriteConflict = (err: any): boolean =>
  err?.name === 'PreconditionFailed' || err?.$metadata?.httpStatusCode === 412
  || err?.name === 'ConditionalRequestConflict' || err?.$metadata?.httpStatusCode === 409;

async function s3GetWithEtag<T>(key: string): Promise<{ data: T | null; etag?: string }> {
  try {
    const res = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: `${PREFIX}/${key}` }));
    return { data: JSON.parse(await streamToString(res.Body)) as T, etag: res.ETag };
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) return { data: null };
    throw err;
  }
}

/** Writes only if the object is still at `etag`, or (no etag) does not exist yet. */
async function s3PutIf(key: string, data: unknown, etag?: string): Promise<string | undefined> {
  const res = await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: `${PREFIX}/${key}`,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
    ...(etag ? { IfMatch: etag } : { IfNoneMatch: '*' }),
  }));
  return res?.ETag;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Read-change-write that cannot lose a concurrent update. `change` gets a fresh copy of the
 * stored value on every attempt (null when absent) and returns the new value, or undefined to
 * leave the file as it is. Retries on a write conflict; any other error is thrown.
 */
async function updateJson<T>(key: string, change: (current: T | null) => Promise<T | undefined> | T | undefined): Promise<T | null> {
  for (let attempt = 1; ; attempt++) {
    const { data, etag } = await s3GetWithEtag<T>(key);
    const next = await change(data);
    if (next === undefined) return data;
    try {
      await s3PutIf(key, next, etag);
      return next;
    } catch (err: any) {
      // S3 answers If-Match on an object deleted meanwhile with 404: also a conflict.
      const vanished = !!etag && (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404);
      if (!(isWriteConflict(err) || vanished) || attempt >= CONDITIONAL_ATTEMPTS) throw err;
      await sleep(Math.min(400, 4 * 2 ** Math.min(attempt, 7)) * (0.5 + Math.random()));
    }
  }
}

/** The transaction hash was claimed by another report (also when two arrive at once). */
export class TxidAlreadyUsedError extends Error {
  constructor() { super('This transaction hash has already been used in a previous report.'); this.name = 'TxidAlreadyUsedError'; }
}

async function s3Exists(key: string): Promise<boolean> {
  try {
    await getS3().send(new HeadObjectCommand({ Bucket: bucket(), Key: `${PREFIX}/${key}` }));
    return true;
  } catch {
    return false;
  }
}

async function s3Delete(key: string): Promise<void> {
  await getS3().send(new DeleteObjectCommand({
    Bucket: bucket(),
    Key: `${PREFIX}/${key}`,
  }));
}

/**
 * Deletes only if the object is still at `etag` (S3 conditional delete, If-Match; supported by
 * Amazon S3 general purpose buckets). Storage answers 412 when the object changed meanwhile.
 */
async function s3DeleteIf(key: string, etag: string): Promise<void> {
  await getS3().send(new DeleteObjectCommand({
    Bucket: bucket(),
    Key: `${PREFIX}/${key}`,
    IfMatch: etag,
  }));
}

/* ── Trust Score System (numeric) ── */
export function calcTrustScore(platform: ScamPlatform): number {
  let score = 0;
  score += platform.victims * 1;                             // +1 per report
  score += (platform.blockchainVerifiedCount || 0) * 3;      // +3 per verified TX
  if (platform.victims >= 5) score += 5;                     // +5 multiple victims
  if (platform.victims >= 20) score += 5;                    // +5 many victims
  if (platform.staffVerified) score += 10;                   // +10 staff review
  return score;
}

export function getTrustLabel(score: number): { label: string; color: string; emoji: string } {
  if (score >= 20) return { label: 'Confirmed Scam', color: 'red', emoji: '🚨' };
  if (score >= 10) return { label: 'Likely Scam', color: 'orange', emoji: '🔴' };
  if (score >= 4) return { label: 'Suspicious', color: 'yellow', emoji: '⚠️' };
  return { label: 'Community Reported', color: 'gray', emoji: '' };
}

/* ── Public view ──
   Stored platform, index and address files are append-only counters written when a
   report arrives. What the public sees is derived from the reports themselves:
   - a rejected report (or one whose file cannot be read) contributes nothing:
     no text, address, URL, loss, victim count or score;
   - reports nobody has moderated cannot raise a community platform above
     "Suspicious" (score 9), however many of them arrive;
   - seeded platforms (with external sources) keep their seeded values.
   Stored files written before this rule are corrected here at read time. */

/** Report statuses the public may see. */
export const PUBLISHED_STATUSES: readonly ScamReport['status'][] = ['pending', 'verified'];
export const isPublished = (report: Pick<ScamReport, 'status'>) => PUBLISHED_STATUSES.includes(report.status);

/** Highest score a community platform reaches without a moderator-verified report. */
export const UNMODERATED_SCORE_CAP = 9;

const hasSources = (platform: ScamPlatform) => (platform.sources?.length ?? 0) > 0;

/**
 * Read reports by id; a report that is missing or cannot be read is left out. `failed` counts the
 * reads that ended in an error (a missing file is not one): with failed > 0 the absence of a
 * report in the result does not mean there is none.
 */
async function loadReportsChecked(ids: string[]): Promise<{ reports: ScamReport[]; failed: number }> {
  const unique = Array.from(new Set(ids));
  const results = await Promise.allSettled(unique.map(id => s3Get(`reports/${id}.json`)));
  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed) console.warn(`[scam-db] ${failed}/${results.length} report reads failed; they are not shown`);
  const reports = results
    .map(r => (r.status === 'fulfilled' ? r.value : null))
    .filter((r): r is ScamReport => !!r && unique.includes(r.id));
  return { reports, failed };
}

/** Read reports by id; a report that is missing or cannot be read is left out. */
async function loadReports(ids: string[]): Promise<ScamReport[]> {
  return (await loadReportsChecked(ids)).reports;
}

/** Which values of a platform came from the verified seed, before any report. */
function baselineOf(platform: ScamPlatform): SeedBaseline | null {
  if (platform.seedBaseline) return platform.seedBaseline;
  // Platforms seeded before baselines were recorded: the seed in code is the record.
  const seed = VERIFIED_SEED_PLATFORMS.find(p => p.slug === platform.slug);
  return seed ? seedBaselineFrom(seed) : null;
}

/**
 * For a sourced platform with no record of its seed: counts are additive (each report
 * added exactly one victim, its loss and its chain confirmation), so the seed's counts
 * are the stored totals minus the reports' — when every report could be read. Sets
 * (addresses, URLs, types) cannot be separated this way and are left empty.
 */
function countsOnlyBaseline(platform: ScamPlatform, reports: ScamReport[]): SeedBaseline {
  const ids = new Set(platform.reportIds);
  const own = reports.filter(r => ids.has(r.id));
  const complete = own.length === ids.size;
  return {
    victims: Math.max(0, platform.victims - platform.reportIds.length),
    totalLoss: complete ? Math.max(0, platform.totalLoss - own.reduce((s, r) => s + (r.lossAmount || 0), 0)) : 0,
    blockchainVerifiedCount: complete ? Math.max(0, platform.blockchainVerifiedCount - own.filter(r => r.blockchainConfirmed).length) : 0,
    addresses: [],
    urls: [],
    types: [],
    staffVerified: false,
    verified: false,
    trustScore: 0,
    firstReported: platform.firstReported,
    lastReported: '',
  };
}

/**
 * The platform as the public may see it, or null when nothing about it may be shown.
 * `reports` are the platform's loaded report files (any status).
 *
 * Shown values are the seed baseline plus what published reports carry. Nothing is
 * inferred from the stored aggregates, which mix both and cannot tell them apart:
 * a rejected report that repeats a seeded address leaves the seeded address shown,
 * and an item no published report or baseline carries is not shown.
 */
export function toPublicPlatform(platform: ScamPlatform, reports: ScamReport[]): ScamPlatform | null {
  const sourced = hasSources(platform);
  if (platform.reportIds.length === 0) return sourced || platform.victims > 0 ? platform : null;

  const published = reports.filter(r => isPublished(r) && platform.reportIds.includes(r.id));
  if (!sourced && published.length === 0) return null;
  const base = baselineOf(platform) ?? (sourced ? countsOnlyBaseline(platform, reports) : null);

  const union = <T>(fromBase: T[] | undefined, of: (r: ScamReport) => (T | undefined)[]): T[] =>
    Array.from(new Set([...(fromBase ?? []), ...published.flatMap(of)]))
      .filter((x): x is T => x !== undefined && x !== '');

  const staffVerifiedReport = published.some(r => r.status === 'verified' && r.trustTier === 3);
  const moderated = published.some(r => r.status === 'verified');
  const dates = [...(base ? [base.firstReported, base.lastReported] : []), ...published.map(r => r.createdAt)]
    .filter(Boolean).sort();

  const view: ScamPlatform = {
    ...platform,
    reportIds: published.map(r => r.id),
    victims: (base?.victims ?? 0) + published.length,
    totalLoss: (base?.totalLoss ?? 0) + published.reduce((sum, r) => sum + (r.lossAmount || 0), 0),
    blockchainVerifiedCount: (base?.blockchainVerifiedCount ?? 0) + published.filter(r => r.blockchainConfirmed).length,
    staffVerified: !!base?.staffVerified || staffVerifiedReport,
    addresses: union(base?.addresses, r => [r.scamAddress]),
    urls: union(base?.urls, r => [r.platformUrl, ...(r.platformUrls || [])]),
    types: union(base?.types, r => [r.platformType]),
    firstReported: dates[0] ?? platform.firstReported,
    lastReported: dates[dates.length - 1] ?? platform.lastReported,
  };
  let score = calcTrustScore(view);
  if (sourced) score = Math.max(score, base?.trustScore ?? 0);
  else if (!moderated) score = Math.min(score, UNMODERATED_SCORE_CAP);
  view.trustScore = score;
  view.verified = !!base?.verified || score >= 10;
  delete view.seedBaseline;
  return view;
}

const toIndexEntry = (p: ScamPlatform): PlatformIndexEntry => ({
  slug: p.slug,
  name: p.name,
  victims: p.victims,
  totalLoss: p.totalLoss,
  blockchainVerifiedCount: p.blockchainVerifiedCount,
  verified: p.verified,
  trustScore: p.trustScore,
  types: p.types,
  urls: p.urls,
  lastReported: p.lastReported,
  addresses: p.addresses,
});

/** Public platform and its published reports, or null when it may not be shown. */
export async function getPublicPlatform(slug: string): Promise<{ platform: ScamPlatform; reports: ScamReport[] } | null> {
  const platform: ScamPlatform | null = await s3Get(`platforms/${slug}.json`);
  if (!platform) return null;
  const reports = await loadReports(platform.reportIds);
  const view = toPublicPlatform(platform, reports);
  if (!view) return null;
  const order = new Map(view.reportIds.map((id, i) => [id, i]));
  return { platform: view, reports: reports.filter(r => order.has(r.id)).sort((a, b) => order.get(a.id)! - order.get(b.id)!) };
}

/* The public index is recomputed from platform and report files; cached briefly in
   this process and dropped on every write made here. */
const INDEX_TTL_MS = 30_000;
let publicIndexCache: { at: number; value: PlatformIndexEntry[] } | null = null;
export function _clearPublicIndexCache(): void { publicIndexCache = null; }

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}

async function readStoredIndex(): Promise<PlatformIndexEntry[]> {
  const data = await s3Get('index/platforms.json');
  return Array.isArray(data) ? data : [];
}

async function buildPublicIndex(stored: PlatformIndexEntry[]): Promise<PlatformIndexEntry[]> {
  const entries = await mapLimit(stored, 8, async (entry) => {
    // Seeded entries without reports have nothing to correct.
    if (!entry.victims) return entry;
    const view = await getPublicPlatform(entry.slug);
    return view ? toIndexEntry(view.platform) : null;
  });
  return entries.filter((e): e is PlatformIndexEntry => !!e);
}

/* ── Reads made by writes ──
   The public readers above leave out a report whose read fails: a page is better shown without
   it than not at all, and the next read shows it again. A WRITE must not do that: what it reads
   is stored (index entry, counters) and stays wrong after the error is gone. A report accepted
   with a temporary storage error would then be on its card but missing from search and totals.
   So a write retries a temporary error a few times and otherwise fails; it never stores a view
   computed from an incomplete read. A missing file is not an error (left out, as before). */
const TRANSIENT_READ_ATTEMPTS = 4;
const TRANSIENT_NAMES = new Set(['ServiceUnavailable', 'SlowDown', 'InternalError', 'RequestTimeout', 'TimeoutError', 'ThrottlingException']);
const TRANSIENT_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ECONNREFUSED', 'EAI_AGAIN']);

function isTransientStorageError(err: any): boolean {
  const status = err?.$metadata?.httpStatusCode;
  return (typeof status === 'number' && (status >= 500 || status === 429))
    || TRANSIENT_NAMES.has(err?.name) || TRANSIENT_CODES.has(err?.code);
}

/** s3Get for a write: a temporary error is retried, then thrown; never read as "absent". */
async function s3GetForWrite(key: string): Promise<any | null> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await s3Get(key);
    } catch (err) {
      if (!isTransientStorageError(err) || attempt >= TRANSIENT_READ_ATTEMPTS) throw err;
      await sleep(50 * 2 ** (attempt - 1) * (0.5 + Math.random()));
    }
  }
}

/** Every listed report that exists, or an error: never a silently shorter list. */
async function loadReportsForWrite(ids: string[]): Promise<ScamReport[]> {
  const unique = Array.from(new Set(ids));
  const reports = await mapLimit(unique, 8, (id) => s3GetForWrite(`reports/${id}.json`) as Promise<ScamReport | null>);
  return reports.filter((r): r is ScamReport => !!r && unique.includes(r.id));
}

/** The platform's public view computed from a complete read, for storing in the index. */
async function publicPlatformForWrite(slug: string): Promise<ScamPlatform | null> {
  const platform: ScamPlatform | null = await s3GetForWrite(`platforms/${slug}.json`);
  if (!platform) return null;
  return toPublicPlatform(platform, await loadReportsForWrite(platform.reportIds));
}

/**
 * Recompute this platform's public index entry (or remove it) after a write. On every attempt
 * the index is read first and the platform's view computed after it, so a view that misses a
 * concurrent report can only be written while that report's own refresh is still to come.
 * The view comes from a complete read (publicPlatformForWrite): a storage error fails the write.
 */
async function refreshIndexEntry(slug: string): Promise<PlatformIndexEntry[]> {
  const index = await updateJson<PlatformIndexEntry[]>('index/platforms.json', async (stored) => {
    const next = Array.isArray(stored) ? stored : [];
    const view = await publicPlatformForWrite(slug);
    const at = next.findIndex(p => p.slug === slug);
    if (view) {
      if (at >= 0) next[at] = toIndexEntry(view);
      else next.push(toIndexEntry(view));
    } else if (at >= 0) {
      next.splice(at, 1);
    }
    return next;
  });
  publicIndexCache = null;
  return index ?? [];
}

/* ── TXID uniqueness ──
   txids/<hash>.json binds a transaction hash to ONE report id, for good:
     { reportId, createdAt, state: 'claimed' }  written before that report's file (If-None-Match),
     state 'saved'                               once its file exists (conditional, same report only),
     state 'done'                                once it is linked; new submissions are refused (409).
   A record without `state` was written by the previous version after its report was saved: done.
   Every change is conditional, and a report is linked only after its own 'saved' transition, so
   two reports can never both hold one hash. The binding has no time limit (round 4 of Codex: a
   lease let a delayed request continue after its retry). Another report may take a hash over only
   while it is merely 'claimed' and the claiming report's file is absent or does not carry the hash
   (an attempt that failed before saving, or a claim left by a duplicate attempt); taking over is a
   conditional write on the same record as the 'saved' transition, so only one of them can win. */
type TxidState = 'claimed' | 'saved' | 'done';
type TxidRecord = { reportId: string; createdAt: string; state?: TxidState };
const normTx = (txid: string) => txid.trim().toLowerCase();
const txidKey = (txid: string) => `txids/${normTx(txid)}.json`;
const stateOf = (record: TxidRecord): TxidState => record.state ?? 'done';

/** The report id of a submission with this transaction hash and no submission key. */
export function txReportId(txid: string): string {
  const h = createHash('sha256').update(`ledgerhound-scam-report:${normTx(txid)}`).digest('hex').toUpperCase();
  return `TX${h.slice(0, 10)}-${h.slice(10, 16)}`;
}

/**
 * True when a report with this hash was saved and linked completely — by a report other than
 * `ownReportId` (the id of the submission asking, when it is known: a retry of the very
 * submission that used the hash is not refused).
 */
export async function isTxidUsed(txid: string, ownReportId?: string): Promise<boolean> {
  const record = await s3Get(txidKey(txid)) as TxidRecord | null;
  return !!record && stateOf(record) === 'done' && record.reportId !== ownReportId;
}

/**
 * Bind the hash to report `id` before its file is written, or throw TxidAlreadyUsedError.
 * `doneIsOwn`: a done binding to this same id is this submission's own (a retry with the same
 * submission key after a lost answer); without a key a done hash is refused, as before.
 */
async function claimTxid(tx: string, id: string, createdAt: string, doneIsOwn: boolean): Promise<void> {
  const key = txidKey(tx);
  for (let attempt = 1; attempt <= CONDITIONAL_ATTEMPTS; attempt++) {
    const { data, etag } = await s3GetWithEtag<TxidRecord>(key);
    if (data && data.reportId === id) {
      if (stateOf(data) === 'done' && !doneIsOwn) throw new TxidAlreadyUsedError();
      return;
    }
    if (data) {
      if (stateOf(data) !== 'claimed') throw new TxidAlreadyUsedError();
      const holder = await s3GetForWrite(`reports/${data.reportId}.json`) as ScamReport | null;
      if (holder?.txHash && normTx(holder.txHash) === normTx(tx)) throw new TxidAlreadyUsedError();
      // the claiming attempt saved nothing with this hash: take the stale claim over
    }
    try {
      await s3PutIf(key, { reportId: id, createdAt, state: 'claimed' } satisfies TxidRecord, data ? etag : undefined);
      return;
    } catch (err) {
      if (!isWriteConflict(err)) throw err;
    }
  }
  throw new Error('txid claim: too many concurrent changes');
}

/** getWithEtag for a write: a temporary error is retried, then thrown; never read as "absent". */
async function getWithEtagForWrite<T>(key: string): Promise<{ data: T | null; etag?: string }> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await s3GetWithEtag<T>(key);
    } catch (err) {
      if (!isTransientStorageError(err) || attempt >= TRANSIENT_READ_ATTEMPTS) throw err;
      await sleep(50 * 2 ** (attempt - 1) * (0.5 + Math.random()));
    }
  }
}

/**
 * A report file left by an attempt that lost its transaction hash to another report. Such a file
 * was never linked: a report is linked only after its own 'claimed' -> 'saved' transition, and a
 * hash in 'saved' or 'done' never changes hands. So the file is not public and may be replaced.
 */
async function isLeftover(report: ScamReport, id: string): Promise<boolean> {
  const tx = report.txHash?.trim();
  if (!tx) return false;
  const record = await s3GetForWrite(txidKey(tx)) as TxidRecord | null;
  return !record || record.reportId !== id;
}

/**
 * Remove report `id`'s file if it is (still) a leftover — and, with `etag`, only that version of
 * it. The checked version is passed to the delete itself (If-Match): a delete that arrives late,
 * after a retry of the same submission replaced the file with its accepted report, is refused by
 * storage (412) and the accepted report stays. Repeatable: an absent file or one that changed
 * meanwhile is left alone.
 */
async function removeLeftover(reportKey: string, id: string, etag?: string): Promise<void> {
  const current = await getWithEtagForWrite<ScamReport>(reportKey);
  if (!current.data || !current.etag) return;
  if (etag ? current.etag !== etag : !(await isLeftover(current.data, id))) return;
  try {
    await s3DeleteIf(reportKey, current.etag);
  } catch (err: any) {
    // 412: the file is no longer the checked version (replaced meanwhile); 404: already gone.
    if (isWriteConflict(err) || err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) return;
    throw err;
  }
}

/**
 * Early check of the report route (before the transaction lookup): true when a submission with
 * this hash is to be refused (409) because another report completed it. A retry of the submission
 * whose saved report is completed is not refused, whatever hash it carries; a leftover file of a
 * losing attempt of this submission is removed on the way. saveReport enforces the same rule.
 */
export async function isTxidRefused(txid: string, submissionKey?: string): Promise<boolean> {
  const id = submissionKey ? submissionReportId(submissionKey) : txReportId(txid);
  const record = await s3Get(txidKey(txid)) as TxidRecord | null;
  if (!record || stateOf(record) !== 'done') return false;
  if (record.reportId === id) return !submissionKey; // without a key a completed hash is refused, as before
  const own = submissionKey ? await getWithEtagForWrite<ScamReport>(`reports/${id}.json`) : { data: null };
  if (own.data && !(await isLeftover(own.data, id))) return false; // completes its own saved report
  await removeLeftover(`reports/${id}.json`, id);
  return true;
}

/** The report's file exists: 'claimed' -> 'saved'. False when another report holds the hash. */
async function markTxidSaved(tx: string, id: string): Promise<boolean> {
  let lost = false;
  await updateJson<TxidRecord>(txidKey(tx), (stored) => {
    if (!stored || stored.reportId !== id) { lost = true; return undefined; }
    return stateOf(stored) === 'claimed' ? { ...stored, state: 'saved' } : undefined;
  });
  return !lost;
}

/* ── Default platform ── */
function defaultPlatform(report: Pick<ScamReport, 'platformName'>, slug: string): ScamPlatform {
  return {
    slug,
    name: report.platformName,
    urls: [],
    types: [],
    reportIds: [],
    totalLoss: 0,
    lossCurrency: 'USD',
    victims: 0,
    addresses: [],
    verified: false,
    trustScore: 0,
    staffVerified: false,
    blockchainVerifiedCount: 0,
    firstReported: new Date().toISOString(),
    lastReported: new Date().toISOString(),
  };
}

function defaultStats(): ScamStats {
  return { totalReports: 0, totalPlatforms: 0, totalLoss: 0, blockchainVerified: 0, updatedAt: new Date().toISOString() };
}

/**
 * Stored counters (index/stats.json) are recomputed from the stored index on every attempt, never
 * incremented: a retry, however late, or two writers at once always produce the same numbers, and
 * nothing can be counted twice. They equal the public totals (getPublicStats) for stored entries.
 */
async function recomputeStoredStats(): Promise<void> {
  await updateJson<ScamStats>('index/stats.json', async (stored) => {
    const index = await readStoredIndex();
    const next: ScamStats = {
      totalReports: index.reduce((sum, p) => sum + p.victims, 0),
      totalPlatforms: index.length,
      totalLoss: index.reduce((sum, p) => sum + p.totalLoss, 0),
      blockchainVerified: index.reduce((sum, p) => sum + publicChainCount(p), 0),
      updatedAt: new Date().toISOString(),
    };
    const same = stored && stored.totalReports === next.totalReports && stored.totalPlatforms === next.totalPlatforms
      && stored.totalLoss === next.totalLoss && stored.blockchainVerified === next.blockchainVerified && Object.keys(stored).length === 5;
    return same ? undefined : next;
  });
}

/**
 * Steps 3-6 for a saved report: platform, address, index and stored counters. Every step is
 * conditional and idempotent per report id, so it can be repeated after a failure or run by two
 * requests at once without double counting.
 */
async function linkReport(full: ScamReport): Promise<void> {
  const { id, createdAt: now } = full;

  // 3. Platform file
  const slug = slugify(full.platformName);
  await updateJson<ScamPlatform>(`platforms/${slug}.json`, (stored) => {
    const platform = stored || defaultPlatform(full, slug);
    if (platform.reportIds.includes(id)) return undefined;
    if (hasSources(platform) && !platform.seedBaseline && platform.reportIds.length === 0) {
      platform.seedBaseline = seedBaselineFrom(platform);
    }
    platform.victims++;
    platform.totalLoss += full.lossAmount || 0;
    if (full.lossCurrency) platform.lossCurrency = full.lossCurrency;
    platform.reportIds.push(id);
    if (full.platformUrl && !platform.urls.includes(full.platformUrl)) platform.urls.push(full.platformUrl);
    if (full.platformUrls) {
      for (const u of full.platformUrls) {
        if (u && !platform.urls.includes(u)) platform.urls.push(u);
      }
    }
    if (full.scamAddress && !platform.addresses.includes(full.scamAddress)) platform.addresses.push(full.scamAddress);
    if (full.platformType && !platform.types.includes(full.platformType)) platform.types.push(full.platformType);
    if (full.blockchainConfirmed) platform.blockchainVerifiedCount++;
    if (full.trustTier === 3) platform.staffVerified = true;
    if (!platform.lastReported || now > platform.lastReported) platform.lastReported = now;
    if (now < platform.firstReported) platform.firstReported = now;
    // Seeded platforms keep their seeded score; community scores are derived at read time.
    if (!hasSources(platform)) {
      platform.trustScore = calcTrustScore(platform);
      platform.verified = platform.trustScore >= 10;
    }
    return platform;
  });

  // 4. Address index
  if (full.scamAddress) {
    const addrKey = full.scamAddress.toLowerCase();
    await updateJson<AddressIndex>(`addresses/${addrKey}.json`, (stored) => {
      const addr: AddressIndex = stored || {
        address: full.scamAddress!,
        platforms: [],
        platformNames: [],
        reports: [],
        totalLoss: 0,
        networks: [],
        firstSeen: now,
        lastSeen: now,
      };
      if (addr.reports.includes(id)) return undefined;
      if (!addr.platforms.includes(slug)) addr.platforms.push(slug);
      if (!addr.platformNames.includes(full.platformName)) addr.platformNames.push(full.platformName);
      addr.reports.push(id);
      addr.totalLoss += full.lossAmount || 0;
      if (full.network && !addr.networks.includes(full.network)) addr.networks.push(full.network);
      if (now > addr.lastSeen) addr.lastSeen = now;
      return addr;
    });
  }

  // 5. This platform's entry in the public index
  await refreshIndexEntry(slug);

  // 6. Stored counters, recomputed from the stored index (idempotent)
  await recomputeStoredStats();
}

/**
 * The report id of a form submission with this key (lib/submission-key): the same for every
 * attempt of that submission, so a retry after an error completes the same report.
 */
export function submissionReportId(key: string): string {
  const h = createHash('sha256').update(`ledgerhound-scam-submission:${key}`).digest('hex').toUpperCase();
  return `SB${h.slice(0, 10)}-${h.slice(10, 16)}`;
}

/* ── Save report (INCREMENTAL — no full rebuild) ──
   The report id belongs to the SUBMISSION: from the form's submission key when there is one
   (whatever the transaction hash of this attempt: adding or removing the hash after an error does
   not change it), else from the transaction hash, else random (callers without a key, e.g.
   seeding). Every attempt of one submission meets the same report file; the first saved version
   is the report, and a retry only completes it. One hash still belongs to one report (claimTxid). */
export async function saveReport(
  report: Omit<ScamReport, 'id' | 'createdAt'>,
  options: { submissionKey?: string } = {},
): Promise<{ id: string; report: ScamReport }> {
  const requestTx = report.txHash?.trim() || undefined;
  const key = options.submissionKey;
  const id = key ? submissionReportId(key) : requestTx ? txReportId(requestTx) : generateId();
  const reportKey = `reports/${id}.json`;
  const derived = !!(key || requestTx);
  let full: ScamReport = { ...report, ...(requestTx ? { txHash: requestTx } : {}), id, createdAt: new Date().toISOString() };
  let writtenEtag: string | undefined; // set when THIS attempt wrote the report file

  // 0. Without a submission key nothing tells a retry from a new submission: a hash whose report
  //    is complete is refused (409), as before. A leftover file of a losing attempt with that id
  //    is removed on the way (see 1).
  if (requestTx && !key && await isTxidUsed(requestTx)) {
    await removeLeftover(reportKey, id);
    throw new TxidAlreadyUsedError();
  }

  // 1. An earlier attempt of this submission already saved the report: complete THAT report —
  //    unless it is a LEFTOVER: a file whose hash another report holds was never linked (linking
  //    needs this report's own 'saved' state, and a saved or done hash never changes hands). Its
  //    attempt lost the hash and could not remove the file (e.g. storage failed). It is not the
  //    report: this attempt replaces it (or removes it, when this attempt is refused too).
  const found = derived ? await getWithEtagForWrite<ScamReport>(reportKey) : { data: null };
  const leftoverEtag = found.data && await isLeftover(found.data, id) ? found.etag : undefined;
  if (found.data && !leftoverEtag) {
    full = found.data;
  } else {
    // 2. Bind the hash of this attempt to this report before its file is written (409 when
    //    another report holds it), then write the file once (replacing a leftover, If-Match).
    if (requestTx) {
      try {
        await claimTxid(requestTx, id, full.createdAt, !!key);
      } catch (err) {
        if (leftoverEtag && (err as Error)?.name === 'TxidAlreadyUsedError') await removeLeftover(reportKey, id, leftoverEtag);
        throw err;
      }
    }
    try {
      writtenEtag = await s3PutIf(reportKey, full, leftoverEtag) ?? '';
    } catch (err) {
      if (!derived || !(isWriteConflict(err) || (leftoverEtag && (err as any)?.$metadata?.httpStatusCode === 404))) throw err;
      const parallel = await s3GetForWrite(reportKey) as ScamReport | null; // a parallel attempt of this submission
      if (!parallel) throw err; // the leftover vanished meanwhile: a retry writes the file
      full = parallel;
    }
  }

  // 3. The hash the saved report carries is this report's, and nobody else's.
  const tx = full.txHash?.trim() || undefined;
  if (tx && !(await markTxidSaved(tx, id))) {
    // Another report took the hash over while this attempt was delayed before writing its file:
    // this file was never linked, so it is removed and the submission is refused. When the
    // removal fails, the file stays a leftover that the next attempt of this submission handles.
    if (writtenEtag !== undefined) {
      try {
        await removeLeftover(reportKey, id, writtenEtag || undefined);
      } catch (err) {
        console.warn('[scam-db] leftover report file not removed; the next attempt removes or replaces it', (err as Error)?.name);
      }
    }
    throw new TxidAlreadyUsedError();
  }

  // 4-7. Platform, address, index, counters (idempotent per report id)
  await linkReport(full);

  // 8. The hash is used for good only now that its report is linked.
  if (tx) {
    await updateJson<TxidRecord>(txidKey(tx), (stored) => {
      if (!stored || stored.reportId !== id) throw new TxidAlreadyUsedError(); // cannot happen after step 3
      return stateOf(stored) === 'done' ? undefined : { ...stored, state: 'done' };
    });
  }

  return { id, report: full };
}

/* ── Save dispute ── */
export async function saveDispute(dispute: Omit<ScamDispute, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const id = generateId();
  const full: ScamDispute = { ...dispute, id, createdAt: new Date().toISOString(), status: 'pending' };
  await s3Put(`disputes/${id}.json`, full);
  return id;
}

/* ── Read data ── */
/** Public platform index: only what may be shown, with aggregates from published reports. */
export async function getPlatformIndex(): Promise<PlatformIndexEntry[]> {
  if (publicIndexCache && Date.now() - publicIndexCache.at < INDEX_TTL_MS) return publicIndexCache.value;
  const value = await buildPublicIndex(await readStoredIndex());
  publicIndexCache = { at: Date.now(), value };
  return value;
}

/** Blockchain-confirmed count of a public entry; old seed entries carry it in the seed. */
function publicChainCount(entry: PlatformIndexEntry): number {
  if (typeof entry.blockchainVerifiedCount === 'number') return entry.blockchainVerifiedCount;
  return VERIFIED_SEED_PLATFORMS.find(p => p.slug === entry.slug)?.blockchainVerifiedCount ?? 0;
}

/** Public totals, derived from the public index rather than the stored counters. */
export async function getPublicStats(): Promise<ScamStats> {
  const [stored, index] = await Promise.all([getStats(), getPlatformIndex()]);
  const totalReports = index.reduce((sum, p) => sum + p.victims, 0);
  return {
    totalReports,
    totalPlatforms: index.length,
    totalLoss: index.reduce((sum, p) => sum + p.totalLoss, 0),
    // From the public entries, never from the stored counter (which counted rejected reports).
    blockchainVerified: index.reduce((sum, p) => sum + publicChainCount(p), 0),
    updatedAt: stored.updatedAt,
  };
}

export async function getStats(): Promise<ScamStats> {
  const data = await s3Get('index/stats.json');
  if (data) {
    console.log('[stats] Loaded from S3:', JSON.stringify(data));
    return data;
  }
  console.log('[stats] No stats found in S3, returning defaults');
  return defaultStats();
}

export async function getPlatformBySlug(slug: string): Promise<ScamPlatform | null> {
  return s3Get(`platforms/${slug}.json`);
}

export async function getReportById(id: string): Promise<ScamReport | null> {
  return s3Get(`reports/${id}.json`);
}

/**
 * Public address entry: only platforms and reports that may be shown, or null.
 * Throws when the address file cannot be read, so callers can say "unavailable".
 */
export interface AddressIndexLookup {
  /** What the public may see about the address, or null when nothing was found. */
  index: AddressIndex | null;
  /**
   * Report files named by the address index that could not be read (audit F9). With
   * failedReads > 0 a null `index` is NOT "the address is not in the database", and the totals
   * of a non-null one may be short.
   */
  failedReads: number;
}

/** The address as the public may see it. Same result as `getAddressIndexChecked`, without the read count. */
export async function getAddressIndex(address: string): Promise<AddressIndex | null> {
  return (await getAddressIndexChecked(address)).index;
}

/**
 * Like `getAddressIndex`, and also says whether every report the index names could be read.
 * Callers that print a negative result ("not in the database") must use this one.
 */
export async function getAddressIndexChecked(address: string): Promise<AddressIndexLookup> {
  const stored: AddressIndex | null = await s3Get(`addresses/${address.toLowerCase()}.json`);
  if (!stored) return { index: null, failedReads: 0 };
  const ids = stored.reports || [];
  if (ids.length === 0) return { index: stored.platforms?.length ? stored : null, failedReads: 0 }; // seeded entry

  const key = address.toLowerCase();
  const { reports, failed: failedReads } = await loadReportsChecked(ids);
  const published = reports.filter(r => isPublished(r) && r.scamAddress?.toLowerCase() === key);
  const fromPublished = new Set(published.map(r => slugify(r.platformName)));

  // A platform stays when a published report names it, or when its seed baseline lists
  // this address. Nothing is inferred from the stored totals, which mix both.
  const seeded: { slug: string; name: string; base: SeedBaseline }[] = [];
  for (const slug of stored.platforms) {
    if (fromPublished.has(slug)) continue;
    const platform: ScamPlatform | null = await s3Get(`platforms/${slug}.json`);
    const base = platform ? baselineOf(platform) : null;
    if (platform && base?.addresses.some(a => a.toLowerCase() === key)) seeded.push({ slug, name: platform.name, base });
  }
  const platforms = Array.from(new Set([...Array.from(fromPublished), ...seeded.map(x => x.slug)]));
  if (platforms.length === 0) return { index: null, failedReads };
  const names = Array.from(new Set([...published.map(r => r.platformName), ...seeded.map(x => x.name)]));
  const dates = published.map(r => r.createdAt).sort();
  const index: AddressIndex = {
    address: stored.address,
    platforms,
    platformNames: names,
    reports: published.map(r => r.id),
    totalLoss: seeded.reduce((s, x) => s + x.base.totalLoss, 0) + published.reduce((s, r) => s + (r.lossAmount || 0), 0),
    networks: Array.from(new Set(published.map(r => r.network).filter((n): n is string => !!n))),
    firstSeen: dates[0] ?? stored.firstSeen,
    lastSeen: dates[dates.length - 1] ?? stored.lastSeen,
  };
  return { index, failedReads };
}

/* ── Search ── */
export async function searchPlatforms(query: string): Promise<PlatformIndexEntry[]> {
  const index = await getPlatformIndex();
  const q = query.toLowerCase().trim();
  if (!q) return index;
  return index.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.slug.includes(q) ||
    p.urls.some(u => u.toLowerCase().includes(q)) ||
    p.addresses.some(a => a.toLowerCase().includes(q))
  );
}

export async function searchByAddress(address: string): Promise<PlatformIndexEntry[]> {
  // First check dedicated address index (O(1) lookup)
  const addrIndex = await getAddressIndex(address);
  if (addrIndex && addrIndex.platforms.length > 0) {
    const index = await getPlatformIndex();
    return index.filter(p => addrIndex.platforms.includes(p.slug));
  }
  // Fallback to platform index scan
  const index = await getPlatformIndex();
  const addr = address.toLowerCase().trim();
  return index.filter(p => p.addresses.some(a => a.toLowerCase() === addr));
}

/* ── Admin: list all reports (with S3 pagination) ── */
export async function listAllReports(): Promise<ScamReport[]> {
  const s3 = getS3();
  const allReports: ScamReport[] = [];
  let ContinuationToken: string | undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: bucket(),
      Prefix: `${PREFIX}/reports/`,
      ContinuationToken,
    }));
    if (res.Contents) {
      const batch = await Promise.all(
        res.Contents.map(async (obj) => {
          try {
            const data = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: obj.Key! }));
            return JSON.parse(await streamToString(data.Body)) as ScamReport;
          } catch { return null; }
        })
      );
      allReports.push(...(batch.filter(Boolean) as ScamReport[]));
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return allReports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Every report, or an error. Unlike listAllReports (which drops unreadable objects for the
 * admin list), any listing or read failure throws, so a scheduled summary can never present
 * an incomplete read as a smaller number.
 */
export async function listAllReportsStrict(): Promise<ScamReport[]> {
  const s3 = getS3();
  const keys: string[] = [];
  let ContinuationToken: string | undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: `${PREFIX}/reports/`, ContinuationToken }));
    for (const obj of res.Contents || []) if (obj.Key) keys.push(obj.Key);
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    if (res.IsTruncated && !ContinuationToken) throw new Error('report listing truncated without a continuation token');
  } while (ContinuationToken);
  const reports: ScamReport[] = [];
  for (let i = 0; i < keys.length; i += 16) {
    const batch = await Promise.allSettled(keys.slice(i, i + 16).map(async (Key) => {
      const data = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key }));
      return JSON.parse(await streamToString(data.Body)) as ScamReport;
    }));
    const failed = batch.filter((r) => r.status === 'rejected').length;
    if (failed) throw new Error(`${failed} of ${keys.length} report objects could not be read`);
    for (const r of batch) if (r.status === 'fulfilled') reports.push(r.value);
  }
  return reports;
}

/* Owner digest record of one day (scam-database/digests/owner-<day>.json): the frozen e-mail and
   its delivery state, see lib/owner-digest.ts. */
const digestKey = (day: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('invalid digest day');
  return `digests/owner-${day}.json`;
};

export async function readOwnerDigestRecord<T = unknown>(day: string): Promise<T | null> {
  return s3Get(digestKey(day));
}

/** Creates the record only if absent (If-None-Match: *); false when it already exists. */
export async function createOwnerDigestRecord(day: string, record: unknown): Promise<boolean> {
  try {
    await s3PutIf(digestKey(day), record);
    return true;
  } catch (err) {
    if (isWriteConflict(err)) return false;
    throw err;
  }
}

export async function markOwnerDigestDelivered(day: string, result: string, deliveredAt: string): Promise<void> {
  await updateJson<Record<string, unknown>>(digestKey(day), (stored) => {
    if (!stored) throw new Error('digest record missing');
    return { ...stored, state: 'delivered', result, deliveredAt };
  });
}

/* ── Admin: update report status ── */
export async function updateReportStatus(id: string, status: 'verified' | 'rejected', trustTier?: 1 | 2 | 3): Promise<void> {
  // Conditional: two moderators changing the same report cannot overwrite each other.
  const report = await updateJson<ScamReport>(`reports/${id}.json`, (stored) => {
    if (!stored) throw new Error('Report not found');
    stored.status = status;
    if (trustTier) stored.trustTier = trustTier;
    if (status === 'verified') stored.verifiedAt = new Date().toISOString();
    return stored;
  });
  if (!report) throw new Error('Report not found');

  // The platform's public view (score, counts, addresses) is derived from its reports;
  // the stored index entry is refreshed so lists and search follow the new status.
  const slug = slugify(report.platformName);
  if (await getPlatformBySlug(slug)) await refreshIndexEntry(slug);
  publicIndexCache = null;

  // Stored counters follow the index (recomputed, so a repeated moderation call cannot double count).
  await recomputeStoredStats();
}

/* ── List disputes ── */
export async function listDisputes(): Promise<ScamDispute[]> {
  const s3 = getS3();
  const disputes: ScamDispute[] = [];
  let ContinuationToken: string | undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: bucket(),
      Prefix: `${PREFIX}/disputes/`,
      ContinuationToken,
    }));
    if (res.Contents) {
      const batch = await Promise.all(
        res.Contents.map(async (obj) => {
          try {
            const data = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: obj.Key! }));
            return JSON.parse(await streamToString(data.Body)) as ScamDispute;
          } catch { return null; }
        })
      );
      disputes.push(...(batch.filter(Boolean) as ScamDispute[]));
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return disputes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ── Update dispute status ── */
export async function updateDisputeStatus(
  disputeId: string,
  status: ScamDispute['status'],
  resolutionNote?: string,
): Promise<ScamDispute | null> {
  const existing = await s3Get(`disputes/${disputeId}.json`) as ScamDispute | null;
  if (!existing) return null;

  const updated: ScamDispute = {
    ...existing,
    status,
    resolvedAt: ['resolved', 'rejected'].includes(status) ? new Date().toISOString() : existing.resolvedAt,
    resolutionNote: resolutionNote || existing.resolutionNote,
  };

  await s3Put(`disputes/${disputeId}.json`, updated);
  return updated;
}

/* ── Get single dispute ── */
export async function getDispute(disputeId: string): Promise<ScamDispute | null> {
  return await s3Get(`disputes/${disputeId}.json`) as ScamDispute | null;
}

/* ── Recovery score calculator ── */
export function calcRecoveryScore(report: {
  lossDate?: string;
  blockchainConfirmed: boolean;
  network?: string;
  lossAmount?: number;
}): { score: number; label: string; details: string[] } {
  let score = 30; // baseline
  const details: string[] = [];

  // Time factor
  if (report.lossDate) {
    const daysSince = Math.floor((Date.now() - new Date(report.lossDate).getTime()) / 86400000);
    if (daysSince <= 7) { score += 25; details.push('Reported within 7 days — critical window for exchange freezes'); }
    else if (daysSince <= 30) { score += 15; details.push('Reported within 30 days — some exchange cooperation possible'); }
    else if (daysSince <= 90) { score += 5; details.push('Reported within 90 days — limited exchange cooperation'); }
    else { details.push('Reported after 90 days — recovery more difficult but not impossible'); }
  }

  // Blockchain evidence
  if (report.blockchainConfirmed) { score += 15; details.push('Transaction verified on blockchain — strong evidence for legal action'); }

  // Network factor (some chains easier to trace)
  if (['eth', 'bnb', 'polygon'].includes(report.network || '')) { score += 5; details.push('EVM chain — well-supported by exchange compliance teams'); }
  else if (report.network === 'btc') { score += 5; details.push('Bitcoin — traceable through UTXO analysis'); }
  else if (report.network === 'trx') { score += 3; details.push('TRON — USDT tracing available but fewer exchange freeze options'); }

  // Amount factor
  if ((report.lossAmount || 0) >= 50000) { score += 10; details.push('Significant amount — meets threshold for law enforcement priority'); }
  else if ((report.lossAmount || 0) >= 10000) { score += 5; details.push('Moderate amount — viable for legal action'); }

  score = Math.min(85, Math.max(5, score));
  const label = score >= 60 ? 'Good recovery potential' : score >= 40 ? 'Moderate recovery potential' : 'Limited recovery potential';

  return { score, label, details };
}

/* ── Seed database from VERIFIED platforms ──────────────────────────────
 *
 * 2026-05-20 CLEANUP: The original SEED array contained 10 fabricated platforms
 * (CryptoTrade Pro, BitInvestment Club, etc.) with no real provenance — one
 * entry falsely labeled Binance hot wallet 0x56eddb7a... as "CryptoYield Ponzi".
 * This created defamation risk and was indexed on ledgerhound.vip publicly.
 *
 * All 10 fabricated platforms were removed in feature/report-v2-phase-0-cleanup.
 * See docs/removed-fabricated-entries.md for the full audit trail.
 *
 * NEW BEHAVIOR: This function now seeds from VERIFIED_SEED_PLATFORMS in
 * lib/scam-db-verified-seed.ts. Each entry there MUST have real on-chain
 * evidence + external corroboration + documented research process.
 *
 * Currently empty (until Phase 4 adds DZHLWK FINTECH).
 */
export async function seedDatabase(force = false): Promise<{ seeded: number; skipped: boolean }> {
  console.log('[seed] Starting seed...');
  console.log('[seed] Bucket:', bucket(), 'Region:', process.env.AWS_REGION || 'eu-central-1');

  // Check if already seeded (skip unless force=true)
  const existing = await readStoredIndex();
  if (!force && existing.length > 0) {
    console.log('[seed] Database already has', existing.length, 'platforms, skipping (use force=true to re-seed)');
    return { seeded: 0, skipped: true };
  }

  const now = new Date().toISOString();

  if (VERIFIED_SEED_PLATFORMS.length === 0) {
    console.log('[seed] No verified seed platforms defined yet. Database remains empty.');
    console.log('[seed] Add platforms to lib/scam-db-verified-seed.ts with full evidence chain.');
    // Write empty indexes so reads return [] not 404
    await Promise.all([
      s3Put('index/platforms.json', [] as PlatformIndexEntry[]),
      s3Put('index/stats.json', {
        totalReports: 0, totalPlatforms: 0, totalLoss: 0, blockchainVerified: 0, updatedAt: now,
      } as ScamStats),
    ]);
    return { seeded: 0, skipped: false };
  }

  console.log(`[seed] Loading ${VERIFIED_SEED_PLATFORMS.length} verified platforms...`);
  const allPlatforms: ScamPlatform[] = [];
  const allAddresses: { key: string; data: AddressIndex }[] = [];
  const platformIndex: PlatformIndexEntry[] = [];
  let totalReports = 0;
  let totalLoss = 0;
  let totalVerified = 0;

  for (const seed of VERIFIED_SEED_PLATFORMS) {
    const platform: ScamPlatform = { ...seed, seedBaseline: seedBaselineFrom(seed) };
    allPlatforms.push(platform);
    platformIndex.push({
      slug: platform.slug,
      name: platform.name,
      victims: platform.victims,
      totalLoss: platform.totalLoss,
      verified: platform.verified,
      trustScore: platform.trustScore,
      types: platform.types,
      urls: platform.urls,
      lastReported: platform.lastReported,
      addresses: platform.addresses,
    });

    for (const addr of platform.addresses) {
      allAddresses.push({
        key: `addresses/${addr.toLowerCase()}.json`,
        data: {
          address: addr,
          platforms: [platform.slug],
          platformNames: [platform.name],
          reports: platform.reportIds,
          totalLoss: platform.totalLoss,
          networks: [],
          firstSeen: platform.firstReported,
          lastSeen: platform.lastReported,
        },
      });
    }

    totalReports += platform.victims;
    totalLoss += platform.totalLoss;
    totalVerified += platform.blockchainVerifiedCount;
  }

  const stats: ScamStats = {
    totalReports, totalPlatforms: allPlatforms.length,
    totalLoss, blockchainVerified: totalVerified,
    updatedAt: now,
  };

  await Promise.all([
    s3Put('index/platforms.json', platformIndex),
    s3Put('index/stats.json', stats),
  ]);
  for (let i = 0; i < allPlatforms.length; i += 4) {
    const batch = allPlatforms.slice(i, i + 4);
    await Promise.all(batch.map(p => s3Put(`platforms/${p.slug}.json`, p)));
  }
  if (allAddresses.length > 0) {
    await Promise.all(allAddresses.map(a => s3Put(a.key, a.data)));
  }

  publicIndexCache = null;
  console.log(`[seed] Done! ${stats.totalPlatforms} verified platforms seeded.`);
  return { seeded: allPlatforms.length, skipped: false };
}


/* ── Delete report + platform cleanup ── */
export async function deleteReportAndPlatform(reportId: string, platformSlug: string): Promise<{
  deleted: string[];
  updatedStats: ScamStats;
  platformsRemaining: number;
}> {
  const deleted: string[] = [];

  // 1. Delete report JSON
  try {
    await s3Delete(`reports/${reportId}.json`);
    deleted.push(`reports/${reportId}.json`);
  } catch (e) { console.log(`[delete] report ${reportId} not found, skipping`); }

  // 2. Delete platform JSON
  try {
    await s3Delete(`platforms/${platformSlug}.json`);
    deleted.push(`platforms/${platformSlug}.json`);
  } catch (e) { console.log(`[delete] platform ${platformSlug} not found, skipping`); }

  // 3. Update platforms index — remove the entry
  const filtered = (await updateJson<PlatformIndexEntry[]>('index/platforms.json',
    (stored) => (Array.isArray(stored) ? stored : []).filter(p => p.slug !== platformSlug))) ?? [];
  publicIndexCache = null;
  deleted.push('index/platforms.json (updated)');

  // 4. Update stats (recomputed from the stored index)
  await recomputeStoredStats();
  const stats = await getStats();
  deleted.push('index/stats.json (updated)');

  // 5. Clean up address index entries referencing this platform
  // (best effort — iterate known addresses if platform data existed)

  console.log(`[delete] Cleaned up report=${reportId}, platform=${platformSlug}`);
  console.log(`[delete] Platforms remaining: ${filtered.length}`);
  console.log(`[delete] Updated stats:`, JSON.stringify(stats));

  return { deleted, updatedStats: stats, platformsRemaining: filtered.length };
}

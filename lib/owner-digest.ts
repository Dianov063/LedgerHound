/**
 * Daily owner digest of the public crypto scam database (package 58, stage 2).
 *
 * Once a day the owner receives the number of complaints that arrived during the previous
 * calendar day in America/New_York. scripts/cron-runner.mjs calls the route every 15 minutes;
 * the digest of day D is due from 09:00 on D+1 and every run until 08:59 on D+2 targets D, so a
 * failed attempt is retried automatically for the same date (see digestTargetDay). The digest
 * also shows the CURRENT statuses of those complaints at the moment it is built, and a breakdown
 * by every supported category. Counts only: no applicant e-mail, wallet address, description or evidence.
 *
 * Safety rules:
 * - off by default: OWNER_DIGEST_ENABLED must be "true" and OWNER_DIGEST_TO set;
 * - an incomplete read of the store fails the run -- it never becomes a digest of zeros;
 * - the day's e-mail is frozen in digests/owner-<day>.json before the first attempt; every retry
 *   resends exactly that message to exactly those recipients under the same key (round 3);
 * - a delivered digest is marked in that record; a repeated run for the same day sends nothing,
 *   and the provider idempotency key covers a crash between send and mark;
 * - it is recorded only when the provider accepted it ('sent' / 'already-sent'); a failed send,
 *   a suppressed recipient or the log-only transport record nothing, so the next run retries.
 */
import { createHash } from 'crypto';
import type { CreateEmailOptions } from 'resend';
import type { ScamReport, ScamType } from './scam-db';
import type { SendResult } from './idempotent-email';

/** Must stay equal to the owner-digest job's timeZone in scripts/cron-runner.mjs (a test checks it). */
export const OWNER_DIGEST_TIME_ZONE = 'America/New_York';
export const DIGEST_CATEGORIES: ScamType[] = ['fake_exchange', 'pig_butchering', 'rug_pull', 'phishing', 'ponzi', 'other'];
export const DIGEST_STATUSES = ['pending', 'verified', 'rejected'] as const;
const CATEGORY_LABELS: Record<ScamType, string> = {
  fake_exchange: 'Fake exchange',
  pig_butchering: 'Pig butchering / romance',
  rug_pull: 'Rug pull / DeFi',
  phishing: 'Phishing / impersonation',
  ponzi: 'Ponzi / pyramid',
  other: 'Other',
};

export class DigestReadError extends Error {
  constructor(message: string) { super(message); this.name = 'DigestReadError'; }
}

/** The transport answered, but the provider did not accept the e-mail (suppressed / log only). */
export class DigestNotDeliveredError extends Error {
  constructor(readonly result: string) { super(`owner digest not accepted by the e-mail provider: ${result}`); this.name = 'DigestNotDeliveredError'; }
}

/** Transport results that mean the provider accepted this message (now or under the same key before). */
export const CONFIRMED_RESULTS: readonly SendResult[] = ['sent', 'already-sent'];

export interface DigestDay {
  /** Calendar day in the digest time zone, YYYY-MM-DD. */
  day: string;
  timeZone: string;
  /** [startUtc, endUtc): local midnight to the next local midnight. */
  startUtc: string;
  endUtc: string;
  /** 24, or 23 / 25 on daylight-saving change days. */
  hours: number;
}

export interface DigestData {
  day: DigestDay;
  total: number;
  byStatus: Record<(typeof DIGEST_STATUSES)[number], number>;
  byCategory: Record<ScamType, number>;
  /** Reports with a status or category this digest does not know (shown only when > 0). */
  unrecognized: { status: number; category: number };
  reportsScanned: number;
  generatedAt: string;
}

/* ── time zone arithmetic (Intl only, no dependencies) ── */
function zonedParts(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

/** Offset of `timeZone` from UTC at `instant`, in ms (local = utc + offset). */
function offsetMs(instant: number, timeZone: string): number {
  const p = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** UTC instant of local midnight on y-m-d in `timeZone`. */
function localMidnightUtc(y: number, m: number, d: number, timeZone: string): number {
  const naive = Date.UTC(y, m - 1, d);
  let utc = naive - offsetMs(naive, timeZone);
  const second = naive - offsetMs(utc, timeZone);
  if (second !== utc) utc = second;
  return utc;
}

const ymd = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Local calendar day y-m-d shifted by `offset` days, with its [start, end) in UTC. */
function localDay(y: number, m: number, d: number, offset: number, timeZone: string): DigestDay {
  const day = new Date(Date.UTC(y, m - 1, d + offset));
  const next = new Date(Date.UTC(y, m - 1, d + offset + 1));
  const start = localMidnightUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), timeZone);
  const end = localMidnightUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), timeZone);
  return { day: ymd(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate()), timeZone,
    startUtc: new Date(start).toISOString(), endUtc: new Date(end).toISOString(), hours: (end - start) / 3_600_000 };
}

/** The calendar day before `now`'s local date in `timeZone`. */
export function previousDay(now: Date, timeZone = OWNER_DIGEST_TIME_ZONE): DigestDay {
  const today = zonedParts(now.getTime(), timeZone);
  return localDay(today.year, today.month, today.day, -1, timeZone);
}

/** Local hour from which the digest of the previous day is due. */
export const OWNER_DIGEST_SEND_HOUR = 9;

/**
 * The day a run at `now` is responsible for. From 09:00 on day D+1 until 08:59 on day D+2 every
 * run targets day D, so a failed 09:00 attempt is retried for the SAME date by the next runs;
 * the target moves on only at the next 09:00.
 */
export function digestTargetDay(now: Date, timeZone = OWNER_DIGEST_TIME_ZONE, sendHour = OWNER_DIGEST_SEND_HOUR): DigestDay {
  const local = zonedParts(now.getTime(), timeZone);
  return localDay(local.year, local.month, local.day, local.hour >= sendHour ? -1 : -2, timeZone);
}

/* ── aggregation ── */
export function buildDigest(reports: ScamReport[], day: DigestDay, now: Date): DigestData {
  const start = Date.parse(day.startUtc);
  const end = Date.parse(day.endUtc);
  const byStatus = { pending: 0, verified: 0, rejected: 0 };
  const byCategory = Object.fromEntries(DIGEST_CATEGORIES.map((c) => [c, 0])) as Record<ScamType, number>;
  const unrecognized = { status: 0, category: 0 };
  let total = 0;
  for (const r of reports) {
    const at = Date.parse(r?.createdAt);
    if (!Number.isFinite(at)) throw new DigestReadError('a report has no readable createdAt; the digest would be incomplete');
    if (at < start || at >= end) continue;
    total++;
    if ((DIGEST_STATUSES as readonly string[]).includes(r.status)) byStatus[r.status]++;
    else unrecognized.status++;
    if (DIGEST_CATEGORIES.includes(r.platformType)) byCategory[r.platformType]++;
    else unrecognized.category++;
  }
  return { day, total, byStatus, byCategory, unrecognized, reportsScanned: reports.length, generatedAt: now.toISOString() };
}

/* ── e-mail (counts only) ── */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderDigestEmail(data: DigestData): { subject: string; html: string; text: string } {
  const { day } = data;
  const noun = data.total === 1 ? 'complaint' : 'complaints';
  const subject = `LedgerHound daily digest ${day.day}: ${data.total} new scam ${noun}`;
  const statusRows: [string, number][] = [['Pending review', data.byStatus.pending], ['Approved (verified)', data.byStatus.verified], ['Rejected', data.byStatus.rejected]];
  if (data.unrecognized.status) statusRows.push(['Other status', data.unrecognized.status]);
  const categoryRows: [string, number][] = DIGEST_CATEGORIES.map((c) => [CATEGORY_LABELS[c], data.byCategory[c]]);
  if (data.unrecognized.category) categoryRows.push(['Unrecognized category', data.unrecognized.category]);
  const window = `${day.day} (${day.timeZone}; ${day.startUtc} to ${day.endUtc} UTC, ${day.hours} h)`;
  const table = (title: string, rows: [string, number][]) =>
    `<h3 style="margin:16px 0 6px;font-size:15px">${esc(title)}</h3><table style="border-collapse:collapse;font-size:14px">${rows
      .map(([k, v]) => `<tr><td style="padding:3px 16px 3px 0">${esc(k)}</td><td style="padding:3px 0;text-align:right"><b>${v}</b></td></tr>`).join('')}</table>`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:560px">
<h2 style="font-size:18px;margin:0 0 8px">Scam database: daily digest</h2>
<p style="margin:0 0 4px">New complaints received on ${esc(window)}:</p>
<p style="font-size:28px;margin:4px 0 12px"><b>${data.total}</b></p>
${table('Current status of these complaints', statusRows)}
${table('By category', categoryRows)}
<p style="color:#64748b;font-size:12px;margin-top:18px">Statuses as of ${esc(data.generatedAt)}. Counts only; complaint details are in the admin panel.</p>
</div>`;
  const text = [
    'Scam database: daily digest',
    `New complaints received on ${window}: ${data.total}`,
    '',
    'Current status of these complaints:',
    ...statusRows.map(([k, v]) => `  ${k}: ${v}`),
    '',
    'By category:',
    ...categoryRows.map(([k, v]) => `  ${k}: ${v}`),
    '',
    `Statuses as of ${data.generatedAt}. Counts only; complaint details are in the admin panel.`,
  ].join('\n');
  return { subject, html, text };
}

/* ── configuration ── */
export interface DigestConfig { enabled: boolean; to: string[]; from: string; timeZone: string }
const EMAIL = /^[^\s@<>,]+@[^\s@<>,]+\.[^\s@<>,]+$/;

/** Reads OWNER_DIGEST_*; throws when enabled with a missing or invalid recipient. */
export function digestConfigFromEnv(env: Record<string, string | undefined> = process.env): DigestConfig {
  const enabled = env.OWNER_DIGEST_ENABLED?.trim().toLowerCase() === 'true';
  const to = (env.OWNER_DIGEST_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
  const from = env.OWNER_DIGEST_FROM?.trim() || env.RESEND_FROM_EMAIL?.trim() || 'LedgerHound <noreply@ledgerhound.vip>';
  if (enabled && (to.length === 0 || to.some((a) => !EMAIL.test(a)))) {
    throw new Error('OWNER_DIGEST_ENABLED is true but OWNER_DIGEST_TO is missing or not a valid address list');
  }
  return { enabled, to, from, timeZone: OWNER_DIGEST_TIME_ZONE };
}

/* ── run ──
   The e-mail of a day is built ONCE and frozen in the day's record before the first attempt
   (scam-database/digests/owner-<day>.json, state 'pending'): sender, recipients, subject, html,
   text, the counts and the idempotency key. Every retry sends exactly that message to exactly those
   recipients with that key, so a provider idempotency check never sees a different payload under
   the same key (Resend answers 409 to that; MailHub likewise) and "already accepted" can only refer
   to this very message. The key also carries a hash of the frozen message. The record becomes
   'delivered' only after the provider accepted it ('sent' or 'already-sent'). */
export interface DigestEmail { from: string; to: string[]; subject: string; html: string; text: string }
export interface DigestRecord {
  day: string;
  state: 'pending' | 'delivered';
  idempotencyKey: string;
  email: DigestEmail;
  digest: DigestData;
  builtAt: string;
  result?: SendResult;
  deliveredAt?: string;
}
export interface DigestStore {
  /** Every report; must throw when any object cannot be listed or read. */
  listReportsStrict(): Promise<ScamReport[]>;
  readRecord(day: string): Promise<DigestRecord | null>;
  /** Creates the record only if none exists; false when another run created it first. */
  createRecord(day: string, record: DigestRecord): Promise<boolean>;
  markDelivered(day: string, result: SendResult, deliveredAt: string): Promise<void>;
}
export type DigestSender = (payload: CreateEmailOptions, idempotencyKey: string) => Promise<SendResult>;

export type DigestResult =
  | { status: 'disabled' }
  | { status: 'already-sent'; day: string; result?: SendResult; deliveredAt?: string; total: number }
  | { status: 'dry-run'; digest: DigestData; subject: string }
  | { status: 'sent'; day: string; result: SendResult; digest: DigestData; resent: boolean };

/** Key of one frozen message: day + hash of exactly what is sent. */
export function digestIdempotencyKey(day: string, email: DigestEmail): string {
  return `owner-digest:${day}:${createHash('sha256').update(JSON.stringify(email)).digest('hex').slice(0, 16)}`;
}

export async function runOwnerDigest(opts: { now: Date; config: DigestConfig; store: DigestStore; send: DigestSender; dryRun?: boolean }): Promise<DigestResult> {
  const { now, config, store, send, dryRun } = opts;
  if (!config.enabled && !dryRun) return { status: 'disabled' };
  const day = digestTargetDay(now, config.timeZone);
  if (dryRun) {
    const digest = buildDigest(await store.listReportsStrict(), day, now);
    return { status: 'dry-run', digest, subject: renderDigestEmail(digest).subject };
  }

  // A read error propagates: an unknown state never leads to a send.
  let record = await store.readRecord(day.day);
  const resent = !!record;
  if (!record) {
    const digest = buildDigest(await store.listReportsStrict(), day, now);
    const rendered = renderDigestEmail(digest);
    const email: DigestEmail = { from: config.from, to: config.to, subject: rendered.subject, html: rendered.html, text: rendered.text };
    const fresh: DigestRecord = { day: day.day, state: 'pending', idempotencyKey: digestIdempotencyKey(day.day, email), email, digest, builtAt: now.toISOString() };
    // Frozen before the first attempt; if this write fails nothing is sent.
    record = (await store.createRecord(day.day, fresh)) ? fresh : await store.readRecord(day.day);
    if (!record) throw new Error('digest record could not be read back');
  }
  if (record.state === 'delivered') {
    return { status: 'already-sent', day: day.day, result: record.result, deliveredAt: record.deliveredAt, total: record.digest.total };
  }

  const result = await send(record.email, record.idempotencyKey);
  // Recorded as delivered only when the provider accepted this message. 'suppressed' (recipient
  // blocked) and 'logged' (no external delivery) are failures: nothing is recorded, later runs retry.
  if (!CONFIRMED_RESULTS.includes(result)) throw new DigestNotDeliveredError(result);
  await store.markDelivered(day.day, result, new Date().toISOString());
  return { status: 'sent', day: day.day, result, digest: record.digest, resent };
}

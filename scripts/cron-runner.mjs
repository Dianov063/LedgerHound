/**
 * Self-hosted replacement for Vercel Cron.
 *
 * Runs as its own container (same image as the web app, command
 * `node scripts/cron-runner.mjs`) and calls the web container over the
 * private compose network with `Authorization: Bearer $CRON_SECRET`, exactly
 * what Vercel Cron sends. Schedules are cron expressions evaluated in UTC,
 * unless a job names a `timeZone` (then in that zone's local time, so a daily
 * 09:00 job stays at 09:00 across daylight-saving changes). The two Vercel jobs
 * must stay identical to vercel.json (a test checks it). A job with `enabledBy`
 * runs only when that variable is "on" in the cron container's environment.
 *
 * Overlap: a job is not started again while its previous call is still
 * running, and the routes themselves refuse a second concurrent run (409).
 * Missed runs (runner down at the scheduled minute) are skipped, not caught up.
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const JOBS = [
  { name: 'refresh-ofac', path: '/api/admin/refresh-ofac', cron: '0 6 * * 1', timeoutMs: 5 * 60_000 },
  { name: 'cleanup-payment-safety', path: '/api/admin/cleanup-payment-safety', cron: '20 4 * * *', timeoutMs: 5 * 60_000 },
  // Self-host only: resumes paid checkouts whose generation was interrupted.
  { name: 'resume-webhook-jobs', path: '/api/admin/resume-webhook-jobs', cron: '*/5 * * * *', timeoutMs: 10 * 60_000, reportsOrders: true },
  // Self-host only, off by default: daily owner digest of the scam database. OWNER_DIGEST_SCHEDULE=on
  // in cron.env schedules it; the route itself also needs OWNER_DIGEST_ENABLED=true to send.
  // Called every 15 minutes: the route sends day D's digest from 09:00 America/New_York on D+1 and
  // keeps retrying the same date until the provider accepts it; afterwards a call only reads the
  // delivery record. The first due call each day is 09:00 local time (timeZone below).
  { name: 'owner-digest', path: '/api/admin/owner-digest', cron: '*/15 * * * *', timeZone: 'America/New_York', timeoutMs: 2 * 60_000, enabledBy: 'OWNER_DIGEST_SCHEDULE' },
];

/** Jobs that run with this environment (a job with `enabledBy` needs that variable set to "on"). */
export function activeJobs(env = process.env) {
  return JOBS.filter((job) => !job.enabledBy || String(env[job.enabledBy] || '').trim().toLowerCase() === 'on');
}

const RANGES = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];

/** Parses the cron subset we use: `*`, `*\/n`, numbers and comma lists. */
export function parseCron(expr) {
  const parts = String(expr).trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`Invalid cron expression: ${expr}`);
  return parts.map((field, i) => {
    const [min, max] = RANGES[i];
    if (field === '*') return null;
    const step = field.match(/^\*\/(\d+)$/);
    if (step) {
      const n = Number(step[1]);
      if (!(n > 0)) throw new Error(`Invalid step in ${expr}`);
      const values = new Set();
      for (let v = min; v <= max; v += n) values.add(v);
      return values;
    }
    const values = new Set(field.split(',').map((v) => {
      if (!/^\d+$/.test(v) || Number(v) < min || Number(v) > max) throw new Error(`Invalid field "${field}" in ${expr}`);
      return Number(v);
    }));
    return values;
  });
}

const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Minute, hour, day, month and weekday of `date` in UTC or in `timeZone`. */
function fieldsOf(date, timeZone) {
  if (!timeZone) return [date.getUTCMinutes(), date.getUTCHours(), date.getUTCDate(), date.getUTCMonth() + 1, date.getUTCDay()];
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', minute: 'numeric', hour: 'numeric', day: 'numeric', month: 'numeric', weekday: 'short' }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return [Number(get('minute')), Number(get('hour')), Number(get('day')), Number(get('month')), WEEKDAYS[get('weekday')]];
}

/** True when `date` falls on a minute matched by `expr`, in UTC or in `timeZone` local time. */
export function isDue(expr, date, timeZone) {
  const [minute, hour, dom, month, dow] = parseCron(expr);
  const [m, h, d, mo, wd] = fieldsOf(date, timeZone);
  const match = (set, value) => set === null || set.has(value);
  return match(minute, m) && match(hour, h) && match(dom, d) && match(month, mo) && match(dow, wd);
}

const minuteKey = (date) => date.toISOString().slice(0, 16);

function log(fields) {
  console.log(JSON.stringify({ time: new Date().toISOString(), service: 'ledgerhound-cron', ...fields }));
}

/**
 * Paid-order watch until external alerts exist: every sweep returns the queue
 * counts; anything but status 'ok' is logged as "attention" (counts only), so
 * `docker logs ledgerhound-cron | grep attention` shows parked, late or
 * unreadable queues. A missing summary is itself "unknown", never "ok".
 */
export function logOrders(job, body) {
  const orders = body?.orders;
  if (orders?.status === 'ok') return;
  const fields = orders
    ? { status: orders.status, pending: orders.pending, oldestPendingAgeSeconds: orders.oldestPendingAgeSeconds, failed: orders.failed, manualReview: orders.manualReview }
    : { status: 'unknown' };
  log({ job: job.name, result: 'attention', orders: fields });
}

async function runJob(job, baseUrl, secret) {
  const started = Date.now();
  try {
    const res = await fetch(`${baseUrl}${job.path}`, {
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(job.timeoutMs),
    });
    log({ job: job.name, status: res.status, ms: Date.now() - started, result: res.status === 409 ? 'skipped-already-running' : res.ok ? 'ok' : 'error' });
    if (job.reportsOrders && res.ok) logOrders(job, await res.json().catch(() => null));
  } catch (err) {
    log({ job: job.name, ms: Date.now() - started, result: 'error', error: err?.name || 'Error' });
  }
}

export function startRunner({ baseUrl, secret, now = () => new Date(), tickMs = 15_000, env = process.env }) {
  const lastRun = new Map();
  const running = new Set();
  const jobs = activeJobs(env);
  const tick = () => {
    const date = now();
    const key = minuteKey(date);
    for (const job of jobs) {
      if (!isDue(job.cron, date, job.timeZone) || lastRun.get(job.name) === key) continue;
      lastRun.set(job.name, key);
      if (running.has(job.name)) {
        log({ job: job.name, result: 'skipped-previous-still-running' });
        continue;
      }
      running.add(job.name);
      runJob(job, baseUrl, secret).finally(() => running.delete(job.name));
    }
  };
  tick();
  const timer = setInterval(tick, tickMs);
  return () => clearInterval(timer);
}

const isMain = !!process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const secret = process.env.CRON_SECRET;
  const baseUrl = (process.env.LEDGERHOUND_INTERNAL_URL || 'http://ledgerhound-web:3000').replace(/\/$/, '');
  if (!secret) {
    log({ result: 'fatal', error: 'CRON_SECRET is not set' });
    process.exit(1);
  }
  log({ result: 'started', baseUrl, jobs: activeJobs().map((j) => `${j.name} ${j.cron}${j.timeZone ? ` ${j.timeZone}` : ''}`) });
  const stop = startRunner({ baseUrl, secret });
  const exit = (signal) => { stop(); log({ result: 'stopped', signal }); process.exit(0); };
  process.on('SIGTERM', () => exit('SIGTERM'));
  process.on('SIGINT', () => exit('SIGINT'));
}

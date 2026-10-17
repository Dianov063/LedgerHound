#!/usr/bin/env node
/**
 * Self-hosted replacement for Vercel Cron.
 *
 * Runs as its own container (same image as the web app, command
 * `node scripts/cron-runner.mjs`) and calls the web container over the
 * private compose network with `Authorization: Bearer $CRON_SECRET`, exactly
 * what Vercel Cron sends. Schedules are cron expressions evaluated in UTC;
 * the two Vercel jobs must stay identical to vercel.json (a test checks it).
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
  { name: 'resume-webhook-jobs', path: '/api/admin/resume-webhook-jobs', cron: '*/5 * * * *', timeoutMs: 10 * 60_000 },
];

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

/** True when `date` (UTC) falls on a minute matched by `expr`. */
export function isDue(expr, date) {
  const [minute, hour, dom, month, dow] = parseCron(expr);
  const match = (set, value) => set === null || set.has(value);
  return match(minute, date.getUTCMinutes())
    && match(hour, date.getUTCHours())
    && match(dom, date.getUTCDate())
    && match(month, date.getUTCMonth() + 1)
    && match(dow, date.getUTCDay());
}

const minuteKey = (date) => date.toISOString().slice(0, 16);

function log(fields) {
  console.log(JSON.stringify({ time: new Date().toISOString(), service: 'ledgerhound-cron', ...fields }));
}

async function runJob(job, baseUrl, secret) {
  const started = Date.now();
  try {
    const res = await fetch(`${baseUrl}${job.path}`, {
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(job.timeoutMs),
    });
    log({ job: job.name, status: res.status, ms: Date.now() - started, result: res.status === 409 ? 'skipped-already-running' : res.ok ? 'ok' : 'error' });
  } catch (err) {
    log({ job: job.name, ms: Date.now() - started, result: 'error', error: err?.name || 'Error' });
  }
}

export function startRunner({ baseUrl, secret, now = () => new Date(), tickMs = 15_000 }) {
  const lastRun = new Map();
  const running = new Set();
  const tick = () => {
    const date = now();
    const key = minuteKey(date);
    for (const job of JOBS) {
      if (!isDue(job.cron, date) || lastRun.get(job.name) === key) continue;
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
  log({ result: 'started', baseUrl, jobs: JOBS.map((j) => `${j.name} ${j.cron}`) });
  const stop = startRunner({ baseUrl, secret });
  const exit = (signal) => { stop(); log({ result: 'stopped', signal }); process.exit(0); };
  process.on('SIGTERM', () => exit('SIGTERM'));
  process.on('SIGINT', () => exit('SIGINT'));
}

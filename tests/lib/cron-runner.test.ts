// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { JOBS, isDue, parseCron, startRunner } from '@/scripts/cron-runner.mjs';

const utc = (iso: string) => new Date(`${iso}Z`);

describe('cron schedules', () => {
  it('match vercel.json exactly for the jobs moved off Vercel', () => {
    const vercel = JSON.parse(readFileSync(path.resolve(__dirname, '../../vercel.json'), 'utf8')) as { crons: { path: string; schedule: string }[] };
    for (const c of vercel.crons) {
      const job = JOBS.find((j: { path: string }) => j.path === c.path);
      expect(job, `cron for ${c.path} missing from the runner`).toBeDefined();
      expect(job.cron).toBe(c.schedule);
    }
  });

  it('evaluates in UTC', () => {
    expect(isDue('0 6 * * 1', utc('2026-10-19T06:00:00'))).toBe(true); // Monday
    expect(isDue('0 6 * * 1', utc('2026-10-20T06:00:00'))).toBe(false); // Tuesday
    expect(isDue('0 6 * * 1', utc('2026-10-19T06:01:00'))).toBe(false);
    expect(isDue('20 4 * * *', utc('2026-10-17T04:20:00'))).toBe(true);
    expect(isDue('20 4 * * *', utc('2026-10-17T05:20:00'))).toBe(false);
    expect(isDue('*/5 * * * *', utc('2026-10-17T13:35:00'))).toBe(true);
    expect(isDue('*/5 * * * *', utc('2026-10-17T13:36:00'))).toBe(false);
  });

  it('rejects expressions it does not understand', () => {
    expect(() => parseCron('0 6 * *')).toThrow();
    expect(() => parseCron('61 * * * *')).toThrow();
    expect(() => parseCron('@daily')).toThrow();
  });
});

describe('runner', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('sends the cron secret and skips a due run while the previous one is still going', () => {
    const calls: { url: string; auth: string | null }[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      calls.push({ url: String(url), auth: new Headers(init?.headers).get('authorization') });
      return new Promise<Response>(() => {}); // never finishes
    });
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((line: string) => { logs.push(line); });
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });

    let clock = utc('2026-10-17T13:45:00');
    const stop = startRunner({ baseUrl: 'http://web:3000', secret: 's3cret', now: () => clock, tickMs: 1_000 });
    expect(calls).toEqual([{ url: 'http://web:3000/api/admin/resume-webhook-jobs', auth: 'Bearer s3cret' }]);

    vi.advanceTimersByTime(1_000); // same minute: not run again
    clock = utc('2026-10-17T13:50:00');
    vi.advanceTimersByTime(1_000); // next due minute, previous call still in flight
    stop();

    expect(calls).toHaveLength(1);
    expect(logs.some((l) => l.includes('skipped-previous-still-running'))).toBe(true);
  });
});

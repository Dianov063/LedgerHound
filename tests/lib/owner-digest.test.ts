// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import {
  OWNER_DIGEST_TIME_ZONE, OWNER_DIGEST_SEND_HOUR, DIGEST_CATEGORIES, digestTargetDay, DigestReadError, buildDigest, digestConfigFromEnv, digestIdempotencyKey,
  previousDay, renderDigestEmail, runOwnerDigest, type DigestEmail, type DigestRecord, type DigestStore,
} from '@/lib/owner-digest';
import type { ScamReport } from '@/lib/scam-db';
import { EmailNotSentError } from '@/lib/idempotent-email';
import { JOBS, activeJobs, isDue, startRunner } from '@/scripts/cron-runner.mjs';

const NY = 'America/New_York';
let seq = 0;
const report = (createdAt: string, over: Partial<ScamReport> = {}): ScamReport => ({
  id: `R${++seq}`, createdAt, platformName: 'QA Example Platform', platformType: 'phishing', verified: false, blockchainConfirmed: false,
  status: 'pending', trustTier: 1, scamAddress: '0xqa00000000000000000000000000000000000001', reporterEmail: `applicant-${seq}@qa-mail.invalid`,
  description: `QA private description number ${seq} that must never reach the owner digest e-mail body.`, ...over,
});

describe('previous calendar day in America/New_York', () => {
  it('normal day: 24 h from local midnight', () => {
    expect(previousDay(new Date('2026-11-12T14:00:00Z'), NY)).toEqual({
      day: '2026-11-11', timeZone: NY, startUtc: '2026-11-11T05:00:00.000Z', endUtc: '2026-11-12T05:00:00.000Z', hours: 24,
    });
  });
  it('spring forward (2026-03-08) is 23 h; the 09:00 run is 13:00Z', () => {
    expect(previousDay(new Date('2026-03-09T13:00:00Z'), NY)).toMatchObject({ day: '2026-03-08', startUtc: '2026-03-08T05:00:00.000Z', endUtc: '2026-03-09T04:00:00.000Z', hours: 23 });
  });
  it('fall back (2026-11-01) is 25 h; the 09:00 run is 14:00Z', () => {
    expect(previousDay(new Date('2026-11-02T14:00:00Z'), NY)).toMatchObject({ day: '2026-11-01', startUtc: '2026-11-01T04:00:00.000Z', endUtc: '2026-11-02T05:00:00.000Z', hours: 25 });
  });
  it('uses the New York date, not the UTC date', () => {
    // 03:30Z on the 12th is still the 11th in New York -> previous day is the 10th
    expect(previousDay(new Date('2026-11-12T03:30:00Z'), NY).day).toBe('2026-11-10');
    expect(previousDay(new Date('2026-11-12T05:00:00Z'), NY).day).toBe('2026-11-11');
  });
  it('crosses month and year boundaries', () => {
    expect(previousDay(new Date('2027-01-01T14:00:00Z'), NY)).toMatchObject({ day: '2026-12-31', startUtc: '2026-12-31T05:00:00.000Z', endUtc: '2027-01-01T05:00:00.000Z' });
    expect(previousDay(new Date('2026-03-01T14:00:00Z'), NY).day).toBe('2026-02-28');
  });
});

describe('digest content', () => {
  const day = previousDay(new Date('2026-11-12T14:00:00Z'), NY); // 2026-11-11, [05:00Z, next 05:00Z)

  it('counts only reports received inside the local day, with current statuses and every category', () => {
    const reports = [
      report('2026-11-11T05:00:00.000Z', { status: 'verified', platformType: 'ponzi' }), // first instant: in
      report('2026-11-12T04:59:59.999Z', { status: 'rejected', platformType: 'rug_pull' }), // last instant: in
      report('2026-11-11T18:00:00.000Z'),
      report('2026-11-11T04:59:59.999Z'), // 23:59:59.999 on the 10th: out
      report('2026-11-12T05:00:00.000Z'), // midnight of the 12th: out
    ];
    const d = buildDigest(reports, day, new Date('2026-11-12T14:00:00Z'));
    expect(d.total).toBe(3);
    expect(d.byStatus).toEqual({ pending: 1, verified: 1, rejected: 1 });
    expect(Object.keys(d.byCategory)).toEqual(DIGEST_CATEGORIES);
    expect(d.byCategory).toEqual({ fake_exchange: 0, pig_butchering: 0, rug_pull: 1, phishing: 1, ponzi: 1, other: 0 });
    expect(d.reportsScanned).toBe(5);
  });

  it('shows zero when nothing arrived', () => {
    const d = buildDigest([report('2026-11-01T12:00:00Z')], day, new Date());
    expect(d.total).toBe(0);
    const email = renderDigestEmail(d);
    expect(email.subject).toBe('LedgerHound daily digest 2026-11-11: 0 new scam complaints');
    expect(email.text).toContain('New complaints received on 2026-11-11');
    expect(email.text).toContain(': 0');
  });

  it('refuses a report without a readable time instead of guessing', () => {
    expect(() => buildDigest([report('not a date')], day, new Date())).toThrow(DigestReadError);
  });

  it('the e-mail carries counts only: no applicant e-mail, wallet address, description or platform name', () => {
    const reports = [report('2026-11-11T12:00:00Z'), report('2026-11-11T13:00:00Z', { status: 'verified' })];
    const email = renderDigestEmail(buildDigest(reports, day, new Date('2026-11-12T14:00:00Z')));
    const all = `${email.subject}\n${email.html}\n${email.text}`;
    for (const r of reports) {
      expect(all).not.toContain(r.reporterEmail!);
      expect(all).not.toContain(r.scamAddress!);
      expect(all).not.toContain(r.description!);
      expect(all).not.toContain(r.id);
    }
    expect(all).not.toContain('QA Example Platform');
    expect(email.subject).toBe('LedgerHound daily digest 2026-11-11: 2 new scam complaints');
  });
});

describe('configuration', () => {
  it('is off by default', () => {
    expect(digestConfigFromEnv({})).toMatchObject({ enabled: false, to: [], timeZone: NY });
  });
  it('refuses to be enabled without a valid recipient', () => {
    expect(() => digestConfigFromEnv({ OWNER_DIGEST_ENABLED: 'true' })).toThrow();
    expect(() => digestConfigFromEnv({ OWNER_DIGEST_ENABLED: 'true', OWNER_DIGEST_TO: 'not-an-address' })).toThrow();
  });
  it('reads a recipient list and the sender', () => {
    expect(digestConfigFromEnv({ OWNER_DIGEST_ENABLED: 'true', OWNER_DIGEST_TO: 'owner@qa.invalid, second@qa.invalid', RESEND_FROM_EMAIL: 'LH <noreply@qa.invalid>' }))
      .toEqual({ enabled: true, to: ['owner@qa.invalid', 'second@qa.invalid'], from: 'LH <noreply@qa.invalid>', timeZone: NY });
    expect(digestConfigFromEnv({ OWNER_DIGEST_ENABLED: 'TRUE', OWNER_DIGEST_TO: 'owner@qa.invalid', OWNER_DIGEST_FROM: 'Digest <d@qa.invalid>' }).from).toBe('Digest <d@qa.invalid>');
  });
});

/* ── runs with a substituted store and transport ── */
function memoryStore(reports: ScamReport[] = []) {
  const records = new Map<string, DigestRecord>();
  const store: DigestStore & { records: Map<string, DigestRecord>; reports: ScamReport[]; fail: { list?: Error; read?: Error; create?: Error; mark?: Error } } = {
    records,
    reports,
    fail: {},
    async listReportsStrict() { if (store.fail.list) throw store.fail.list; return store.reports; },
    async readRecord(day) { if (store.fail.read) throw store.fail.read; const r = records.get(day); return r ? structuredClone(r) : null; },
    async createRecord(day, record) { if (store.fail.create) throw store.fail.create; if (records.has(day)) return false; records.set(day, structuredClone(record)); return true; },
    async markDelivered(day, result, at) { if (store.fail.mark) throw store.fail.mark; const r = records.get(day)!; records.set(day, { ...r, state: 'delivered', result, deliveredAt: at }); },
  };
  return store;
}
const enabled = { enabled: true, to: ['owner@qa.invalid'], from: 'LedgerHound <noreply@qa.invalid>', timeZone: NY };
const at9 = new Date('2026-11-12T14:00:00Z'); // 09:00 EST
const delivered = (store: ReturnType<typeof memoryStore>, day = '2026-11-11') => store.records.get(day)?.state === 'delivered';

describe('runOwnerDigest', () => {
  it('normal day: the e-mail is frozen, sent once, and marked delivered', async () => {
    const store = memoryStore([report('2026-11-11T12:00:00Z'), report('2026-11-11T20:00:00Z', { status: 'verified', platformType: 'ponzi' }), report('2026-11-10T12:00:00Z')]);
    const send = vi.fn(async () => 'sent' as const);
    const r = await runOwnerDigest({ now: at9, config: enabled, store, send });
    expect(r).toMatchObject({ status: 'sent', day: '2026-11-11', result: 'sent', resent: false, digest: { total: 2, byStatus: { pending: 1, verified: 1, rejected: 0 } } });
    expect(send).toHaveBeenCalledTimes(1);
    const [payload, key] = send.mock.calls[0] as unknown as [DigestEmail, string];
    const record = store.records.get('2026-11-11')!;
    expect(payload).toEqual(record.email);
    expect(key).toBe(record.idempotencyKey);
    expect(key).toBe(digestIdempotencyKey('2026-11-11', record.email));
    expect(key).toMatch(/^owner-digest:2026-11-11:[0-9a-f]{16}$/);
    expect(payload).toMatchObject({ to: ['owner@qa.invalid'], subject: 'LedgerHound daily digest 2026-11-11: 2 new scam complaints' });
    expect(record).toMatchObject({ state: 'delivered', result: 'sent', digest: { total: 2 } });
  });

  it('zero complaints still sends a digest showing 0', async () => {
    const send = vi.fn(async () => 'sent' as const);
    const r = await runOwnerDigest({ now: at9, config: enabled, store: memoryStore([]), send });
    expect(r).toMatchObject({ status: 'sent', digest: { total: 0 } });
    expect((send.mock.calls[0] as unknown as [{ subject: string }])[0].subject).toContain(': 0 new scam complaints');
  });

  it('a read error sends nothing and records nothing (no digest of zeros)', async () => {
    const store = memoryStore([report('2026-11-11T12:00:00Z')]);
    store.fail.list = new Error('2 of 40 report objects could not be read');
    const send = vi.fn(async () => 'sent' as const);
    await expect(runOwnerDigest({ now: at9, config: enabled, store, send })).rejects.toThrow('could not be read');
    expect(send).not.toHaveBeenCalled();
    expect(store.records.size).toBe(0);
  });

  it('an unreadable day record sends nothing (state unknown)', async () => {
    const store = memoryStore([]);
    store.fail.read = new Error('ServiceUnavailable');
    const send = vi.fn(async () => 'sent' as const);
    await expect(runOwnerDigest({ now: at9, config: enabled, store, send })).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });

  it('if the e-mail cannot be frozen first, nothing is sent', async () => {
    const store = memoryStore([report('2026-11-11T12:00:00Z')]);
    store.fail.create = new Error('SlowDown');
    const send = vi.fn(async () => 'sent' as const);
    await expect(runOwnerDigest({ now: at9, config: enabled, store, send })).rejects.toThrow('SlowDown');
    expect(send).not.toHaveBeenCalled();
  });

  it('a repeated run for a delivered day does not send again', async () => {
    const store = memoryStore([report('2026-11-11T12:00:00Z')]);
    const send = vi.fn(async () => 'sent' as const);
    await runOwnerDigest({ now: at9, config: enabled, store, send });
    const again = await runOwnerDigest({ now: new Date('2026-11-12T14:05:00Z'), config: enabled, store, send });
    expect(again).toMatchObject({ status: 'already-sent', day: '2026-11-11', result: 'sent', total: 1 });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('a send failure is not marked; the retry resends the SAME message to the SAME recipients with the same key', async () => {
    const store = memoryStore([report('2026-11-11T12:00:00Z')]);
    const send = vi.fn()
      .mockRejectedValueOnce(new EmailNotSentError('mailhub_timeout', 'MailHub request timed out'))
      .mockResolvedValueOnce('sent');
    await expect(runOwnerDigest({ now: at9, config: enabled, store, send })).rejects.toThrow(EmailNotSentError);
    expect(delivered(store)).toBe(false);
    // between the attempts: a new complaint arrives, statuses change, the recipient setting changes
    store.reports.push(report('2026-11-11T22:00:00Z', { platformType: 'rug_pull' }));
    store.reports[0].status = 'verified';
    const retry = await runOwnerDigest({ now: new Date('2026-11-12T14:15:00Z'), config: { ...enabled, to: ['someone-else@qa.invalid'] }, store, send });
    expect(retry).toMatchObject({ status: 'sent', day: '2026-11-11', resent: true, digest: { total: 1 } });
    const [first, second] = send.mock.calls as unknown as [DigestEmail, string][];
    expect(second[0]).toEqual(first[0]); // identical subject, html, text, sender and recipients
    expect(second[0].to).toEqual(['owner@qa.invalid']);
    expect(second[1]).toBe(first[1]);
    expect(delivered(store)).toBe(true);
  });

  it('two runs racing for the first attempt send one frozen message', async () => {
    const store = memoryStore([report('2026-11-11T12:00:00Z')]);
    const create = store.createRecord.bind(store);
    // another run creates the record (with its own build) just before this one
    store.createRecord = async (day, record) => {
      await create(day, { ...record, builtAt: 'other-run', email: { ...record.email, subject: 'frozen by the other run' } });
      return create(day, record);
    };
    const send = vi.fn(async () => 'sent' as const);
    await runOwnerDigest({ now: at9, config: enabled, store, send });
    expect((send.mock.calls[0] as unknown as [DigestEmail])[0].subject).toBe('frozen by the other run');
  });

  it('provider "already-sent" for the frozen message is a confirmation and is marked', async () => {
    const store = memoryStore([]);
    const send = vi.fn(async () => 'already-sent' as const);
    await runOwnerDigest({ now: at9, config: enabled, store, send });
    expect(store.records.get('2026-11-11')).toMatchObject({ state: 'delivered', result: 'already-sent' });
  });

  it('the idempotency key changes with the content, so a different message never shares a key', () => {
    const email = { from: 'a@qa.invalid', to: ['o@qa.invalid'], subject: 's', html: '<b>1</b>', text: '1' };
    expect(digestIdempotencyKey('2026-11-11', email)).toBe(digestIdempotencyKey('2026-11-11', { ...email }));
    expect(digestIdempotencyKey('2026-11-11', email)).not.toBe(digestIdempotencyKey('2026-11-11', { ...email, text: '2' }));
    expect(digestIdempotencyKey('2026-11-11', email)).not.toBe(digestIdempotencyKey('2026-11-11', { ...email, to: ['x@qa.invalid'] }));
  });

  it('"suppressed" and "logged" are not provider acceptance: not marked, the run fails, the next run resends the frozen message', async () => {
    for (const result of ['suppressed', 'logged'] as const) {
      const store = memoryStore([report('2026-11-11T12:00:00Z')]);
      const send = vi.fn().mockResolvedValueOnce(result).mockResolvedValueOnce('sent');
      await expect(runOwnerDigest({ now: at9, config: enabled, store, send })).rejects.toMatchObject({ name: 'DigestNotDeliveredError', result });
      expect(delivered(store)).toBe(false);
      await runOwnerDigest({ now: new Date('2026-11-12T14:15:00Z'), config: enabled, store, send });
      expect(send.mock.calls[1]).toEqual(send.mock.calls[0]);
      expect(delivered(store)).toBe(true);
    }
  });

  it('disabled: no read, no send', async () => {
    const store = memoryStore([]);
    store.fail.list = new Error('must not be read');
    store.fail.read = new Error('must not be read');
    const send = vi.fn();
    expect(await runOwnerDigest({ now: at9, config: { ...enabled, enabled: false }, store, send })).toEqual({ status: 'disabled' });
    expect(send).not.toHaveBeenCalled();
  });

  it('dry run: counts without sending or freezing', async () => {
    const store = memoryStore([report('2026-11-11T12:00:00Z')]);
    const send = vi.fn();
    const r = await runOwnerDigest({ now: at9, config: { ...enabled, enabled: false }, store, send, dryRun: true });
    expect(r).toMatchObject({ status: 'dry-run', digest: { total: 1 } });
    expect(send).not.toHaveBeenCalled();
    expect(store.records.size).toBe(0);
  });
});

describe('schedule (cron runner)', () => {
  const job = JOBS.find((j: { name: string }) => j.name === 'owner-digest');

  it('the digest job is called every 15 minutes, in the zone the digest uses', () => {
    expect(job).toMatchObject({ path: '/api/admin/owner-digest', cron: '*/15 * * * *', timeZone: OWNER_DIGEST_TIME_ZONE, enabledBy: 'OWNER_DIGEST_SCHEDULE' });
    expect(OWNER_DIGEST_SEND_HOUR).toBe(9);
    const due = (iso: string) => isDue(job.cron, new Date(iso), job.timeZone);
    expect(due('2026-07-15T13:00:00Z')).toBe(true);
    expect(due('2026-07-15T13:15:00Z')).toBe(true);
    expect(due('2026-07-15T13:07:00Z')).toBe(false);
  });

  it('time-zone schedules keep local time across daylight-saving changes (runner feature)', () => {
    const due = (iso: string) => isDue('0 9 * * *', new Date(iso), NY);
    // EDT (UTC-4): 13:00Z; EST (UTC-5): 14:00Z, including the change days 2026-03-08 and 2026-11-01
    expect([due('2026-07-15T13:00:00Z'), due('2026-07-15T14:00:00Z')]).toEqual([true, false]);
    expect([due('2026-12-15T14:00:00Z'), due('2026-12-15T13:00:00Z')]).toEqual([true, false]);
    expect([due('2026-03-08T13:00:00Z'), due('2026-03-08T14:00:00Z')]).toEqual([true, false]);
    expect([due('2026-11-01T14:00:00Z'), due('2026-11-01T13:00:00Z')]).toEqual([true, false]);
    const counts = new Map<string, number>();
    for (let t = Date.UTC(2026, 0, 1, 5); t < Date.UTC(2027, 0, 1, 5); t += 3_600_000) {
      if (due(new Date(t).toISOString())) {
        const local = new Intl.DateTimeFormat('en-CA', { timeZone: NY }).format(new Date(t));
        counts.set(local, (counts.get(local) || 0) + 1);
      }
    }
    expect(counts.size).toBe(365);
    expect(Math.max(...Array.from(counts.values()))).toBe(1);
  });

  it('is off unless OWNER_DIGEST_SCHEDULE=on in the cron environment', () => {
    const names = (env: Record<string, string>) => activeJobs(env as NodeJS.ProcessEnv).map((j: { name: string }) => j.name);
    expect(names({})).not.toContain('owner-digest');
    expect(names({ OWNER_DIGEST_SCHEDULE: 'off' })).not.toContain('owner-digest');
    expect(names({ OWNER_DIGEST_SCHEDULE: 'on' })).toContain('owner-digest');
  });

  it('the runner calls the digest route only when switched on', () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const run = (env: Record<string, string>, iso: string) => {
      const calls: string[] = [];
      vi.stubGlobal('fetch', vi.fn(async (url: string) => { calls.push(url); return new Response('{}', { status: 200 }); }));
      const stop = startRunner({ baseUrl: 'http://web:3000', secret: 's3cret', now: () => new Date(iso), tickMs: 3_600_000, env: env as NodeJS.ProcessEnv });
      stop();
      vi.unstubAllGlobals();
      return calls.filter((u) => u.endsWith('/api/admin/owner-digest'));
    };
    expect(run({}, '2026-07-15T13:15:00Z')).toHaveLength(0);
    expect(run({ OWNER_DIGEST_SCHEDULE: 'on' }, '2026-07-15T13:15:00Z')).toHaveLength(1);
    expect(run({ OWNER_DIGEST_SCHEDULE: 'on' }, '2026-07-15T13:16:00Z')).toHaveLength(0);
    vi.restoreAllMocks();
  });
});

describe('automatic retry for the same date', () => {
  it('a run targets day D from 09:00 on D+1 until 08:59 on D+2', () => {
    // EST: 09:00 local = 14:00Z
    expect(digestTargetDay(new Date('2026-11-12T13:59:00Z'), NY).day).toBe('2026-11-10'); // 08:59 on the 12th
    expect(digestTargetDay(new Date('2026-11-12T14:00:00Z'), NY).day).toBe('2026-11-11'); // 09:00 on the 12th
    expect(digestTargetDay(new Date('2026-11-13T04:59:00Z'), NY).day).toBe('2026-11-11'); // 23:59 on the 12th
    expect(digestTargetDay(new Date('2026-11-13T13:59:00Z'), NY).day).toBe('2026-11-11'); // 08:59 on the 13th
    expect(digestTargetDay(new Date('2026-11-13T14:00:00Z'), NY).day).toBe('2026-11-12');
    // EDT: 09:00 local = 13:00Z
    expect(digestTargetDay(new Date('2026-07-15T13:00:00Z'), NY).day).toBe('2026-07-14');
    expect(digestTargetDay(new Date('2026-07-15T12:59:00Z'), NY).day).toBe('2026-07-13');
  });

  it('daylight-saving days keep their 23 h / 25 h windows when targeted by a later retry', () => {
    expect(digestTargetDay(new Date('2026-03-10T03:00:00Z'), NY)).toMatchObject({ day: '2026-03-08', hours: 23 }); // 23:00 on the 9th
    expect(digestTargetDay(new Date('2026-11-03T04:00:00Z'), NY)).toMatchObject({ day: '2026-11-01', hours: 25 }); // 23:00 on the 2nd
  });

  it('a failed 09:00 attempt is retried by the next runs for the same date until the provider accepts it', async () => {
    const store = memoryStore([report('2026-11-11T12:00:00Z')]);
    const send = vi.fn()
      .mockRejectedValueOnce(new EmailNotSentError('mailhub_timeout', 'MailHub request timed out')) // 09:00
      .mockResolvedValueOnce('suppressed') // 09:15: not accepted
      .mockResolvedValueOnce('sent'); // 09:30
    const tick = (iso: string) => runOwnerDigest({ now: new Date(iso), config: enabled, store, send }).catch((e) => ({ status: 'error', name: e.name }));
    expect(await tick('2026-11-12T14:00:00Z')).toMatchObject({ status: 'error', name: 'EmailNotSentError' });
    expect(await tick('2026-11-12T14:15:00Z')).toMatchObject({ status: 'error', name: 'DigestNotDeliveredError' });
    expect(delivered(store)).toBe(false);
    expect(await tick('2026-11-12T14:30:00Z')).toMatchObject({ status: 'sent', day: '2026-11-11' });
    expect(await tick('2026-11-12T14:45:00Z')).toMatchObject({ status: 'already-sent', day: '2026-11-11' });
    expect(await tick('2026-11-13T13:45:00Z')).toMatchObject({ status: 'already-sent', day: '2026-11-11' }); // 08:45 next day
    expect(send).toHaveBeenCalledTimes(3);
    const calls = send.mock.calls as unknown as [DigestEmail, string][];
    expect(new Set(calls.map((c) => c[1])).size).toBe(1); // one key
    expect(calls[1][0]).toEqual(calls[0][0]); // one frozen message
    expect(calls[2][0]).toEqual(calls[0][0]);
  });

  it('a failure lasting past midnight is still retried for the same date the next morning', async () => {
    const store = memoryStore([]);
    const send = vi.fn().mockRejectedValue(new EmailNotSentError('mailhub_network_error', 'down'));
    await runOwnerDigest({ now: new Date('2026-11-12T14:00:00Z'), config: enabled, store, send }).catch(() => null);
    send.mockResolvedValueOnce('sent');
    const r = await runOwnerDigest({ now: new Date('2026-11-13T07:30:00Z'), config: enabled, store, send }); // 02:30 on the 13th
    expect(r).toMatchObject({ status: 'sent', day: '2026-11-11' });
  });
});

describe('sample e-mail (saved for the owner)', () => {
  it('writes qa-output/owner-digest/sample-email.{html,txt}', () => {
    const now = new Date('2026-11-12T14:00:00Z');
    const reports = [
      ...Array.from({ length: 7 }, (_, i) => report(`2026-11-11T${String(6 + i).padStart(2, '0')}:15:00Z`, { platformType: DIGEST_CATEGORIES[i % 6], status: i % 3 === 0 ? 'verified' : 'pending' })),
      report('2026-11-11T21:40:00Z', { status: 'rejected', platformType: 'phishing' }),
      report('2026-11-10T21:40:00Z'),
    ];
    const email = renderDigestEmail(buildDigest(reports, previousDay(now, NY), now));
    const dir = path.resolve(__dirname, '../../qa-output/owner-digest');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'sample-email.html'), `<!-- Subject: ${email.subject} -->\n${email.html}\n`);
    writeFileSync(path.join(dir, 'sample-email.txt'), `Subject: ${email.subject}\n\n${email.text}\n`);
    expect(email.subject).toBe('LedgerHound daily digest 2026-11-11: 8 new scam complaints');
  });
});

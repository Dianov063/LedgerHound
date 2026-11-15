// @vitest-environment node
/**
 * Package 58 (Codex round 5, follow-up): a submission WITHOUT a transaction hash that fails after
 * its report was already saved (storage answered 503 four times) must not become two public
 * reports when the form sends it again. The form sends one submission key with every attempt; the
 * server derives the report id from it and completes the earlier report.
 *
 * Acceptance (Codex): after the failure and the resubmission there is ONE report in storage, on
 * the card, in search and in the totals. Checked here through the real route handlers.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getJson, resetS3, s3Calls, s3Failures, s3Faults, s3Gates, s3Store } from './helpers/aws-s3-mock';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn().mockResolvedValue({ success: true }) }));

import { POST as submitReport } from '@/app/api/scam-database/report/route';
import { GET as platformApi } from '@/app/api/scam-database/platform/route';
import { GET as searchApi } from '@/app/api/scam-database/search/route';
import { GET as statsApi } from '@/app/api/scam-database/stats/route';
import { _clearPublicIndexCache, submissionReportId, txReportId } from '@/lib/scam-db';

const P = 'scam-database';
const ADDRESS = '0xqa000000000000000000000000000000005b5b5b';
const KEY = '7f0c2d4e-91a3-4b5c-8d6e-0f1a2b3c4d5e';
const SLUG = 'qa-key-exchange';
const form = (over: Record<string, unknown> = {}) => ({
  platformName: 'QA Key Exchange', platformUrl: 'qa-key-exchange.invalid', platformType: 'fake_exchange',
  scamAddress: ADDRESS, network: 'ethereum', lossAmount: 750, lossCurrency: 'USD',
  description: 'Synthetic complaint for the submission key test. All details are fictional; nothing here describes a real person, company or payment.',
  reporterEmail: 'key-test@qa-mail.invalid', submissionKey: KEY, ...over,
});
const post = (body: object) => submitReport(new NextRequest('http://localhost/api/scam-database/report', { method: 'POST', body: JSON.stringify(body) }));
const unavailable = () => Object.assign(new Error('ServiceUnavailable'), { name: 'ServiceUnavailable', $metadata: { httpStatusCode: 503 } });
const storedReports = () => Array.from(s3Store.keys()).filter((k) => k.startsWith(`${P}/reports/`));

/** Storage, card, search (name and address) and totals, as the public routes answer them. */
async function oneReportEverywhere(id: string) {
  _clearPublicIndexCache();
  expect(storedReports()).toEqual([`${P}/reports/${id}.json`]);
  const card = await (await platformApi(new NextRequest(`http://localhost/api/scam-database/platform?slug=${SLUG}`))).json();
  expect(card.reports.map((r: { id: string }) => r.id)).toEqual([id]);
  expect(card.platform.victims).toBe(1);
  for (const query of [{ q: 'QA Key Exchange' }, { address: ADDRESS }]) {
    const found = await (await searchApi(new NextRequest(`http://localhost/api/scam-database/search?${new URLSearchParams(query)}`))).json();
    expect(found.platforms.map((p: { slug: string; victims: number }) => [p.slug, p.victims])).toEqual([[SLUG, 1]]);
  }
  expect(await (await statsApi()).json()).toMatchObject({ totalReports: 1, totalPlatforms: 1, totalLoss: 750 });
  expect(getJson(`${P}/index/stats.json`)).toMatchObject({ totalReports: 1, totalPlatforms: 1, totalLoss: 750 });
}

beforeEach(() => {
  resetS3();
  _clearPublicIndexCache();
  vi.stubEnv('AWS_S3_BUCKET', 'test-bucket');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unexpected external request')));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('resubmission of a report without a transaction hash (submission key)', () => {
  it('Codex scenario: four 503s after the report was saved, storage recovers, the form sends again: one report everywhere', async () => {
    let failures = 0;
    let saved = false; // storage starts answering 503 to report reads once the report file is written
    s3Faults.push((command, input) => {
      if (!String(input.Key).startsWith(`${P}/reports/`)) return null;
      if (command === 'PutObjectCommand') { saved = true; return null; }
      if (command !== 'GetObjectCommand' || !saved) return null;
      failures++;
      return unavailable();
    });
    const failed = await post(form());
    expect(failed.status).toBe(500);
    expect(failures).toBe(4); // the write path retried, then gave up
    expect(storedReports()).toEqual([`${P}/reports/${submissionReportId(KEY)}.json`]); // the report was saved before the failure

    s3Faults.length = 0; // storage recovers; the form sends the same submission again
    const again = await post(form());
    expect(again.status).toBe(200);
    const { reportId } = await again.json();
    expect(reportId).toBe(submissionReportId(KEY));
    await oneReportEverywhere(reportId);
  });

  it('the report file itself could not be written: the resubmission saves it once', async () => {
    let failed = false;
    s3Faults.push((command, input) => (!failed && command === 'PutObjectCommand' && String(input.Key).startsWith(`${P}/reports/`) ? (failed = true, unavailable()) : null));
    expect((await post(form())).status).toBe(500);
    expect(storedReports()).toEqual([]);
    const again = await post(form());
    expect(again.status).toBe(200);
    await oneReportEverywhere((await again.json()).reportId);
  });

  it('the answer was lost after a success: sending again returns the same report, still one', async () => {
    const first = await (await post(form())).json();
    const second = await post(form());
    expect(second.status).toBe(200);
    expect((await second.json()).reportId).toBe(first.reportId);
    await oneReportEverywhere(first.reportId);
  });

  it('a double click (two requests at once): one report', async () => {
    const answers = await Promise.all([post(form()), post(form())]);
    expect(answers.map((a) => a.status)).toEqual([200, 200]);
    const ids = await Promise.all(answers.map(async (a) => (await a.json()).reportId));
    expect(ids[0]).toBe(ids[1]);
    await oneReportEverywhere(ids[0]);
  });

  it('two submissions with different keys are two reports', async () => {
    const a = await (await post(form({ submissionKey: '11111111-2222-4333-8444-555555555555' }))).json();
    const b = await (await post(form({ submissionKey: '66666666-7777-4888-8999-aaaaaaaaaaaa' }))).json();
    expect(a.reportId).not.toBe(b.reportId);
    expect(storedReports()).toHaveLength(2);
    expect(getJson(`${P}/platforms/${SLUG}.json`)).toMatchObject({ victims: 2 });
  });

  it('a malformed key is refused before anything is stored', async () => {
    for (const submissionKey of ['short', 'x'.repeat(65), '../../reports/abc-def-ghi-jkl', 42, { k: 1 }]) {
      const res = await post(form({ submissionKey }));
      expect(res.status, JSON.stringify(submissionKey)).toBe(400);
    }
    expect(s3Store.size).toBe(0);
  });

  it('callers without a key keep working (random id, as before)', async () => {
    const res = await post(form({ submissionKey: undefined }));
    expect(res.status).toBe(200);
    expect((await res.json()).reportId).not.toBe(submissionReportId(KEY));
  });
});

/* Codex round 6: the submission key decides the report id even when a retry adds or removes the
   transaction hash; the first saved version is the report. One hash still belongs to one report. */
describe('a retry that adds or removes the transaction hash (submission key)', () => {
  const TX = '0x' + '6a'.repeat(32);
  const TX_KEY = `${P}/txids/${TX}.json`;
  /** 503 to every report read once the report file is written (the Codex failure). */
  const failAfterSave = () => {
    let saved = false;
    s3Faults.push((command, input) => {
      if (!String(input.Key).startsWith(`${P}/reports/`)) return null;
      if (command === 'PutObjectCommand') { saved = true; return null; }
      return command === 'GetObjectCommand' && saved ? unavailable() : null;
    });
  };
  const OTHER_KEY = '0b1c2d3e-4f50-4617-8a9b-cdef01234567';

  it('first attempt WITH the hash fails after saving, the retry WITHOUT it: one report (the first, with the hash), the hash bound to it', async () => {
    failAfterSave();
    expect((await post(form({ txHash: TX }))).status).toBe(500);
    s3Faults.length = 0;
    const again = await post(form({ txHash: undefined }));
    expect(again.status).toBe(200);
    const { reportId } = await again.json();
    expect(reportId).toBe(submissionReportId(KEY));
    await oneReportEverywhere(reportId);
    expect(getJson(`${P}/reports/${reportId}.json`)).toMatchObject({ txHash: TX });
    expect(getJson(TX_KEY)).toMatchObject({ reportId, state: 'done' });
    // the hash stays unique: another submission with it is refused, and nothing is added
    expect((await post(form({ txHash: TX, submissionKey: OTHER_KEY }))).status).toBe(409);
    expect((await post(form({ txHash: TX, submissionKey: undefined }))).status).toBe(409);
    await oneReportEverywhere(reportId);
  });

  it('first attempt WITHOUT the hash fails after saving, the retry WITH it: one report (the first, without the hash); the hash stays free', async () => {
    failAfterSave();
    expect((await post(form({ txHash: undefined }))).status).toBe(500);
    s3Faults.length = 0;
    const again = await post(form({ txHash: TX }));
    expect(again.status).toBe(200);
    const body = await again.json();
    expect(body.reportId).toBe(submissionReportId(KEY));
    expect(body.verifiedTxData).toBeNull(); // the answer describes the saved report, which has no hash
    await oneReportEverywhere(body.reportId);
    expect(getJson(`${P}/reports/${body.reportId}.json`)).not.toHaveProperty('txHash');
    expect(getJson(TX_KEY)).toBeNull();
    // a separate submission may still use the hash: it is a second report, as it should be
    const separate = await post(form({ txHash: TX, submissionKey: OTHER_KEY }));
    expect(separate.status).toBe(200);
    expect(getJson(TX_KEY)).toMatchObject({ reportId: (await separate.json()).reportId, state: 'done' });
    expect(storedReports()).toHaveLength(2);
  });

  it('the answer was lost after a success with a hash: the same submission sent again is not refused', async () => {
    const first = await (await post(form({ txHash: TX }))).json();
    const again = await post(form({ txHash: TX }));
    expect(again.status).toBe(200);
    expect((await again.json()).reportId).toBe(first.reportId);
    await oneReportEverywhere(first.reportId);
  });

  it('two submissions with one hash: the second is refused, with or without a key', async () => {
    const first = await (await post(form({ txHash: TX }))).json();
    expect((await post(form({ txHash: TX, submissionKey: OTHER_KEY }))).status).toBe(409);
    expect((await post(form({ txHash: TX, submissionKey: undefined }))).status).toBe(409);
    await oneReportEverywhere(first.reportId);
  });

  it('a hash claimed by an attempt that then saved its report WITHOUT it is taken over by the next submission', async () => {
    // first attempt with the hash: the claim is written, the report file write fails
    let failed = false;
    s3Faults.push((command, input) => (!failed && command === 'PutObjectCommand' && String(input.Key).startsWith(`${P}/reports/`) ? (failed = true, unavailable()) : null));
    expect((await post(form({ txHash: TX }))).status).toBe(500);
    expect(getJson(TX_KEY)).toMatchObject({ reportId: submissionReportId(KEY), state: 'claimed' });
    // its retry without the hash saves the report without it
    expect((await post(form({ txHash: undefined }))).status).toBe(200);
    // another submission with the hash takes the stale claim over
    const other = await post(form({ txHash: TX, submissionKey: OTHER_KEY, platformName: 'QA Key Other' }));
    expect(other.status).toBe(200);
    const otherId = (await other.json()).reportId;
    expect(getJson(TX_KEY)).toMatchObject({ reportId: otherId, state: 'done' });
    expect(storedReports().sort()).toEqual([`${P}/reports/${otherId}.json`, `${P}/reports/${submissionReportId(KEY)}.json`].sort());
  });

  it('an attempt delayed before writing its file loses a hash taken over meanwhile: refused, its file removed, one report with the hash', async () => {
    let release!: () => void;
    const held = new Promise<void>((r) => { release = r; });
    let reached!: () => void;
    const atGate = new Promise<void>((r) => { reached = r; });
    let gated = false;
    s3Gates.push((command, input) => {
      if (!gated && command === 'PutObjectCommand' && input.Key === `${P}/reports/${submissionReportId(KEY)}.json`) { gated = true; reached(); return held; }
      return null;
    });
    const delayed = post(form({ txHash: TX }));
    await atGate; // the claim is written, the file not yet
    const other = await post(form({ txHash: TX, submissionKey: OTHER_KEY, platformName: 'QA Key Other' }));
    expect(other.status).toBe(200);
    const otherId = (await other.json()).reportId;
    release();
    expect((await delayed).status).toBe(409);
    expect(storedReports()).toEqual([`${P}/reports/${otherId}.json`]);
    expect(getJson(TX_KEY)).toMatchObject({ reportId: otherId, state: 'done' });
    expect(getJson(`${P}/platforms/${SLUG}.json`)).toBeNull(); // the delayed report was never linked
  });
});

/* Codex round 7: the attempt that lost a hash could not remove its file (storage failed). The file
   is a leftover (never linked); the next attempt of the same submission replaces or removes it. */
describe('a losing attempt whose file could not be removed', () => {
  const TX = '0x' + '7b'.repeat(32);
  const TX_KEY = `${P}/txids/${TX}.json`;
  const OTHER_KEY = '1c2d3e4f-5061-4728-9abc-def012345678';
  const OWN_FILE = `${P}/reports/${submissionReportId(KEY)}.json`;

  /** The delayed attempt `body` loses the hash to another submission while every delete of its file fails. */
  async function loseWithFailedDelete(body: Record<string, unknown>, ownFile: string) {
    let release!: () => void;
    const held = new Promise<void>((r) => { release = r; });
    let reached!: () => void;
    const atGate = new Promise<void>((r) => { reached = r; });
    let gated = false;
    s3Gates.push((command, input) => {
      if (!gated && command === 'PutObjectCommand' && input.Key === ownFile) { gated = true; reached(); return held; }
      return null;
    });
    let deleteFailures = 0;
    s3Faults.push((command, input) => (command === 'DeleteObjectCommand' && input.Key === ownFile ? (deleteFailures++, unavailable()) : null));
    const delayed = post(body);
    await atGate;
    const other = await post(form({ txHash: TX, submissionKey: OTHER_KEY, platformName: 'QA Key Other' }));
    expect(other.status).toBe(200);
    const otherId = (await other.json()).reportId as string;
    release();
    expect((await delayed).status).toBe(409);
    expect(deleteFailures).toBeGreaterThan(0); // the removal really failed
    expect(storedReports()).toContain(ownFile); // the leftover stays for now
    expect(getJson(TX_KEY)).toMatchObject({ reportId: otherId, state: 'done' });
    s3Faults.length = 0;
    s3Gates.length = 0; // storage recovers
    return otherId;
  }

  /** The winning report keeps the hash and stays public, alone on its card. */
  async function winnerIntact(otherId: string) {
    _clearPublicIndexCache();
    expect(getJson(TX_KEY)).toMatchObject({ reportId: otherId, state: 'done' });
    expect(getJson(`${P}/reports/${otherId}.json`)).toMatchObject({ txHash: TX });
    const card = await (await platformApi(new NextRequest('http://localhost/api/scam-database/platform?slug=qa-key-other'))).json();
    expect(card.reports.map((r: { id: string }) => r.id)).toEqual([otherId]);
  }

  it('Codex check: the retry with the same key and WITHOUT the disputed hash succeeds; the hash stays with the winner', async () => {
    const otherId = await loseWithFailedDelete(form({ txHash: TX }), OWN_FILE);
    const again = await post(form({ txHash: undefined }));
    expect(again.status).toBe(200);
    const { reportId } = await again.json();
    expect(reportId).toBe(submissionReportId(KEY));
    expect(getJson(OWN_FILE)).not.toHaveProperty('txHash'); // the leftover was replaced by this attempt
    expect(storedReports().sort()).toEqual([OWN_FILE, `${P}/reports/${otherId}.json`].sort());
    await winnerIntact(otherId);
    _clearPublicIndexCache();
    const card = await (await platformApi(new NextRequest(`http://localhost/api/scam-database/platform?slug=${SLUG}`))).json();
    expect(card.reports.map((r: { id: string }) => r.id)).toEqual([reportId]);
    for (const query of [{ q: 'QA Key Exchange' }, { address: ADDRESS }]) {
      const found = await (await searchApi(new NextRequest(`http://localhost/api/scam-database/search?${new URLSearchParams(query)}`))).json();
      expect(found.platforms.find((p: { slug: string }) => p.slug === SLUG)?.victims).toBe(1);
    }
    expect(await (await statsApi()).json()).toMatchObject({ totalReports: 2, totalPlatforms: 2 });
    expect(getJson(`${P}/index/stats.json`)).toMatchObject({ totalReports: 2, totalPlatforms: 2 });
  });

  it('the retry still carries the disputed hash: refused, and the leftover is removed; then without the hash it succeeds', async () => {
    const otherId = await loseWithFailedDelete(form({ txHash: TX }), OWN_FILE);
    expect((await post(form({ txHash: TX }))).status).toBe(409);
    expect(storedReports()).toEqual([`${P}/reports/${otherId}.json`]);
    const again = await post(form({ txHash: undefined }));
    expect(again.status).toBe(200);
    expect(storedReports().sort()).toEqual([OWN_FILE, `${P}/reports/${otherId}.json`].sort());
    await winnerIntact(otherId);
  });

  it('removal fails again on the retry: the retry fails, the next one completes (the cleanup is repeatable)', async () => {
    const otherId = await loseWithFailedDelete(form({ txHash: TX }), OWN_FILE);
    // the retry with the hash is refused and its removal fails too
    s3Faults.push((command, input) => (command === 'DeleteObjectCommand' && input.Key === OWN_FILE ? unavailable() : null));
    expect((await post(form({ txHash: TX }))).status).toBeGreaterThanOrEqual(409);
    expect(storedReports()).toContain(OWN_FILE);
    s3Faults.length = 0;
    const again = await post(form({ txHash: undefined }));
    expect(again.status).toBe(200);
    expect(getJson(OWN_FILE)).not.toHaveProperty('txHash');
    await winnerIntact(otherId);
  });

  it('without a key: the leftover of a losing attempt is removed when the hash is refused later', async () => {
    const noKey = form({ txHash: TX, submissionKey: undefined });
    const leftover = `${P}/reports/${txReportId(TX)}.json`;
    const otherId = await loseWithFailedDelete(noKey, leftover);
    expect((await post(noKey)).status).toBe(409);
    expect(storedReports()).toEqual([`${P}/reports/${otherId}.json`]);
    await winnerIntact(otherId);
  });
});

/* Codex round 8: the losing attempt's delete arrives LATE, after the retry of the same submission
   replaced the leftover with its accepted report. The checked version travels in the delete itself
   (If-Match): storage refuses the late delete (412) and the accepted report stays. */
describe('a late delete of the losing attempt', () => {
  const TX = '0x' + '8c'.repeat(32);
  const OTHER_KEY = '2d3e4f50-6172-4839-abcd-ef0123456789';
  const OWN_FILE = `${P}/reports/${submissionReportId(KEY)}.json`;

  it('is refused with 412; the accepted report stays in storage, on the card, in search and in the totals', async () => {
    // 1. the attempt with the hash is held before writing its file
    let releaseWrite!: () => void;
    const writeHeld = new Promise<void>((r) => { releaseWrite = r; });
    let writeReached!: () => void;
    const atWrite = new Promise<void>((r) => { writeReached = r; });
    // 3. ... and its delete is held after it checked the version
    let releaseDelete!: () => void;
    const deleteHeld = new Promise<void>((r) => { releaseDelete = r; });
    let deleteReached!: () => void;
    const atDelete = new Promise<void>((r) => { deleteReached = r; });
    let writeGated = false;
    let deleteGated = false;
    s3Gates.push((command, input) => {
      if (input.Key !== OWN_FILE) return null;
      if (!writeGated && command === 'PutObjectCommand') { writeGated = true; writeReached(); return writeHeld; }
      if (!deleteGated && command === 'DeleteObjectCommand') { deleteGated = true; deleteReached(); return deleteHeld; }
      return null;
    });
    const delayed = post(form({ txHash: TX }));
    await atWrite;
    // 2. another submission takes the hash over
    const other = await post(form({ txHash: TX, submissionKey: OTHER_KEY, platformName: 'QA Key Other' }));
    expect(other.status).toBe(200);
    const otherId = (await other.json()).reportId as string;
    releaseWrite();
    await atDelete; // the losing attempt checked its file and sent the delete; it has not arrived yet
    const leftover = s3Store.get(OWN_FILE)!;
    expect(JSON.parse(leftover.body)).toMatchObject({ txHash: TX });

    // 4. meanwhile the user retries without the disputed hash: accepted, the leftover replaced
    const again = await post(form({ txHash: undefined }));
    expect(again.status).toBe(200);
    const { reportId } = await again.json();
    expect(reportId).toBe(submissionReportId(KEY));
    expect(s3Store.get(OWN_FILE)!.etag).not.toBe(leftover.etag);

    // 5. the late delete arrives: refused by storage with 412, the accepted report stays
    releaseDelete();
    expect((await delayed).status).toBe(409);
    const lateDelete = s3Calls.filter((c) => c.command === 'DeleteObjectCommand' && c.input.Key === OWN_FILE);
    expect(lateDelete).toHaveLength(1);
    expect(lateDelete[0].input.IfMatch).toBe(leftover.etag); // the checked version travels in the delete
    expect(s3Failures.filter((f) => f.command === 'DeleteObjectCommand' && f.key === OWN_FILE).map((f) => f.status)).toEqual([412]);

    // storage
    expect(getJson(OWN_FILE)).toMatchObject({ id: reportId });
    expect(getJson(OWN_FILE)).not.toHaveProperty('txHash');
    expect(storedReports().sort()).toEqual([OWN_FILE, `${P}/reports/${otherId}.json`].sort());
    // card, search by name and by address, totals
    _clearPublicIndexCache();
    const card = await (await platformApi(new NextRequest(`http://localhost/api/scam-database/platform?slug=${SLUG}`))).json();
    expect(card.reports.map((r: { id: string }) => r.id)).toEqual([reportId]);
    for (const query of [{ q: 'QA Key Exchange' }, { address: ADDRESS }]) {
      const found = await (await searchApi(new NextRequest(`http://localhost/api/scam-database/search?${new URLSearchParams(query)}`))).json();
      expect(found.platforms.find((p: { slug: string }) => p.slug === SLUG)?.victims).toBe(1);
    }
    expect(await (await statsApi()).json()).toMatchObject({ totalReports: 2, totalPlatforms: 2 });
    expect(getJson(`${P}/index/stats.json`)).toMatchObject({ totalReports: 2, totalPlatforms: 2 });
    // the hash stays with the winner
    expect(getJson(`${P}/txids/${TX}.json`)).toMatchObject({ reportId: otherId, state: 'done' });
  });

  it('every removal of a leftover is a conditional delete (If-Match)', async () => {
    // a losing attempt whose delete goes through: the delete carries the version it checked
    let release!: () => void;
    const held = new Promise<void>((r) => { release = r; });
    let reached!: () => void;
    const at = new Promise<void>((r) => { reached = r; });
    let gated = false;
    s3Gates.push((command, input) => (!gated && command === 'PutObjectCommand' && input.Key === OWN_FILE ? (gated = true, reached(), held) : null));
    const delayed = post(form({ txHash: TX }));
    await at;
    expect((await post(form({ txHash: TX, submissionKey: OTHER_KEY, platformName: 'QA Key Other' }))).status).toBe(200);
    release();
    expect((await delayed).status).toBe(409);
    const deletes = s3Calls.filter((c) => c.command === 'DeleteObjectCommand');
    expect(deletes.length).toBeGreaterThan(0);
    for (const d of deletes) expect(d.input.IfMatch, String(d.input.Key)).toEqual(expect.any(String));
    expect(storedReports()).not.toContain(OWN_FILE);
  });
});

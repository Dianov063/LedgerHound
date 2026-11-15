/**
 * QA (package 58, stage 1): mass run of the public crypto scam database through the real HTTP routes.
 *
 *   node scripts/qa/scam-db-mass/run.mjs
 *
 * What runs for real: `next dev` of this worktree on 127.0.0.1 with the application's own route
 * handlers, lib/scam-db.ts, rate limiter (in-memory backend, as when Upstash is absent), admin
 * gate and middleware; the real @aws-sdk/client-s3. What is replaced: the S3 bucket is an
 * in-memory S3-compatible store on 127.0.0.1 (fake-s3.mjs) created empty for this run.
 * Safety, checked here before anything starts: no .env file the dev server would load; the
 * server gets a whitelisted environment with synthetic credentials only (no Stripe, Upstash,
 * Resend, MailHub); every Node process of the server is preloaded with loopback-guard.cjs,
 * which refuses non-loopback connections and DNS lookups and logs the attempt.
 * Output: qa-output/scam-db-mass/<run>/ (manifest, reconciliation report before cleanup,
 * final report, server and guard logs). Cleanup of this run's bucket always runs.
 */
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync, readFileSync, createWriteStream, copyFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { randomBytes, createHash } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildManifest, labelOf } from './generator.mjs';
import { startFakeS3, randomBucketName } from './fake-s3.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const require = createRequire(join(ROOT, 'package.json'));
const { S3Client, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const RUN = new Date().toISOString().replace(/[:.]/g, '-');
const OUT = join(ROOT, 'qa-output', 'scam-db-mass', RUN);
mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);

/* ── 1. safety checks ── */
const ENV_FILES = ['.env', '.env.local', '.env.development', '.env.development.local', '.env.production', '.env.production.local', '.env.test', '.env.test.local'];
const presentEnvFiles = ENV_FILES.filter((f) => existsSync(join(ROOT, f)));
if (presentEnvFiles.length) throw new Error(`refusing to run: ${presentEnvFiles.join(', ')} would be loaded by the dev server`);
const PASS_THROUGH = ['PATH', 'Path', 'PATHEXT', 'SystemRoot', 'SYSTEMROOT', 'windir', 'ComSpec', 'TEMP', 'TMP', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH', 'APPDATA', 'LOCALAPPDATA', 'NUMBER_OF_PROCESSORS', 'PROCESSOR_ARCHITECTURE', 'OS', 'HOME'];
const FORBIDDEN = /STRIPE|RESEND|UPSTASH|MAILHUB|SMTP|SENDGRID|OPENAI|ANTHROPIC|ETHERSCAN|ALCHEMY|TRONGRID|HELIUS|GITHUB_TOKEN|VERCEL/i;

/** Parallel submitters / moderators (QA_CONCURRENCY, default 8). */
const CONCURRENCY = Math.max(1, Number(process.env.QA_CONCURRENCY || 8));
async function pool(items, n, fn) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (next < items.length) { const item = items[next++]; await fn(item); } }));
}

const freePort = () => new Promise((r) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => r(port)); }); });

async function main() {
  const manifest = buildManifest();
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const E = manifest.expected;
  log(`manifest ${manifest.sha256.slice(0, 12)}: ${manifest.total} complaints, decisions ${JSON.stringify(E.decisions)}`);

  const bucket = randomBucketName();
  const s3srv = await startFakeS3({ buckets: [bucket] });
  const s3 = new S3Client({ region: 'us-east-1', endpoint: s3srv.url, forcePathStyle: true, credentials: { accessKeyId: 'QATESTKEY', secretAccessKey: 'qa-test-secret' } });
  const listAll = async () => {
    const keys = []; let token;
    do { const r = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token })); for (const o of r.Contents || []) keys.push(o.Key); token = r.IsTruncated ? r.NextContinuationToken : undefined; } while (token);
    return keys;
  };
  const getJson = async (key) => JSON.parse(await (await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))).Body.transformToString());

  const report = { run: RUN, parallelWorkers: CONCURRENCY, manifestSha256: manifest.sha256, seed: manifest.seed, bucket, fakeS3: s3srv.url, checks: [], defects: [], counts: {}, timings: {} };
  const check = (name, ok, detail) => { report.checks.push({ name, ok: !!ok, ...(detail === undefined ? {} : { detail }) }); if (!ok) log(`CHECK FAILED: ${name}`, detail === undefined ? '' : JSON.stringify(detail).slice(0, 400)); return !!ok; };

  const before = await listAll();
  check('bucket is empty before the run (ListObjectsV2)', before.length === 0, { objects: before.length });
  if (before.length) throw new Error('bucket not empty');

  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const adminKey = randomBytes(24).toString('hex');
  const guardLog = join(OUT, 'loopback-guard.log');
  writeFileSync(guardLog, '');
  const env = {};
  for (const k of PASS_THROUGH) if (process.env[k] !== undefined) env[k] = process.env[k];
  Object.assign(env, {
    NODE_ENV: 'development',
    NEXT_TELEMETRY_DISABLED: '1',
    AWS_ACCESS_KEY_ID: 'QATESTKEY',
    AWS_SECRET_ACCESS_KEY: randomBytes(16).toString('hex'),
    AWS_REGION: 'us-east-1',
    AWS_S3_BUCKET: bucket,
    AWS_ENDPOINT_URL_S3: s3srv.url,
    AWS_CONFIG_FILE: join(OUT, 'no-aws-config'),
    AWS_SHARED_CREDENTIALS_FILE: join(OUT, 'no-aws-credentials'),
    ADMIN_PASSWORD: adminKey,
    CRON_SECRET: randomBytes(24).toString('hex'),
    EMAIL_TRANSPORT: 'log',
    NEXT_PUBLIC_SITE_URL: base,
    QA_GUARD_LOG: guardLog,
    NODE_OPTIONS: `--require ${join(HERE, 'loopback-guard.cjs').replace(/\\/g, '/')}`,
  });
  const leaked = Object.keys(env).filter((k) => FORBIDDEN.test(k));
  check('dev server environment has no Stripe/Upstash/mail/chain-API variables', leaked.length === 0, { leaked });
  check('dev server gets synthetic AWS credentials and a loopback S3 endpoint only',
    !/^(AKIA|ASIA)/.test(env.AWS_ACCESS_KEY_ID) && /^http:\/\/127\.0\.0\.1:\d+$/.test(env.AWS_ENDPOINT_URL_S3), { endpoint: env.AWS_ENDPOINT_URL_S3 });
  if (leaked.length) throw new Error('forbidden variables in the server environment');

  const serverLog = createWriteStream(join(OUT, 'next-dev.log'));
  const server = spawn(process.execPath, [join(ROOT, 'node_modules/next/dist/bin/next'), 'dev', '-H', '127.0.0.1', '-p', String(port)], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.pipe(serverLog); server.stderr.pipe(serverLog);
  const stopServer = () => { try { execFileSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { try { server.kill('SIGKILL'); } catch { /* gone */ } } };

  const http = async (method, path, { body, ip, admin, timeout = 180_000 } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(ip ? { 'x-forwarded-for': ip } : {}), ...(admin ? { 'x-admin-key': adminKey } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
    });
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, json, text };
  };

  let mainCleaned = false;
  const cleanup = async (label) => {
    const keys = await listAll();
    for (const k of keys) await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: k }));
    const after = await listAll();
    return { label, deleted: keys.length, remaining: after.length };
  };

  try {
    /* wait for the dev server (first compile of the stats route) */
    let ready = false;
    for (let i = 0; i < 240 && !ready; i++) {
      try { const r = await http('GET', '/api/scam-database/stats', { timeout: 120_000 }); ready = r.status === 200; if (ready) report.initialStats = r.json; }
      catch { await new Promise((r) => setTimeout(r, 1000)); }
    }
    if (!ready) throw new Error('dev server did not answer');
    log('dev server ready');
    check('public counters are zero before the run', report.initialStats.totalReports === 0 && report.initialStats.totalPlatforms === 0 && report.initialStats.totalLoss === 0, report.initialStats);
    const unauth = await http('GET', '/api/scam-database/admin');
    check('admin API refuses a request without the admin key', unauth.status === 401, { status: unauth.status });

    /* ── 2. submission through POST /api/scam-database/report ── */
    const tSubmit = Date.now();
    const ids = new Map(); // seq -> reportId
    const submitFailures = [];
    const notVisible = [];
    const seenSlugs = new Set();
    let searchChecks = 0;
    let done = 0;
    // CONCURRENCY parallel submitters (different applicants at the same time, as in production)
    await pool(manifest.complaints, CONCURRENCY, async (c) => {
      const r = await http('POST', '/api/scam-database/report', { body: c.payload, ip: c.ip });
      const id = r.json?.reportId;
      if (r.status !== 200 || typeof id !== 'string' || !/^[0-9A-Z]+-[0-9A-Z]{6}$/.test(id)) { submitFailures.push({ seq: c.seq, status: r.status, body: r.text.slice(0, 200) }); return; }
      ids.set(c.seq, id);
      // appears automatically: the public card and the search answer right after the POST
      const card = await http('GET', `/api/scam-database/platform?slug=${encodeURIComponent(c.slug)}`);
      const onCard = card.status === 200 && card.json?.reports?.some((x) => x.id === id && x.status === 'pending');
      // Each search right after a write rebuilds the whole public index (O(all reports)), so the
      // search check runs for the first complaint of every platform and for every 10th one.
      let inSearch = true;
      const firstOfPlatform = !seenSlugs.has(c.slug);
      seenSlugs.add(c.slug);
      if (firstOfPlatform || c.seq % 10 === 0) {
        searchChecks++;
        const search = await http('GET', `/api/scam-database/search?q=${encodeURIComponent(c.payload.platformName)}`);
        inSearch = search.status === 200 && search.json?.platforms?.some((p) => p.slug === c.slug && p.victims >= 1);
      }
      if (!onCard || !inSearch) notVisible.push({ seq: c.seq, id, cardStatus: card.status, onCard, inSearch });
      if (++done % 200 === 0) log(`submitted ${done}/${manifest.total}`);
    });
    report.timings.submitSeconds = Math.round((Date.now() - tSubmit) / 1000);
    report.counts.accepted = ids.size;
    report.counts.cardChecksAfterSubmit = ids.size;
    report.counts.searchChecksAfterSubmit = searchChecks;
    check('every submission answered 200 with a report id', submitFailures.length === 0, { failures: submitFailures.slice(0, 20), failed: submitFailures.length });
    check('report ids are unique', new Set(ids.values()).size === ids.size, { ids: ids.size });
    // the form's submission key decides the id (lib/scam-db submissionReportId): a retry finds the same report
    const keyId = (key) => { const h = createHash('sha256').update(`ledgerhound-scam-submission:${key}`).digest('hex').toUpperCase(); return `SB${h.slice(0, 10)}-${h.slice(10, 16)}`; };
    const notFromKey = manifest.complaints.filter((c) => ids.has(c.seq) && ids.get(c.seq) !== keyId(c.payload.submissionKey)).map((c) => c.seq);
    check('every report id is derived from the submission key the form sent', notFromKey.length === 0, { notFromKey: notFromKey.slice(0, 20), count: notFromKey.length });
    check('each new report appeared on its public card (status pending) and in name search right after submission, without any import or reindex',
      notVisible.length === 0, { notVisible: notVisible.slice(0, 20), count: notVisible.length });

    /* stored reports via the admin API */
    const adminList1 = await http('GET', '/api/scam-database/admin', { admin: true });
    const stored1 = new Map((adminList1.json?.reports || []).map((r) => [r.id, r]));
    report.counts.storedAfterSubmit = stored1.size;
    const fieldMismatch = [];
    for (const c of manifest.complaints) {
      const s = stored1.get(ids.get(c.seq));
      if (!s) { fieldMismatch.push({ seq: c.seq, missing: true }); continue; }
      const p = c.payload;
      const same = s.status === 'pending' && s.platformName === p.platformName && s.platformType === p.platformType && (s.scamAddress || undefined) === p.scamAddress
        && s.network === p.network && s.lossAmount === p.lossAmount && s.reporterEmail === p.reporterEmail && s.description === p.description && s.platformUrl === p.platformUrl;
      if (!same) fieldMismatch.push({ seq: c.seq, id: s.id });
    }
    check('admin list holds all 1200 reports, pending, with the submitted fields', adminList1.status === 200 && stored1.size === manifest.total && fieldMismatch.length === 0,
      { status: adminList1.status, stored: stored1.size, mismatches: fieldMismatch.slice(0, 10), mismatchCount: fieldMismatch.length });

    /* ── 3. moderation through the admin API ── */
    const tMod = Date.now();
    const modFailures = [];
    await pool(manifest.complaints.filter((c) => c.decision !== 'pending' && ids.has(c.seq)), CONCURRENCY, async (c) => {
      const r = await http('POST', '/api/scam-database/admin', { admin: true, body: { action: 'updateStatus', reportId: ids.get(c.seq), status: c.decision } });
      if (r.status !== 200 || !r.json?.success) modFailures.push({ seq: c.seq, status: r.status });
    });
    report.timings.moderateSeconds = Math.round((Date.now() - tMod) / 1000);
    check('all 1100 moderation calls answered 200', modFailures.length === 0, { failures: modFailures.slice(0, 10), count: modFailures.length });

    /* ── 4. reconciliation ── */
    const adminList2 = await http('GET', '/api/scam-database/admin', { admin: true });
    const stored2 = new Map((adminList2.json?.reports || []).map((r) => [r.id, r]));
    const statusCount = { verified: 0, rejected: 0, pending: 0 };
    const statusMismatch = [];
    for (const c of manifest.complaints) {
      const s = stored2.get(ids.get(c.seq));
      if (s) statusCount[s.status] = (statusCount[s.status] || 0) + 1;
      if (!s || s.status !== c.decision) statusMismatch.push({ seq: c.seq, id: ids.get(c.seq), want: c.decision, got: s?.status });
    }
    report.counts.stored = stored2.size;
    report.counts.statuses = statusCount;
    check('all 1200 stored ids carry the expected status (800 verified / 300 rejected / 100 pending)',
      stored2.size === manifest.total && statusMismatch.length === 0 && statusCount.verified === 800 && statusCount.rejected === 300 && statusCount.pending === 100,
      { stored: stored2.size, statusCount, mismatches: statusMismatch.slice(0, 10) });

    const rejectedIds = new Set(manifest.complaints.filter((c) => c.decision === 'rejected').map((c) => ids.get(c.seq)));
    const publishedBySlug = {};
    for (const c of manifest.complaints) if (c.decision !== 'rejected') (publishedBySlug[c.slug] ??= []).push(ids.get(c.seq));
    const publicTexts = [];
    const sorted = (a) => [...(a || [])].sort();
    const eqSet = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));

    // cards (public platform API = what the platform page renders)
    const cardMismatch = [];
    let cardsShown = 0; let reportsShown = 0;
    for (const [slug, want] of Object.entries(E.platforms)) {
      const r = await http('GET', `/api/scam-database/platform?slug=${encodeURIComponent(slug)}`);
      publicTexts.push(r.text);
      if (!want.public) { if (r.status !== 404) cardMismatch.push({ slug, want: 404, got: r.status }); continue; }
      if (r.status !== 200) { cardMismatch.push({ slug, want: 200, got: r.status }); continue; }
      cardsShown++;
      const p = r.json.platform; const reps = r.json.reports || [];
      reportsShown += reps.length;
      const diff = {};
      if (p.victims !== want.victims) diff.victims = [want.victims, p.victims];
      if (Math.abs(p.totalLoss - want.totalLoss) > 1e-6) diff.totalLoss = [want.totalLoss, p.totalLoss];
      if (p.trustScore !== want.trustScore) diff.trustScore = [want.trustScore, p.trustScore];
      if (p.verified !== want.verified) diff.verified = [want.verified, p.verified];
      if (labelOf(p.trustScore) !== want.label) diff.label = [want.label, labelOf(p.trustScore)];
      if (!eqSet(p.addresses, want.addresses)) diff.addresses = { want: want.addresses.length, got: p.addresses?.length };
      if (!eqSet(p.urls, want.urls)) diff.urls = { want: want.urls, got: p.urls };
      if (!eqSet(p.types, want.types)) diff.types = { want: want.types, got: p.types };
      if (!eqSet(reps.map((x) => x.id), publishedBySlug[slug])) diff.reportIds = { want: publishedBySlug[slug].length, got: reps.length };
      const st = { verified: reps.filter((x) => x.status === 'verified').length, pending: reps.filter((x) => x.status === 'pending').length };
      if (st.verified !== want.statuses.verified || st.pending !== want.statuses.pending) diff.statuses = { want: want.statuses, got: st };
      if (reps.some((x) => 'reporterEmail' in x || 'txHash' in x)) diff.privateFields = true;
      if (Object.keys(diff).length) cardMismatch.push({ slug, diff });
    }
    report.counts.publicCards = cardsShown;
    report.counts.publicReportsOnCards = reportsShown;
    check('every platform card matches the manifest (victims, loss, score, flag, label, addresses, URLs, types, report ids and statuses; no e-mail or tx hash)',
      cardMismatch.length === 0, { mismatches: cardMismatch.slice(0, 15), count: cardMismatch.length });

    // name search
    const nameMismatch = [];
    for (const [slug, want] of Object.entries(E.platforms)) {
      for (const q of [want.name, want.name.toLowerCase()]) {
        const r = await http('GET', `/api/scam-database/search?q=${encodeURIComponent(q)}`);
        publicTexts.push(r.text);
        const hits = (r.json?.platforms || []).filter((p) => p.slug === slug);
        if (!want.public) { if (hits.length) nameMismatch.push({ slug, q, want: 'absent' }); continue; }
        const h = hits[0];
        if (!h || h.victims !== want.victims || h.trustScore !== want.trustScore || Math.abs(h.totalLoss - want.totalLoss) > 1e-6) nameMismatch.push({ slug, q, got: h ? { victims: h.victims, trustScore: h.trustScore, totalLoss: h.totalLoss } : null });
      }
    }
    check('name search (exact and lower case) finds every public platform with the expected figures and none of the non-public ones', nameMismatch.length === 0, { mismatches: nameMismatch.slice(0, 15), count: nameMismatch.length });

    // full public index (timed: the first read after the last write rebuilds the index from all reports)
    const tIndex = Date.now();
    const all = await http('GET', '/api/scam-database/search?q=');
    report.timings.fullIndexAfterWriteMs = Date.now() - tIndex;
    const tIndex2 = Date.now();
    await http('GET', '/api/scam-database/search?q=');
    report.timings.fullIndexCachedMs = Date.now() - tIndex2;
    publicTexts.push(all.text);
    const index = all.json?.platforms || [];
    const wantPublic = Object.entries(E.platforms).filter(([, w]) => w.public).map(([s]) => s);
    const indexDiff = [];
    for (const e of index) {
      const w = E.platforms[e.slug];
      if (!w || !w.public) { indexDiff.push({ slug: e.slug, unexpected: true }); continue; }
      if (e.victims !== w.victims || e.trustScore !== w.trustScore || e.verified !== w.verified || Math.abs(e.totalLoss - w.totalLoss) > 1e-6 || !eqSet(e.addresses, w.addresses) || !eqSet(e.urls, w.urls) || !eqSet(e.types, w.types)) indexDiff.push({ slug: e.slug });
    }
    check('public index lists exactly the 52 public platforms with matching aggregates', index.length === wantPublic.length && eqSet(index.map((e) => e.slug), wantPublic) && indexDiff.length === 0,
      { listed: index.length, expected: wantPublic.length, diffs: indexDiff.slice(0, 10) });

    // address index
    const addrMismatch = [];
    let multi = 0;
    for (const [key, w] of Object.entries(E.addresses)) {
      const r = await http('GET', `/api/scam-database/search?address=${encodeURIComponent(w.address)}`);
      publicTexts.push(r.text);
      const slugs = (r.json?.platforms || []).map((p) => p.slug);
      if (r.status !== 200 || !eqSet(slugs, w.publicSlugs)) addrMismatch.push({ address: key, want: w.publicSlugs, got: slugs, status: r.status });
      if (w.complaints > 1) multi++;
    }
    report.counts.addressesChecked = Object.keys(E.addresses).length;
    report.counts.addressesWithSeveralComplaints = multi;
    check(`address search returns exactly the public platforms for all ${Object.keys(E.addresses).length} addresses (${multi} of them used by several complaints)`,
      addrMismatch.length === 0, { mismatches: addrMismatch.slice(0, 15), count: addrMismatch.length });

    // stored address files for the shared addresses (reports kept, rejected included -- stored side)
    const sharedDetail = {};
    for (const [name, addr] of Object.entries(manifest.shared)) {
      const w = E.addresses[addr.toLowerCase()];
      const r = await http('GET', `/api/scam-database/search?address=${encodeURIComponent(addr)}`);
      sharedDetail[name] = { complaints: w.complaints, publicComplaints: w.publicComplaints, expectedPlatforms: w.publicSlugs, gotPlatforms: (r.json?.platforms || []).map((p) => p.slug) };
    }
    report.sharedAddresses = sharedDetail;

    // public counters
    const stats = await http('GET', '/api/scam-database/stats');
    publicTexts.push(stats.text);
    report.publicStats = stats.json;
    check('public counters: 900 reports, 52 platforms, expected loss total, 0 chain-confirmed',
      stats.json?.totalReports === E.stats.totalReports && stats.json?.totalPlatforms === E.stats.totalPlatforms && Math.abs((stats.json?.totalLoss ?? -1) - E.stats.totalLoss) < 1e-6 && stats.json?.blockchainVerified === 0,
      { want: E.stats, got: stats.json });

    // stored counter file (written by every submission and moderation; lost increments show here)
    const storedMainStats = await getJson('scam-database/index/stats.json').catch(() => null);
    report.storedStats = storedMainStats;
    check('stored counter file: 900 published reports, expected loss total (no lost increments under parallel writes)',
      storedMainStats?.totalReports === E.stats.totalReports && Math.abs((storedMainStats?.totalLoss ?? -1) - E.stats.totalLoss) < 1e-6,
      { want: { totalReports: E.stats.totalReports, totalLoss: E.stats.totalLoss }, got: storedMainStats && { totalReports: storedMainStats.totalReports, totalLoss: storedMainStats.totalLoss } });
    const storedIndex = await getJson('scam-database/index/platforms.json').catch(() => []);
    check('stored index file lists exactly the 52 public platforms', storedIndex.length === E.stats.totalPlatforms, { stored: storedIndex.length });

    // publication rules
    const po = E.platforms['qa-pending-only-wave'];
    const poCard = await http('GET', '/api/scam-database/platform?slug=qa-pending-only-wave');
    check('rule: 24 pending-only complaints are public but capped (score 9, not "Confirmed Scam")',
      poCard.status === 200 && poCard.json.platform.victims === 24 && poCard.json.platform.trustScore === 9 && labelOf(poCard.json.platform.trustScore) !== 'Confirmed Scam' && po.label === 'Suspicious',
      { victims: poCard.json?.platform?.victims, trustScore: poCard.json?.platform?.trustScore });
    const swarm = await http('GET', '/api/scam-database/platform?slug=qa-verified-swarm');
    check('rule: 30 verified complaints reach "Confirmed Scam"', labelOf(swarm.json?.platform?.trustScore) === 'Confirmed Scam', { trustScore: swarm.json?.platform?.trustScore });
    const allPublic = publicTexts.join('\n');
    const leakedRejected = [...rejectedIds].filter((id) => allPublic.includes(id));
    const rejectedOnlyAddr = manifest.shared.rejectedOnly;
    check('rule: no rejected report id, rejected-only address or rejected-only platform appears in any public answer',
      leakedRejected.length === 0 && !allPublic.toLowerCase().includes(rejectedOnlyAddr.toLowerCase()) && !allPublic.includes('QA Rejected Ghost'),
      { leakedRejected: leakedRejected.slice(0, 10), rejectedOnlyAddressShown: allPublic.toLowerCase().includes(rejectedOnlyAddr.toLowerCase()) });
    check('no applicant e-mail appears in any public answer', !/@qa-mail\.invalid/.test(allPublic));

    report.counts.publicTotal = stats.json?.totalReports;
    report.counts.rejected = statusCount.rejected;
    report.counts.pending = statusCount.pending;
    report.counts.verified = statusCount.verified;
    report.storedObjectsBeforeCleanup = (await listAll()).length;

    /* save the reconciliation before any cleanup */
    report.reconciledAt = new Date().toISOString();
    writeFileSync(join(OUT, 'reconciliation-before-cleanup.json'), JSON.stringify(report, null, 2));
    log(`reconciliation saved: ${report.checks.filter((c) => c.ok).length}/${report.checks.length} checks passed`);

    /* ── 5. cleanup of this run ── */
    report.cleanupMain = await cleanup('main');
    mainCleaned = true;
    await new Promise((r) => setTimeout(r, 31_000)); // the public index is cached up to 30 s per process
    const zero = await http('GET', '/api/scam-database/stats');
    report.statsAfterMainCleanup = zero.json;
    check('after cleanup: no objects left and public counters are zero', report.cleanupMain.remaining === 0 && zero.json?.totalReports === 0 && zero.json?.totalPlatforms === 0 && zero.json?.totalLoss === 0,
      { cleanup: report.cleanupMain, stats: zero.json });

    /* ── 6. concurrency and rate-limit checks (separate, after the main cleanup) ── */
    const mk = (name, i) => ({ payload: { platformName: name, platformType: 'ponzi', platformUrl: 'https://qa-parallel.invalid', network: 'eth', lossAmount: 100,
      description: `[QA-PAR ${i}] Parallel write check: the same platform receives several complaints at the same moment from different applicants.`, reporterEmail: `parallel-${i}@qa-mail.invalid` } });
    const par = {};
    const post = (body, ip) => http('POST', '/api/scam-database/report', { body, ip });
    // a) N complaints to one platform at once
    const N = 24;
    const sameRes = await Promise.all(Array.from({ length: N }, (_, i) => post(mk('QA Parallel Target', i).payload, `198.19.250.${i + 1}`)));
    const okIds = sameRes.filter((r) => r.status === 200).map((r) => r.json.reportId);
    const storedPlatform = await getJson('scam-database/platforms/qa-parallel-target.json').catch(() => null);
    const card = await http('GET', '/api/scam-database/platform?slug=qa-parallel-target');
    const storedReports = (await listAll()).filter((k) => k.startsWith('scam-database/reports/')).length;
    par.samePlatform = { sent: N, accepted: okIds.length, reportFilesStored: storedReports, platformReportIds: storedPlatform?.reportIds?.length, platformVictims: storedPlatform?.victims,
      publicVictims: card.json?.platform?.victims, publicReports: card.json?.reports?.length,
      allAcceptedOnCard: okIds.every((id) => card.json?.reports?.some((r) => r.id === id)) };
    // a2) moderate those N reports at once: half rejected, half verified
    const modRes = await Promise.all(okIds.map((id, i) => http('POST', '/api/scam-database/admin', { admin: true, body: { action: 'updateStatus', reportId: id, status: i % 2 ? 'rejected' : 'verified' } })));
    const cardAfterMod = await http('GET', '/api/scam-database/platform?slug=qa-parallel-target');
    const searchAfterMod = await http('GET', '/api/scam-database/search?q=QA%20Parallel%20Target');
    par.samePlatformModeration = { calls: modRes.length, ok: modRes.filter((r) => r.status === 200).length, publicVictims: cardAfterMod.json?.platform?.victims,
      searchVictims: searchAfterMod.json?.platforms?.find((p) => p.slug === 'qa-parallel-target')?.victims, expected: Math.ceil(okIds.length / 2) };
    // b) 2 complaints at once, repeated on fresh platforms
    let pairsLost = 0;
    for (let k = 0; k < 10; k++) {
      const name = `QA Parallel Pair ${String(k).padStart(2, '0')}`;
      const res = await Promise.all([0, 1].map((i) => post(mk(name, `${k}-${i}`).payload, `198.19.251.${k * 2 + i + 1}`)));
      const p = await getJson(`scam-database/platforms/qa-parallel-pair-${String(k).padStart(2, '0')}.json`).catch(() => null);
      if (res.every((r) => r.status === 200) && (p?.reportIds?.length ?? 0) < 2) pairsLost++;
    }
    par.pairs = { attempts: 10, platformsThatLostAReport: pairsLost };
    // c) N complaints to N different platforms at once (shared index and counter files)
    const multiRes = await Promise.all(Array.from({ length: N }, (_, i) => post(mk(`QA Parallel Many ${String(i).padStart(2, '0')}`, `m${i}`).payload, `198.19.252.${i + 1}`)));
    const idx = await getJson('scam-database/index/platforms.json').catch(() => []);
    const manyInIndex = idx.filter((e) => e.slug.startsWith('qa-parallel-many-')).length;
    const manySearch = await http('GET', '/api/scam-database/search?q=QA%20Parallel%20Many');
    const storedStats = await getJson('scam-database/index/stats.json').catch(() => null);
    const pubStats = await http('GET', '/api/scam-database/stats');
    par.differentPlatforms = { sent: N, accepted: multiRes.filter((r) => r.status === 200).length, platformsInStoredIndex: manyInIndex, platformsInSearch: manySearch.json?.platforms?.length };
    // stored counter: every accepted report counted once, rejected ones taken back out by moderation
    par.storedStatsTotalReports = storedStats?.totalReports;
    par.expectedStoredTotalReports = okIds.length - Math.floor(okIds.length / 2) + 20 + N;
    par.publicStatsTotalReports = pubStats.json?.totalReports;
    report.concurrency = par;
    const lost = (par.samePlatform.platformReportIds ?? 0) < par.samePlatform.accepted || !par.samePlatform.allAcceptedOnCard || pairsLost > 0;
    check(`parallel writes to one platform: all ${N} accepted reports linked, shown on the card and counted`,
      !lost && par.samePlatform.accepted === N && par.samePlatform.platformVictims === N && par.samePlatform.publicVictims === N, par.samePlatform);
    check('parallel pairs on fresh platforms: no report lost in 10 attempts', pairsLost === 0, par.pairs);
    check(`parallel moderation of one platform: card and search show the ${par.samePlatformModeration.expected} verified reports`,
      par.samePlatformModeration.ok === okIds.length && par.samePlatformModeration.publicVictims === par.samePlatformModeration.expected && par.samePlatformModeration.searchVictims === par.samePlatformModeration.expected,
      par.samePlatformModeration);
    check(`parallel writes to ${N} different platforms: every platform in the stored index and in search`,
      manyInIndex === N && par.differentPlatforms.platformsInSearch === N && par.differentPlatforms.accepted === N, par.differentPlatforms);
    check('stored and public counters after the parallel phase match every accepted and moderated report',
      par.storedStatsTotalReports === par.expectedStoredTotalReports && par.publicStatsTotalReports === par.expectedStoredTotalReports,
      { stored: par.storedStatsTotalReports, public: par.publicStatsTotalReports, expected: par.expectedStoredTotalReports });
    if (lost) {
      report.defects.push({
        id: 'D1-lost-update-same-platform',
        summary: 'Concurrent reports for the same platform lost updates (accepted and stored, but not linked to the platform).',
        minimalRepro: 'Empty store; 3 POST /api/scam-database/report with the same platformName at the same moment (different IPs). See repro-concurrency.mjs.',
        observed: { samePlatform: par.samePlatform, pairs: par.pairs },
        code: 'lib/scam-db.ts saveReport()',
      });
    }
    if (manyInIndex < N || par.storedStatsTotalReports !== par.expectedStoredTotalReports) {
      report.defects.push({
        id: 'D2-lost-update-shared-index',
        summary: 'Concurrent reports for different platforms lost entries or increments in index/platforms.json or index/stats.json.',
        observed: { differentPlatforms: par.differentPlatforms, storedStatsTotalReports: par.storedStatsTotalReports, expected: par.expectedStoredTotalReports },
        code: 'lib/scam-db.ts refreshIndexEntry() and saveReport()',
      });
    }
    // e) resubmission after storage errors (Codex round 5): the report is saved, then every read of a
    //    report file answers 503 (beyond all retries), the POST fails; storage recovers and the form
    //    sends the SAME submission (same key) again. Exactly one report in storage, on the card, in
    //    search by name and by address, and in the stored and public totals. Then a double click.
    const statsBefore = { stored: (await getJson('scam-database/index/stats.json').catch(() => null))?.totalReports ?? 0, pub: (await http('GET', '/api/scam-database/stats')).json?.totalReports };
    const retryKey = 'b0a7c3d1-5e2f-4a6b-9c8d-7e6f5a4b3c2d';
    const retryAddr = '0xqa0000000000000000000000000000000000e503';
    const retryBody = { platformName: 'QA Retry After 503', platformType: 'phishing', platformUrl: 'https://qa-retry-503.invalid', network: 'eth', lossAmount: 4321, scamAddress: retryAddr,
      description: '[QA-RETRY] Resubmission check: storage answers 503 after the report was saved; the form sends the same submission again after the error.', reporterEmail: 'retry-503@qa-mail.invalid', submissionKey: retryKey };
    s3srv.failGetsAfterPut('scam-database/reports/');
    const injectedBefore = s3srv.fault.injected;
    const failedPost = await post(retryBody, '198.19.254.1');
    const injected = s3srv.fault.injected - injectedBefore;
    s3srv.failGets(null);
    const filesAfterFailure = (await listAll()).filter((k) => k.startsWith('scam-database/reports/SB')).length;
    const retryPost = await post(retryBody, '198.19.254.1');
    const retryId = retryPost.json?.reportId;
    const retryFiles = (await listAll()).filter((k) => k.startsWith('scam-database/reports/'));
    const retryCard = await http('GET', '/api/scam-database/platform?slug=qa-retry-after-503');
    const retryByName = await http('GET', '/api/scam-database/search?q=QA%20Retry%20After%20503');
    const retryByAddr = await http('GET', `/api/scam-database/search?address=${retryAddr}`);
    const victimsIn = (r) => (r.json?.platforms || []).filter((p) => p.slug === 'qa-retry-after-503').map((p) => p.victims);
    // double click: the same submission twice at the same moment
    const dblBody = { ...retryBody, platformName: 'QA Double Click', platformUrl: 'https://qa-double-click.invalid', scamAddress: undefined, submissionKey: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f' };
    const dbl = await Promise.all([post(dblBody, '198.19.254.2'), post(dblBody, '198.19.254.3')]);
    const dblPlatform = await getJson('scam-database/platforms/qa-double-click.json').catch(() => null);
    const statsAfter = { stored: (await getJson('scam-database/index/stats.json').catch(() => null))?.totalReports ?? 0, pub: (await http('GET', '/api/scam-database/stats')).json?.totalReports };
    par.resubmitAfter503 = {
      failedStatus: failedPost.status, injected503: injected, reportFilesAfterFailure: filesAfterFailure,
      retryStatus: retryPost.status, retryIdFromKey: retryId === keyId(retryKey),
      reportFilesForSubmission: retryFiles.filter((k) => k === `scam-database/reports/${retryId}.json`).length,
      cardReports: retryCard.json?.reports?.map((r) => r.id), cardVictims: retryCard.json?.platform?.victims,
      searchByName: victimsIn(retryByName), searchByAddress: victimsIn(retryByAddr),
      doubleClick: { statuses: dbl.map((r) => r.status), sameId: dbl[0].json?.reportId === dbl[1].json?.reportId, platformReportIds: dblPlatform?.reportIds?.length },
      storedTotalsDelta: statsAfter.stored - statsBefore.stored, publicTotalsDelta: statsAfter.pub - statsBefore.pub,
    };
    const rs = par.resubmitAfter503;
    check('resubmission after storage errors (503 after the report was saved): the first POST fails, the same submission sent again gives ONE report in storage, on the card, in search by name and address, and in the totals',
      rs.failedStatus === 500 && rs.injected503 > 0 && rs.reportFilesAfterFailure === 1 && rs.retryStatus === 200 && rs.retryIdFromKey && rs.reportFilesForSubmission === 1
        && JSON.stringify(rs.cardReports) === JSON.stringify([retryId]) && rs.cardVictims === 1
        && JSON.stringify(rs.searchByName) === '[1]' && JSON.stringify(rs.searchByAddress) === '[1]',
      rs);
    check('double click (the same submission twice at once): both answered with one report id, one report linked',
      JSON.stringify(rs.doubleClick.statuses) === '[200,200]' && rs.doubleClick.sameId && rs.doubleClick.platformReportIds === 1, rs.doubleClick);
    check('stored and public totals grew by exactly 2 in the resubmission phase (one per submission)', rs.storedTotalsDelta === 2 && rs.publicTotalsDelta === 2,
      { stored: rs.storedTotalsDelta, public: rs.publicTotalsDelta });

    // d) the regular limit is active: a 4th report from one IP within the hour is refused
    const rl = [];
    for (let i = 0; i < 4; i++) rl.push((await http('POST', '/api/scam-database/report', { body: mk('QA Rate Limit Probe', `rl${i}`).payload, ip: '198.19.253.1' })).status);
    report.rateLimit = rl;
    check('rate limit active: 3 reports from one IP accepted, the 4th answered 429', JSON.stringify(rl) === '[200,200,200,429]', { statuses: rl });

    // f) conditional delete over the wire (Codex round 8): the installed SDK sends If-Match on
    //    DeleteObject, and storage refuses a delete of a version that changed meanwhile (412).
    const probeKey = 'scam-database/reports/QA-CONDITIONAL-DELETE-PROBE.json';
    const v1 = (await s3.send(new PutObjectCommand({ Bucket: bucket, Key: probeKey, Body: '{"v":1}', ContentType: 'application/json' }))).ETag;
    const v2 = (await s3.send(new PutObjectCommand({ Bucket: bucket, Key: probeKey, Body: '{"v":2}', ContentType: 'application/json' }))).ETag;
    let staleStatus = null;
    try { await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: probeKey, IfMatch: v1 })); staleStatus = 204; } catch (e) { staleStatus = e?.$metadata?.httpStatusCode ?? String(e?.name); }
    const afterStale = await getJson(probeKey).catch(() => null);
    const conditionalBefore = s3srv.counters.conditionalDelete || 0;
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: probeKey, IfMatch: v2 }));
    const afterCurrent = await getJson(probeKey).catch(() => null);
    report.conditionalDelete = { staleVersionStatus: staleStatus, keptAfterStaleDelete: afterStale?.v === 2, currentVersionDeleted: afterCurrent === null,
      ifMatchSeenByStorage: (s3srv.counters.conditionalDelete || 0) - conditionalBefore === 1 };
    check('conditional delete over HTTP: a delete of an older version is refused with 412 and the object stays; the current version is deleted',
      staleStatus === 412 && report.conditionalDelete.keptAfterStaleDelete && report.conditionalDelete.currentVersionDeleted && report.conditionalDelete.ifMatchSeenByStorage,
      report.conditionalDelete);

    report.cleanupConcurrency = await cleanup('concurrency');
    await new Promise((r) => setTimeout(r, 31_000));
    const zero2 = await http('GET', '/api/scam-database/stats');
    report.statsAfterFinalCleanup = zero2.json;
    check('after the final cleanup: no objects left and public counters are zero', report.cleanupConcurrency.remaining === 0 && zero2.json?.totalReports === 0 && zero2.json?.totalPlatforms === 0,
      { cleanup: report.cleanupConcurrency, stats: zero2.json });
  } catch (err) {
    report.error = String(err?.stack || err);
    log('ERROR', report.error);
  } finally {
    // cleanup always runs, also after an error
    try { const c = await cleanup(mainCleaned ? 'final' : 'after-error'); report.cleanupFinal = c; } catch (e) { report.cleanupFinal = { error: String(e) }; }
    report.objectsLeftInRunBucket = s3srv.size(bucket);
    stopServer();
    await s3srv.close();
    const guard = readFileSync(guardLog, 'utf8').trim();
    report.loopbackGuard = { blockedAttempts: guard ? guard.split('\n').length : 0, entries: guard ? guard.split('\n').slice(0, 20).map((l) => JSON.parse(l)) : [] };
    report.fakeS3Counters = s3srv.counters;
    report.finishedAt = new Date().toISOString();
    report.timings.totalSeconds = Math.round((Date.now() - t0) / 1000);
    report.summary = { passed: report.checks.filter((c) => c.ok).length, failed: report.checks.filter((c) => !c.ok).length, defects: report.defects.map((d) => d.id) };
    writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    log(`done: ${JSON.stringify(report.summary)}; counts ${JSON.stringify(report.counts)}; left in bucket ${report.objectsLeftInRunBucket}; guard blocks ${report.loopbackGuard.blockedAttempts}; out ${OUT}`);
  }
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });

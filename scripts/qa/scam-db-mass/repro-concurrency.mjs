/**
 * QA (package 58): minimal reproduction of lost updates in POST /api/scam-database/report.
 *   node scripts/qa/scam-db-mass/repro-concurrency.mjs
 * Same isolation as run.mjs: `next dev` on 127.0.0.1, empty in-memory S3-compatible store,
 * whitelisted environment with synthetic credentials, loopback guard preloaded.
 * For N = 2, 3, 4, 6, 12 concurrent complaints (different IPs) it sends 5 trials each:
 *   same    -- all N to one fresh platform; counts ids linked in platforms/<slug>.json
 *   distinct -- N fresh platforms at once; counts them in index/platforms.json
 * Output: qa-output/scam-db-mass/repro-<run>.json. Cleans the store at the end.
 */
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startFakeS3, randomBucketName } from './fake-s3.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const require = createRequire(join(ROOT, 'package.json'));
const { S3Client, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const RUN = new Date().toISOString().replace(/[:.]/g, '-');
const OUT = join(ROOT, 'qa-output', 'scam-db-mass');
mkdirSync(OUT, { recursive: true });
for (const f of ['.env', '.env.local', '.env.development', '.env.development.local']) if (existsSync(join(ROOT, f))) throw new Error(`refusing: ${f} present`);

const freePort = () => new Promise((r) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => r(port)); }); });
const bucket = randomBucketName();
const s3srv = await startFakeS3({ buckets: [bucket] });
const s3 = new S3Client({ region: 'us-east-1', endpoint: s3srv.url, forcePathStyle: true, credentials: { accessKeyId: 'QATESTKEY', secretAccessKey: 'qa-test-secret' } });
const getJson = async (key) => { try { return JSON.parse(await (await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))).Body.transformToString()); } catch { return null; } };
const listAll = async () => { const keys = []; let t; do { const r = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: t })); for (const o of r.Contents || []) keys.push(o.Key); t = r.IsTruncated ? r.NextContinuationToken : undefined; } while (t); return keys; };

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const guardLog = join(OUT, `repro-${RUN}-guard.log`);
writeFileSync(guardLog, '');
const env = {};
for (const k of ['PATH', 'Path', 'PATHEXT', 'SystemRoot', 'SYSTEMROOT', 'windir', 'ComSpec', 'TEMP', 'TMP', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH', 'APPDATA', 'LOCALAPPDATA', 'NUMBER_OF_PROCESSORS', 'PROCESSOR_ARCHITECTURE', 'OS', 'HOME']) if (process.env[k] !== undefined) env[k] = process.env[k];
Object.assign(env, {
  NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1', AWS_ACCESS_KEY_ID: 'QATESTKEY', AWS_SECRET_ACCESS_KEY: randomBytes(16).toString('hex'), AWS_REGION: 'us-east-1',
  AWS_S3_BUCKET: bucket, AWS_ENDPOINT_URL_S3: s3srv.url, AWS_CONFIG_FILE: join(OUT, 'no-aws-config'), AWS_SHARED_CREDENTIALS_FILE: join(OUT, 'no-aws-credentials'),
  ADMIN_PASSWORD: randomBytes(24).toString('hex'), EMAIL_TRANSPORT: 'log', QA_GUARD_LOG: guardLog,
  NODE_OPTIONS: `--require ${join(HERE, 'loopback-guard.cjs').replace(/\\/g, '/')}`,
});
const server = spawn(process.execPath, [join(ROOT, 'node_modules/next/dist/bin/next'), 'dev', '-H', '127.0.0.1', '-p', String(port)], { cwd: ROOT, env, stdio: 'ignore' });
const post = async (body, ip) => (await fetch(`${base}/api/scam-database/report`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) })).status;
const complaint = (name, tag) => ({ platformName: name, platformType: 'ponzi', platformUrl: 'https://qa-repro.invalid', network: 'eth', lossAmount: 100,
  description: `[QA-REPRO ${tag}] Concurrency reproduction complaint with a description long enough to pass the route's one hundred character minimum.`, reporterEmail: `repro-${tag}@qa-mail.invalid` });

const result = { run: RUN, trialsPerN: 5, same: {}, distinct: {} };
let ipN = 0;
const ip = () => { ipN++; return `198.19.${100 + Math.floor(ipN / 256)}.${ipN % 256}`; };
try {
  for (let i = 0; i < 240; i++) { try { if ((await fetch(`${base}/api/scam-database/stats`, { signal: AbortSignal.timeout(120_000) })).ok) break; } catch { await new Promise((r) => setTimeout(r, 1000)); } }
  await post(complaint('QA Repro Warmup', 'warm'), ip()); // compile the route before measuring
  let k = 0;
  for (const N of [2, 3, 4, 6, 12]) {
    result.same[N] = []; result.distinct[N] = [];
    for (let t = 0; t < 5; t++) {
      k++;
      const name = `QA Repro Same ${k}`;
      const statuses = await Promise.all(Array.from({ length: N }, (_, i) => post(complaint(name, `${k}-${i}`), ip())));
      const p = await getJson(`scam-database/platforms/qa-repro-same-${k}.json`);
      result.same[N].push({ accepted: statuses.filter((s) => s === 200).length, linked: p?.reportIds?.length ?? 0 });
      const names = Array.from({ length: N }, (_, i) => `QA Repro Distinct ${k} ${i}`);
      const st2 = await Promise.all(names.map((n, i) => post(complaint(n, `d${k}-${i}`), ip())));
      const idx = (await getJson('scam-database/index/platforms.json')) || [];
      result.distinct[N].push({ accepted: st2.filter((s) => s === 200).length, inIndex: idx.filter((e) => e.slug.startsWith(`qa-repro-distinct-${k}-`)).length });
    }
    const lostSame = result.same[N].filter((x) => x.linked < x.accepted).length;
    const lostDistinct = result.distinct[N].filter((x) => x.inIndex < x.accepted).length;
    console.log(`N=${N}: same platform lost updates in ${lostSame}/5 trials ${JSON.stringify(result.same[N])}; distinct platforms lost in ${lostDistinct}/5 ${JSON.stringify(result.distinct[N])}`);
  }
} finally {
  const keys = await listAll();
  for (const key of keys) await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  result.cleanup = { deleted: keys.length, remaining: (await listAll()).length };
  try { execFileSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { server.kill('SIGKILL'); }
  await s3srv.close();
  const g = readFileSync(guardLog, 'utf8').trim();
  result.loopbackGuardBlocked = g ? g.split('\n').length : 0;
  writeFileSync(join(OUT, `repro-${RUN}.json`), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ cleanup: result.cleanup, loopbackGuardBlocked: result.loopbackGuardBlocked }));
}
process.exit(0);

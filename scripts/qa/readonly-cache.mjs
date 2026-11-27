// Run inside a private production container via stdin: node --input-type=module.
// Read-only GETs, no provider keys, no public ports, network none.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/app/server.js');
const config = JSON.parse(fs.readFileSync('/app/.next/required-server-files.json')).config;
assert.equal(config.experimental.isrFlushToDisk, false);
assert.equal(config.cacheMaxMemorySize, 50 * 1024 * 1024);
assert.equal(process.getuid(), 1000);
assert.equal(config.images.unoptimized, true);

const base = 'http://127.0.0.1:3000';
let requestCount = 0;
async function get(path, expected, headers = {}) {
  const r = await fetch(base + path, { redirect: 'manual', headers, signal: AbortSignal.timeout(10000) });
  const body = await r.text(); requestCount++;
  assert.equal(r.status, expected, path);
  return { r, body };
}
for (let i = 0; i < 40; i++) {
  try { await fetch(base + '/pricing', { signal: AbortSignal.timeout(1000) }); break; }
  catch (e) { if (i === 39) throw e; await new Promise(r => setTimeout(r, 500)); }
}
function diskState(dir) {
  if (!fs.existsSync(dir)) return { files: 0, bytes: 0 };
  const out = { files: 0, bytes: 0 };
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const path = dir + '/' + entry.name;
    if (entry.isDirectory()) { const sub = diskState(path); out.files += sub.files; out.bytes += sub.bytes; }
    else { out.files++; out.bytes += fs.statSync(path).size; }
  }
  return out;
}
const before = { cache: diskState('/app/.next/cache'), routeCache: diskState('/app/.next/server/route-cache') };
const pages = [];
for (const prefix of ['', '/ru', '/es', '/fr', '/zh', '/ar']) {
  for (const path of ['/pricing', '/payment-safety', '/emergency']) {
    const { r } = await get(prefix + path, 200); pages.push(prefix + path);
    assert.match(r.headers.get('content-type'), /text\/html/);
  }
}
const pricing = await get('/pricing', 200);
assert.match(pricing.r.headers.get('cache-control'), /s-maxage=/);
const secured = await get('/ru/payment-safety', 200);
assert.match(secured.r.headers.get('content-security-policy'), /default-src 'self'/);
assert.equal(secured.r.headers.get('x-frame-options'), 'DENY');
const redirect = await get('/tracker', 307);
assert.equal(new URL(redirect.r.headers.get('location'), base).pathname, '/wallet-tracker');
assert.equal(new URL((await get('/', 307, { 'accept-language': 'ru' })).r.headers.get('location'), base).pathname, '/ru');
assert.equal(new URL((await get('/en/pricing', 308)).r.headers.get('location'), base).pathname, '/pricing');
const assets = [...new Set(pricing.body.match(/\/_next\/static\/[^"<>\s]+\.(?:js|css)/g))].slice(0, 2);
assert.equal(assets.length, 2);
for (const path of assets) assert.match((await get(path, 200)).r.headers.get('cache-control'), /immutable/);
const unique404 = process.env.QA_RESTART === '1' ? 8 : 200;
for (let i = 0; i < unique404; i += 4) {
  await Promise.all(Array.from({ length: 4 }, (_, j) => {
    const id = i + j;
    // Dots bypass the i18n matcher and exercise the built-in negative route cache.
    return get(id % 2 ? '/ru/cache-qa-missing-' + id : '/cache-qa-missing-' + id + '.txt', 404);
  }));
}
await new Promise(r => setTimeout(r, 500)); // Allow background cache persistence to finish.
const after = { cache: diskState('/app/.next/cache'), routeCache: diskState('/app/.next/server/route-cache') };
assert.deepEqual(after, before, 'GETs must not create runtime disk artifacts');
assert.equal((await get('/pricing', 200)).r.status, 200);

// The installed framework must still keep an evictable memory cache; this is
// independent of HTTP5xx, which hid the original persistence failures.
const Cache = require('next/dist/server/lib/incremental-cache/file-system-cache').default;
let writes = 0;
const cache = new Cache({
  fs: { existsSync: () => false, readFile: async () => { throw Error('No test seed'); },
    mkdir: async () => { writes++; throw Error('readonly'); }, writeFile: async () => { writes++; throw Error('readonly'); } },
  flushToDisk: config.experimental.isrFlushToDisk,
  serverDistDir: '/app/.next/server', maxMemoryCacheSize: 2048, revalidatedTags: [],
});
for (let i = 0; i < 100; i++) await cache.set('/qa-' + i, { kind: 'APP_ROUTE', body: Buffer.alloc(100), status: 404, headers: {} }, {});
assert.equal(writes, 0);
assert.ok(Cache.memoryCache.totalSize <= 2048);
assert.equal(await cache.get('/qa-0', { kind: 'APP_ROUTE' }), null);
assert.equal((await cache.get('/qa-99', { kind: 'APP_ROUTE' })).value.status, 404);
console.log(JSON.stringify({ passed: true, requestCount, pages, unique404, before, after,
  memoryBudget: config.cacheMaxMemorySize, lruEvictionVerified: true, handlerDiskWrites: writes,
  run: process.env.QA_RESTART === '1' ? 'restart' : 'cold' }));

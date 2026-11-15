/**
 * QA (package 58, stage 1): reproducible generator of 1 200 synthetic crypto-scam complaints
 * and the expected public result, computed from the generated data alone (never from the
 * database code). Fixed seed -> identical output on every run.
 *
 * All data is fictitious: platform names start with "QA", domains and e-mail addresses use the
 * reserved `.invalid` TLD, wallet addresses are random strings in each chain's format, test
 * client IPs come from 198.18.0.0/15 (RFC 2544 benchmarking range). No tx hashes are generated:
 * a tx hash makes the report route call /api/tx, which looks the hash up on public chains.
 *
 * Usage: node scripts/qa/scam-db-mass/generator.mjs [outFile]   (writes the manifest JSON)
 */
import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SEED = 20261112;
export const TOTAL = 1200;
export const DECISION_TOTALS = { verified: 800, rejected: 300, pending: 100 };
/** Every category the report form and route accept (app/[locale]/scam-database/report, VALID_TYPES). */
export const CATEGORIES = ['fake_exchange', 'pig_butchering', 'rug_pull', 'phishing', 'ponzi', 'other'];
export const NETWORKS = ['eth', 'bnb', 'polygon', 'btc', 'trx', 'sol'];

/* ── deterministic PRNG (mulberry32) ── */
function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  const pick = (arr) => arr[Math.floor(next() * arr.length)];
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  };
  return { next, int, pick, shuffle };
}

const HEX = '0123456789abcdef';
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const B32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function makeAddress(r, network) {
  const s = (alphabet, n) => Array.from({ length: n }, () => r.pick(alphabet)).join('');
  if (network === 'btc') return `bc1q${s(B32, 38)}`;
  if (network === 'trx') return `T${s(B58, 33)}`;
  if (network === 'sol') return s(B58, 44);
  return `0x${s(HEX, 40)}`; // eth, bnb, polygon
}

const ADJ = ['Nova', 'Atlas', 'Crimson', 'Silver', 'Quantum', 'Harbor', 'Velvet', 'Summit', 'Orbit', 'Cobalt', 'Ember', 'Lumen'];
const NOUN = ['Vault', 'Exchange', 'Yield', 'Ledger', 'Swap', 'Capital', 'Mint', 'Bridge', 'Trust', 'Markets', 'Pool', 'Signal'];
const OPENERS = [
  'I was contacted through a messaging app by someone who promised steady returns',
  'After seeing an advertisement I opened an account and made several deposits',
  'A person I met online guided me step by step through funding a trading account',
  'The site showed growing profits on my dashboard for several weeks',
  'I connected my wallet to what looked like an official airdrop page',
  'The project announced a staking pool with a fixed daily percentage',
];
const MIDDLES = [
  'when I asked to withdraw, support demanded an additional verification fee',
  'the withdrawal button stopped working and my account was frozen without explanation',
  'the token liquidity was removed and the developers deleted their channels',
  'my balance was drained shortly after I signed a transaction I did not understand',
  'new deposits were required to unlock earlier payouts, which never arrived',
  'the operators stopped answering and the domain later went offline',
];
const CLOSERS = [
  'I have screenshots of the chat history and the deposit receipts.',
  'I am reporting this so others can check the platform before investing.',
  'Several other people in the same group describe the same pattern.',
  'I reported it to my bank and to the local police as well.',
];

const pad = (n, w) => String(n).padStart(w, '0');
/** The documented slug rule for these simple names: lower case, spaces to dashes. */
const slugOf = (name) => name.toLowerCase().replace(/\s+/g, '-');

/* ── designed platforms: each exercises one publication rule ── */
const DESIGNED = [
  { key: 'pendingOnly', name: 'QA Pending Only Wave', type: 'pig_butchering', networks: ['trx'], plan: { pending: 24 } },
  { key: 'verifiedSwarm', name: 'QA Verified Swarm', type: 'fake_exchange', networks: ['eth', 'bnb'], plan: { verified: 30 } },
  { key: 'rejectedGhost', name: 'QA Rejected Ghost', type: 'phishing', networks: ['eth'], plan: { rejected: 12 } },
  { key: 'mixedLedger', name: 'QA Mixed Ledger', type: 'ponzi', networks: ['trx', 'btc'], plan: { verified: 10, rejected: 6, pending: 4 } },
  { key: 'smallVerified', name: 'QA Small Verified', type: 'rug_pull', networks: ['sol'], plan: { verified: 3 } },
];

/** Deterministic UUID-shaped submission key of complaint `seq` (no random stream is consumed). */
export function qaSubmissionKey(seed, seq) {
  const h = createHash('sha256').update(`qa-submission:${seed}:${seq}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export function generate(seed = SEED) {
  const r = rng(seed);
  const platforms = [];
  for (const d of DESIGNED) {
    platforms.push({ ...d, slug: slugOf(d.name), domains: [`${slugOf(d.name)}.invalid`, `app-${slugOf(d.name)}.invalid`], addresses: [] });
  }
  const RANDOM_PLATFORMS = 48;
  for (let i = 1; i <= RANDOM_PLATFORMS; i++) {
    const name = `QA ${ADJ[(i * 5) % ADJ.length]} ${NOUN[(i * 7) % NOUN.length]} ${pad(i, 2)}`;
    const slug = slugOf(name);
    const nets = r.shuffle([...NETWORKS]).slice(0, r.int(1, 2));
    platforms.push({ key: `r${pad(i, 2)}`, name, slug, type: CATEGORIES[(i - 1) % CATEGORIES.length], networks: nets,
      domains: [`${slug}.invalid`, ...(r.next() < 0.4 ? [`login-${slug}.invalid`] : [])], weight: 1 + r.int(0, 9), addresses: [] });
  }
  const byKey = Object.fromEntries(platforms.map((p) => [p.key, p]));

  /* complaint skeletons: designed ones carry their decision, random ones get one later */
  const skeletons = [];
  for (const d of DESIGNED) for (const [decision, n] of Object.entries(d.plan)) for (let k = 0; k < n; k++) skeletons.push({ platform: d.key, decision });
  const designedTotals = { verified: 0, rejected: 0, pending: 0 };
  for (const s of skeletons) designedTotals[s.decision]++;
  const randomCount = TOTAL - skeletons.length;
  const randomDecisions = r.shuffle([
    ...Array(DECISION_TOTALS.verified - designedTotals.verified).fill('verified'),
    ...Array(DECISION_TOTALS.rejected - designedTotals.rejected).fill('rejected'),
    ...Array(DECISION_TOTALS.pending - designedTotals.pending).fill('pending'),
  ]);
  if (randomDecisions.length !== randomCount) throw new Error('decision totals do not add up');
  const randoms = platforms.filter((p) => p.weight);
  const weightSum = randoms.reduce((s, p) => s + p.weight, 0);
  for (let k = 0; k < randomCount; k++) {
    let x = r.next() * weightSum;
    const p = randoms.find((q) => (x -= q.weight) < 0) || randoms[randoms.length - 1];
    skeletons.push({ platform: p.key, decision: randomDecisions[k] });
  }
  r.shuffle(skeletons); // submission order mixes platforms and decisions

  /* shared addresses that exercise the address index */
  const shared = {
    multiInVerified: makeAddress(r, 'eth'),        // 6 complaints, one published platform
    crossPlatform: makeAddress(r, 'trx'),          // mixedLedger (verified) + r01 (pending) + rejectedGhost (rejected)
    rejectedOnly: makeAddress(r, 'eth'),           // only rejected complaints -> never public
    mixedSamePlatform: makeAddress(r, 'btc'),      // mixedLedger: 2 verified + 2 rejected
  };
  const want = [
    { addr: 'multiInVerified', platform: 'verifiedSwarm', decision: 'verified', n: 6, network: 'eth' },
    { addr: 'crossPlatform', platform: 'mixedLedger', decision: 'verified', n: 1, network: 'trx' },
    { addr: 'crossPlatform', platform: 'rejectedGhost', decision: 'rejected', n: 1, network: 'trx' },
    { addr: 'rejectedOnly', platform: 'rejectedGhost', decision: 'rejected', n: 3, network: 'eth' },
    { addr: 'mixedSamePlatform', platform: 'mixedLedger', decision: 'verified', n: 2, network: 'btc' },
    { addr: 'mixedSamePlatform', platform: 'mixedLedger', decision: 'rejected', n: 2, network: 'btc' },
  ];
  // cross-platform also on a random platform with a pending complaint (r01 must get one)
  const r01Pending = skeletons.find((s) => s.platform === 'r01' && s.decision === 'pending')
    || skeletons.find((s) => s.platform === 'r01');
  if (r01Pending) { r01Pending.forceAddress = { addr: 'crossPlatform', network: 'trx' }; }
  for (const w of want) {
    let left = w.n;
    for (const s of skeletons) {
      if (!left) break;
      if (s.platform === w.platform && s.decision === w.decision && !s.forceAddress) { s.forceAddress = { addr: w.addr, network: w.network }; left--; }
    }
    if (left) throw new Error(`not enough ${w.decision} complaints on ${w.platform} for ${w.addr}`);
  }

  /* applicants: each submits 1..3 complaints (the route allows 3 per IP per hour) from its own IP */
  const complaints = [];
  let applicant = 0;
  let quota = 0;
  for (let i = 0; i < skeletons.length; i++) {
    if (quota === 0) { applicant++; quota = r.int(1, 3); }
    quota--;
    const s = skeletons[i];
    const p = byKey[s.platform];
    const seq = i + 1;
    const network = s.forceAddress?.network || r.pick(p.networks);
    let scamAddress;
    if (s.forceAddress) scamAddress = shared[s.forceAddress.addr];
    else if (r.next() < 0.78) {
      if (p.addresses.length && r.next() < 0.25) scamAddress = r.pick(p.addresses);
      else { scamAddress = makeAddress(r, network); p.addresses.push(scamAddress); }
    }
    const type = r.next() < 0.8 ? p.type : r.pick(CATEGORIES);
    const ipN = applicant; // 198.18.0.0/15: 198.18.x.y and 198.19.x.y
    const ip = `198.${18 + Math.floor(ipN / 65536)}.${Math.floor((ipN % 65536) / 256)}.${ipN % 256}`;
    const extraUrls = p.domains.length > 1 && r.next() < 0.3 ? [`https://${p.domains[1]}/account`] : undefined;
    const month = r.int(1, 10);
    const description = `[QA-C${pad(seq, 4)}] ${r.pick(OPENERS)} on ${p.name}; ${r.pick(MIDDLES)}. ${r.pick(CLOSERS)}`;
    complaints.push({
      seq,
      applicant: `A${pad(applicant, 4)}`,
      ip,
      decision: s.decision,
      platformKey: p.key,
      slug: p.slug,
      payload: {
        platformName: p.name,
        platformUrl: `https://${p.domains[0]}`,
        ...(extraUrls ? { platformUrls: extraUrls } : {}),
        platformType: type,
        ...(scamAddress ? { scamAddress } : {}),
        network,
        lossAmount: r.int(1, 2000) * (r.next() < 0.2 ? 250 : 25),
        lossCurrency: 'USD',
        lossDate: `2026-${pad(month, 2)}-${pad(r.int(1, 28), 2)}`,
        description,
        reporterEmail: `applicant-${pad(applicant, 4)}@qa-mail.invalid`,
        // as the form sends it (lib/submission-key): one key per submission, UUID-shaped
        submissionKey: qaSubmissionKey(seed, seq),
      },
    });
  }
  return { seed, platforms, shared, complaints };
}

/* ── expected public result, from the generated data and the documented rules only ──
   Rules (lib/scam-db.ts header + task): pending and verified reports are public, rejected are not;
   a platform with no verified report is capped at score 9; score = victims + 3*chain-confirmed
   (none here) + 5 if >= 5 victims + 5 if >= 20 victims + 10 if staff-verified (none here);
   "verified" flag = score >= 10; label thresholds 20 / 10 / 4. */
export const labelOf = (score) => (score >= 20 ? 'Confirmed Scam' : score >= 10 ? 'Likely Scam' : score >= 4 ? 'Suspicious' : 'Community Reported');

export function expectations(data) {
  const pub = (c) => c.decision !== 'rejected';
  const platforms = {};
  for (const p of data.platforms) {
    const all = data.complaints.filter((c) => c.platformKey === p.key);
    const published = all.filter(pub);
    if (!published.length) { platforms[p.slug] = { name: p.name, public: false, submitted: all.length }; continue; }
    const n = published.length;
    let score = n + (n >= 5 ? 5 : 0) + (n >= 20 ? 5 : 0);
    const moderated = published.some((c) => c.decision === 'verified');
    if (!moderated) score = Math.min(score, 9);
    const set = (f) => Array.from(new Set(published.flatMap(f).filter(Boolean))).sort();
    platforms[p.slug] = {
      name: p.name, public: true, submitted: all.length,
      victims: n,
      totalLoss: published.reduce((s, c) => s + c.payload.lossAmount, 0),
      trustScore: score, verified: score >= 10, label: labelOf(score),
      addresses: set((c) => [c.payload.scamAddress]),
      urls: set((c) => [c.payload.platformUrl, ...(c.payload.platformUrls || [])]),
      types: set((c) => [c.payload.platformType]),
      statuses: { verified: published.filter((c) => c.decision === 'verified').length, pending: published.filter((c) => c.decision === 'pending').length },
    };
  }
  const addresses = {};
  for (const c of data.complaints) {
    const a = c.payload.scamAddress;
    if (!a) continue;
    const key = a.toLowerCase();
    addresses[key] ??= { address: a, complaints: 0, publicSlugs: new Set(), publicComplaints: 0, totalPublicLoss: 0 };
    const e = addresses[key];
    e.complaints++;
    if (pub(c)) { e.publicSlugs.add(c.slug); e.publicComplaints++; e.totalPublicLoss += c.payload.lossAmount; }
  }
  for (const e of Object.values(addresses)) e.publicSlugs = Array.from(e.publicSlugs).sort();
  const publicPlatforms = Object.values(platforms).filter((p) => p.public);
  const decisions = { verified: 0, rejected: 0, pending: 0 };
  for (const c of data.complaints) decisions[c.decision]++;
  return {
    decisions,
    stats: {
      totalReports: publicPlatforms.reduce((s, p) => s + p.victims, 0),
      totalPlatforms: publicPlatforms.length,
      totalLoss: publicPlatforms.reduce((s, p) => s + p.totalLoss, 0),
      blockchainVerified: 0,
    },
    platforms,
    addresses,
    categories: Object.fromEntries(CATEGORIES.map((t) => [t, data.complaints.filter((c) => c.payload.platformType === t).length])),
    networks: Object.fromEntries(NETWORKS.map((n) => [n, data.complaints.filter((c) => c.payload.network === n).length])),
  };
}

export function buildManifest(seed = SEED) {
  const data = generate(seed);
  const expected = expectations(data);
  const body = { generator: 'scripts/qa/scam-db-mass/generator.mjs', seed, total: data.complaints.length, shared: data.shared, expected, complaints: data.complaints };
  const sha256 = createHash('sha256').update(JSON.stringify(body)).digest('hex');
  return { ...body, sha256 };
}

const isMain = !!process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const out = resolve(process.argv[2] || 'qa-output/scam-db-mass/manifest.json');
  mkdirSync(dirname(out), { recursive: true });
  const m = buildManifest();
  writeFileSync(out, JSON.stringify(m, null, 2));
  console.log(JSON.stringify({ out, sha256: m.sha256, total: m.total, decisions: m.expected.decisions, stats: m.expected.stats, categories: m.expected.categories, networks: m.expected.networks,
    platforms: Object.keys(m.expected.platforms).length, publicPlatforms: m.expected.stats.totalPlatforms, addresses: Object.keys(m.expected.addresses).length }));
}

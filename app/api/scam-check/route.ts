import { NextRequest } from 'next/server';
import { getAddressIndex } from '@/lib/scam-db';
import { getScamCheckView } from '@/lib/known-entities';

// 2026-05-20: Local KNOWN_ENTITIES removed. Source of truth is now
// `lib/known-entities.ts` — accessed via `getScamCheckView()` which
// returns { label, type, category }. See that file's header for the
// fabricated-entry cleanup audit trail (docs/removed-fabricated-entries.md).

/* ── Rate limiting ── */
const RATE_LIMIT_WINDOW = 3600000;
const rateLimit = new Map<string, { count: number; reset: number }>();
setInterval(() => { const now = Date.now(); Array.from(rateLimit.entries()).forEach(([k, v]) => { if (v.reset <= now) rateLimit.delete(k); }); }, 600000);

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const now = Date.now();
    const entry = rateLimit.get(ip);
    if (entry && entry.reset > now) {
      if (entry.count >= 30) {
        return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
      }
      entry.count++;
    } else {
      rateLimit.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW });
    }

    const { address } = await req.json();
    const isEth = /^0x[a-fA-F0-9]{40}$/.test(address);
    const isTron = /^T[a-zA-Z0-9]{33}$/.test(address);
    const isBtc = /^(1|3)[a-zA-Z0-9]{24,33}$|^bc1[a-zA-Z0-9]{25,62}$/.test(address);
    const isSol = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    if (!address || (!isEth && !isTron && !isBtc && !isSol)) {
      return Response.json({ error: 'Invalid address. Supports Bitcoin (1.../3.../bc1...), Ethereum (0x...), Solana (base58), and TRON (T...)' }, { status: 400 });
    }

    // BTC and SOL addresses are case-sensitive; TRON is case-sensitive; ETH is lowercased
    const addr = isEth ? address.toLowerCase() : address;
    const sources: { source: string; label: string; type: string; category: string }[] = [];
    let chainabuseReports = 0;
    let chainabuseCategories: string[] = [];

    /* 1. Check internal DB */
    const entity = getScamCheckView(addr);
    if (entity && entity.type !== 'exchange' && entity.type !== 'defi') {
      sources.push({
        source: 'LedgerHound DB',
        label: entity.label,
        type: entity.type,
        category: entity.category,
      });
    }

    /* 2. Check LedgerHound Scam Database (address index) */
    let scamDbPlatforms: string[] = [];
    try {
      const addrIndex = await getAddressIndex(addr);
      if (addrIndex && addrIndex.platforms.length > 0) {
        scamDbPlatforms = addrIndex.platformNames;
        sources.push({
          source: 'LedgerHound Scam Database',
          label: `Reported in ${addrIndex.reports.length} report(s) — ${addrIndex.platformNames.join(', ')}`,
          type: 'scam',
          category: 'Scam',
        });
      }
    } catch {
      // Scam database check failed — continue without it
    }

    /* 3. Check Chainabuse (public API, no key needed) */
    try {
      const caRes = await fetch(
        `https://api.chainabuse.com/v0/reports?address=${addr}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (caRes.ok) {
        const caData = await caRes.json();
        const reports = caData.reports || caData.items || [];
        if (Array.isArray(reports) && reports.length > 0) {
          chainabuseReports = reports.length;
          const cats = new Set<string>();
          for (const r of reports) {
            if (r.category) cats.add(r.category);
            if (r.scamType) cats.add(r.scamType);
          }
          chainabuseCategories = Array.from(cats);
          sources.push({
            source: 'Chainabuse',
            label: `${chainabuseReports} community report${chainabuseReports > 1 ? 's' : ''}`,
            type: 'community_report',
            category: chainabuseCategories[0] || 'Reported',
          });
        }
      }
    } catch {
      // Chainabuse timeout/error — continue without it
    }

    /* 4. Determine entity info for clean addresses */
    let entityInfo: { label: string; type: string } | null = null;
    if (entity && (entity.type === 'exchange' || entity.type === 'defi')) {
      entityInfo = { label: entity.label, type: entity.type };
    }

    /* 5. Calculate risk */
    const isFlagged = sources.length > 0;
    let riskLevel: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'CLEAN';
    let riskScore = 0;
    let ofacWarning = '';

    if (isFlagged) {
      // OFAC detection: explicit 'sanctioned' type OR mixer-with-OFAC-label
      // (Tornado Cash variants are stored as type='mixer' in known-entities.ts
      //  with "(OFAC)" in the label — they should still trigger OFAC warning.)
      const OFAC_LABEL_RE = /OFAC|Lazarus|Blender\.io|Sinbad\.io|Tornado Cash/i;
      const hasSanctions = sources.some(s => s.type === 'sanctioned' || OFAC_LABEL_RE.test(s.label));
      const hasScam = sources.some(s => s.type === 'scam');
      const hasMixer = sources.some(s => s.type === 'mixer');
      const hasDarknet = sources.some(s => s.type === 'darknet');
      const hasRansomware = sources.some(s => s.type === 'ransomware');
      const hasCommunityOnly = sources.every(s => s.type === 'community_report');

      // OFAC sanctioned = instant CRITICAL (95-100)
      if (hasSanctions) {
        riskScore = 95;
        ofacWarning = 'OFAC Sanctioned — US persons are prohibited from transacting with this address';
      } else if (hasRansomware) {
        riskScore = 85;
      } else if (hasMixer) {
        riskScore = 75;
      } else if (hasScam) {
        riskScore = 70;
      } else if (hasDarknet) {
        riskScore = 65;
      } else if (hasCommunityOnly) {
        riskScore = 40;
      }

      // Bump score for multiple signals
      if (hasSanctions && hasScam) riskScore = 100;
      if (chainabuseReports > 0 && !hasCommunityOnly) riskScore = Math.min(100, riskScore + 5);
      if (chainabuseReports > 5) riskScore = Math.min(100, riskScore + 10);

      riskScore = Math.min(100, riskScore);

      if (riskScore >= 85) riskLevel = 'CRITICAL';
      else if (riskScore >= 65) riskLevel = 'HIGH';
      else if (riskScore >= 35) riskLevel = 'MEDIUM';
      else riskLevel = 'LOW';
    }

    /* 6. Collect all categories + OFAC badge */
    const categories = Array.from(new Set([
      ...sources.map(s => s.category),
      ...chainabuseCategories,
    ]));
    // Ensure "OFAC Sanctioned" appears as a distinct category
    const OFAC_LABEL_RE_CAT = /OFAC|Lazarus|Blender\.io|Sinbad\.io|Tornado Cash/i;
    if (sources.some(s => s.type === 'sanctioned' || OFAC_LABEL_RE_CAT.test(s.label)) && !categories.includes('OFAC Sanctioned')) {
      categories.unshift('OFAC Sanctioned');
    }

    return Response.json({
      address: addr,
      isFlagged,
      riskLevel,
      riskScore,
      sources,
      categories,
      chainabuseReports,
      entityInfo,
      ofacWarning,
      scamDbPlatforms,
    });
  } catch (err: any) {
    console.error('[scam-check]', err);
    return Response.json({ error: err.message || 'Check failed' }, { status: 500 });
  }
}

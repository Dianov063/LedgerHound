/**
 * Address Labels Federation — single entry point.
 *
 *   getAddressLabels(address, network)
 *     → cache hit? return cached.
 *     → run local sources (KNOWN_ENTITIES, KNOWN_PHISHING, scam-db) sequentially
 *       and external sources (Chainabuse, GoPlus, OFAC) in parallel.
 *     → aggregate flags, write to cache, return.
 *
 * Graceful degradation: any single source can fail without breaking the
 * federation. A `hadExternalSourceFailure` flag is bubbled up to the caller
 * so the PDF can show a footnote when external intelligence was unavailable.
 *
 * 2026-05-20: Phase 1 federation.
 */

import { getKnownEntity } from '../known-entities';
import { getPhishingEntry } from '../known-phishing';
import { getAddressIndex } from '../scam-db';
import {
  queryChainabuse,
  shouldQueryChainabuse,
  getMonthlyUsage,
  incrementUsage,
} from './chainabuse';
import { queryGoPlus } from './goplus';
import { checkOfac } from './ofac';
import { getFromCache, saveToCache } from './cache';
import type { AddressLabel, AddressLabelResponse, LabelCategory } from './types';

const TTL_DAYS = 7;

function mapEntityType(type: string): LabelCategory {
  switch (type) {
    case 'exchange': return 'cex';
    case 'mixer': return 'mixer';
    case 'defi': return 'defi';
    case 'scam': return 'scam';
    case 'sanctioned': return 'sanctions';
    default: return 'unknown';
  }
}

/**
 * Fetch all available labels for a single address, with caching.
 * `network` defaults to 'eth'. Non-EVM networks skip GoPlus automatically.
 */
export async function getAddressLabels(
  address: string,
  network: string = 'eth',
): Promise<AddressLabelResponse> {
  const start = Date.now();
  const normalized = address.startsWith('0x') ? address.toLowerCase() : address;

  // 1. Cache lookup
  const cached = await getFromCache(normalized, network);
  if (cached) {
    console.log(JSON.stringify({
      event: 'address_labels_federation',
      address: normalized,
      network,
      cache_hit: true,
      total_labels: cached.labels.length,
      duration_ms: Date.now() - start,
    }));
    return cached;
  }

  const labels: AddressLabel[] = [];

  // ── 2. Phase A: local sources + OFAC + GoPlus in parallel ───────────
  // Chainabuse is gated AFTER Phase A so we can skip it when other
  // sources already flagged or whitelisted the address. This is the
  // monthly-quota guard for free-tier Chainabuse keys (10 calls/month).
  // Local sync sources (KNOWN_ENTITIES, KNOWN_PHISHING) cost nothing —
  // run them in the sync section below. Scam-DB + OFAC + GoPlus are
  // promisified.

  // 2a. Sync local sources
  const known = getKnownEntity(normalized);
  if (known) {
    labels.push({
      source: known.type === 'exchange' ? 'cex_whitelist' : 'known_entity',
      tag: known.label,
      category: mapEntityType(known.type),
      confidence: 1.0,
      notes: known.notes,
    });
  }

  const phishing = getPhishingEntry(normalized);
  if (phishing) {
    labels.push({
      source: 'known_phishing',
      tag: phishing.etherscanTag || 'Phishing wallet (curated)',
      category: 'phishing',
      confidence: 1.0,
      verifiedAt: phishing.verifiedAt,
      url: phishing.etherscanTag
        ? `https://etherscan.io/address/${normalized}`
        : undefined,
      notes: phishing.notes,
    });
  }

  // 2b. Phase A async — scam-db (S3) + OFAC (S3) + GoPlus (HTTP), parallel.
  const phaseA = await Promise.allSettled([
    getAddressIndex(normalized),
    checkOfac(normalized),
    queryGoPlus(normalized, network),
  ]);

  const phaseASourceNames = ['scam_db', 'ofac', 'goplus'] as const;
  const sourceSucceeded: Record<string, boolean> = {};
  let externalSourceFailureCount = 0;
  for (let i = 0; i < phaseA.length; i++) {
    const name = phaseASourceNames[i];
    if (phaseA[i].status === 'rejected') {
      sourceSucceeded[name] = false;
      externalSourceFailureCount++;
      const reason = (phaseA[i] as PromiseRejectedResult).reason;
      console.warn(`[federation] ${name} rejected:`, reason?.message || reason);
    } else {
      sourceSucceeded[name] = true;
    }
  }

  const scamDbResult = phaseA[0].status === 'fulfilled' ? phaseA[0].value : null;
  const ofacResult = phaseA[1].status === 'fulfilled' ? phaseA[1].value : null;
  const goplusResult = phaseA[2].status === 'fulfilled' ? phaseA[2].value : null;

  if (scamDbResult && scamDbResult.platforms.length > 0) {
    labels.push({
      source: 'ledgerhound_scam_db',
      tag: scamDbResult.platformNames.join(', '),
      category: 'scam',
      confidence: 0.85,
      reportCount: scamDbResult.reports.length,
      notes: scamDbResult.totalLoss > 0 ? `$${scamDbResult.totalLoss.toLocaleString()} reported losses` : undefined,
    });
  }
  if (ofacResult) labels.push(ofacResult);
  if (goplusResult) labels.push(goplusResult);

  // ── 3. Phase B: gated Chainabuse call ────────────────────────────────
  // We only spend monthly quota when no other source has already flagged
  // or whitelisted the address. See shouldQueryChainabuse() for the rules.
  const usage = await getMonthlyUsage();
  const decision = shouldQueryChainabuse({
    address: normalized,
    knownEntity: known,
    isKnownPhishing: !!phishing,
    scamDbMatch: scamDbResult && scamDbResult.platforms.length > 0 ? scamDbResult : null,
    ofacMatch: ofacResult,
    monthlyCallsUsed: usage.calls_used,
    hasApiKey: !!process.env.CHAINABUSE_API_KEY,
  });

  if (!decision.shouldQuery) {
    console.log(JSON.stringify({
      event: 'chainabuse_skip',
      address: normalized,
      reason: decision.reason,
      monthly_used: usage.calls_used,
      monthly_cap: usage.calls_limit,
    }));
    sourceSucceeded.chainabuse_skipped = true;
  } else {
    try {
      const chainabuseLabel = await queryChainabuse(normalized);
      // Increment counter only on a successful billable round-trip — we treat
      // "no reports" (null) as a billable call since the API was hit.
      // queryChainabuse returns null both for "no reports" and for transient
      // errors, so to be conservative we only increment when we got a
      // response object back. The conservative path slightly under-counts
      // but never over-counts.
      if (chainabuseLabel) {
        labels.push(chainabuseLabel);
      }
      // Always increment after a fetch attempt — even null responses count
      // toward quota per Chainabuse billing. Doing so protects the budget.
      await incrementUsage();
      sourceSucceeded.chainabuse = true;
      console.log(JSON.stringify({
        event: 'chainabuse_call',
        address: normalized,
        had_match: !!chainabuseLabel,
        monthly_used_after: usage.calls_used + 1,
      }));
    } catch (e: any) {
      // queryChainabuse already swallows errors and returns null, so a throw
      // here would be from unexpected code. Treat as soft failure.
      sourceSucceeded.chainabuse = false;
      externalSourceFailureCount++;
      console.warn('[federation] chainabuse threw:', e?.message || e);
    }
  }

  // Treat scam-db failure as a partial external failure for the footnote.
  const scamDbFailed = phaseA[0].status === 'rejected';
  const hadExternalSourceFailure = externalSourceFailureCount > 0 || scamDbFailed;

  const response: AddressLabelResponse = {
    address: normalized,
    network,
    labels,
    cached_at: new Date().toISOString(),
    ttl_days: TTL_DAYS,
    hasPhishingFlag: labels.some((l) => l.category === 'phishing'),
    hasSanctionsFlag: labels.some((l) => l.category === 'sanctions'),
    hasScamFlag: labels.some((l) => l.category === 'scam' || l.category === 'phishing'),
    isKycExchange: labels.some((l) => l.category === 'cex'),
    highestConfidence: labels.reduce((m, l) => Math.max(m, l.confidence), 0),
    hadExternalSourceFailure,
  };

  // 5. Cache write (best-effort)
  await saveToCache(response);

  console.log(JSON.stringify({
    event: 'address_labels_federation',
    address: normalized,
    network,
    cache_hit: false,
    // Phase A queried unconditionally; Chainabuse only when gate allowed it.
    sources_queried: decision.shouldQuery
      ? ['scam_db', 'ofac', 'goplus', 'chainabuse']
      : ['scam_db', 'ofac', 'goplus'],
    chainabuse_decision: decision.reason,
    chainabuse_monthly_used: usage.calls_used + (decision.shouldQuery ? 1 : 0),
    sources_succeeded: sourceSucceeded,
    scam_db_failed: scamDbFailed,
    total_labels: labels.length,
    flags: {
      phishing: response.hasPhishingFlag,
      sanctions: response.hasSanctionsFlag,
      scam: response.hasScamFlag,
      cex: response.isKycExchange,
    },
    duration_ms: Date.now() - start,
  }));

  return response;
}

/**
 * Batch federation for a list of addresses, with bounded concurrency.
 * Returns AddressLabelResponse[] in the same order as the input.
 *
 * Use this in generateReport to look up counterparties — limit input to the
 * top N to keep total time bounded.
 */
export async function getAddressLabelsBatch(
  addresses: string[],
  network: string = 'eth',
  concurrency: number = 8,
): Promise<AddressLabelResponse[]> {
  const out: AddressLabelResponse[] = new Array(addresses.length);
  let i = 0;

  async function worker(): Promise<void> {
    while (i < addresses.length) {
      const idx = i++;
      try {
        out[idx] = await getAddressLabels(addresses[idx], network);
      } catch (e: any) {
        console.warn(`[federation] batch entry ${addresses[idx]} failed:`, e?.message || e);
        // Synthesize an empty response so the array stays dense.
        out[idx] = {
          address: addresses[idx].toLowerCase(),
          network,
          labels: [],
          cached_at: new Date().toISOString(),
          ttl_days: TTL_DAYS,
          hasPhishingFlag: false,
          hasSanctionsFlag: false,
          hasScamFlag: false,
          isKycExchange: false,
          highestConfidence: 0,
          hadExternalSourceFailure: true,
        };
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, addresses.length) }, () => worker());
  await Promise.all(workers);
  return out;
}

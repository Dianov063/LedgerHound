/**
 * Address Labels Federation — single entry point.
 *
 *   getAddressLabels(address, network)
 *     → cache hit? return cached, with OFAC checked again against the current list.
 *     → run local sources (KNOWN_ENTITIES, KNOWN_PHISHING, scam-db) sequentially
 *       and external sources (Chainabuse, GoPlus, OFAC) in parallel.
 *     → aggregate flags, write to cache, return.
 *
 * Graceful degradation: any single source can fail without breaking the
 * federation. The response says what every source answered (`sources`): a
 * source that failed or was not asked is never counted as "nothing found"
 * (audit F9). `hadExternalSourceFailure` is true when any source failed, and
 * such a result is not cached, so a failure is not served for 7 days as a
 * negative result. A match read only in part (`partial`) is not cached either.
 *
 * 2026-05-20: Phase 1 federation.
 */

import { getKnownEntity } from '../known-entities';
import { getPhishingEntry } from '../known-phishing';
import { getAddressIndexChecked } from '../scam-db';
import {
  queryChainabuse,
  shouldQueryChainabuse,
  reserveChainabuseCall,
} from './chainabuse';
import { queryGoPlus } from './goplus';
import { checkOfac } from './ofac';
import { getFromCache, saveToCache } from './cache';
import type { AddressLabel, AddressLabelResponse, LabelCategory, SourceCheck, SourceName } from './types';
import { LABELS_SCHEMA } from './types';

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

/** The summary flags of a response, derived from its labels. */
function flagsOf(labels: AddressLabel[]) {
  return {
    hasPhishingFlag: labels.some((l) => l.category === 'phishing'),
    hasSanctionsFlag: labels.some((l) => l.category === 'sanctions'),
    hasScamFlag: labels.some((l) => l.category === 'scam' || l.category === 'phishing'),
    isKycExchange: labels.some((l) => l.category === 'cex'),
    highestConfidence: labels.reduce((m, l) => Math.max(m, l.confidence), 0),
  };
}

/**
 * A cached response with its OFAC answer replaced by the answer of the list as it is NOW.
 *
 * OFAC is never served from the cache (audit F9, review of package 63). A cached "not listed"
 * came from the list of the day it was written; served for 7 days it outlived the list's own
 * maximum age, and missed an address sanctioned since. The check is a lookup in a list this
 * process already holds, so repeating it costs nothing and spends no quota.
 *
 * "The list as it is now" means the copy this process holds: it is reloaded from S3 at most
 * every 24 hours (ofac.ts, MEM_TTL_MS), so an address added by a refresh shows up here within
 * a day of that refresh, not at once.
 *
 *   not listed, list fresh      → no_match (as cached);
 *   not listed, list too old    → ofac `unavailable`, result incomplete (the cache keeps its entry);
 *   listed now, was not         → the sanctions label is added;
 *   listed before               → stays listed while the list cannot confirm otherwise;
 *   was listed, is not any more → null: the other sources were skipped because of that listing,
 *                                 so everything is looked up again.
 */
async function withCurrentOfac(cached: AddressLabelResponse, address: string): Promise<AddressLabelResponse | null> {
  const sources = cached.sources!;
  const wasListed = sources.ofac.status === 'match';
  let ofac: AddressLabel | null;
  try {
    ofac = await checkOfac(address);
  } catch (e: any) {
    if (wasListed) return cached;
    console.warn('[federation] ofac not confirmed for a cached result:', e?.message || e);
    return {
      ...cached,
      sources: { ...sources, ofac: { status: 'unavailable', reason: String(e?.name || 'error') } },
      hadExternalSourceFailure: true,
    };
  }
  if (!!ofac === wasListed) return cached;
  if (!ofac) return null;
  const labels = [...cached.labels.filter((l) => l.source !== 'ofac'), ofac];
  return { ...cached, labels, ...flagsOf(labels), sources: { ...sources, ofac: { status: 'match' } } };
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

  // 1. Cache lookup. Everything but OFAC is served from it; see withCurrentOfac.
  const cached = await getFromCache(normalized, network);
  const current = cached ? await withCurrentOfac(cached, normalized) : null;
  if (current) {
    console.log(JSON.stringify({
      event: 'address_labels_federation',
      address: normalized,
      network,
      cache_hit: true,
      ofac: current.sources?.ofac,
      total_labels: current.labels.length,
      duration_ms: Date.now() - start,
    }));
    return current;
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
    getAddressIndexChecked(normalized),
    checkOfac(normalized),
    queryGoPlus(normalized, network),
  ]);

  const failure = (index: number, name: string): SourceCheck => {
    const reason = (phaseA[index] as PromiseRejectedResult).reason;
    console.warn(`[federation] ${name} rejected:`, reason?.message || reason);
    return { status: 'unavailable', reason: String(reason?.name || 'error') };
  };

  const scamDbLookup = phaseA[0].status === 'fulfilled' ? phaseA[0].value : null;
  const scamDbResult = scamDbLookup?.index ?? null;
  const ofacResult = phaseA[1].status === 'fulfilled' ? phaseA[1].value : null;
  const goplus = phaseA[2].status === 'fulfilled' ? phaseA[2].value : null;
  const scamDbMatched = !!scamDbResult && scamDbResult.platforms.length > 0;

  // The address index was read, but a report it names was not: what was read may show a match,
  // but it cannot show that there is none.
  const scamDbPartial = scamDbMatched && scamDbLookup!.failedReads > 0;
  const scamDbCheck = (): SourceCheck => {
    // A match stays a match; with unread reports its counts are a lower bound.
    if (scamDbMatched) return scamDbPartial ? { status: 'match', reason: 'incomplete_read', partial: true } : { status: 'match' };
    if (scamDbLookup!.failedReads > 0) {
      console.warn(`[federation] scam_db: ${scamDbLookup!.failedReads} report read(s) failed for ${normalized}`);
      return { status: 'unavailable', reason: 'incomplete_read' };
    }
    return { status: 'no_match' };
  };

  // What each source answered. Only `no_match` means the source has nothing on the address.
  const sources: Record<SourceName, SourceCheck> = {
    scam_db: phaseA[0].status === 'rejected' ? failure(0, 'scam_db') : scamDbCheck(),
    ofac: phaseA[1].status === 'rejected' ? failure(1, 'ofac') : { status: ofacResult ? 'match' : 'no_match' },
    goplus: phaseA[2].status === 'rejected' ? failure(2, 'goplus') : { status: goplus!.status, ...(goplus!.reason ? { reason: goplus!.reason } : {}) },
    chainabuse: { status: 'skipped', reason: 'not_reached' },
  };

  if (scamDbMatched) {
    labels.push({
      source: 'ledgerhound_scam_db',
      tag: scamDbResult!.platformNames.join(', '),
      category: 'scam',
      confidence: 0.85,
      reportCount: scamDbResult!.reports.length,
      ...(scamDbPartial ? { countIncomplete: true } : {}),
      notes: scamDbResult!.totalLoss > 0
        ? `${scamDbPartial ? 'at least ' : ''}$${scamDbResult!.totalLoss.toLocaleString()} reported losses`
        : undefined,
    });
  }
  if (ofacResult) labels.push(ofacResult);
  if (goplus?.label) labels.push(goplus.label);

  // ── 3. Phase B: gated Chainabuse call ────────────────────────────────
  // We only spend monthly quota when no other source has already flagged
  // or whitelisted the address. See shouldQueryChainabuse() for the rules.
  // The quota itself is decided by the reservation, not here: reading the
  // counter and writing it after the call let parallel lookups overspend it.
  const decision = shouldQueryChainabuse({
    address: normalized,
    knownEntity: known,
    isKnownPhishing: !!phishing,
    scamDbMatch: scamDbMatched ? scamDbResult : null,
    ofacMatch: ofacResult,
    monthlyCallsUsed: 0,
    hasApiKey: !!process.env.CHAINABUSE_API_KEY,
  });

  let chainabuseCalled = false;
  let monthlyUsed: number | undefined;

  if (!decision.shouldQuery) {
    sources.chainabuse = { status: 'skipped', reason: decision.reason };
  } else {
    // A slot is reserved BEFORE the call by a conditional write. No slot, no call.
    const slot = await reserveChainabuseCall();
    monthlyUsed = slot.usage?.calls_used;
    if (slot.reserved === false) {
      // Quota spent: the source was not asked. Counter unreadable: we cannot tell whether a call
      // is allowed, so none is made, and the lookup is incomplete (retried by the next one).
      sources.chainabuse = slot.reason === 'rate_limit_reached'
        ? { status: 'skipped', reason: 'rate_limit_reached' }
        : { status: 'unavailable', reason: 'quota_check_failed' };
    } else {
      chainabuseCalled = true;
      let result: SourceCheck & { label?: AddressLabel };
      try {
        result = await queryChainabuse(normalized);
      } catch (e: any) {
        // queryChainabuse reports its own failures; a throw here is unexpected code.
        console.warn('[federation] chainabuse threw:', e?.message || e);
        result = { status: 'unavailable', reason: String(e?.name || 'error') };
      }
      if (result.label) labels.push(result.label);
      // The reserved slot stays spent whatever the call returned: Chainabuse may bill a failed
      // call, and a failing API must not be retried without limit.
      sources.chainabuse = { status: result.status, ...(result.reason ? { reason: result.reason } : {}) };
    }
  }

  console.log(JSON.stringify({
    event: chainabuseCalled ? 'chainabuse_call' : 'chainabuse_skip',
    address: normalized,
    status: sources.chainabuse.status,
    reason: sources.chainabuse.reason,
    monthly_used: monthlyUsed,
  }));

  // A source that could not be read makes the result incomplete, whichever source it is.
  const hadExternalSourceFailure = Object.values(sources).some((check) => check.status === 'unavailable');

  const response: AddressLabelResponse = {
    address: normalized,
    network,
    labels,
    cached_at: new Date().toISOString(),
    ttl_days: TTL_DAYS,
    ...flagsOf(labels),
    hadExternalSourceFailure,
    sources,
    schema: LABELS_SCHEMA,
  };

  // 5. Cache write (best-effort). An incomplete lookup is not cached: the next one asks the
  //    failed source again instead of serving its failure for 7 days as "nothing found". The same
  //    holds for a match read only in part: cached, its short counts would outlive the failure.
  const cacheable = !hadExternalSourceFailure && !Object.values(sources).some((check) => check.partial);
  if (cacheable) await saveToCache(response);

  console.log(JSON.stringify({
    event: 'address_labels_federation',
    address: normalized,
    network,
    cache_hit: false,
    chainabuse_called: chainabuseCalled,
    chainabuse_monthly_used: monthlyUsed,
    sources,
    cached: cacheable,
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
          // The lookup itself crashed: no source can be said to have answered.
          sources: {
            scam_db: { status: 'unavailable', reason: 'federation_error' },
            ofac: { status: 'unavailable', reason: 'federation_error' },
            goplus: { status: 'unavailable', reason: 'federation_error' },
            chainabuse: { status: 'unavailable', reason: 'federation_error' },
          },
          schema: LABELS_SCHEMA,
        };
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, addresses.length) }, () => worker());
  await Promise.all(workers);
  return out;
}

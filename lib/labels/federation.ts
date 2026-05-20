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
import { queryChainabuse } from './chainabuse';
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

  // 2. Local sources (sync, no failure modes)
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

  // 3. Scam-DB (S3-backed local source — can throw on bucket unavailability)
  let scamDbFailed = false;
  try {
    const idx = await getAddressIndex(normalized);
    if (idx && idx.platforms.length > 0) {
      labels.push({
        source: 'ledgerhound_scam_db',
        tag: idx.platformNames.join(', '),
        category: 'scam',
        confidence: 0.85,
        reportCount: idx.reports.length,
        notes: idx.totalLoss > 0 ? `$${idx.totalLoss.toLocaleString()} reported losses` : undefined,
      });
    }
  } catch (e: any) {
    scamDbFailed = true;
    console.warn('[federation] scam-db lookup failed:', e?.message || e);
  }

  // 4. External sources in parallel — none of these can throw out of here.
  const results = await Promise.allSettled([
    queryChainabuse(normalized),
    queryGoPlus(normalized, network),
    checkOfac(normalized),
  ]);

  const sourceNames = ['chainabuse', 'goplus', 'ofac'] as const;
  const sourceSucceeded: Record<string, boolean> = {};
  let externalSourceFailureCount = 0;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const name = sourceNames[i];
    if (r.status === 'fulfilled') {
      sourceSucceeded[name] = true;
      if (r.value) labels.push(r.value);
    } else {
      sourceSucceeded[name] = false;
      externalSourceFailureCount++;
      console.warn(`[federation] ${name} rejected:`, r.reason?.message || r.reason);
    }
  }

  // Treat scam-db failure as a partial external failure for the footnote.
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
    sources_queried: ['chainabuse', 'goplus', 'ofac'],
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

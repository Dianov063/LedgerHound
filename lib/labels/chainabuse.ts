/**
 * Chainabuse API integration — community scam-report lookup.
 *
 * Endpoint:  GET https://api.chainabuse.com/v0/reports?address=<addr>
 * Auth:      Basic auth (API key as username, blank password) — per
 *            https://docs.chainabuse.com/reference/reports-1
 *
 * Rate limits (per Chainabuse docs):
 *   - Standard (free) tier: 10 calls / MONTH. Effectively unusable for
 *     forensic workflows — we expect the env-configured key to be on a
 *     Partner tier (5000/h).
 *   - Per-call result cap: 50 reports.
 *
 * Failure modes (all return null — graceful degradation):
 *   - CHAINABUSE_API_KEY not set → skip entirely
 *   - HTTP 401/403 → log warning, return null (key wrong or quota exceeded)
 *   - HTTP 429 → log warning, return null (rate limited)
 *   - HTTP 5xx / timeout → log warning, return null
 *
 * 2026-05-20: Phase 1 federation.
 */

import type { AddressLabel, LabelCategory } from './types';

const ENDPOINT = 'https://api.chainabuse.com/v0/reports';
const TIMEOUT_MS = 8000;

function buildAuthHeader(apiKey: string): string {
  // Basic Auth: base64("<key>:") — empty password is conventional for
  // API-key-as-username schemes.
  const encoded = Buffer.from(`${apiKey}:`).toString('base64');
  return `Basic ${encoded}`;
}

function mapChainabuseCategory(cat: string | undefined): LabelCategory {
  if (!cat) return 'scam';
  const lower = cat.toLowerCase();
  if (lower.includes('phishing')) return 'phishing';
  if (lower.includes('sanction')) return 'sanctions';
  if (lower.includes('mixer') || lower.includes('tumbler')) return 'mixer';
  return 'scam';
}

function mostCommon<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  const counts = new Map<T, number>();
  for (const item of arr) counts.set(item, (counts.get(item) || 0) + 1);
  let max = 0;
  let result: T | undefined;
  for (const entry of Array.from(counts.entries())) {
    if (entry[1] > max) {
      max = entry[1];
      result = entry[0];
    }
  }
  return result;
}

/**
 * Query Chainabuse for community reports on a single address.
 * Returns null on any failure or when no reports exist.
 */
export async function queryChainabuse(address: string): Promise<AddressLabel | null> {
  const apiKey = process.env.CHAINABUSE_API_KEY;
  if (!apiKey) {
    // Not an error — federation is meant to degrade gracefully without keys.
    return null;
  }

  const url = `${ENDPOINT}?address=${encodeURIComponent(address)}&perPage=50`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: buildAuthHeader(apiKey),
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e: any) {
    const isTimeout = e?.name === 'TimeoutError' || e?.name === 'AbortError';
    console.warn(`[chainabuse] ${isTimeout ? 'timeout' : 'fetch error'} for ${address}: ${e?.message}`);
    return null;
  }

  if (res.status === 404) return null; // no reports
  if (res.status === 401 || res.status === 403) {
    console.warn(`[chainabuse] auth failure ${res.status} — check CHAINABUSE_API_KEY`);
    return null;
  }
  if (res.status === 429) {
    console.warn('[chainabuse] rate limit (429) — consider Partner tier');
    return null;
  }
  if (!res.ok) {
    console.warn(`[chainabuse] HTTP ${res.status} for ${address}`);
    return null;
  }

  let data: any;
  try {
    data = await res.json();
  } catch (e: any) {
    console.warn(`[chainabuse] JSON parse failure for ${address}: ${e?.message}`);
    return null;
  }

  // Chainabuse response shape: { reports: [...], pagination: {...} } OR a
  // flat array. Be defensive.
  const reports: any[] = Array.isArray(data?.reports)
    ? data.reports
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];

  if (reports.length === 0) return null;

  const categories = reports.map((r) => r?.scamCategory || r?.category).filter(Boolean) as string[];
  const primary = mostCommon(categories);
  const category = mapChainabuseCategory(primary);

  // Confidence scales with report count, capped at 0.95.
  const confidence = Math.min(0.95, 0.5 + reports.length * 0.05);

  return {
    source: 'chainabuse',
    tag: `${reports.length} community report${reports.length > 1 ? 's' : ''} — ${primary || 'scam'}`,
    category,
    confidence,
    reportCount: reports.length,
    url: `https://www.chainabuse.com/address/${address}`,
    verifiedAt: new Date().toISOString().split('T')[0],
  };
}

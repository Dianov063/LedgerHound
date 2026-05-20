/**
 * GoPlus Security — free public address-risk API.
 *
 * Endpoint:  GET https://api.gopluslabs.io/api/v1/address_security/<addr>?chain_id=<id>
 * Auth:      none for public tier
 * Rate:      generous public limit (Promise.all'd with other sources is fine)
 *
 * Maps the risk flags GoPlus returns into our LabelCategory taxonomy.
 * EVM-only — non-EVM networks (BTC, SOL, TRON) → return null.
 *
 * 2026-05-20: Phase 1 federation.
 */

import type { AddressLabel, LabelCategory } from './types';

const TIMEOUT_MS = 8000;

const CHAIN_IDS: Record<string, string> = {
  eth: '1',
  bnb: '56',
  polygon: '137',
  arb: '42161',
  arbitrum: '42161',
  op: '10',
  optimism: '10',
  base: '8453',
  avax: '43114',
  avalanche: '43114',
  linea: '59144',
};

export async function queryGoPlus(address: string, network: string): Promise<AddressLabel | null> {
  const chainId = CHAIN_IDS[network.toLowerCase()];
  if (!chainId) return null; // non-EVM or unsupported

  const url = `https://api.gopluslabs.io/api/v1/address_security/${address}?chain_id=${chainId}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e: any) {
    const isTimeout = e?.name === 'TimeoutError' || e?.name === 'AbortError';
    console.warn(`[goplus] ${isTimeout ? 'timeout' : 'fetch error'} for ${address}: ${e?.message}`);
    return null;
  }

  if (!res.ok) {
    if (res.status !== 404) console.warn(`[goplus] HTTP ${res.status} for ${address}`);
    return null;
  }

  let data: any;
  try {
    data = await res.json();
  } catch (e: any) {
    console.warn(`[goplus] JSON parse failure for ${address}: ${e?.message}`);
    return null;
  }

  // GoPlus convention: code: 1 = success, result holds the flags ("1"/"0" strings).
  if (data?.code !== 1 || !data?.result) return null;
  const r = data.result;

  const flags: string[] = [];
  if (r.phishing_activities === '1') flags.push('phishing');
  if (r.fake_kyc === '1') flags.push('fake KYC');
  if (r.fake_standard_interface === '1') flags.push('fake standard interface');
  if (r.malicious_mining_activities === '1') flags.push('malicious mining');
  if (r.blacklist_doubt === '1') flags.push('blacklisted');
  if (r.honeypot_related_address === '1') flags.push('honeypot related');
  if (r.blackmail_activities === '1') flags.push('blackmail');
  if (r.stealing_attack === '1') flags.push('stealing attack');
  if (r.sanctioned === '1') flags.push('sanctioned');
  if (r.darkweb_transactions === '1') flags.push('darkweb');
  if (r.money_laundering === '1') flags.push('money laundering');

  if (flags.length === 0) return null;

  const category: LabelCategory = flags.includes('sanctioned')
    ? 'sanctions'
    : flags.includes('phishing')
      ? 'phishing'
      : 'scam';

  return {
    source: 'goplus',
    tag: `GoPlus risk: ${flags.join(', ')}`,
    category,
    confidence: 0.8,
    url: `https://gopluslabs.io/token-security/${chainId}/${address}`,
    verifiedAt: new Date().toISOString().split('T')[0],
  };
}

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

import type { LabelCategory, SourceResult } from './types';

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

/**
 * The risk flags of the address_security answer ("1"/"0" strings), as documented at
 * docs.gopluslabs.io/reference/response-details-1 (read 2026-11-17), with the name shown in the
 * label. `contract_address` and `reinit` describe the contract and are not risk flags. The last
 * five were not read before: an address GoPlus marked only with one of them counted as clean.
 */
const RISK_FLAGS: readonly (readonly [field: string, name: string])[] = [
  ['phishing_activities', 'phishing'],
  ['fake_kyc', 'fake KYC'],
  ['fake_standard_interface', 'fake standard interface'],
  ['malicious_mining_activities', 'malicious mining'],
  ['blacklist_doubt', 'blacklisted'],
  ['honeypot_related_address', 'honeypot related'],
  ['blackmail_activities', 'blackmail'],
  ['stealing_attack', 'stealing attack'],
  ['sanctioned', 'sanctioned'],
  ['darkweb_transactions', 'darkweb'],
  ['money_laundering', 'money laundering'],
  ['cybercrime', 'cybercrime'],
  ['financial_crime', 'financial crime'],
  ['mixer', 'mixer'],
  ['gas_abuse', 'gas abuse'],
  ['fake_token', 'fake token'],
];

/**
 * The answer always says what happened (audit F9): a failed call is `unavailable`, never
 * "no risk flags".
 *   match        GoPlus reports at least one risk flag (with the label);
 *   no_match     GoPlus answered (code 1) with flag data and every risk flag is "0";
 *   unavailable  the call failed, GoPlus answered with an error code, or the answer carries
 *                no flag data we recognize (`reason`);
 *   skipped      the network is not one GoPlus covers (EVM only), so no call was made.
 */
export async function queryGoPlus(address: string, network: string): Promise<SourceResult> {
  const chainId = CHAIN_IDS[network.toLowerCase()];
  if (!chainId) return { status: 'skipped', reason: 'unsupported_network' }; // non-EVM or unsupported

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
    return { status: 'unavailable', reason: isTimeout ? 'timeout' : 'network_error' };
  }

  if (!res.ok) {
    console.warn(`[goplus] HTTP ${res.status} for ${address}`);
    return { status: 'unavailable', reason: `http_${res.status}` };
  }

  let data: any;
  try {
    data = await res.json();
  } catch (e: any) {
    console.warn(`[goplus] JSON parse failure for ${address}: ${e?.message}`);
    return { status: 'unavailable', reason: 'invalid_json' };
  }

  // GoPlus convention: code: 1 = success, result holds the flags ("1"/"0" strings).
  // Any other code (rate limit, internal error) is not an answer about the address.
  if (data?.code !== 1 || !data?.result || typeof data.result !== 'object') {
    console.warn(`[goplus] error answer for ${address}: code ${data?.code}`);
    return { status: 'unavailable', reason: `code_${data?.code ?? 'missing'}` };
  }
  const r = data.result;

  // "No flags" is a result only when the answer carries flag data: `result: {}`, `result: []`
  // or an object with other fields says nothing about the address (review of package 63).
  // (An array has none of these fields either, so `[]` and `[{...}]` fail the same test.)
  const answered = RISK_FLAGS.some(([field]) => r[field] === '0' || r[field] === '1');
  if (!answered) {
    console.warn(`[goplus] answer without flag data for ${address}`);
    return { status: 'unavailable', reason: Array.isArray(r) || Object.keys(r).length === 0 ? 'empty_result' : 'unrecognized_result' };
  }

  const flags: string[] = RISK_FLAGS.filter(([field]) => r[field] === '1').map(([, name]) => name);
  const created = Number(r.number_of_malicious_contracts_created);
  if (Number.isFinite(created) && created > 0) flags.push('created malicious contracts');

  if (flags.length === 0) return { status: 'no_match' };

  const category: LabelCategory = flags.includes('sanctioned')
    ? 'sanctions'
    : flags.includes('phishing')
      ? 'phishing'
      : flags.length === 1 && flags[0] === 'mixer'
        ? 'mixer'
        : 'scam';

  return {
    status: 'match',
    label: {
      source: 'goplus',
      tag: `GoPlus risk: ${flags.join(', ')}`,
      category,
      confidence: 0.8,
      url: `https://gopluslabs.io/token-security/${chainId}/${address}`,
      verifiedAt: new Date().toISOString().split('T')[0],
    },
  };
}

/**
 * Scam-database cross-reference of the paid report's counterparties (audit F9).
 *
 * Before, a lookup that failed was skipped in silence, and the report then read as if no
 * counterparty were in the database. Failed lookups are now counted, and the evidence line says
 * so instead of printing a negative result.
 */
import { getAddressIndexChecked } from './scam-db';
import type { ScamDbMatch } from './generateReport';

export interface ScamDbCrossReference {
  /** Counterparties found in the database, in the order of the input. */
  matches: ScamDbMatch[];
  /** Addresses looked up. */
  checked: number;
  /**
   * Addresses with no match whose lookup did not complete: the address index, or a report it
   * names, could not be read. For these "not in the database" is not known.
   */
  failed: number;
}

export async function crossReferenceScamDb(addresses: string[]): Promise<ScamDbCrossReference> {
  const results = await Promise.all(addresses.map(async (address): Promise<ScamDbMatch | 'failed' | null> => {
    try {
      const { index, failedReads } = await getAddressIndexChecked(address);
      if (index && index.platforms.length > 0) {
        return {
          address,
          platformNames: index.platformNames,
          platformSlugs: index.platforms,
          totalLoss: index.totalLoss,
          reports: index.reports.length,
          // The match is confirmed; with unread report files its counts are a lower bound.
          ...(failedReads > 0 ? { incomplete: true } : {}),
        };
      }
      return failedReads > 0 ? 'failed' : null;
    } catch {
      return 'failed';
    }
  }));
  return {
    matches: results.filter((r): r is ScamDbMatch => !!r && r !== 'failed'),
    checked: addresses.length,
    failed: results.filter((r) => r === 'failed').length,
  };
}

export interface ScamDbEvidenceStrings {
  counterpartyScamDb: (n: number) => string;
  counterpartyScamDbGeneric: string;
  scamDbMatch: string;
  scamDbIncomplete: (failed: number, checked: number) => string;
}

/**
 * The scam-database line of the evidence list. Met when a match exists (wording differs by the
 * wallet's role). Not met with failed lookups: the line says the check is incomplete, because
 * the plain unmet line would read as "no counterparty is in the database".
 */
export function scamDbEvidenceFactor(input: {
  isVictimRole: boolean;
  /** Matches among counterparties (the subject address excluded). */
  counterpartyMatches: number;
  /** All matches, the subject included. */
  totalMatches: number;
  check: Pick<ScamDbCrossReference, 'checked' | 'failed'>;
  strings: ScamDbEvidenceStrings;
}): { label: string; met: boolean; severity?: 'unverified' } {
  const { isVictimRole, counterpartyMatches, totalMatches, check, strings } = input;
  const met = isVictimRole ? counterpartyMatches > 0 : totalMatches > 0;
  if (!met && check.failed > 0) {
    return { label: strings.scamDbIncomplete(check.failed, check.checked), met: false, severity: 'unverified' };
  }
  if (!isVictimRole) return { label: strings.scamDbMatch, met };
  return { label: met ? strings.counterpartyScamDb(counterpartyMatches) : strings.counterpartyScamDbGeneric, met };
}

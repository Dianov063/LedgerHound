/**
 * Source coverage of a federation result (audit F9).
 *
 * "No label from a source" is a negative result only when the source answered. This module
 * says, per address and per report, which sources did not answer and why, so the paid report
 * can state it instead of printing "no matches".
 */
import type { AddressLabelResponse, SourceCheck, SourceName } from './types';
import { SOURCE_NAMES } from './types';

/** Skip reasons that mean "another source had already identified the address": nothing is missing. */
const NOT_NEEDED = new Set(['cex_whitelisted', 'mixer_known', 'sanctions_known', 'known_phishing', 'scam_db_match', 'ofac_match']);

export type CoverageKind = 'checked' | 'unavailable' | 'not_consulted' | 'not_needed';

/**
 * checked        the source answered (match or no match);
 * unavailable    the source failed;
 * not_consulted  the source was not asked although nothing else had identified the address
 *                (no API key, monthly quota reached, network not supported): a gap;
 * not_needed     the source was not asked because another source had already identified the address.
 * A response without `sources` (older format) counts as unavailable when it carries the
 * failure flag, otherwise as checked, which is all the old format can say.
 */
export function coverageOf(check: SourceCheck | undefined, legacyFailure = false): CoverageKind {
  if (!check) return legacyFailure ? 'unavailable' : 'checked';
  if (check.status === 'unavailable') return 'unavailable';
  if (check.status === 'skipped') return NOT_NEEDED.has(check.reason || '') ? 'not_needed' : 'not_consulted';
  return 'checked';
}

/** Sources whose silence about this address is NOT a negative result. */
export function uncheckedSources(response: AddressLabelResponse): SourceName[] {
  return SOURCE_NAMES.filter((name) => {
    const kind = coverageOf(response.sources?.[name], response.hadExternalSourceFailure && !response.sources);
    return kind === 'unavailable' || kind === 'not_consulted';
  });
}

export interface SourceCoverage {
  /** Addresses analyzed. */
  analyzed: number;
  bySource: Record<SourceName, { checked: number; unavailable: number; notConsulted: number; notNeeded: number }>;
  /** Sources that failed for at least one address. */
  unavailableSources: SourceName[];
  /** Sources that were not asked for at least one address that nothing else had identified. */
  notConsultedSources: SourceName[];
}

export function summarizeCoverage(responses: AddressLabelResponse[]): SourceCoverage {
  const bySource = Object.fromEntries(
    SOURCE_NAMES.map((name) => [name, { checked: 0, unavailable: 0, notConsulted: 0, notNeeded: 0 }]),
  ) as SourceCoverage['bySource'];
  for (const response of responses) {
    for (const name of SOURCE_NAMES) {
      const kind = coverageOf(response.sources?.[name], response.hadExternalSourceFailure && !response.sources);
      if (kind === 'checked') bySource[name].checked++;
      else if (kind === 'unavailable') bySource[name].unavailable++;
      else if (kind === 'not_consulted') bySource[name].notConsulted++;
      else bySource[name].notNeeded++;
    }
  }
  return {
    analyzed: responses.length,
    bySource,
    unavailableSources: SOURCE_NAMES.filter((name) => bySource[name].unavailable > 0),
    notConsultedSources: SOURCE_NAMES.filter((name) => bySource[name].notConsulted > 0),
  };
}

/**
 * Behavioral Scam Pattern Detection
 *
 * Analyzes HOW a wallet behaves, not just whether it's in a database.
 * Used by generateReport.ts to add a "Behavioral Pattern Analysis" section to the PDF.
 */

export interface ScamPattern {
  name: string;
  confidence: number; // 0-100
  evidence: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PatternAnalysis {
  patterns: ScamPattern[];
  overallRisk: 'CLEAN' | 'SUSPICIOUS' | 'LIKELY_SCAM' | 'CONFIRMED_SCAM';
  interpretation: string;
}

interface TxInput {
  date: string;
  direction: 'IN' | 'OUT';
  from: string;
  to: string;
  value: number;
  token: string;
}

interface EntityInput {
  address: string;
  label: string;
  type: string;
  interactions: number;
}

/* ──────────────────────────────────────────────
   Pattern 1: Rapid Forwarding (Scam Funnel)
   Funds arrive and leave within 24h — classic transit wallet
   ────────────────────────────────────────────── */
function detectRapidForwarding(transactions: TxInput[]): ScamPattern | null {
  const inTxs = transactions.filter(tx => tx.direction === 'IN' && tx.date && tx.date !== 'N/A');
  const outTxs = transactions.filter(tx => tx.direction === 'OUT' && tx.date && tx.date !== 'N/A');

  if (inTxs.length < 2 || outTxs.length < 1) return null;

  let rapidForwardCount = 0;

  for (const inTx of inTxs) {
    const inTime = new Date(inTx.date).getTime();
    if (isNaN(inTime)) continue;

    const matchingOut = outTxs.find(outTx => {
      const outTime = new Date(outTx.date).getTime();
      if (isNaN(outTime)) return false;
      const hoursDiff = (outTime - inTime) / (1000 * 60 * 60);
      return hoursDiff >= 0 && hoursDiff < 24;
    });
    if (matchingOut) rapidForwardCount++;
  }

  const rapidForwardPercent = (rapidForwardCount / inTxs.length) * 100;

  if (rapidForwardPercent > 60) {
    return {
      name: 'Rapid Forwarding (Scam Funnel)',
      confidence: Math.min(Math.round(rapidForwardPercent), 95),
      evidence: [
        `${Math.round(rapidForwardPercent)}% of incoming funds forwarded within 24 hours`,
        `${rapidForwardCount} of ${inTxs.length} deposits show pass-through behavior`,
        'Wallet acts as transit point, not final destination',
      ],
      severity: rapidForwardPercent > 85 ? 'CRITICAL' : 'HIGH',
    };
  }
  return null;
}

/* ──────────────────────────────────────────────
   Pattern 2: Aggregation Wallet (Victim Collector)
   Many different senders, few outgoing destinations
   ────────────────────────────────────────────── */
function detectAggregation(transactions: TxInput[]): ScamPattern | null {
  const inTxs = transactions.filter(tx => tx.direction === 'IN');
  const outTxs = transactions.filter(tx => tx.direction === 'OUT');
  const uniqueSenders = new Set(inTxs.map(tx => tx.from.toLowerCase())).size;
  const uniqueRecipients = new Set(outTxs.map(tx => tx.to.toLowerCase())).size;

  if (uniqueSenders >= 5 && inTxs.length >= 8 && uniqueRecipients <= 3) {
    return {
      name: 'Aggregation Wallet (Victim Collector)',
      confidence: Math.min(65 + uniqueSenders * 2, 95),
      evidence: [
        `${uniqueSenders} unique senders (potential victims)`,
        `${inTxs.length} incoming vs ${outTxs.length} outgoing transactions`,
        `Funds consolidated to only ${uniqueRecipients} destination(s)`,
      ],
      severity: uniqueSenders > 15 ? 'CRITICAL' : 'HIGH',
    };
  }
  return null;
}

/* ──────────────────────────────────────────────
   Pattern 3: Pig Butchering / Romance Scam
   Gradual deposits over time, then large single withdrawal
   ────────────────────────────────────────────── */
function detectPigButchering(transactions: TxInput[]): ScamPattern | null {
  const inTxs = transactions
    .filter(tx => tx.direction === 'IN' && tx.date && tx.date !== 'N/A')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const outTxs = transactions.filter(tx => tx.direction === 'OUT');

  if (inTxs.length < 3) return null;

  const firstIn = new Date(inTxs[0].date).getTime();
  const lastIn = new Date(inTxs[inTxs.length - 1].date).getTime();
  if (isNaN(firstIn) || isNaN(lastIn)) return null;

  const daysBetween = (lastIn - firstIn) / (1000 * 60 * 60 * 24);

  // Multiple deposits over 7+ days
  if (daysBetween >= 7 && inTxs.length >= 3) {
    const totalIn = inTxs.reduce((sum, tx) => sum + (tx.value || 0), 0);
    const largestOut = outTxs.reduce((max, tx) => Math.max(max, tx.value || 0), 0);

    // Large withdrawal is 60%+ of total deposits
    if (totalIn > 0 && largestOut >= totalIn * 0.6) {
      return {
        name: 'Pig Butchering Pattern',
        confidence: Math.min(70 + Math.round(daysBetween / 5), 90),
        evidence: [
          `${inTxs.length} deposits over ${Math.round(daysBetween)} days (gradual "investment")`,
          `Largest outflow = ${Math.round((largestOut / totalIn) * 100)}% of total deposited funds`,
          'Pattern consistent with romance or investment scam',
        ],
        severity: 'HIGH',
      };
    }
  }
  return null;
}

/* ──────────────────────────────────────────────
   Pattern 4: Dusting & Spam Activity
   Many micro-transactions or spam tokens
   ────────────────────────────────────────────── */
function detectDusting(transactions: TxInput[], spamTokenCount: number): ScamPattern | null {
  const microTxs = transactions.filter(tx => tx.value < 0.001);
  const microPercent = transactions.length > 0 ? (microTxs.length / transactions.length) * 100 : 0;

  if (spamTokenCount > 15 || microPercent > 50) {
    return {
      name: 'Dusting / Spam Activity',
      confidence: Math.min(45 + spamTokenCount, 85),
      evidence: [
        `${spamTokenCount} spam/airdrop tokens detected`,
        `${Math.round(microPercent)}% micro-transactions (dust)`,
        'May indicate phishing targets or address poisoning attempts',
      ],
      severity: spamTokenCount > 30 ? 'MEDIUM' : 'LOW',
    };
  }
  return null;
}

/* ──────────────────────────────────────────────
   Pattern 5: Mixer / Tumbler Usage
   Already detected via entity identification
   ────────────────────────────────────────────── */
function detectMixerUsage(entities: EntityInput[]): ScamPattern | null {
  const mixers = entities.filter(e => e.type === 'mixer');

  if (mixers.length > 0) {
    return {
      name: 'Mixer / Tumbler Usage',
      confidence: 95,
      evidence: [
        `Interaction with ${mixers.length} known mixer(s)`,
        ...mixers.map(m => `${m.label} (${m.interactions} interaction${m.interactions > 1 ? 's' : ''})`),
        'Mixers are commonly used to launder stolen funds',
      ],
      severity: 'CRITICAL',
    };
  }
  return null;
}

/* ──────────────────────────────────────────────
   Pattern 6: Round-Number Transfers
   Many transfers in round amounts (exactly 1000, 5000, etc.)
   ────────────────────────────────────────────── */
function detectRoundNumberTransfers(transactions: TxInput[]): ScamPattern | null {
  const significantTxs = transactions.filter(tx => tx.value >= 1);
  if (significantTxs.length < 3) return null;

  const roundCount = significantTxs.filter(tx => {
    const v = tx.value;
    return v === Math.round(v) && v >= 10; // exact integers >= 10
  }).length;

  const roundPercent = (roundCount / significantTxs.length) * 100;

  if (roundPercent > 60 && roundCount >= 3) {
    return {
      name: 'Round-Number Transfers',
      confidence: Math.min(50 + Math.round(roundPercent / 2), 80),
      evidence: [
        `${roundCount} of ${significantTxs.length} transfers are exact round numbers`,
        `${Math.round(roundPercent)}% round-number rate (typical scams use round amounts)`,
        'Organic transfers rarely consist of exact round numbers',
      ],
      severity: 'MEDIUM',
    };
  }
  return null;
}

/* ──────────────────────────────────────────────
   Main Analyzer
   ────────────────────────────────────────────── */
export function analyzeScamPatterns(
  transactions: TxInput[],
  entities: EntityInput[],
  spamTokenCount: number,
): PatternAnalysis {
  const patterns: ScamPattern[] = [];

  const rapidForward = detectRapidForwarding(transactions);
  if (rapidForward) patterns.push(rapidForward);

  const aggregation = detectAggregation(transactions);
  if (aggregation) patterns.push(aggregation);

  const pigButchering = detectPigButchering(transactions);
  if (pigButchering) patterns.push(pigButchering);

  const dusting = detectDusting(transactions, spamTokenCount);
  if (dusting) patterns.push(dusting);

  const mixer = detectMixerUsage(entities);
  if (mixer) patterns.push(mixer);

  const roundNumbers = detectRoundNumberTransfers(transactions);
  if (roundNumbers) patterns.push(roundNumbers);

  // Sort by severity: CRITICAL > HIGH > MEDIUM > LOW
  const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  patterns.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));

  // Calculate overall risk
  const criticalCount = patterns.filter(p => p.severity === 'CRITICAL').length;
  const highCount = patterns.filter(p => p.severity === 'HIGH').length;

  let overallRisk: PatternAnalysis['overallRisk'] = 'CLEAN';
  if (criticalCount > 0) overallRisk = 'CONFIRMED_SCAM';
  else if (highCount >= 2) overallRisk = 'LIKELY_SCAM';
  else if (highCount === 1 || patterns.length >= 2) overallRisk = 'SUSPICIOUS';

  let interpretation: string;
  switch (overallRisk) {
    case 'CONFIRMED_SCAM':
      interpretation = 'Critical scam indicators present. This wallet exhibits behavior strongly associated with fraud or money laundering. Immediate legal action recommended.';
      break;
    case 'LIKELY_SCAM':
      interpretation = 'Multiple high-risk patterns detected. Wallet behavior is consistent with scam operations. Full forensic investigation strongly recommended.';
      break;
    case 'SUSPICIOUS':
      interpretation = 'Some behavioral patterns warrant further investigation. Not conclusive, but monitoring and deeper analysis recommended.';
      break;
    default:
      interpretation = 'No suspicious behavioral patterns detected in automated analysis. Wallet activity appears normal. Note: this does not guarantee legitimacy — manual review may still be warranted.';
  }

  return { patterns, overallRisk, interpretation };
}

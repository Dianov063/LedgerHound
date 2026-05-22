/**
 * Forensic Report internationalization (Phase 3).
 *
 * SEPARATE from the UI's next-intl setup. next-intl's `getTranslations` reads
 * the locale from the *request* context — but reports are rendered in a
 * background task (Stripe webhook → waitUntil), where there is no user request
 * context. So we use a self-contained translation table keyed by locale, the
 * same proven pattern as lib/legal-packs/pdf-i18n.ts.
 *
 * Spanish here is LATAM Spanish (Peru-friendly): "ustedes" not "vosotros",
 * "computadora"/"celular", Peru government terminology (PNP, DIVINDAT, DNI).
 *
 * 2026-05-21: Phase 3 Part 1 — infrastructure + structural strings. Body-text
 * strings are migrated in Part 2.
 */

export type ReportLocale = 'en' | 'es';
export const SUPPORTED_REPORT_LOCALES: ReportLocale[] = ['en', 'es'];

export function isSupportedReportLocale(x: string | undefined | null): x is ReportLocale {
  return x === 'en' || x === 'es';
}

/**
 * Translation shape. Part 1 covers cover page, footer, all page section
 * titles, and the Recovery Readiness hero. Part 2 extends this interface
 * with body-paragraph keys. Keep keys namespaced by area.
 */
export interface ReportTranslations {
  locale: ReportLocale;
  common: {
    confidential: string;     // footer left
    pageOf: (n: number, total: number) => string; // "Page X of Y" / "Página X de Y"
    caseId: string;
    date: string;
    generatedBy: string;
  };
  cover: {
    line1: string;            // "FORENSIC WALLET"
    line2: string;            // "ANALYSIS REPORT"
    walletAddress: string;
    date: string;
    caseId: string;
    premium: string;
    confidential: string;     // "CONFIDENTIAL — For Legal Use"
    generatedBy: string;
  };
  /** Risk severity enum labels (data-driven values mapped at display). */
  riskLabels: {
    CRITICAL: string;
    HIGH: string;
    MODERATE: string;
    LOW: string;
  };
  /** Executive Summary page chrome (static labels). */
  exec: {
    ofacAlertTitle: string;
    ofacAlertBody: string;
    riskScore: string;
    recoveryProbability: string;
    recoveryDisclaimerTitle: string;
    positiveFactors: string;
    negativeFactors: string;
    riskBreakdownTitle: string;
    colFactor: string;
    colScore: string;
    baseline: string;
    rowUnknownWallet: string;
    rowMixer: string;
    rowKycExchange: string;
    rowMultiHop: string;
    rowStablecoin: string;
    rowOfac: string;
    rowScamDb: string;
    totalRiskScore: string;
    scamDbLinked: string;
    scamDbCounterpartyLinked: string;
    reportsLosses: (reports: number, loss: string) => string;
    keyFindings: string;
  };
  /** Recovery Readiness page (content computed in reportPdf, fully localized). */
  readiness: {
    subtitle: string;
    disclaimerNote: string;
    evidencePackageIncluded: string;
    investigationDifficulty: string;
    keyFactors: string;
    howToUseTitle: string;
    howToUse1Bold: string; howToUse1: string;
    howToUse2Bold: string; howToUse2: string;
    howToUse3Bold: string; howToUse3: string;
    howToUse4Bold: string; howToUse4: string;
    // tier labels + descriptions
    tierExcellent: string; tierStrong: string; tierModerate: string; tierLimited: string;
    labelExcellent: string; labelStrong: string; labelModerate: string; labelLimited: string;
    // difficulty tiers + explanations
    diffLow: string; diffMedium: string; diffHigh: string;
    diffLowExpl: string; diffMediumExpl: string; diffHighExpl: string;
    // evidence checklist items
    evOnChain: string;
    evVictimEntry: string;
    evScammerExit: string;
    evScammerExitNot: string;
    evFraudNetwork: string;
    evEtherscanTag: string;
    evPoisoning: string;
    evUnicode: string;
    evVictimClass: string;
    evBehavioral: string;
    evRecoveryProb: string;
    // difficulty factors
    dfKycEntry: string;
    dfEtherscanVerified: string;
    dfCampaignDocumented: string;
    dfMixer: string;
    dfCrossChain: string;
    dfMultiCluster: string;
    dfNoExit: string;
  };
  /** H2 page titles, keyed by a stable id. */
  sections: {
    executiveSummary: string;
    recoveryReadiness: string;
    investigationSummary: string;
    assetSummary: string;
    activityTimeline: string;
    behavioralPatterns: string;
    walletAnalytics: string;
    entityIdentification: string;
    exitPointAnalysis: string;
    crossChainTrace: string;
    addressVerification: string;
    attackTechnique: string;
    fundFlow: string;
    transactionHistory: string;
    recoveryAssessment: string;
    legalRecommendations: string;
    actionableSteps: string;
    disclaimer: string;
    peruResources: string;    // Phase 3 Part 3
  };
  /** Investigation Summary page (Phase 3 Batch 2.1) — chrome + generated prose. */
  investigation: Investigation;
  /** Attack Technique Analysis page (Phase 3 Batch 2.2). */
  attackTechnique: AttackTechnique;
  /** Asset Summary section (Phase 3 Batch 2.3). */
  assetSummary: AssetSummaryT;
  /** Activity Timeline section (Phase 3 Batch 2.3). */
  timeline: TimelineT;
  /** Behavioral Pattern Analysis page (Phase 3 Batch 2.4). */
  behavioral: Behavioral;
  /** Wallet Analytics page (Phase 3 Batch 2.4). */
  analytics: Analytics;
  /** Entity Identification + Exit Point Analysis (Phase 3 Batch 2.5). */
  entityId: EntityId;
  /** Address Verification & External Intelligence (Phase 3 Batch 2.5). */
  addressVerification: AddressVerification;
}

/** Entity Identification + Exit Point Analysis (page 9) translations. */
export interface EntityId {
  noEntities: string;
  colAddress: string;
  colEntity: string;
  colType: string;
  colInteractions: string;
  entityType: (type: string) => string;
  mixerWarningTitle: string;
  mixerWarningBody: string;
  exchangeIdentifiedTitle: string;
  exchangeIdentifiedBody: string;
  exitColDestination: string;
  exitColAmount: string;
  exitColToken: string;
  exitColType: string;
  exitColRecovery: string;
  exitKycTitle: string;
  exitKycBody: string;
  exitMixerTitle: string;
  exitMixerBody: string;
  exitNoneTitle: string;
  exitNoneBody: string;
  noOutflows: string;
  recoveryDiff: (entityType: string) => string;
}

/** Address Verification & External Intelligence (page 10) translations. */
export interface AddressVerification {
  intro: string;
  degradedTitle: string;
  degradedBody: string;
  sourcesSuffix: (n: number) => string;
  noMatches: string;
  reportsSuffix: (n: number) => string;
  confLabel: (pct: number) => string;
  remaining: (n: number) => string;
  methodology: string;
  sourceLabel: (source: string) => string;
}

/** Behavioral Pattern Analysis (page 7) — chrome + generated pattern strings. */
export interface Behavioral {
  introVictim: string;
  introNonVictim: string;
  overallAssessment: string;
  victimPatternBadge: string;
  riskLabel: Record<'CONFIRMED_SCAM' | 'LIKELY_SCAM' | 'SUSPICIOUS' | 'CLEAN', string>;
  victimAssessmentText: string;
  detectedPatterns: (n: number) => string;
  confidence: (pct: number) => string;
  severity: Record<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', string>;
  noPatternsTitle: string;
  noPatternsBody: string;
  methodologyFootnote: string;
  // Pattern detector generated strings
  rapidForwardingName: string;
  rapidForwardingEv: (pct: number, count: number, total: number) => string[];
  aggregationName: string;
  aggregationEv: (senders: number, inCount: number, outCount: number, recipients: number) => string[];
  pigButcheringName: string;
  pigButcheringEv: (deposits: number, days: number, pct: number) => string[];
  dustingName: string;
  dustingEv: (spamCount: number, microPct: number) => string[];
  mixerName: string;
  mixerEvHeader: (count: number) => string;
  mixerEvItem: (label: string, n: number) => string;
  mixerEvFooter: string;
  roundNumbersName: string;
  roundNumbersEv: (roundCount: number, total: number, pct: number) => string[];
  interpretation: Record<'CONFIRMED_SCAM' | 'LIKELY_SCAM' | 'SUSPICIOUS' | 'CLEAN', string>;
}

/** Wallet Analytics (page 8) translations. */
export interface Analytics {
  received: (sym: string) => string;
  sent: (sym: string) => string;
  netFlow: (sym: string) => string;
  transactions: string;
  activePeriod: string;
  uniqueTokens: string;
  topCounterparties: string;
  colAddress: string;
  colEntity: string;
  colInteractions: string;
  colVolume: (sym: string) => string;
  inactiveTitle: (n: number) => string;
  inactiveBody: (lastActivity: string) => string;
}

/** Asset Summary section (page 6) translations. */
export interface AssetSummaryT {
  realAssetsHeader: string;
  colToken: string;
  colTotalIn: string;
  colTotalOut: string;
  colNet: string;
  spamFiltered: (n: number) => string;
  spamNote: string;
  unicodeEvidenceHeader: (n: number) => string;
  mimickingSuffix: (mimics: string, script: string, count: number) => string;
  originalLabel: string;
  codepointsLabel: string;
  displayLabel: string;
  spoofTokensNote: string;
  // Phase 2.7.1 footnote (real loss vs worthless spoof units)
  footnoteNote: string;
  footnoteRealMisdirected: (breakdown: string) => string;
  footnoteSpoofUnits: (breakdown: string) => string;
  footnoteTail: string;
}

/** Activity Timeline section (page 6) translations. */
export interface TimelineT {
  walletFirstActive: string;
  received: (amount: string, token: string, from: string) => string;
  sent: (amount: string, token: string, to: string) => string;
  lastActivity: string;
  keyEventBadge: string;
  misdirectionBadge: string;
  sentToSpoofNote: string;
  totalActivePeriod: (first: string, last: string) => string;
  inactiveSuffix: (n: number) => string;
  noTimeline: string;
}

/** Attack Technique Analysis (pages 11-12) translations. */
export interface AttackTechnique {
  intro: string;
  // ── Address poisoning campaign ──
  poisoningHeader: string;
  poisoningIntro: string;
  vanityCluster: (pattern: string) => string;
  statClusterAddresses: string;
  statRealMisdirections: string;
  statSecondarySpoofs: string;
  realFundsMisdirected: (breakdown: string) => string;
  worthlessSpoofUnits: (breakdown: string) => string;
  unclassifiedUnits: (breakdown: string) => string;
  fakePhishingTagged: (n: number) => string;
  mainCollectorTitle: string;
  mainCollectorRealAmount: (amount: string, token: string) => string;
  mainCollectorSpoofAmount: (amount: string, mimics: string) => string;
  mainCollectorDesc: (desc: string, txCount: number) => string;
  etherscan: (tag: string) => string;
  secondarySpoofsTitle: string;
  secondarySpoofsIntro: string;
  misdirectionConfirmedReal: (amounts: string, txCount: number) => string;
  spoofTokenRouted: (amount: string, mimics: string, scriptName: string | undefined, codepoints: string | undefined, contract: string | undefined) => string;
  /** Localized Unicode script-category name (e.g. "Cyrillic" / "cirílica"). */
  scriptName: (category: string) => string;
  unclassifiedTokenUnits: (amount: string, symbol: string) => string;
  noFundsReceived: (dusted: boolean) => string;
  differsFromMainCollector: (pos: number, a: string, b: string) => string;
  additionalSpoofs: (n: number) => string;
  forensicInterpretationTitle: string;
  forensicInterpretationBody: (pattern: string, count: number) => string;
  methodologyFootnote: string;
  forensicNote: string;
  // ── Unicode spoofing ──
  unicodeHeader: string;
  unicodeIntroPart1: string;
  unicodeIntroPart2: string;
  statUniqueFakeTokens: string;
  statSpoofTransfers: string;
  masqueradingAs: string;
  originalUnicodeLabel: string;
  unicodeLabel: string;
  displayNfcLabel: string;
  scriptLine: (script: string, occurrences: number, addrCount: number) => string;
  combiningMarksNote: string;
  exampleLine: (date: string, addr: string) => string;
  bottomMethodology: string;
}

/**
 * Investigation Summary (page 4) translations. Functions interpolate runtime
 * values; the locale is already fixed by the table the function belongs to.
 * Generated prose (role reasoning, narrative, evidence factors) is built in
 * generateReport.ts via getReportTranslations(locale).
 */
export interface Investigation {
  // ── Chrome (static JSX labels) ──
  howWeClassified: string;
  confidence: (pct: number) => string;
  uniqueSenders: string;
  assetIn: (sym: string) => string;
  assetOut: (sym: string) => string;
  forwarded24h: string;
  fundFlow: string;
  sourceDeposits: (n: number) => string;
  victimsCount: (n: number) => string;
  inclCexDeposits: string;
  victimWalletBadge: string;
  scamWalletBadge: string;
  counterpartyWallets: (n: number) => string;
  receiversCount: (n: number) => string;
  kycExchange: string;
  suspectedScammerCluster: string;
  oneOfManySources: (n: number) => string;
  ifYouSentFunds: string;
  transactionPath: (label: string) => string;
  cashOutSuffix: (exchange: string) => string;
  toLocateTransaction: string;
  locateStep1: string;
  locateStep2: string;
  locateStep3: string;
  evidenceStrengthTitle: string;
  reportSuitabilityTitle: string;
  exchangeKycEntryVsExit: string;
  kycEntryPointLabel: string;
  interactions: (n: number) => string;
  noneDetected: string;
  identifiesVictimAccount: string;
  kycExitPointLabel: string;
  exitNotDetected: string;
  // ── Wallet type labels ──
  walletTypes: Record<
    'victim' | 'aggregator' | 'transit' | 'distributor' | 'exchange_deposit' | 'aggregation' | 'personal' | 'unknown',
    string
  >;
  // ── Role reasoning bullets ──
  roleReasoning: {
    scamDbListed: (platforms: string) => string;
    documentedLosses: (amount: string) => string;
    knownExchange: (label: string) => string;
    knownInfra: (label: string) => string;
    victimKycEntry: (n: number) => string;
    victimForwarded: (n: number) => string;
    victimLimitedHistory: (n: number) => string;
    victimRapidForward: (pct: number) => string;
    aggregatorSenders: (senders: number, receivers: number) => string;
    aggregatorConsolidated: (exchange: string) => string;
    transitForwarded: (pct: number) => string;
    transitNoCex: string;
    transitSenders: (n: number) => string;
    exchangeSingleRecipient: (exchange: string) => string;
    exchangeConsolidated: (n: number) => string;
    distributor: (senders: number, receivers: number) => string;
    personalLowCount: (n: number) => string;
    unknownPattern: (txs: number, senders: number, receivers: number) => string;
    manualReview: string;
  };
  // ── Narrative summary + conclusion ──
  narrative: {
    summaryVictim: (inDisp: string, kycDeposits: number, pct: number, receivers: number, outDisp: string, nativeSuffix: string) => string;
    summaryAggregator: (senders: number, pct: number, inDisp: string, outDisp: string) => string;
    summaryTransit: (senders: number, pct: number, inDisp: string, outDisp: string) => string;
    summaryExchangeDeposit: (exchange: string, senders: number, inDisp: string, outDisp: string) => string;
    summaryDistributor: (senders: number, inDisp: string, receivers: number, outDisp: string) => string;
    summaryUnknown: (txs: number, senders: number, receivers: number, inDisp: string, outDisp: string) => string;
    cashoutDestination: (exchange: string) => string;
    routedThrough: (exchange: string) => string;
    nativeDustSuffix: (eth: string, native: string) => string;
    conclusionVictim: string;
    conclusionAggregator: string;
    conclusionTransit: string;
    conclusionExchangeDeposit: (exchange: string) => string;
    conclusionDistributor: string;
    conclusionMixer: string;
    conclusionTraceable: (exchange: string) => string;
    conclusionFurther: string;
  };
  // ── Evidence strength ──
  evidence: {
    labelStrong: string;
    labelModerate: string;
    labelWeak: string;
    txAnalyzed: (n: number) => string;
    uniqueSenders: (n: number) => string;
    rapidForwarding: (pct: number) => string;
    kycEntryConfirmed: string;
    scammerKycExit: string;
    criticalPatterns: (n: number) => string;
    counterpartyScamDb: (n: number) => string;
    counterpartyScamDbGeneric: string;
    scamDbMatch: string;
    counterpartyPhishing: (n: number) => string;
    counterpartyPhishingGeneric: string;
    phishingTagged: string;
    timestampsVerified: string;
    crossChainTraced: string;
    poisoningIdentified: (lookalikes: number, clusters: number) => string;
    poisoningSucceeded: (times: number, realLoss: string) => string;
    unicodeSpoofing: (n: number) => string;
  };
  // ── Legal weight / report suitability ──
  legalWeight: {
    lawEnforcement: string;
    exchangeReview: (exchanges: string) => string;
    civilLitigation: string;
    insurance: string;
    regulatory: string;
    courtUpgrade: string;
  };
}

const en: ReportTranslations = {
  locale: 'en',
  common: {
    confidential: 'LedgerHound · USPROJECT LLC · Confidential',
    pageOf: (n, total) => `Page ${n} of ${total}`,
    caseId: 'Case ID',
    date: 'Date',
    generatedBy: 'Generated by LedgerHound · USPROJECT LLC',
  },
  cover: {
    line1: 'FORENSIC WALLET',
    line2: 'ANALYSIS REPORT',
    walletAddress: 'WALLET ADDRESS',
    date: 'DATE',
    caseId: 'CASE ID',
    premium: 'PREMIUM FORENSIC REPORT',
    confidential: 'CONFIDENTIAL — For Legal Use',
    generatedBy: 'Generated by LedgerHound · USPROJECT LLC',
  },
  riskLabels: { CRITICAL: 'CRITICAL', HIGH: 'HIGH', MODERATE: 'MODERATE', LOW: 'LOW' },
  exec: {
    ofacAlertTitle: 'OFAC SANCTIONS ALERT',
    ofacAlertBody: 'This wallet has interacted with OFAC-sanctioned addresses. US persons are prohibited from transacting with sanctioned entities under penalty of law.',
    riskScore: 'RISK SCORE',
    recoveryProbability: 'RECOVERY PROBABILITY',
    recoveryDisclaimerTitle: 'RECOVERY PROBABILITY — IMPORTANT DISCLAIMER',
    positiveFactors: 'POSITIVE FACTORS',
    negativeFactors: 'NEGATIVE FACTORS',
    riskBreakdownTitle: 'RISK SCORE BREAKDOWN',
    colFactor: 'Factor',
    colScore: 'Score',
    baseline: 'Baseline',
    rowUnknownWallet: 'Unknown wallet interactions (>80% unidentified)',
    rowMixer: 'Mixer/tumbler interaction detected',
    rowKycExchange: 'KYC exchange interaction (recovery aid)',
    rowMultiHop: 'Multi-hop transfer pattern (3+ same day)',
    rowStablecoin: 'Stablecoin movement detected',
    rowOfac: 'OFAC sanctioned address interaction',
    rowScamDb: 'LedgerHound Scam Database match',
    totalRiskScore: 'TOTAL RISK SCORE',
    scamDbLinked: 'Linked to LedgerHound Scam Database',
    scamDbCounterpartyLinked: 'Counterparty Linked to LedgerHound Scam Database',
    reportsLosses: (reports, loss) => `${reports} reports, $${loss} losses`,
    keyFindings: 'Key Findings',
  },
  readiness: {
    subtitle: 'Quick reference for legal counsel and law enforcement: what evidence is documented, what investigation difficulty to expect, and what is included in this report package.',
    disclaimerNote: 'Readiness reflects evidence completeness, not recovery probability. High readiness means the case is well-documented for legal action — actual recovery depends on law-enforcement response, exchange cooperation, and legal proceedings.',
    evidencePackageIncluded: 'Evidence Package Included',
    investigationDifficulty: 'Investigation Difficulty',
    keyFactors: 'Key Factors',
    howToUseTitle: 'How to Use This Report',
    howToUse1Bold: 'File a police report', howToUse1: '— attach this PDF as supporting documentation.',
    howToUse2Bold: 'Submit to exchange compliance', howToUse2: '— request preservation of counterparty data.',
    howToUse3Bold: 'Submit evidence to the stablecoin issuer', howToUse3: '— for USDT-denominated transfers to flagged wallets, contact the issuer (Tether) with this report; enforcement is at the issuer\'s discretion.',
    howToUse4Bold: 'Consult legal counsel', howToUse4: '— share this evidence package for case evaluation.',
    tierExcellent: 'Excellent', tierStrong: 'Strong', tierModerate: 'Moderate', tierLimited: 'Limited',
    labelExcellent: 'Comprehensive evidence package — ready for legal action and exchange compliance review.',
    labelStrong: 'Sufficient evidence for police report and exchange compliance request.',
    labelModerate: 'Evidence available; additional tracing may strengthen recovery prospects.',
    labelLimited: 'Basic documentation completed; further investigation strongly recommended.',
    diffLow: 'LOW', diffMedium: 'MEDIUM', diffHigh: 'HIGH',
    diffLowExpl: 'This case has clear evidence trails and identified parties. Recovery efforts can proceed through standard legal channels.',
    diffMediumExpl: 'Investigation is feasible but requires coordination across multiple parties (law enforcement, exchanges, payment processors). Typical timeframe: 6–18 months.',
    diffHighExpl: 'Investigation faces significant obstacles (anonymisation, jurisdictional complexity, or fragmented evidence). Standard recovery channels may be insufficient — specialised cyber-forensics counsel is recommended.',
    evOnChain: 'On-chain transaction history (complete)',
    evVictimEntry: 'Victim KYC entry point identified',
    evScammerExit: 'Scammer cash-out exit identified (KYC exchange)',
    evScammerExitNot: 'Scammer cash-out exit NOT detected — expanded counterparty trace required',
    evFraudNetwork: 'Counterparty linked to known fraud network',
    evEtherscanTag: 'Counterparty officially tagged by Etherscan (Fake_Phishing)',
    evPoisoning: 'Address poisoning attack documented',
    evUnicode: 'Unicode spoofing evidence documented',
    evVictimClass: 'Victim wallet classification with reasoning',
    evBehavioral: 'Behavioral pattern analysis (counterparty)',
    evRecoveryProb: 'Recovery probability with factor breakdown',
    dfKycEntry: 'KYC exchange entry point identified',
    dfEtherscanVerified: 'Counterparty pre-verified by Etherscan (Fake_Phishing tag)',
    dfCampaignDocumented: 'Coordinated fraud campaign documented (coordinated multi-wallet fraud pattern)',
    dfMixer: 'Mixer/tumbler interaction detected — complicates fund tracing',
    dfCrossChain: 'Cross-chain bridging detected — multi-jurisdiction investigation',
    dfMultiCluster: 'Multiple fraud clusters — fragmented destinations',
    dfNoExit: 'No scammer cash-out exit identified — requires expanded counterparty trace',
  },
  sections: {
    executiveSummary: 'Executive Summary',
    recoveryReadiness: 'Recovery Readiness Assessment',
    investigationSummary: 'Investigation Summary',
    assetSummary: 'Asset Summary',
    activityTimeline: 'Activity Timeline',
    behavioralPatterns: 'Behavioral Pattern Analysis',
    walletAnalytics: 'Wallet Analytics',
    entityIdentification: 'Entity Identification',
    exitPointAnalysis: 'Exit Point Analysis',
    crossChainTrace: 'Cross-Chain Trace Summary',
    addressVerification: 'Address Verification & External Intelligence',
    attackTechnique: 'Attack Technique Analysis',
    fundFlow: 'Fund Flow Graph',
    transactionHistory: 'Transaction History',
    recoveryAssessment: 'Recovery Assessment',
    legalRecommendations: 'Legal Recommendations',
    actionableSteps: 'Actionable Recovery Steps',
    disclaimer: 'Disclaimer & Legal Notice',
    peruResources: 'Peru-Specific Resources',
  },
  investigation: {
    howWeClassified: 'HOW WE CLASSIFIED THIS WALLET',
    confidence: (pct) => `Confidence: ${pct}%`,
    uniqueSenders: 'UNIQUE SENDERS',
    assetIn: (sym) => `${sym} IN`,
    assetOut: (sym) => `${sym} OUT`,
    forwarded24h: 'FORWARDED <24H',
    fundFlow: 'Fund Flow',
    sourceDeposits: (n) => `~${n} Source Deposit(s)`,
    victimsCount: (n) => `${n} Victims`,
    inclCexDeposits: '(incl. CEX deposits)',
    victimWalletBadge: 'VICTIM WALLET',
    scamWalletBadge: 'SCAM WALLET',
    counterpartyWallets: (n) => `${n} Counterparty Wallet(s)`,
    receiversCount: (n) => `${n} Receivers`,
    kycExchange: 'KYC Exchange',
    suspectedScammerCluster: 'Suspected Scammer Cluster',
    oneOfManySources: (n) => `Note: This wallet is one of approximately ${n > 0 ? n : 'several'} source(s) sending funds to the same recipient cluster. The pattern is consistent with the wallet owner being a victim, not a scam operator.`,
    ifYouSentFunds: 'If You Sent Funds to This Wallet:',
    transactionPath: (label) => `Your transaction likely followed this path: YOU → This Wallet (${label})`,
    cashOutSuffix: (exchange) => ` → ${exchange} (Cash-out)`,
    toLocateTransaction: 'To locate your specific transaction:',
    locateStep1: 'Find your TXID in the Transaction History section of this report',
    locateStep2: 'Note the date, amount, and transaction hash',
    locateStep3: 'Include this information in your police report and exchange complaint',
    evidenceStrengthTitle: 'Evidence Strength',
    reportSuitabilityTitle: 'Report Suitability',
    exchangeKycEntryVsExit: 'Exchange KYC — Entry vs Exit',
    kycEntryPointLabel: "KYC ENTRY POINT (victim's funding source)",
    interactions: (n) => `${n} interaction(s)`,
    noneDetected: 'None detected.',
    identifiesVictimAccount: "Identifies the VICTIM'S exchange account — useful to confirm victim identity for legal proceedings, not the scammer's.",
    kycExitPointLabel: 'KYC EXIT POINT (scammer cash-out)',
    exitNotDetected: "Not detected in subject wallet's direct history. The fraud cluster controls the funds; identifying a cash-out exchange requires an expanded counterparty trace (one or more hops beyond this wallet).",
    walletTypes: {
      victim: 'Victim Wallet — Funds Sent to Identified Counterparty',
      aggregator: 'Scam Aggregation Wallet — Multiple Victims Identified',
      transit: 'Transit/Forwarding Wallet',
      distributor: 'Distribution Wallet',
      exchange_deposit: 'Exchange Deposit Funnel',
      aggregation: 'Scam Aggregation Point',
      personal: 'Personal/Low-Activity Wallet',
      unknown: 'Unclassified Wallet',
    },
    roleReasoning: {
      scamDbListed: (platforms) => `Subject wallet is listed in LedgerHound Scam Database as part of "${platforms}"`,
      documentedLosses: (amount) => `Linked to documented losses of approximately $${amount}`,
      knownExchange: (label) => `Subject wallet is a known ${label} address (KYC exchange)`,
      knownInfra: (label) => `Subject wallet is a known ${label} — analyzing as opaque infrastructure, not as victim/scammer`,
      victimKycEntry: (n) => `Received funds from ${n} KYC exchange deposit(s) — characteristic of a victim funding their own wallet`,
      victimForwarded: (n) => `Forwarded funds to ${n} unknown address(es) — consistent with sending to scammer-controlled wallets`,
      victimLimitedHistory: (n) => `Limited transaction history (${n} txs) — typical retail user profile`,
      victimRapidForward: (pct) => `${pct}% of funds forwarded within 24h — rapid action under social engineering pressure`,
      aggregatorSenders: (senders, receivers) => `${senders} unique senders aggregated into ${receivers} destination(s)`,
      aggregatorConsolidated: (exchange) => `Funds consolidated and forwarded to KYC exchange (${exchange}) — characteristic of a scam collection wallet`,
      transitForwarded: (pct) => `${pct}% of funds forwarded within 24h`,
      transitNoCex: 'No CEX deposits in incoming flow — pure on-chain routing pattern',
      transitSenders: (n) => `${n} unique senders feeding this wallet`,
      exchangeSingleRecipient: (exchange) => `Single recipient identified — a KYC exchange (${exchange})`,
      exchangeConsolidated: (n) => `${n} senders consolidated to one exit point — exchange deposit funnel pattern`,
      distributor: (senders, receivers) => `${senders} sender(s) distributing to ${receivers} recipients`,
      personalLowCount: (n) => `Low transaction count (${n}) and no fraud-network indicators — likely a personal/low-activity wallet`,
      unknownPattern: (txs, senders, receivers) => `Activity does not match any clear-cut pattern (${txs} transactions, ${senders} senders, ${receivers} receivers)`,
      manualReview: 'Manual review recommended for confident classification',
    },
    narrative: {
      summaryVictim: (inDisp, kycDeposits, pct, receivers, outDisp, nativeSuffix) => `This wallet shows the behavioral profile of a victim wallet. It received ${inDisp} from ${kycDeposits} KYC exchange deposit(s), then forwarded ${pct}% of those funds to ${receivers} unknown counterparty address(es) within 24 hours. Total outflow: ${outDisp}.${nativeSuffix}`,
      summaryAggregator: (senders, pct, inDisp, outDisp) => `This wallet functions as a scam aggregation point. It received funds from approximately ${senders} unique sender addresses and forwarded ${pct}% of incoming value within 24 hours. Total inflow: ${inDisp}. Total outflow: ${outDisp}.`,
      summaryTransit: (senders, pct, inDisp, outDisp) => `This wallet functions as a transit/forwarding wallet. It received funds from approximately ${senders} unique sender addresses and forwarded ${pct}% of incoming value within 24 hours. Total inflow: ${inDisp}. Total outflow: ${outDisp}.`,
      summaryExchangeDeposit: (exchange, senders, inDisp, outDisp) => `This wallet appears to funnel funds to ${exchange}. It received from ${senders} senders and consolidated to a single exchange destination. Total flow: ${inDisp} in, ${outDisp} out.`,
      summaryDistributor: (senders, inDisp, receivers, outDisp) => `This wallet distributes funds to a large number of recipients. ${senders} sender(s) deposited a total of ${inDisp}, then funds flowed to ${receivers} recipients (${outDisp} total outflow).`,
      summaryUnknown: (txs, senders, receivers, inDisp, outDisp) => `This wallet shows ${txs} total transactions across ${senders} unique senders and ${receivers} unique receivers. Total inflow: ${inDisp}. Total outflow: ${outDisp}.`,
      cashoutDestination: (exchange) => ` The primary cash-out destination is ${exchange}, a KYC-regulated exchange where account holder identity may be obtainable via legal subpoena (subject to exchange policy and data availability).`,
      routedThrough: (exchange) => ` Funds were routed through ${exchange}.`,
      nativeDustSuffix: (eth, native) => ` Separately, ${eth} ${native} in gas/dust was moved across native transactions.`,
      conclusionVictim: 'Conclusion: This wallet was used by a victim to send funds to a coordinated counterparty cluster — not a scammer-controlled wallet.',
      conclusionAggregator: 'Conclusion: This is a scam aggregation point collecting victim funds, not a legitimate user account.',
      conclusionTransit: 'Conclusion: This is a transit wallet used in coordinated fund routing, not a legitimate user account.',
      conclusionExchangeDeposit: (exchange) => `Conclusion: Exchange deposit funnel — identity likely recoverable via ${exchange} KYC records.`,
      conclusionDistributor: 'Conclusion: Distribution pattern — possible airdrop, payroll, or victim payout mechanism.',
      conclusionMixer: 'Conclusion: Mixer usage detected — funds were deliberately obfuscated.',
      conclusionTraceable: (exchange) => `Conclusion: Funds traceable to ${exchange} — recovery possible via legal channels.`,
      conclusionFurther: 'Conclusion: Further investigation recommended to determine fund destination.',
    },
    evidence: {
      labelStrong: 'STRONG',
      labelModerate: 'MODERATE',
      labelWeak: 'WEAK',
      txAnalyzed: (n) => `${n} transactions analyzed`,
      uniqueSenders: (n) => `${n} unique sender addresses identified`,
      rapidForwarding: (pct) => `${pct}% rapid forwarding pattern`,
      kycEntryConfirmed: 'KYC entry point confirmed (victim funding source)',
      scammerKycExit: 'Scammer KYC exit point confirmed',
      criticalPatterns: (n) => `${n} critical behavioral pattern(s) detected`,
      counterpartyScamDb: (n) => `Counterparty in LedgerHound Scam Database (${n} match${n > 1 ? 'es' : ''})`,
      counterpartyScamDbGeneric: 'Counterparty in LedgerHound Scam Database',
      scamDbMatch: 'Scam database match found',
      counterpartyPhishing: (n) => `Counterparty phishing flag confirmed (${n} wallet${n > 1 ? 's' : ''})`,
      counterpartyPhishingGeneric: 'Counterparty phishing flag confirmed (external sources)',
      phishingTagged: 'Phishing-tagged counterparty (Etherscan)',
      timestampsVerified: 'Timestamps verified on-chain',
      crossChainTraced: 'Cross-chain activity traced',
      poisoningIdentified: (lookalikes, clusters) => `Address poisoning campaign identified (${lookalikes} look-alike address${lookalikes > 1 ? 'es' : ''} in ${clusters} cluster${clusters > 1 ? 's' : ''})`,
      poisoningSucceeded: (times, realLoss) => `CRITICAL: address poisoning succeeded ${times} time(s) — real funds misdirected to secondary spoof addresses${realLoss ? `: ${realLoss}` : ''}`,
      unicodeSpoofing: (n) => `Unicode spoofing tokens detected (${n} fake symbol${n > 1 ? 's' : ''})`,
    },
    legalWeight: {
      lawEnforcement: 'Law enforcement submission (FBI IC3, local police)',
      exchangeReview: (exchanges) => `Exchange compliance review${exchanges ? ` (${exchanges})` : ''}`,
      civilLitigation: 'Civil litigation support',
      insurance: 'Insurance claim documentation',
      regulatory: 'Regulatory complaint filing',
      courtUpgrade: 'Court evidence (certified upgrade available)',
    },
  },
  attackTechnique: {
    intro: 'Forensic analysis identified specific scam techniques used against this wallet. These are professional methods employed by coordinated cryptocurrency fraud operations and constitute critical evidence for law enforcement and civil litigation.',
    poisoningHeader: 'Address Poisoning Campaign Detected',
    poisoningIntro: 'A coordinated address poisoning attack was identified. The attacker deployed a cluster of visually similar addresses (sharing prefix and suffix patterns) to confuse the victim and distribute fraudulent inflows across multiple wallets — making blacklisting and seizure more difficult. All addresses in this cluster are attacker-controlled; the highest-volume address is the main collector, the rest are secondary spoofs.',
    vanityCluster: (pattern) => `Vanity Cluster: ${pattern}`,
    statClusterAddresses: 'CLUSTER ADDRESSES',
    statRealMisdirections: 'REAL MISDIRECTIONS',
    statSecondarySpoofs: 'SECONDARY SPOOFS',
    realFundsMisdirected: (breakdown) => `Real funds misdirected to secondary spoofs: ${breakdown}`,
    worthlessSpoofUnits: (breakdown) => `Worthless spoof-token units routed to secondary spoofs: ${breakdown} — no market value (see Unicode Spoofing section).`,
    unclassifiedUnits: (breakdown) => `Unclassified token units routed: ${breakdown} (excluded from loss figures).`,
    fakePhishingTagged: (n) => `${n} address(es) in this cluster are officially tagged by Etherscan as Fake_Phishing.`,
    mainCollectorTitle: 'Main Collector (Highest Volume)',
    mainCollectorRealAmount: (amount, token) => `${amount} ${token}`,
    mainCollectorSpoofAmount: (amount, mimics) => `${amount} units of a fake "${mimics}" token (worthless spoof)`,
    mainCollectorDesc: (desc, txCount) => `Received ${desc} across ${txCount} transaction(s) — the primary scam wallet in this fraud network.`,
    etherscan: (tag) => `Etherscan: ${tag}`,
    secondarySpoofsTitle: 'Secondary Spoofs (Address Poisoning Targets)',
    secondarySpoofsIntro: 'These addresses share the same visual pattern as the main collector but are separate wallets. Real funds the victim sent here indicate successful confusion induced by the poisoning attack; worthless spoof-token transfers are reported separately.',
    misdirectionConfirmedReal: (amounts, txCount) => `MISDIRECTION CONFIRMED (real funds): ${amounts} across ${txCount} tx`,
    spoofTokenRouted: (amount, mimics, scriptName, codepoints, contract) =>
      `Spoof-token routed: ${amount} units of a fake "${mimics}" token${scriptName && codepoints ? ` (Unicode spoof — ${scriptName} script: ${codepoints})` : ' (Unicode spoof)'} — worthless, not real ${mimics}.${contract ? ` Contract: ${contract}` : ''}`,
    scriptName: (category) => ({
      Lisu: 'Lisu',
      Cyrillic: 'Cyrillic',
      Greek: 'Greek',
      'Latin Diacritics': 'Latin-diacritic',
      'Fullwidth Latin': 'fullwidth-Latin',
      Mathematical: 'Mathematical',
      Mixed: 'mixed-script',
      Other: 'other-script',
    } as Record<string, string>)[category] ?? category,
    unclassifiedTokenUnits: (amount, symbol) => `${amount} units of unclassified token "${symbol}" (excluded from loss figures).`,
    noFundsReceived: (dusted) => `No funds received (poisoning only)${dusted ? ' · dusted the victim' : ''}`,
    differsFromMainCollector: (pos, a, b) => `Differs from main collector at position ${pos}: "${a}" vs "${b}"`,
    additionalSpoofs: (n) => `+ ${n} additional spoof addresses in cluster`,
    forensicInterpretationTitle: 'Forensic Interpretation',
    forensicInterpretationBody: (pattern, count) => `The vanity pattern (${pattern}) shared across ${count} addresses is statistically improbable by chance (~1 in 4.3 billion per pair for 8 matching characters). This is characteristic of a deliberate, coordinated address poisoning campaign by a multi-wallet fraud operation, with three goals: (1) confusion — trick the victim into copying the wrong address from history; (2) risk distribution — spread inflows across wallets to evade blacklisting; (3) investigation obfuscation — fragment the destination to complicate tracing.`,
    methodologyFootnote: 'Methodology: For an N-character hex match at fixed positions (case-insensitive), the probability that two independently generated addresses share those positions is (1/16)^N. With 8 fixed characters (4-character prefix + 4-character suffix), P ≈ 1 in 4.3 × 10^9. Real-world address generation involves additional patterns that reduce entropy further; this baseline is a conservative lower bound for the improbability of coincidental clustering.',
    forensicNote: 'Forensic note: amounts shown as "spoof-token units" are worthless Unicode-impersonation tokens (e.g. a fake "USDT"), not real currency. They are reported separately and are NOT included in the real economic-loss figures above.',
    unicodeHeader: 'Unicode Spoofing Attack',
    unicodeIntroPart1: 'Fake tokens use characters from non-Latin scripts (Lisu Letters, Cyrillic, Greek) that visually resemble legitimate ticker symbols. For example, "',
    unicodeIntroPart2: '" (Lisu Letters, U+A4F4 U+A4E2 U+A4D3 U+A4D4) appears identical to "USDT" but is a worthless contract. Attackers send these fake "deposits" to fabricate the appearance of returns or refunds in wallet history.',
    statUniqueFakeTokens: 'UNIQUE FAKE TOKENS',
    statSpoofTransfers: 'SPOOF TRANSFERS',
    masqueradingAs: '— masquerading as ',
    originalUnicodeLabel: 'Original Unicode: ',
    unicodeLabel: 'Unicode: ',
    displayNfcLabel: 'Display (NFC): ',
    scriptLine: (script, occurrences, addrCount) => `Script: ${script} · ${occurrences} transfer${occurrences > 1 ? 's' : ''}${addrCount ? ` from ${addrCount} address(es)` : ''}`,
    combiningMarksNote: 'Uses combining diacritical marks; display shows NFC-normalised form for readability — original byte sequence preserved above.',
    exampleLine: (date, addr) => `e.g. ${date} · from ${addr}`,
    bottomMethodology: 'Methodology: Address poisoning detection matches counterparty addresses against actual recipients on a 4-character prefix + 4-character suffix basis (8 hex characters of visual overlap). Unicode spoofing detection normalises token symbols (NFKD decomposition + a curated confusable-character map across Lisu, Cyrillic, Greek and fullwidth Latin) and compares against legitimate tickers. Codepoints are shown in standard U+ notation so the evidence is verifiable independent of font rendering.',
  },
  assetSummary: {
    realAssetsHeader: 'Real Assets',
    colToken: 'Token',
    colTotalIn: 'Total In',
    colTotalOut: 'Total Out',
    colNet: 'Net',
    spamFiltered: (n) => `Spam/Airdrop Tokens Filtered: ${n}`,
    spamNote: 'Spam tokens are common on active wallets and typically have no real value.',
    unicodeEvidenceHeader: (n) => `Unicode Spoofing Evidence: ${n} fake token${n > 1 ? 's' : ''} detected`,
    mimickingSuffix: (mimics, script, count) => ` — mimicking ${mimics} (${script}, ${count} transfer${count > 1 ? 's' : ''})`,
    originalLabel: 'Original: ',
    codepointsLabel: 'Codepoints: ',
    displayLabel: 'Display: ',
    spoofTokensNote: 'These tokens use non-Latin characters to impersonate real currencies. See Attack Technique Analysis for full detail.',
    footnoteNote: 'Note: The apparent net balance understates the true economic loss.',
    footnoteRealMisdirected: (breakdown) => ` Real funds misdirected to address-poisoning spoof addresses: ${breakdown}.`,
    footnoteSpoofUnits: (breakdown) => ` Separately, ${breakdown} of worthless spoof-token units (no market value) were routed to attacker-controlled addresses.`,
    footnoteTail: ' See Attack Technique Analysis. Real funds were lost to visual address confusion, not legitimately transferred; spoof-token units carry no value and are reported separately.',
  },
  timeline: {
    walletFirstActive: 'Wallet first active',
    received: (amount, token, from) => `Received ${amount} ${token} from ${from}...`,
    sent: (amount, token, to) => `Sent ${amount} ${token} to ${to}`,
    lastActivity: 'Last recorded activity',
    keyEventBadge: 'KEY EVENT',
    misdirectionBadge: '⚠ MISDIRECTION',
    sentToSpoofNote: 'Sent to an address-poisoning spoof — not the intended recipient.',
    totalActivePeriod: (first, last) => `Total Active Period: ${first} to ${last}`,
    inactiveSuffix: (n) => ` (inactive for ${n} days)`,
    noTimeline: 'No timestamped transactions available for timeline construction.',
  },
  behavioral: {
    introVictim: 'The subject wallet was classified as a victim wallet. The patterns below describe characteristics of the counterparty cluster that received funds, not allegations against the subject wallet.',
    introNonVictim: 'Automated detection of scam-associated behavioral patterns based on transaction timing, flow structure, and counterparty analysis.',
    overallAssessment: 'OVERALL BEHAVIORAL ASSESSMENT',
    victimPatternBadge: 'VICTIM PATTERN DETECTED',
    riskLabel: { CONFIRMED_SCAM: 'CONFIRMED SCAM', LIKELY_SCAM: 'LIKELY SCAM', SUSPICIOUS: 'SUSPICIOUS', CLEAN: 'CLEAN' },
    victimAssessmentText: 'The subject wallet shows the behavioral fingerprint of a victim wallet (CEX-funded, low-history, rapid forwarding to a small unknown counterparty set). Detected patterns characterise the counterparty cluster — not the subject.',
    detectedPatterns: (n) => `Detected Patterns (${n})`,
    confidence: (pct) => `Confidence: ${pct}%`,
    severity: { CRITICAL: 'CRITICAL', HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' },
    noPatternsTitle: 'No Suspicious Patterns Detected',
    noPatternsBody: 'Automated behavioral analysis did not detect scam-associated patterns. This does not guarantee legitimacy — manual review may still be warranted for comprehensive assessment.',
    methodologyFootnote: 'Methodology: Patterns are detected by analyzing transaction timing, flow direction, counterparty diversity, asset types, and known entity interactions. Confidence scores reflect the strength of evidence. This is automated analysis — professional forensic review may identify additional patterns.',
    rapidForwardingName: 'Rapid Forwarding (Scam Funnel)',
    rapidForwardingEv: (pct, count, total) => [
      `${pct}% of incoming funds forwarded within 24 hours`,
      `${count} of ${total} deposits show pass-through behavior`,
      'Wallet acts as transit point, not final destination',
    ],
    aggregationName: 'Aggregation Wallet (Victim Collector)',
    aggregationEv: (senders, inCount, outCount, recipients) => [
      `${senders} unique senders (potential victims)`,
      `${inCount} incoming vs ${outCount} outgoing transactions`,
      `Funds consolidated to only ${recipients} destination(s)`,
    ],
    pigButcheringName: 'Pig Butchering Pattern',
    pigButcheringEv: (deposits, days, pct) => [
      `${deposits} deposits over ${days} days (gradual "investment")`,
      `Largest outflow = ${pct}% of total deposited funds`,
      'Pattern consistent with romance or investment scam',
    ],
    dustingName: 'Dusting / Spam Activity',
    dustingEv: (spamCount, microPct) => [
      `${spamCount} spam/airdrop tokens detected`,
      `${microPct}% micro-transactions (dust)`,
      'May indicate phishing targets or address poisoning attempts',
    ],
    mixerName: 'Mixer / Tumbler Usage',
    mixerEvHeader: (count) => `Interaction with ${count} known mixer(s)`,
    mixerEvItem: (label, n) => `${label} (${n} interaction${n > 1 ? 's' : ''})`,
    mixerEvFooter: 'Mixers are commonly used to launder stolen funds',
    roundNumbersName: 'Round-Number Transfers',
    roundNumbersEv: (roundCount, total, pct) => [
      `${roundCount} of ${total} transfers are exact round numbers`,
      `${pct}% round-number rate (typical scams use round amounts)`,
      'Organic transfers rarely consist of exact round numbers',
    ],
    interpretation: {
      CONFIRMED_SCAM: 'Critical scam indicators present. This wallet exhibits behavior strongly associated with fraud or money laundering. Immediate legal action recommended.',
      LIKELY_SCAM: 'Multiple high-risk patterns detected. Wallet behavior is consistent with scam operations. Full forensic investigation strongly recommended.',
      SUSPICIOUS: 'Some behavioral patterns warrant further investigation. Not conclusive, but monitoring and deeper analysis recommended.',
      CLEAN: 'No suspicious behavioral patterns detected in automated analysis. Wallet activity appears normal. Note: this does not guarantee legitimacy — manual review may still be warranted.',
    },
  },
  analytics: {
    received: (sym) => `${sym} RECEIVED`,
    sent: (sym) => `${sym} SENT`,
    netFlow: (sym) => `${sym} NET FLOW`,
    transactions: 'TRANSACTIONS',
    activePeriod: 'ACTIVE PERIOD',
    uniqueTokens: 'UNIQUE TOKENS',
    topCounterparties: 'Top 5 Counterparty Addresses',
    colAddress: 'Address',
    colEntity: 'Entity',
    colInteractions: 'Interactions',
    colVolume: (sym) => `Volume (${sym})`,
    inactiveTitle: (n) => `Wallet Inactive — ${n} Days`,
    inactiveBody: (lastActivity) => `Last activity: ${lastActivity}. Possible: key loss, cooling-off, or fund redistribution.`,
  },
  entityId: {
    noEntities: 'No known entities identified in automated analysis. Manual investigation with commercial tools may reveal additional attributions.',
    colAddress: 'Address',
    colEntity: 'Entity',
    colType: 'Type',
    colInteractions: 'Interactions',
    entityType: (type) => (({
      exchange: 'EXCHANGE', mixer: 'MIXER', sanctioned: 'SANCTIONED', bridge: 'BRIDGE',
      defi: 'DEFI', scam: 'SCAM', unknown: 'UNKNOWN',
    } as Record<string, string>)[type.toLowerCase()] ?? type.toUpperCase()),
    mixerWarningTitle: 'WARNING: Mixer Activity Detected',
    mixerWarningBody: 'Mixing services obscure fund origins and are associated with money laundering.',
    exchangeIdentifiedTitle: 'Exchange Identified — Subpoena Target Available',
    exchangeIdentifiedBody: 'KYC exchanges maintain identity records that may be obtainable via legal subpoena (subject to exchange policy and data availability).',
    exitColDestination: 'Destination',
    exitColAmount: 'Amount',
    exitColToken: 'Token',
    exitColType: 'Type',
    exitColRecovery: 'Recovery Difficulty',
    exitKycTitle: 'KYC Exchange Exit Detected',
    exitKycBody: 'Funds reached a KYC-compliant exchange. Attorney can file discovery request for account holder identification.',
    exitMixerTitle: 'Mixer Exit Detected',
    exitMixerBody: 'Funds passed through mixing services. Professional demixing analysis recommended.',
    exitNoneTitle: 'No KYC Exchange Exit Detected',
    exitNoneBody: 'Without exchange interaction, recovery requires deeper investigation. The largest outflow destination should be traced further.',
    noOutflows: 'No significant outflows detected for exit point analysis.',
    recoveryDiff: (entityType) => (({
      exchange: 'LOW - Subpoena possible',
      mixer: 'HIGH - Funds obfuscated',
      defi: 'MEDIUM - On-chain analysis possible',
    } as Record<string, string>)[entityType] ?? 'UNKNOWN - Further investigation needed'),
  },
  addressVerification: {
    intro: 'Top counterparty addresses (by volume) cross-referenced with multiple verification sources: LedgerHound Scam Database, OFAC SDN, Chainabuse community reports, GoPlus Security risk flags, and our curated Etherscan Fake_Phishing list. Sources are queried independently; agreement across sources increases confidence.',
    degradedTitle: 'External intelligence partially unavailable',
    degradedBody: 'One or more external sources (Chainabuse, GoPlus, OFAC) were unavailable during report generation. Some labels may be incomplete. Internal database matches and curated Etherscan tags are unaffected.',
    sourcesSuffix: (n) => `${n} source${n === 1 ? '' : 's'}`,
    noMatches: 'No matches in any verification source.',
    reportsSuffix: (n) => `  (${n} reports)`,
    confLabel: (pct) => `  conf=${pct}%`,
    remaining: (n) => `+ ${n} more counterpart${n === 1 ? 'y' : 'ies'} analyzed but not shown (capped at 15). Full data available via the LedgerHound API.`,
    methodology: 'Methodology: Labels are aggregated from independent sources. OFAC SDN entries reflect the US Treasury sanctions list as published by the github mirror `0xB10C/ofac-sanctioned-digital-currency-addresses`. Chainabuse confidence scales with community report count. GoPlus scores reflect on-chain risk signals (phishing, blacklisting, stolen-funds attribution). Federation results are cached in S3 for 7 days.',
    sourceLabel: (source) => (({
      etherscan_manual: 'ETHERSCAN', chainabuse: 'CHAINABUSE', goplus: 'GOPLUS', ofac: 'OFAC SDN',
      ledgerhound_scam_db: 'LEDGERHOUND DB', cex_whitelist: 'KYC EXCHANGE', known_entity: 'KNOWN ENTITY',
      known_phishing: 'ETHERSCAN',
    } as Record<string, string>)[source] ?? source),
  },
};

const es: ReportTranslations = {
  locale: 'es',
  common: {
    confidential: 'LedgerHound · USPROJECT LLC · Confidencial',
    pageOf: (n, total) => `Página ${n} de ${total}`,
    caseId: 'ID de Caso',
    date: 'Fecha',
    generatedBy: 'Generado por LedgerHound · USPROJECT LLC',
  },
  cover: {
    line1: 'INFORME FORENSE',
    line2: 'DE WALLET',
    walletAddress: 'DIRECCIÓN DE WALLET',
    date: 'FECHA',
    caseId: 'ID DE CASO',
    premium: 'INFORME FORENSE PREMIUM',
    confidential: 'CONFIDENCIAL — Para Uso Legal',
    generatedBy: 'Generado por LedgerHound · USPROJECT LLC',
  },
  riskLabels: { CRITICAL: 'CRÍTICA', HIGH: 'ALTA', MODERATE: 'MODERADA', LOW: 'BAJA' },
  exec: {
    ofacAlertTitle: 'ALERTA DE SANCIONES OFAC',
    ofacAlertBody: 'Esta wallet ha interactuado con direcciones sancionadas por la OFAC. A las personas estadounidenses se les prohíbe realizar transacciones con entidades sancionadas bajo pena de ley.',
    riskScore: 'PUNTUACIÓN DE RIESGO',
    recoveryProbability: 'PROBABILIDAD DE RECUPERACIÓN',
    recoveryDisclaimerTitle: 'PROBABILIDAD DE RECUPERACIÓN — AVISO IMPORTANTE',
    positiveFactors: 'FACTORES POSITIVOS',
    negativeFactors: 'FACTORES NEGATIVOS',
    riskBreakdownTitle: 'DESGLOSE DE LA PUNTUACIÓN DE RIESGO',
    colFactor: 'Factor',
    colScore: 'Puntuación',
    baseline: 'Base',
    rowUnknownWallet: 'Interacciones con wallets desconocidas (>80% no identificadas)',
    rowMixer: 'Interacción con mixer/tumbler detectada',
    rowKycExchange: 'Interacción con exchange KYC (ayuda a la recuperación)',
    rowMultiHop: 'Patrón de transferencias multi-salto (3+ el mismo día)',
    rowStablecoin: 'Movimiento de stablecoins detectado',
    rowOfac: 'Interacción con dirección sancionada por OFAC',
    rowScamDb: 'Coincidencia en la Base de Datos de Estafas de LedgerHound',
    totalRiskScore: 'PUNTUACIÓN TOTAL DE RIESGO',
    scamDbLinked: 'Vinculada a la Base de Datos de Estafas de LedgerHound',
    scamDbCounterpartyLinked: 'Contraparte Vinculada a la Base de Datos de Estafas de LedgerHound',
    reportsLosses: (reports, loss) => `${reports} reportes, $${loss} en pérdidas`,
    keyFindings: 'Hallazgos Clave',
  },
  readiness: {
    subtitle: 'Referencia rápida para asesores legales y autoridades: qué evidencia está documentada, qué dificultad de investigación esperar y qué incluye este paquete del informe.',
    disclaimerNote: 'La preparación refleja la integridad de la evidencia, no la probabilidad de recuperación. Una preparación alta significa que el caso está bien documentado para la acción legal — la recuperación real depende de la respuesta de las autoridades, la cooperación del exchange y los procedimientos legales.',
    evidencePackageIncluded: 'Paquete de Evidencia Incluido',
    investigationDifficulty: 'Dificultad de Investigación',
    keyFactors: 'Factores Clave',
    howToUseTitle: 'Cómo Usar Este Informe',
    howToUse1Bold: 'Presente una denuncia policial', howToUse1: '— adjunte este PDF como documentación de apoyo.',
    howToUse2Bold: 'Envíelo al área de cumplimiento del exchange', howToUse2: '— solicite la preservación de los datos de la contraparte.',
    howToUse3Bold: 'Envíe evidencia al emisor de la stablecoin', howToUse3: '— para transferencias en USDT a wallets marcadas, contacte al emisor (Tether) con este informe; la aplicación queda a discreción del emisor.',
    howToUse4Bold: 'Consulte con un asesor legal', howToUse4: '— comparta este paquete de evidencia para la evaluación del caso.',
    tierExcellent: 'Excelente', tierStrong: 'Sólida', tierModerate: 'Moderada', tierLimited: 'Limitada',
    labelExcellent: 'Paquete de evidencia integral — listo para la acción legal y la revisión de cumplimiento del exchange.',
    labelStrong: 'Evidencia suficiente para una denuncia policial y una solicitud de cumplimiento al exchange.',
    labelModerate: 'Evidencia disponible; un rastreo adicional puede fortalecer las perspectivas de recuperación.',
    labelLimited: 'Documentación básica completada; se recomienda encarecidamente una investigación adicional.',
    diffLow: 'BAJA', diffMedium: 'MEDIA', diffHigh: 'ALTA',
    diffLowExpl: 'Este caso tiene rastros de evidencia claros y partes identificadas. Los esfuerzos de recuperación pueden avanzar por los canales legales habituales.',
    diffMediumExpl: 'La investigación es viable pero requiere coordinación entre múltiples partes (autoridades, exchanges, procesadores de pago). Plazo típico: 6 a 18 meses.',
    diffHighExpl: 'La investigación enfrenta obstáculos significativos (anonimización, complejidad jurisdiccional o evidencia fragmentada). Los canales de recuperación habituales pueden ser insuficientes — se recomienda un asesor especializado en ciberforense.',
    evOnChain: 'Historial de transacciones en cadena (completo)',
    evVictimEntry: 'Punto de entrada KYC de la víctima identificado',
    evScammerExit: 'Punto de salida de fondos del estafador identificado (exchange KYC)',
    evScammerExitNot: 'Punto de salida del estafador NO detectado — se requiere rastreo ampliado de la contraparte',
    evFraudNetwork: 'Contraparte vinculada a una red de fraude conocida',
    evEtherscanTag: 'Contraparte etiquetada oficialmente por Etherscan (Fake_Phishing)',
    evPoisoning: 'Ataque de envenenamiento de direcciones documentado',
    evUnicode: 'Evidencia de suplantación con caracteres Unicode documentada',
    evVictimClass: 'Clasificación de wallet de víctima con su fundamentación',
    evBehavioral: 'Análisis de patrones de comportamiento (contraparte)',
    evRecoveryProb: 'Probabilidad de recuperación con desglose de factores',
    dfKycEntry: 'Punto de entrada a exchange KYC identificado',
    dfEtherscanVerified: 'Contraparte preverificada por Etherscan (etiqueta Fake_Phishing)',
    dfCampaignDocumented: 'Campaña coordinada de fraude documentada (patrón coordinado de fraude con múltiples wallets)',
    dfMixer: 'Interacción con mixer/tumbler detectada — complica el rastreo de fondos',
    dfCrossChain: 'Puenteo entre cadenas detectado — investigación multi-jurisdiccional',
    dfMultiCluster: 'Múltiples grupos de fraude — destinos fragmentados',
    dfNoExit: 'No se identificó un punto de salida de fondos del estafador — se requiere rastreo ampliado de la contraparte',
  },
  sections: {
    executiveSummary: 'Resumen Ejecutivo',
    recoveryReadiness: 'Evaluación de Preparación para la Recuperación',
    investigationSummary: 'Resumen de la Investigación',
    assetSummary: 'Resumen de Activos',
    activityTimeline: 'Cronología de Actividad',
    behavioralPatterns: 'Análisis de Patrones de Comportamiento',
    walletAnalytics: 'Analítica de la Wallet',
    entityIdentification: 'Identificación de Entidades',
    exitPointAnalysis: 'Análisis de Puntos de Salida',
    crossChainTrace: 'Resumen de Rastreo Multi-Cadena',
    addressVerification: 'Verificación de Direcciones e Inteligencia Externa',
    attackTechnique: 'Análisis de Técnicas de Ataque',
    fundFlow: 'Gráfico de Flujo de Fondos',
    transactionHistory: 'Historial de Transacciones',
    recoveryAssessment: 'Evaluación de Recuperación',
    legalRecommendations: 'Recomendaciones Legales',
    actionableSteps: 'Pasos Concretos para la Recuperación',
    disclaimer: 'Aviso Legal y Descargo de Responsabilidad',
    peruResources: 'Recursos Específicos para Perú',
  },
  investigation: {
    howWeClassified: 'CÓMO CLASIFICAMOS ESTA WALLET',
    confidence: (pct) => `Confianza: ${pct}%`,
    uniqueSenders: 'REMITENTES ÚNICOS',
    assetIn: (sym) => `${sym} ENTRANTE`,
    assetOut: (sym) => `${sym} SALIENTE`,
    forwarded24h: 'REENVIADO <24H',
    fundFlow: 'Flujo de Fondos',
    sourceDeposits: (n) => `~${n} Depósito(s) de Origen`,
    victimsCount: (n) => `${n} Víctimas`,
    inclCexDeposits: '(incl. depósitos de exchange)',
    victimWalletBadge: 'WALLET DE VÍCTIMA',
    scamWalletBadge: 'WALLET DE ESTAFA',
    counterpartyWallets: (n) => `${n} Wallet(s) de Contraparte`,
    receiversCount: (n) => `${n} Receptores`,
    kycExchange: 'Exchange KYC',
    suspectedScammerCluster: 'Grupo Sospechoso de Estafa',
    oneOfManySources: (n) => `Nota: Esta wallet es una de aproximadamente ${n > 0 ? n : 'varias'} fuente(s) que envían fondos al mismo grupo receptor. El patrón es consistente con que el dueño de la wallet sea una víctima, no un operador de estafa.`,
    ifYouSentFunds: 'Si Usted Envió Fondos a Esta Wallet:',
    transactionPath: (label) => `Su transacción probablemente siguió esta ruta: USTED → Esta Wallet (${label})`,
    cashOutSuffix: (exchange) => ` → ${exchange} (Retiro)`,
    toLocateTransaction: 'Para localizar su transacción específica:',
    locateStep1: 'Encuentre su TXID en la sección Historial de Transacciones de este informe',
    locateStep2: 'Anote la fecha, el monto y el hash de la transacción',
    locateStep3: 'Incluya esta información en su denuncia policial y en su reclamo ante el exchange',
    evidenceStrengthTitle: 'Solidez de la Evidencia',
    reportSuitabilityTitle: 'Usos del Informe',
    exchangeKycEntryVsExit: 'KYC del Exchange — Entrada vs Salida',
    kycEntryPointLabel: 'PUNTO DE ENTRADA KYC (fuente de financiamiento de la víctima)',
    interactions: (n) => `${n} interacción(es)`,
    noneDetected: 'Ninguno detectado.',
    identifiesVictimAccount: 'Identifica la cuenta de exchange de la VÍCTIMA — útil para confirmar la identidad de la víctima en procedimientos legales, no la del estafador.',
    kycExitPointLabel: 'PUNTO DE SALIDA KYC (retiro del estafador)',
    exitNotDetected: 'No detectado en el historial directo de la wallet analizada. El grupo de fraude controla los fondos; identificar un exchange de retiro requiere un rastreo ampliado de la contraparte (uno o más saltos más allá de esta wallet).',
    walletTypes: {
      victim: 'Wallet de Víctima — Fondos Enviados a Contraparte Identificada',
      aggregator: 'Wallet Agregadora de Estafa — Múltiples Víctimas Identificadas',
      transit: 'Wallet de Tránsito/Reenvío',
      distributor: 'Wallet de Distribución',
      exchange_deposit: 'Embudo de Depósitos de Exchange',
      aggregation: 'Punto de Agregación de Estafa',
      personal: 'Wallet Personal/de Baja Actividad',
      unknown: 'Wallet sin Clasificar',
    },
    roleReasoning: {
      scamDbListed: (platforms) => `La wallet analizada figura en la Base de Datos de Estafas de LedgerHound como parte de "${platforms}"`,
      documentedLosses: (amount) => `Vinculada a pérdidas documentadas de aproximadamente $${amount}`,
      knownExchange: (label) => `La wallet analizada es una dirección conocida de ${label} (exchange KYC)`,
      knownInfra: (label) => `La wallet analizada es un(a) ${label} conocido(a) — analizada como infraestructura opaca, no como víctima/estafador`,
      victimKycEntry: (n) => `Recibió fondos de ${n} depósito(s) de exchange KYC — característico de una víctima financiando su propia wallet`,
      victimForwarded: (n) => `Reenvió fondos a ${n} dirección(es) desconocida(s) — consistente con envíos a wallets controladas por el estafador`,
      victimLimitedHistory: (n) => `Historial de transacciones limitado (${n} txs) — perfil típico de usuario minorista`,
      victimRapidForward: (pct) => `${pct}% de los fondos reenviados en 24h — acción rápida bajo presión de ingeniería social`,
      aggregatorSenders: (senders, receivers) => `${senders} remitentes únicos agregados en ${receivers} destino(s)`,
      aggregatorConsolidated: (exchange) => `Fondos consolidados y reenviados a un exchange KYC (${exchange}) — característico de una wallet de recolección de estafa`,
      transitForwarded: (pct) => `${pct}% de los fondos reenviados en 24h`,
      transitNoCex: 'Sin depósitos de exchange en el flujo entrante — patrón de enrutamiento puramente on-chain',
      transitSenders: (n) => `${n} remitentes únicos alimentando esta wallet`,
      exchangeSingleRecipient: (exchange) => `Un único receptor identificado — un exchange KYC (${exchange})`,
      exchangeConsolidated: (n) => `${n} remitentes consolidados en un único punto de salida — patrón de embudo de depósito a exchange`,
      distributor: (senders, receivers) => `${senders} remitente(s) distribuyendo a ${receivers} receptores`,
      personalLowCount: (n) => `Bajo número de transacciones (${n}) y sin indicadores de red de fraude — probablemente una wallet personal/de baja actividad`,
      unknownPattern: (txs, senders, receivers) => `La actividad no coincide con ningún patrón definido (${txs} transacciones, ${senders} remitentes, ${receivers} receptores)`,
      manualReview: 'Se recomienda revisión manual para una clasificación con confianza',
    },
    narrative: {
      summaryVictim: (inDisp, kycDeposits, pct, receivers, outDisp, nativeSuffix) => `Esta wallet muestra el perfil conductual de una wallet de víctima. Recibió ${inDisp} de ${kycDeposits} depósito(s) de exchange KYC, luego reenvió ${pct}% de esos fondos a ${receivers} dirección(es) de contraparte desconocida(s) en 24 horas. Salida total: ${outDisp}.${nativeSuffix}`,
      summaryAggregator: (senders, pct, inDisp, outDisp) => `Esta wallet funciona como un punto de agregación de estafa. Recibió fondos de aproximadamente ${senders} direcciones remitentes únicas y reenvió ${pct}% del valor entrante en 24 horas. Entrada total: ${inDisp}. Salida total: ${outDisp}.`,
      summaryTransit: (senders, pct, inDisp, outDisp) => `Esta wallet funciona como una wallet de tránsito/reenvío. Recibió fondos de aproximadamente ${senders} direcciones remitentes únicas y reenvió ${pct}% del valor entrante en 24 horas. Entrada total: ${inDisp}. Salida total: ${outDisp}.`,
      summaryExchangeDeposit: (exchange, senders, inDisp, outDisp) => `Esta wallet parece canalizar fondos hacia ${exchange}. Recibió de ${senders} remitentes y los consolidó en un único destino de exchange. Flujo total: ${inDisp} entrante, ${outDisp} saliente.`,
      summaryDistributor: (senders, inDisp, receivers, outDisp) => `Esta wallet distribuye fondos a un gran número de receptores. ${senders} remitente(s) depositaron un total de ${inDisp}, luego los fondos fluyeron a ${receivers} receptores (${outDisp} de salida total).`,
      summaryUnknown: (txs, senders, receivers, inDisp, outDisp) => `Esta wallet muestra ${txs} transacciones en total a través de ${senders} remitentes únicos y ${receivers} receptores únicos. Entrada total: ${inDisp}. Salida total: ${outDisp}.`,
      cashoutDestination: (exchange) => ` El principal destino de retiro es ${exchange}, un exchange regulado con KYC donde la identidad del titular de la cuenta puede obtenerse mediante citación judicial (sujeto a la política del exchange y disponibilidad de datos).`,
      routedThrough: (exchange) => ` Los fondos fueron enrutados a través de ${exchange}.`,
      nativeDustSuffix: (eth, native) => ` Por separado, ${eth} ${native} en gas/dust se movió en transacciones nativas.`,
      conclusionVictim: 'Conclusión: Esta wallet fue utilizada por una víctima para enviar fondos a un grupo de contraparte coordinado — no es una wallet controlada por el estafador.',
      conclusionAggregator: 'Conclusión: Este es un punto de agregación de estafa que recolecta fondos de víctimas, no una cuenta de usuario legítima.',
      conclusionTransit: 'Conclusión: Esta es una wallet de tránsito utilizada en el enrutamiento coordinado de fondos, no una cuenta de usuario legítima.',
      conclusionExchangeDeposit: (exchange) => `Conclusión: Embudo de depósito a exchange — identidad probablemente recuperable mediante los registros KYC de ${exchange}.`,
      conclusionDistributor: 'Conclusión: Patrón de distribución — posible airdrop, nómina o mecanismo de pago a víctimas.',
      conclusionMixer: 'Conclusión: Uso de mezclador detectado — los fondos fueron deliberadamente ofuscados.',
      conclusionTraceable: (exchange) => `Conclusión: Fondos rastreables hasta ${exchange} — recuperación posible por vías legales.`,
      conclusionFurther: 'Conclusión: Se recomienda una investigación adicional para determinar el destino de los fondos.',
    },
    evidence: {
      labelStrong: 'SÓLIDA',
      labelModerate: 'MODERADA',
      labelWeak: 'DÉBIL',
      txAnalyzed: (n) => `${n} transacciones analizadas`,
      uniqueSenders: (n) => `${n} direcciones remitentes únicas identificadas`,
      rapidForwarding: (pct) => `${pct}% de patrón de reenvío rápido`,
      kycEntryConfirmed: 'Punto de entrada KYC confirmado (fuente de financiamiento de la víctima)',
      scammerKycExit: 'Punto de salida KYC del estafador confirmado',
      criticalPatterns: (n) => `${n} patrón(es) de comportamiento crítico(s) detectado(s)`,
      counterpartyScamDb: (n) => `Contraparte en la Base de Datos de Estafas de LedgerHound (${n} coincidencia${n > 1 ? 's' : ''})`,
      counterpartyScamDbGeneric: 'Contraparte en la Base de Datos de Estafas de LedgerHound',
      scamDbMatch: 'Coincidencia encontrada en la base de datos de estafas',
      counterpartyPhishing: (n) => `Marca de phishing de contraparte confirmada (${n} wallet${n > 1 ? 's' : ''})`,
      counterpartyPhishingGeneric: 'Marca de phishing de contraparte confirmada (fuentes externas)',
      phishingTagged: 'Contraparte etiquetada como phishing (Etherscan)',
      timestampsVerified: 'Marcas de tiempo verificadas en cadena',
      crossChainTraced: 'Actividad multi-cadena rastreada',
      poisoningIdentified: (lookalikes, clusters) => `Campaña de envenenamiento de direcciones identificada (${lookalikes} dirección(es) similar(es) en ${clusters} grupo(s))`,
      poisoningSucceeded: (times, realLoss) => `CRÍTICO: el envenenamiento de direcciones tuvo éxito ${times} vez(ces) — fondos reales desviados a direcciones de suplantación secundarias${realLoss ? `: ${realLoss}` : ''}`,
      unicodeSpoofing: (n) => `Tokens de suplantación Unicode detectados (${n} símbolo(s) falso(s))`,
    },
    legalWeight: {
      lawEnforcement: 'Presentación ante autoridades (FBI IC3, policía local)',
      exchangeReview: (exchanges) => `Revisión de cumplimiento del exchange${exchanges ? ` (${exchanges})` : ''}`,
      civilLitigation: 'Apoyo para litigios civiles',
      insurance: 'Documentación para reclamos de seguro',
      regulatory: 'Presentación de denuncia regulatoria',
      courtUpgrade: 'Evidencia para tribunales (actualización certificada disponible)',
    },
  },
  attackTechnique: {
    intro: 'El análisis forense identificó técnicas de estafa específicas utilizadas contra esta wallet. Estos son métodos profesionales empleados por operaciones coordinadas de fraude con criptomonedas y constituyen evidencia crítica para las autoridades y los litigios civiles.',
    poisoningHeader: 'Campaña de Envenenamiento de Direcciones Detectada',
    poisoningIntro: 'Se identificó un ataque coordinado de envenenamiento de direcciones. El atacante desplegó un grupo de direcciones visualmente similares (que comparten patrones de prefijo y sufijo) para confundir a la víctima y distribuir las entradas fraudulentas entre múltiples wallets — dificultando el bloqueo y la incautación. Todas las direcciones de este grupo están controladas por el atacante; la dirección de mayor volumen es el recolector principal, el resto son suplantaciones secundarias.',
    vanityCluster: (pattern) => `Grupo de Direcciones Vanity: ${pattern}`,
    statClusterAddresses: 'DIRECCIONES DEL GRUPO',
    statRealMisdirections: 'DESVÍOS REALES',
    statSecondarySpoofs: 'SUPLANTACIONES SECUNDARIAS',
    realFundsMisdirected: (breakdown) => `Fondos reales desviados a suplantaciones secundarias: ${breakdown}`,
    worthlessSpoofUnits: (breakdown) => `Unidades de tokens falsificados enviadas a suplantaciones secundarias: ${breakdown} — sin valor de mercado (ver sección de Suplantación Unicode).`,
    unclassifiedUnits: (breakdown) => `Unidades de token sin clasificar enviadas: ${breakdown} (excluidas de las cifras de pérdida).`,
    fakePhishingTagged: (n) => `${n} dirección(es) en este grupo están etiquetadas oficialmente por Etherscan como Fake_Phishing.`,
    mainCollectorTitle: 'Recolector Principal (Mayor Volumen)',
    mainCollectorRealAmount: (amount, token) => `${amount} ${token}`,
    mainCollectorSpoofAmount: (amount, mimics) => `${amount} unidades de un token falsificado de "${mimics}" (suplantación sin valor)`,
    mainCollectorDesc: (desc, txCount) => `Recibió ${desc} en ${txCount} transacción(es) — la wallet principal de la estafa en esta red de fraude.`,
    etherscan: (tag) => `Etherscan: ${tag}`,
    secondarySpoofsTitle: 'Suplantaciones Secundarias (Objetivos de Envenenamiento)',
    secondarySpoofsIntro: 'Estas direcciones comparten el mismo patrón visual que el recolector principal pero son wallets separadas. Los fondos reales que la víctima envió aquí indican una confusión exitosa inducida por el ataque de envenenamiento; las transferencias de tokens falsificados sin valor se reportan por separado.',
    misdirectionConfirmedReal: (amounts, txCount) => `DESVÍO CONFIRMADO (fondos reales): ${amounts} en ${txCount} tx`,
    spoofTokenRouted: (amount, mimics, scriptName, codepoints, contract) =>
      `Token falsificado enviado: ${amount} unidades de un token falsificado de "${mimics}"${scriptName && codepoints ? ` (suplantación Unicode — escritura ${scriptName}: ${codepoints})` : ' (suplantación Unicode)'} — sin valor, no es ${mimics} real.${contract ? ` Contrato: ${contract}` : ''}`,
    scriptName: (category) => ({
      Lisu: 'lisu',
      Cyrillic: 'cirílica',
      Greek: 'griega',
      'Latin Diacritics': 'latina con diacríticos',
      'Fullwidth Latin': 'latina de ancho completo',
      Mathematical: 'matemática',
      Mixed: 'mixta',
      Other: 'desconocida',
    } as Record<string, string>)[category] ?? category,
    unclassifiedTokenUnits: (amount, symbol) => `${amount} unidades de token sin clasificar "${symbol}" (excluido de las cifras de pérdida).`,
    noFundsReceived: (dusted) => `No recibió fondos (solo envenenamiento)${dusted ? ' · envenenó a la víctima' : ''}`,
    differsFromMainCollector: (pos, a, b) => `Difiere del recolector principal en la posición ${pos}: "${a}" vs "${b}"`,
    additionalSpoofs: (n) => `+ ${n} direcciones de suplantación adicionales en el grupo`,
    forensicInterpretationTitle: 'Interpretación Forense',
    forensicInterpretationBody: (pattern, count) => `El patrón vanity (${pattern}) compartido entre ${count} direcciones es estadísticamente improbable por azar (~1 en 4.3 mil millones por par para 8 caracteres coincidentes). Esto es característico de una campaña de envenenamiento de direcciones deliberada y coordinada por una operación de fraude multi-wallet, con tres objetivos: (1) confusión — engañar a la víctima para que copie la dirección equivocada del historial; (2) distribución del riesgo — repartir las entradas entre wallets para evadir el bloqueo; (3) ofuscación de la investigación — fragmentar el destino para complicar el rastreo.`,
    methodologyFootnote: 'Metodología: Para una coincidencia hexadecimal de N caracteres en posiciones fijas (insensible a mayúsculas/minúsculas), la probabilidad de que dos direcciones generadas aleatoriamente de manera independiente compartan esas posiciones es (1/16)^N. Con 8 caracteres fijos (prefijo de 4 caracteres + sufijo de 4 caracteres), P ≈ 1 en 4.3 × 10^9. La generación de direcciones en el mundo real involucra patrones adicionales que reducen aún más la entropía; esta línea base sirve como un límite inferior conservador para la improbabilidad de agrupamiento por coincidencia.',
    forensicNote: 'Nota forense: los montos mostrados como "unidades de token falsificado" son tokens de suplantación Unicode sin valor (p. ej. un "USDT" falso), no moneda real. Se reportan por separado y NO se incluyen en las cifras de pérdida económica real anteriores.',
    unicodeHeader: 'Ataque de Suplantación Unicode',
    unicodeIntroPart1: 'Los tokens falsos usan caracteres de escrituras no latinas (letras Lisu, cirílico, griego) que se parecen visualmente a símbolos de tickers legítimos. Por ejemplo, "',
    unicodeIntroPart2: '" (letras Lisu, U+A4F4 U+A4E2 U+A4D3 U+A4D4) parece idéntico a "USDT" pero es un contrato sin valor. Los atacantes envían estos "depósitos" falsos para fabricar la apariencia de retornos o reembolsos en el historial de la wallet.',
    statUniqueFakeTokens: 'TOKENS FALSOS ÚNICOS',
    statSpoofTransfers: 'TRANSFERENCIAS DE SUPLANTACIÓN',
    masqueradingAs: '— haciéndose pasar por ',
    originalUnicodeLabel: 'Unicode original: ',
    unicodeLabel: 'Unicode: ',
    displayNfcLabel: 'Visualización (NFC): ',
    scriptLine: (script, occurrences, addrCount) => `Escritura: ${script} · ${occurrences} transferencia(s)${addrCount ? ` de ${addrCount} dirección(es)` : ''}`,
    combiningMarksNote: 'Usa marcas diacríticas combinantes; la visualización muestra la forma normalizada NFC para legibilidad — la secuencia original de bytes se preserva arriba.',
    exampleLine: (date, addr) => `ej. ${date} · de ${addr}`,
    bottomMethodology: 'Metodología: La detección de envenenamiento de direcciones compara las direcciones de contraparte con los receptores reales sobre una base de prefijo de 4 caracteres + sufijo de 4 caracteres (8 caracteres hexadecimales de superposición visual). La detección de suplantación Unicode normaliza los símbolos de los tokens (descomposición NFKD + un mapa curado de caracteres confundibles entre Lisu, cirílico, griego y latín de ancho completo) y los compara con tickers legítimos. Los puntos de código se muestran en notación U+ estándar para que la evidencia sea verificable independientemente de la representación de la fuente.',
  },
  assetSummary: {
    realAssetsHeader: 'Activos Reales',
    colToken: 'Token',
    colTotalIn: 'Total Entrada',
    colTotalOut: 'Total Salida',
    colNet: 'Neto',
    spamFiltered: (n) => `Tokens de Spam/Airdrop Filtrados: ${n}`,
    spamNote: 'Los tokens de spam son comunes en wallets activas y normalmente no tienen valor real.',
    unicodeEvidenceHeader: (n) => `Evidencia de Suplantación Unicode: ${n} token${n > 1 ? 's' : ''} falso${n > 1 ? 's' : ''} detectado${n > 1 ? 's' : ''}`,
    mimickingSuffix: (mimics, script, count) => ` — imitando a ${mimics} (${script}, ${count} transferencia${count > 1 ? 's' : ''})`,
    originalLabel: 'Original: ',
    codepointsLabel: 'Puntos de código: ',
    displayLabel: 'Visualización: ',
    spoofTokensNote: 'Estos tokens usan caracteres no latinos para hacerse pasar por monedas reales. Ver Análisis de Técnicas de Ataque para el detalle completo.',
    footnoteNote: 'Nota: El saldo neto aparente subestima la pérdida económica real.',
    footnoteRealMisdirected: (breakdown) => ` Fondos reales desviados a direcciones de envenenamiento: ${breakdown}.`,
    footnoteSpoofUnits: (breakdown) => ` Por separado, ${breakdown} de unidades de tokens falsificados sin valor de mercado fueron enviados a direcciones controladas por el atacante.`,
    footnoteTail: ' Ver Análisis de Técnicas de Ataque. Los fondos reales se perdieron por confusión visual de direcciones, no fueron transferidos legítimamente; las unidades de tokens falsificados no tienen valor y se reportan por separado.',
  },
  timeline: {
    walletFirstActive: 'Wallet activada por primera vez',
    received: (amount, token, from) => `Recibido ${amount} ${token} de ${from}...`,
    sent: (amount, token, to) => `Enviado ${amount} ${token} a ${to}`,
    lastActivity: 'Última actividad registrada',
    keyEventBadge: 'EVENTO CLAVE',
    misdirectionBadge: '⚠ DESVÍO',
    sentToSpoofNote: 'Enviado a una suplantación de envenenamiento de direcciones — no es el destinatario previsto.',
    totalActivePeriod: (first, last) => `Período Activo Total: ${first} a ${last}`,
    inactiveSuffix: (n) => ` (inactiva por ${n} días)`,
    noTimeline: 'No hay transacciones con marca de tiempo disponibles para construir la cronología.',
  },
  behavioral: {
    introVictim: 'La wallet analizada fue clasificada como wallet de víctima. Los patrones a continuación describen características del grupo de contraparte que recibió los fondos, no acusaciones contra la wallet analizada.',
    introNonVictim: 'Detección automatizada de patrones de comportamiento asociados a estafas, basada en la sincronización de transacciones, la estructura del flujo y el análisis de contrapartes.',
    overallAssessment: 'EVALUACIÓN GENERAL DE COMPORTAMIENTO',
    victimPatternBadge: 'PATRÓN DE VÍCTIMA DETECTADO',
    riskLabel: { CONFIRMED_SCAM: 'ESTAFA CONFIRMADA', LIKELY_SCAM: 'PROBABLE ESTAFA', SUSPICIOUS: 'SOSPECHOSO', CLEAN: 'LIMPIO' },
    victimAssessmentText: 'La wallet analizada muestra la huella conductual de una wallet de víctima (financiada por exchange, historial corto, reenvío rápido a un pequeño conjunto de contrapartes desconocidas). Los patrones detectados caracterizan al grupo de contraparte — no a la wallet analizada.',
    detectedPatterns: (n) => `Patrones Detectados (${n})`,
    confidence: (pct) => `Confianza: ${pct}%`,
    severity: { CRITICAL: 'CRÍTICA', HIGH: 'ALTA', MEDIUM: 'MEDIA', LOW: 'BAJA' },
    noPatternsTitle: 'No se Detectaron Patrones Sospechosos',
    noPatternsBody: 'El análisis conductual automatizado no detectó patrones asociados a estafas. Esto no garantiza la legitimidad — puede ser necesaria una revisión manual para una evaluación integral.',
    methodologyFootnote: 'Metodología: Los patrones se detectan analizando la sincronización de las transacciones, la dirección del flujo, la diversidad de contrapartes, los tipos de activos y las interacciones con entidades conocidas. Las puntuaciones de confianza reflejan la solidez de la evidencia. Este es un análisis automatizado — una revisión forense profesional puede identificar patrones adicionales.',
    rapidForwardingName: 'Reenvío Rápido (Embudo de Estafa)',
    rapidForwardingEv: (pct, count, total) => [
      `${pct}% de los fondos entrantes reenviados en 24 horas`,
      `${count} de ${total} depósitos muestran comportamiento de paso`,
      'La wallet actúa como punto de tránsito, no como destino final',
    ],
    aggregationName: 'Wallet Agregadora (Recolector de Víctimas)',
    aggregationEv: (senders, inCount, outCount, recipients) => [
      `${senders} remitentes únicos (posibles víctimas)`,
      `${inCount} transacciones entrantes vs ${outCount} salientes`,
      `Fondos consolidados en solo ${recipients} destino(s)`,
    ],
    pigButcheringName: 'Patrón de Pig Butchering',
    pigButcheringEv: (deposits, days, pct) => [
      `${deposits} depósitos durante ${days} días ("inversión" gradual)`,
      `Mayor salida = ${pct}% del total de fondos depositados`,
      'Patrón consistente con estafa romántica o de inversión',
    ],
    dustingName: 'Actividad de Dusting / Spam',
    dustingEv: (spamCount, microPct) => [
      `${spamCount} tokens de spam/airdrop detectados`,
      `${microPct}% de micro-transacciones (dust)`,
      'Puede indicar objetivos de phishing o intentos de envenenamiento de direcciones',
    ],
    mixerName: 'Uso de Mezclador / Tumbler',
    mixerEvHeader: (count) => `Interacción con ${count} mezclador(es) conocido(s)`,
    mixerEvItem: (label, n) => `${label} (${n} interacci${n > 1 ? 'ones' : 'ón'})`,
    mixerEvFooter: 'Los mezcladores se usan comúnmente para lavar fondos robados',
    roundNumbersName: 'Transferencias en Números Redondos',
    roundNumbersEv: (roundCount, total, pct) => [
      `${roundCount} de ${total} transferencias son números redondos exactos`,
      `${pct}% de tasa de números redondos (las estafas suelen usar montos redondos)`,
      'Las transferencias orgánicas rara vez consisten en números redondos exactos',
    ],
    interpretation: {
      CONFIRMED_SCAM: 'Indicadores críticos de estafa presentes. Esta wallet exhibe comportamiento fuertemente asociado con fraude o lavado de dinero. Se recomienda acción legal inmediata.',
      LIKELY_SCAM: 'Múltiples patrones de alto riesgo detectados. El comportamiento de la wallet es consistente con operaciones de estafa. Se recomienda encarecidamente una investigación forense completa.',
      SUSPICIOUS: 'Algunos patrones de comportamiento ameritan una investigación adicional. No es concluyente, pero se recomienda monitoreo y un análisis más profundo.',
      CLEAN: 'No se detectaron patrones de comportamiento sospechosos en el análisis automatizado. La actividad de la wallet parece normal. Nota: esto no garantiza la legitimidad — aún puede ser necesaria una revisión manual.',
    },
  },
  analytics: {
    received: (sym) => `${sym} RECIBIDO`,
    sent: (sym) => `${sym} ENVIADO`,
    netFlow: (sym) => `FLUJO NETO ${sym}`,
    transactions: 'TRANSACCIONES',
    activePeriod: 'PERÍODO ACTIVO',
    uniqueTokens: 'TOKENS ÚNICOS',
    topCounterparties: 'Top 5 Direcciones de Contraparte',
    colAddress: 'Dirección',
    colEntity: 'Entidad',
    colInteractions: 'Interacciones',
    colVolume: (sym) => `Volumen (${sym})`,
    inactiveTitle: (n) => `Wallet Inactiva — ${n} Días`,
    inactiveBody: (lastActivity) => `Última actividad: ${lastActivity}. Posible: pérdida de claves, período de espera o redistribución de fondos.`,
  },
  entityId: {
    noEntities: 'No se identificaron entidades conocidas en el análisis automatizado. Una investigación manual con herramientas comerciales podría revelar atribuciones adicionales.',
    colAddress: 'Dirección',
    colEntity: 'Entidad',
    colType: 'Tipo',
    colInteractions: 'Interacciones',
    entityType: (type) => (({
      exchange: 'EXCHANGE', mixer: 'MEZCLADOR', sanctioned: 'SANCIONADA', bridge: 'PUENTE',
      defi: 'DEFI', scam: 'ESTAFA', unknown: 'DESCONOCIDA',
    } as Record<string, string>)[type.toLowerCase()] ?? type.toUpperCase()),
    mixerWarningTitle: 'ADVERTENCIA: Actividad de Mezclador Detectada',
    mixerWarningBody: 'Los servicios de mezcla ocultan el origen de los fondos y están asociados con el lavado de dinero.',
    exchangeIdentifiedTitle: 'Exchange Identificado — Objetivo de Citación Disponible',
    exchangeIdentifiedBody: 'Los exchanges KYC mantienen registros de identidad que pueden obtenerse mediante citación judicial (sujeto a la política del exchange y disponibilidad de datos).',
    exitColDestination: 'Destino',
    exitColAmount: 'Monto',
    exitColToken: 'Token',
    exitColType: 'Tipo',
    exitColRecovery: 'Dificultad de Recuperación',
    exitKycTitle: 'Salida por Exchange KYC Detectada',
    exitKycBody: 'Los fondos llegaron a un exchange con cumplimiento KYC. Un abogado puede presentar una solicitud de descubrimiento para identificar al titular de la cuenta.',
    exitMixerTitle: 'Salida por Mezclador Detectada',
    exitMixerBody: 'Los fondos pasaron por servicios de mezcla. Se recomienda un análisis profesional de desmezclado.',
    exitNoneTitle: 'No se Detectó Salida por Exchange KYC',
    exitNoneBody: 'Sin interacción con un exchange, la recuperación requiere una investigación más profunda. El mayor destino de salida debe rastrearse más a fondo.',
    noOutflows: 'No se detectaron salidas significativas para el análisis de puntos de salida.',
    recoveryDiff: (entityType) => (({
      exchange: 'BAJA - Citación judicial posible',
      mixer: 'ALTA - Fondos ofuscados',
      defi: 'MEDIA - Análisis on-chain posible',
    } as Record<string, string>)[entityType] ?? 'DESCONOCIDA - Se requiere investigación adicional'),
  },
  addressVerification: {
    intro: 'Las principales direcciones de contraparte (por volumen) se cruzan con múltiples fuentes de verificación: la Base de Datos de Estafas de LedgerHound, OFAC SDN, reportes comunitarios de Chainabuse, indicadores de riesgo de GoPlus Security, y nuestra lista curada de Fake_Phishing de Etherscan. Las fuentes se consultan de forma independiente; la concordancia entre fuentes aumenta la confianza.',
    degradedTitle: 'Inteligencia externa parcialmente no disponible',
    degradedBody: 'Una o más fuentes externas (Chainabuse, GoPlus, OFAC) no estaban disponibles durante la generación del informe. Algunas etiquetas pueden estar incompletas. Las coincidencias de la base de datos interna y las etiquetas curadas de Etherscan no se ven afectadas.',
    sourcesSuffix: (n) => `${n} fuente${n === 1 ? '' : 's'}`,
    noMatches: 'Sin coincidencias en ninguna fuente de verificación.',
    reportsSuffix: (n) => `  (${n} reportes)`,
    confLabel: (pct) => `  conf=${pct}%`,
    remaining: (n) => `+ ${n} contraparte${n === 1 ? '' : 's'} más analizada${n === 1 ? '' : 's'} pero no mostrada${n === 1 ? '' : 's'} (limitado a 15). Datos completos disponibles vía la API de LedgerHound.`,
    methodology: 'Metodología: Las etiquetas se agregan de fuentes independientes. Las entradas de OFAC SDN reflejan la lista de sanciones del Tesoro de EE. UU. publicada en el espejo de github `0xB10C/ofac-sanctioned-digital-currency-addresses`. La confianza de Chainabuse escala con el número de reportes comunitarios. Las puntuaciones de GoPlus reflejan señales de riesgo on-chain (phishing, listas negras, atribución de fondos robados). Los resultados de federación se almacenan en caché en S3 durante 7 días.',
    sourceLabel: (source) => (({
      etherscan_manual: 'ETHERSCAN', chainabuse: 'CHAINABUSE', goplus: 'GOPLUS', ofac: 'OFAC SDN',
      ledgerhound_scam_db: 'LEDGERHOUND DB', cex_whitelist: 'EXCHANGE KYC', known_entity: 'ENTIDAD CONOCIDA',
      known_phishing: 'ETHERSCAN',
    } as Record<string, string>)[source] ?? source),
  },
};

const TABLE: Record<ReportLocale, ReportTranslations> = { en, es };

/**
 * Resolve translations for a locale. Unsupported locales fall back to English.
 */
export function getReportTranslations(locale: string | undefined | null): ReportTranslations {
  if (isSupportedReportLocale(locale || '')) return TABLE[locale as ReportLocale];
  return en;
}

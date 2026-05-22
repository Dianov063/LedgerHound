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
};

const TABLE: Record<ReportLocale, ReportTranslations> = { en, es };

/**
 * Resolve translations for a locale. Unsupported locales fall back to English.
 */
export function getReportTranslations(locale: string | undefined | null): ReportTranslations {
  if (isSupportedReportLocale(locale || '')) return TABLE[locale as ReportLocale];
  return en;
}

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
    // Phase 3.1 Stage 12 (P0-1): factor rows that mirror the live formula.
    rowScamEntity: string;
    rowHighOutflow: string;
    rowLowActivity: string;
    rowPhishingTag: string;
    rowFederationScam: string;
    rowPoisoning: string;
    rowUnicode: string;
    rowEtherscanTag: string;
    rowSanctionsFloor: string;
    rowBehavioralFloor: string;
    rowCap: string;
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
  /** Recovery Assessment + Legal Recommendations (Phase 3 Batch 2.6). */
  recovery: Recovery;
  /** Actionable Recovery Steps (Phase 3 Batch 2.6). */
  steps: Steps;
  /** Disclaimer & Legal Notice (Phase 3 Batch 2.6). */
  disclaimer: DisclaimerT;
  /** Fund Flow Graph (Phase 3 Batch 2.7). */
  fundFlow: FundFlow;
  /** Transaction History (Phase 3 Batch 2.7). */
  transactions: Transactions;
  /** Country-specific recovery guidance (Phase 3 Part 3). */
  countryGuidance: CountryGuidance;
  /** Executive Summary "Key Findings" generated prose (Phase 3.1 Issue #8). */
  findings: Findings;
}

/**
 * Key Findings (Executive Summary, page 2) generated prose. These were
 * previously emitted as raw English in generateReport.ts; Phase 3.1 routes
 * them through this table so the Spanish PDF carries no English leaks.
 */
export interface Findings {
  ofacCritical: (labels: string) => string;
  mixerDetected: string;
  exchangesInteracted: (exchanges: string) => string;
  scamFlagged: string;
  scamDbMatch: (addrShort: string, platforms: string, reports: number, totalLoss: string) => string;
  stableSent: (amount: string, symbol: string, n: number) => string;
  stableReceived: (amount: string, symbol: string, n: number) => string;
  stableWallet: (parts: string) => string;
  nativeDust: (amount: string, currency: string, n: number) => string;
  nativeSent: (amount: string, currency: string, n: number) => string;
  inactive: (days: number, lastActivity: string) => string;
  spamFiltered: (n: number) => string;
  crossChainBridge: (n: number, summary: string) => string;
  multiChain: (chains: number, chainList: string) => string;
  laundering: (confidence: number, reason: string) => string;
  behavioral: (name: string, confidence: number, evidence: string) => string;
  none: string;
}

/** Country-specific recovery guidance (Phase 3 Part 3). */
export interface CountryGuidance {
  peru: PeruGuidance;
  india: IndiaGuidance;
  // TODO(Phase 3): mexico, colombia, argentina, chile, spain as content lands.
}

/** India-specific recovery resources page. English-first (India's official
 *  fraud-reporting channels operate in English/Hindi). Rendered when country==='IN'. */
export interface IndiaGuidance {
  title: string;
  intro: string;
  // 1. I4C / National Cyber Crime Reporting Portal + 1930 helpline
  i4cTitle: string;
  i4cPortal: string;
  i4cHelpline: string;
  i4cGoldenHour: string;
  i4cZeroFir: string;
  i4cDescription: string;
  // 2. Local police cyber cell / Zero FIR
  policeTitle: string;
  policeFir: string;
  policeDescription: string;
  // 3. RBI Ombudsman (RB-IOS) via CMS
  rbiTitle: string;
  rbiPortal: string;
  rbiProcess: string;
  rbiDescription: string;
  // 4. FIU-IND registered VDA exchange grievance officer
  exchangeTitle: string;
  exchangeProcess: string;
  exchangeDescription: string;
}

/** Peru-specific recovery resources page. */
export interface PeruGuidance {
  title: string;
  intro: string;
  divindatTitle: string;
  divindatAddress: string;
  divindatPhone: string;
  divindatEmail: string;
  divindatHours: string;
  divindatDescription: string;
  ministerioPublicoTitle: string;
  ministerioPublicoUrl: string;
  ministerioPublicoDescription: string;
  sbsTitle: string;
  sbsPhone: string;
  sbsEmail: string;
  sbsDescription: string;
  indecopiTitle: string;
  indecopiPhone: string;
  indecopiUrl: string;
  indecopiDescription: string;
  calTitle: string;
  calUrl: string;
  calDescription: string;
  reniecTitle: string;
  reniecUrl: string;
  reniecDescription: string;
  disclaimer: string;
  /** Phase 3.1 Stage 11 (B2): "documents in this package" checklist (Exec Summary). */
  documentsTitle: string;
  documentsIntro: string;
  documentsDivindat: string;
  documentsBinance: string;
  documentsTether: string;
  documentsOrder: string;
}

/** Fund Flow Graph (page 13) translations. */
export interface FundFlow {
  intro: string;
  colNum: string;
  colLabel: string;
  colType: string;
  colVolume: string;
  colDirection: string;
  nodeType: (type: string) => string;
  legendYourWallet: string;
  legendExchange: string;
  legendMixer: string;
  legendDefi: string;
  legendScam: string;
  legendScamDb: string;
  legendUnknown: string;
  legendIncoming: string;
  legendOutgoing: string;
  noGraph: string;
  interactiveLine: string;
  /** Phase 3.1 Stage 10: real vs spoof flow legend + spoof "no value" warning. */
  realFlowLegend: string;
  spoofFlowLegend: string;
  fakeNoValueWarning: string;
}

/** Transaction History (page 14) translations. */
export interface Transactions {
  titleSuffix: (n: number) => string;
  colDate: string;
  colDir: string;
  colFrom: string;
  colTo: string;
  colValue: string;
  colToken: string;
  spoofFootnote: string;
  spamFilteredNote: (n: number) => string;
  truncationNote: (shown: number, total: number) => string;
}

/** Recovery Assessment + Legal Recommendations (pages 15-16). */
export interface Recovery {
  probabilityLabel: string;
  recoveryIfConfirmedLabel: string;
  overallRecoveryProbability: string;
  chance: Record<'HIGH' | 'MEDIUM' | 'LOW', string>;
  ofacNoticeTitle: string;
  ofacNoticeBody: string;
  recommendedActions: string;
  // Recovery scenarios (generated in generateReport)
  scenarioAName: string;
  scenarioADescKyc: string;
  scenarioADescNoKyc: string;
  scenarioAActionKyc: string;
  scenarioAActionNoKyc: string;
  scenarioBName: string;
  scenarioBDesc: string;
  scenarioBAction: string;
  scenarioCName: string;
  scenarioCDescMixer: string;
  scenarioCDescNoMixer: string;
  scenarioCActionMixer: string;
  scenarioCActionNoMixer: string;
  // Legal recommendation items (bold + text)
  entryPointBold: (brand: string) => string;
  entryPointText: (brand: string) => string;
  counterpartyExitBold: string;
  counterpartyExitText: string;
  kycExitBold: string;
  kycExitText: (brand: string) => string;
  ic3Bold: string;
  ic3Text: string;
  exchangeComplianceBold: string;
  exchangeComplianceText: string;
  tokenIssuerBold: string;
  tokenIssuerText: string;
  courtCertifiedBold: string;
  courtCertifiedText: string;
  // Recovery assessment label/disclaimer/factors (Exec Summary + Recovery page).
  // Generated in generateReport.ts; Phase 3.1 routes them through this table.
  assessmentLabel: Record<'MODERATE' | 'LOW_TO_MODERATE' | 'LOW' | 'VERY_LOW', string>;
  assessmentDisclaimer: string;
  factorKycExchange: (label: string) => string;
  factorFraudCluster: string;
  factorPhishingTag: (n: number) => string;
  factorRecent30: string;
  factorRecent7: string;
  factorMixer: string;
  factorLargeOutflow: string;
  factorStale: string;
}

/** Actionable Recovery Steps (page 17). */
export interface Steps {
  stepLabel: (n: number) => string;
  recoveryPathIdentified: string;
  recoveryRequiresInvestigation: string;
  recoveryPathBody: string;
  recoveryRequiresBody: string;
  // Phase 3.1 Stage 5 (R1): scenario-aware top banner. "Recovery path
  // identified" only when a scammer KYC exit was actually found; the victim
  // and generic variants avoid overpromising.
  recoveryPathVictimBody: string;
  recoveryPathGeneric: string;
  recoveryPathGenericBody: string;
  // STEP 1 is role-aware (Phase 3.1 Issue #5/#6). The base step1Title/Body/
  // Closing cover the "scammer KYC exit confirmed" scenario; the *Victim and
  // *Generic variants prevent the page from implying a scammer exit was found
  // when it was not (resolving the Page 5 vs Page 17 contradiction).
  step1Title: string;
  step1Body: string;
  step1Closing: (caseId: string) => string;
  /** Legal-defensive banner shown above STEP 1 cards for the victim scenario. */
  step1BannerVictim: string;
  step1TitleVictim: string;
  step1BodyVictim: string;
  step1ClosingVictim: (caseId: string) => string;
  step1TitleGeneric: string;
  step1BodyGeneric: string;
  step1ClosingGeneric: (caseId: string) => string;
  step1Interactions: (interactions: number, addrCount: number) => string;
  step1MoreAddrs: (n: number) => string;
  step1NoContact: string;
  /** Phase 3.1 Stage 8: Binance has no direct victim compliance email. */
  step1BinanceChannel: string;
  lawEnforcementTitle: string;
  ic3Bullet: string;
  localPoliceBullet: string;
  ftcBullet: string;
  sarBullet: string;
  lawEnforcementClosing: (caseId: string) => string;
  legalProceedingsTitle: string;
  legalSubpoena: (brand: string) => string;
  legalIdentityRequest: string;
  legalCivilRecovery: string;
  legalPreservationLetter: string;
  legalConsultAttorney: string;
  legalAdvancedTracing: string;
  legalInternational: string;
  preserveEvidenceTitle: string;
  preserve1: string;
  preserve2: string;
  preserve3: string;
  preserve4: string;
  ctaTitle: string;
  ctaBody: string;
}

/** Disclaimer & Legal Notice (page 18). */
export interface DisclaimerT {
  para1: string;
  para2: string;
  para3: string;
  para4: string;
  para5: string;
  para6: string;
  tagline: string;
  /** Phase 3.1 Stage 11.2: SHA-256 integrity line printed in the report. */
  integrityTitle: string;
  integrityNote: string;
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
  /** Phase 3.1 Stage 6 (T3): footnote when the exit-points table is truncated. */
  exitTruncatedNote: string;
  /** Phase 3.1 Stage 16 (P1-2): amounts are per-destination totals (summed across
   *  all transfers), with the transaction count shown in parentheses. */
  exitAggregateNote: string;
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
  /** Phase 3.1 Stage 15 (P1-2): explains the IN/OUT direction tag on each
   *  counterparty volume row (e.g. a CEX deposit is inbound, not an outflow). */
  directionLegend: string;
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
  /** Phase 3.1 Stage 11 (A1): clarifies net flow != economic loss. */
  netFlowClarification: string;
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
  /** Phase 3.1 Stage 7/9 (A3/P2): timeline send role markers. Role strings
   *  include their preposition ("al ..." / "a una ...") so grammar is correct. */
  sentToRole: (amount: string, token: string, role: string) => string;
  roleMainCollector: string;
  roleSpoofAddress: string;
  /** Phase 3.1 Stage 15 (P0-1): shown when the timeline has both a collector
   *  send and a spoof misdirection — explains the look-alike collision is the
   *  attack signature, not a duplicate, and isn't double-counted. */
  poisoningCollisionNote: string;
  totalActivePeriod: (first: string, last: string) => string;
  inactiveSuffix: (n: number) => string;
  noTimeline: string;
  /** Phase 3.1 Stage 17 (P1-2): clarifies the timeline lists SELECTED key events,
   *  so the displayed amounts intentionally do not sum to the reported total. */
  abbreviatedNote: string;
}

/** Attack Technique Analysis (pages 11-12) translations. */
export interface AttackTechnique {
  intro: string;
  // ── Address poisoning campaign ──
  poisoningHeader: string;
  poisoningIntro: string;
  /** Phase 3.1 Stage 16 (P2-1): explains HOW poisoning works for a lay reader —
   *  zero-value / dust transfers planted in the victim's history. */
  poisoningMechanismNote: string;
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
  /** Phase 3.1 Stage 7 (A4): clarifies senders-vs-transactions mismatch. */
  mainCollectorSendersNote: string;
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
  /** Phase 3.1 Stage 6/7 (T1/A1): unit-separated economic-loss line for the
   *  Exec Summary. `real` = real-currency sent to the cluster; `misdirected` =
   *  real-currency to a spoof; `spoofUnits` = worthless spoof-token units
   *  (kept SEPARATE — never summed with real currency). */
  totalEconomicLossLine: (real: string, misdirected: string, spoofUnits: string) => string;
  fundFlow: string;
  sourceDeposits: (n: number) => string;
  victimsCount: (n: number) => string;
  inclCexDeposits: string;
  victimWalletBadge: string;
  scamWalletBadge: string;
  counterpartyWallets: (n: number) => string;
  /** Phase 3.1 Stage 16 (P1-1): flow-box label using the real-value recipient
   *  count (consistent with the Stage 15 narrative split), plus a spoof note. */
  counterpartyWalletsReal: (n: number) => string;
  spoofRecipientsNote: (n: number) => string;
  receiversCount: (n: number) => string;
  kycExchange: string;
  suspectedScammerCluster: string;
  oneOfManySources: (n: number) => string;
  ifYouSentFunds: string;
  transactionPath: (label: string) => string;
  cashOutSuffix: (exchange: string) => string;
  /** Phase 3.1 Stage 12 (P0-2): route tail when NO scammer KYC exit was detected. */
  counterpartyGroupSuffix: string;
  toLocateTransaction: string;
  locateStep1: string;
  locateStep2: string;
  locateStep3: string;
  evidenceStrengthTitle: string;
  /** Phase 3.1 Stage 16 (P2-3): explains the evidence-strength score is the
   *  proportion of evidentiary factors met (documentation completeness). */
  evidenceMethodologyNote: string;
  reportSuitabilityTitle: string;
  exchangeKycEntryVsExit: string;
  kycEntryPointLabel: string;
  /** Phase 3.1 Stage 8: Binance compliance channel (no direct victim email). */
  binanceComplianceChannel: string;
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
    victimForwarded: (realCount: number, spoofOnlyCount: number) => string;
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

/**
 * India recovery-resources content. English-first (India's official fraud-
 * reporting channels operate in English/Hindi), shared across locales until
 * hi/bn/mr translations land. All facts verified June 2026 against official
 * sources (cybercrime.gov.in, I4C/MHA, RBI CMS, FIU-IND).
 */
const INDIA_GUIDANCE: IndiaGuidance = {
  title: 'Reporting in India — Authorities & Process',
  intro: 'India operates a centralized cybercrime-reporting system. The fastest action for a crypto-fraud victim is to call the 1930 helpline and file on the National Cyber Crime Reporting Portal — ideally within the first hour, while funds may still be frozen at the receiving account.',
  i4cTitle: 'I4C — National Cyber Crime Reporting Portal + 1930 Helpline',
  i4cPortal: 'Portal: cybercrime.gov.in (NCRP — Ministry of Home Affairs / I4C)',
  i4cHelpline: 'Helpline: 1930 — 24/7, toll-free, available in Hindi, English and major regional languages',
  i4cGoldenHour: 'Golden hour: call 1930 within ~1 hour of the transfer — the operator can coordinate with banks to freeze the destination account before withdrawal.',
  i4cZeroFir: 'For losses above ₹10 lakh, the e-Zero FIR initiative (since May 2025) automatically registers a Zero FIR.',
  i4cDescription: 'This is the primary, first-stop channel for any cryptocurrency-fraud victim in India. File here first, then attach this forensic report to your complaint.',
  policeTitle: 'Local Police — Cyber Cell / Zero FIR',
  policeFir: 'File an FIR at your local cyber cell. A Zero FIR can be lodged at any police station regardless of jurisdiction, then transferred to the competent one.',
  policeDescription: 'Opens the formal criminal case. Submit this LedgerHound forensic report as supporting evidence of the coordinated fraud and the on-chain fund flow.',
  rbiTitle: 'RBI Ombudsman (RB-IOS) — via CMS',
  rbiPortal: 'Portal: cms.rbi.org.in (Reserve Bank Integrated Ombudsman Scheme)',
  rbiProcess: 'Complain to your bank first and allow 30 days; then escalate to the RBI Ombudsman. Compensation of up to ₹30 lakh is possible.',
  rbiDescription: 'The banking track — relevant if your funds passed through a bank account or UPI before being converted to cryptocurrency.',
  exchangeTitle: 'FIU-IND Registered Exchange — Grievance Officer',
  exchangeProcess: 'Every Indian Virtual Digital Asset (VDA) exchange must register with FIU-IND and designate a principal officer plus a grievance-redressal mechanism.',
  exchangeDescription: "If the trail reaches an Indian exchange, submit this forensic report to that exchange's grievance officer to request KYC disclosure and record preservation (with your police case number).",
};

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
    rowScamEntity: 'Scam-flagged counterparty entity',
    rowHighOutflow: 'High native outflow with no exchange',
    rowLowActivity: 'Very low transaction count',
    rowPhishingTag: 'Wallet(s) tagged by internal/community sources (phishing)',
    rowFederationScam: 'External scam-flagged counterparty(ies)',
    rowPoisoning: 'Confirmed address-poisoning campaign',
    rowUnicode: 'Unicode token spoofing detected',
    rowEtherscanTag: 'Independent Etherscan verification (Fake_Phishing tag)',
    rowSanctionsFloor: 'External sanctions flag (severity floor)',
    rowBehavioralFloor: 'Behavioral pattern severity floor',
    rowCap: 'Score capped at maximum (100)',
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
    totalEconomicLossLine: (real, misdirected, spoofUnits) => {
      let s = `Victim's confirmed economic loss: ${real} sent to fraud-group addresses`;
      if (misdirected) s += ` (of which ${misdirected} was misdirected to an address-poisoning spoof address)`;
      s += '.';
      if (spoofUnits) s += ` Additionally, ${spoofUnits} units of worthless spoof tokens were sent to the same group as an obfuscation technique — see Attack Technique Analysis (no economic value).`;
      return s;
    },
    fundFlow: 'Fund Flow',
    sourceDeposits: (n) => `~${n} Source Deposit(s)`,
    victimsCount: (n) => `${n} Victims`,
    inclCexDeposits: '(incl. CEX deposits)',
    victimWalletBadge: 'VICTIM WALLET',
    scamWalletBadge: 'SCAM WALLET',
    counterpartyWallets: (n) => `${n} Counterparty Wallet(s)`,
    counterpartyWalletsReal: (n) => `${n} Wallet(s) received real funds`,
    spoofRecipientsNote: (n) => `+ ${n} with spoof tokens (no value)`,
    receiversCount: (n) => `${n} Receivers`,
    kycExchange: 'KYC Exchange',
    suspectedScammerCluster: 'Suspected Scammer Cluster',
    oneOfManySources: (n) => `Note: This wallet is one of approximately ${n > 0 ? n : 'several'} source(s) sending funds to the same recipient cluster. The pattern is consistent with the wallet owner being a victim, not a scam operator.`,
    ifYouSentFunds: 'If You Sent Funds to This Wallet:',
    transactionPath: (label) => `Your transaction likely followed this path: YOU → This Wallet (${label})`,
    cashOutSuffix: (exchange) => ` → ${exchange} (Cash-out)`,
    counterpartyGroupSuffix: ' → Counterparty Group (extended trace pending)',
    toLocateTransaction: 'To locate your specific transaction:',
    locateStep1: 'Find your TXID in the Transaction History section of this report',
    locateStep2: 'Note the date, amount, and transaction hash',
    locateStep3: 'Include this information in your police report and exchange complaint',
    evidenceStrengthTitle: 'Evidence Strength',
    evidenceMethodologyNote: 'Score = the proportion of the evidentiary factors listed below that are met. It measures documentation completeness, not recovery probability.',
    reportSuitabilityTitle: 'Report Suitability',
    exchangeKycEntryVsExit: 'Exchange KYC — Entry vs Exit',
    kycEntryPointLabel: "KYC ENTRY POINT (victim's funding source)",
    binanceComplianceChannel: "compliance channel — victims: support ticket category 'Report fraud/scam' (DO NOT use a compliance email directly)",
    interactions: (n) => `${n} interaction(s)`,
    noneDetected: 'None detected.',
    identifiesVictimAccount: "Identifies the VICTIM'S exchange account — useful to confirm victim identity for legal proceedings, not the scammer's.",
    kycExitPointLabel: 'KYC EXIT POINT (scammer cash-out)',
    exitNotDetected: "Not detected in subject wallet's direct history. The observed pattern is consistent with coordinated control of the funds by the fraud operators; identifying a cash-out exchange requires an expanded counterparty trace (one or more hops beyond this wallet).",
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
      victimForwarded: (realCount, spoofOnlyCount) => {
        const tail = ' — consistent with sending to wallets presumably controlled by the fraud operators';
        if (realCount === 0) return `Sent only worthless spoof tokens to ${spoofOnlyCount} unknown address(es)${tail}`;
        const base = `Forwarded funds to ${realCount} unknown address(es) with real economic value`;
        return spoofOnlyCount > 0
          ? `${base} (and to ${spoofOnlyCount} additional address(es) that received only worthless spoof tokens)${tail}`
          : `${base}${tail}`;
      },
      victimLimitedHistory: (n) => `Limited transaction history (${n} txs) — typical retail user profile`,
      victimRapidForward: (pct) => `${pct}% of funds forwarded within 24h (by volume) — rapid action under social engineering pressure`,
      aggregatorSenders: (senders, receivers) => `${senders} unique senders aggregated into ${receivers} destination(s)`,
      aggregatorConsolidated: (exchange) => `Funds consolidated and forwarded to KYC exchange (${exchange}) — characteristic of a scam collection wallet`,
      transitForwarded: (pct) => `${pct}% of funds forwarded within 24h (by volume)`,
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
      summaryVictim: (inDisp, kycDeposits, pct, receivers, outDisp, nativeSuffix) => `This wallet shows the behavioral profile of a victim wallet. It received ${inDisp} from ${kycDeposits} KYC exchange deposit(s), then forwarded ${pct}% of those funds (by volume) to ${receivers} unknown counterparty address(es) within 24 hours. Total outflow: ${outDisp}.${nativeSuffix}`,
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
      courtUpgrade: 'Supporting documentation for legal proceedings (certified version available)',
    },
  },
  attackTechnique: {
    intro: 'Forensic analysis identified specific scam techniques used against this wallet. These are professional methods employed by coordinated cryptocurrency fraud operations and constitute important supporting documentation for legal and administrative proceedings.',
    poisoningHeader: 'Address Poisoning Campaign Detected',
    poisoningMechanismNote: 'How poisoning works: these addresses sent zero-value (0 USDT) or tiny dust transfers TO the victim’s wallet — not to move funds, but so the look-alike address appears in the victim’s transaction history. When the victim later copies an address from that history to make a payment, they can mistakenly copy the spoofed address instead of the legitimate one. Addresses that planted dust but received no real funds are part of the attack even though they hold no value.',
    poisoningIntro: 'A coordinated address poisoning attack was identified. A cluster of visually similar addresses (sharing prefix and suffix patterns) was deployed to confuse the victim and distribute fraudulent inflows across multiple wallets — hindering compliance and investigative actions. All addresses in this cluster are consistent with coordinated control; the highest-volume address functions as the main collector, while the rest operate as secondary spoofs.',
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
    mainCollectorDesc: (desc, txCount) => `Received ${desc} across ${txCount} transaction(s) — main receiving wallet observed in this coordinated pattern.`,
    mainCollectorSendersNote: 'Note: the number of transactions to the main collector may differ from the total unique senders to this wallet, as some senders correspond to address-poisoning attempts from the same fraud group rather than victim deposits.',
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
    forensicInterpretationBody: (pattern, count) => `The vanity pattern (${pattern}) shared across ${count} addresses is statistically improbable by chance (~1 in 4.3 billion per pair for 8 matching characters). This is characteristic of a deliberate, coordinated address poisoning campaign by a multi-wallet coordinated operation, with three goals: (1) confusion — trick the victim into copying the wrong address from history; (2) risk distribution — spread inflows across wallets to evade blacklisting; (3) investigation obfuscation — fragment the destination to complicate tracing.`,
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
    combiningMarksNote: 'Uses combining diacritical marks; display shows NFC-normalised form for readability — original byte sequence preserved above. (NFC = Normalization Form Canonical Composition, a Unicode standard for consistent representation of combining characters.)',
    exampleLine: (date, addr) => `e.g. ${date} · from ${addr}`,
    bottomMethodology: 'Methodology: Address poisoning detection matches counterparty addresses against actual recipients on a 4-character prefix + 4-character suffix basis (8 hex characters of visual overlap). Unicode spoofing detection normalises token symbols (NFKD decomposition + a curated confusable-character map across Lisu, Cyrillic, Greek and fullwidth Latin) and compares against legitimate tickers. Codepoints are shown in standard U+ notation so the evidence is verifiable independent of font rendering.',
  },
  assetSummary: {
    realAssetsHeader: 'Real Assets',
    colToken: 'Token',
    colTotalIn: 'Total In',
    colTotalOut: 'Total Out',
    colNet: 'Net account flow',
    netFlowClarification: "Note: \"Net account flow\" is the period's accounting balance, NOT the economic loss. Incoming funds are mostly the victim's own deposits (e.g. from their exchange), not recovery. The confirmed economic loss is stated in the Executive Summary.",
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
    footnoteSpoofUnits: (breakdown) => ` Separately, ${breakdown} of worthless spoof-token units (no market value) were routed to addresses associated with the coordinated pattern.`,
    footnoteTail: ' See Attack Technique Analysis. Real funds were lost to visual address confusion, not legitimately transferred; spoof-token units carry no value and are reported separately.',
  },
  timeline: {
    walletFirstActive: 'Wallet first active',
    received: (amount, token, from) => `Received ${amount} ${token} from ${from}...`,
    sent: (amount, token, to) => `Sent ${amount} ${token} to ${to}`,
    lastActivity: 'Last recorded activity',
    keyEventBadge: 'KEY EVENT',
    misdirectionBadge: '⚠ POISONING MISDIRECTION',
    sentToSpoofNote: 'Sent to an address-poisoning spoof — not the intended recipient.',
    sentToRole: (amount, token, role) => `Sent ${amount} ${token} ${role}`,
    roleMainCollector: 'to the MAIN COLLECTOR',
    roleSpoofAddress: 'to a SPOOF ADDRESS',
    poisoningCollisionNote: 'Note: the main collector and the spoof address are distinct transactions to visually similar addresses (same prefix/suffix, different middle) — the signature of the address-poisoning attack. The misdirected amount is already included once in the total real USDT forwarded (it is not counted twice).',
    totalActivePeriod: (first, last) => `Total Active Period: ${first} to ${last}`,
    inactiveSuffix: (n) => ` (inactive for ${n} days)`,
    noTimeline: 'No timestamped transactions available for timeline construction.',
    abbreviatedNote: 'Abbreviated timeline — selected key events only. The amounts shown are a selection and intentionally do not sum to the reported total; see the Transaction History page (or Etherscan) for the complete list of transfers.',
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
      `${pct}% of incoming deposits forwarded within 24 hours (by deposit count)`,
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
    directionLegend: 'IN = funds received by the analyzed wallet (e.g. an exchange deposit); OUT = funds sent by the analyzed wallet.',
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
    exitTruncatedNote: 'Showing primary destinations by volume. See the Complete Transaction History for all transfers.',
    exitAggregateNote: 'Amounts are the cumulative total sent to each destination; the number in parentheses is the transaction count.',
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
  recovery: {
    probabilityLabel: 'Probability:',
    recoveryIfConfirmedLabel: 'Recovery if confirmed:',
    overallRecoveryProbability: 'OVERALL RECOVERY PROBABILITY',
    chance: { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' },
    ofacNoticeTitle: 'OFAC COMPLIANCE NOTICE',
    ofacNoticeBody: 'Interaction with SDN addresses triggers blocking obligations. Consult OFAC compliance counsel.',
    recommendedActions: 'Recommended Actions',
    scenarioAName: 'Scenario A: Funds reached KYC exchange',
    scenarioADescKyc: 'Exchange detected. Subpoena can reveal account holder identity.',
    scenarioADescNoKyc: 'No exchange exit detected yet. Deeper trace may reveal exchange endpoint.',
    scenarioAActionKyc: 'File subpoena to exchange compliance department',
    scenarioAActionNoKyc: 'Commission deep trace to find exchange endpoint',
    scenarioBName: 'Scenario B: Funds in unknown wallets',
    scenarioBDesc: 'Funds held in unidentified wallets. May be intermediary or final destination.',
    scenarioBAction: 'Continue monitoring for movement to exchange',
    scenarioCName: 'Scenario C: Funds mixed or bridged',
    scenarioCDescMixer: 'Mixer usage detected. Professional demixing analysis required.',
    scenarioCDescNoMixer: 'No mixer detected. Cross-chain bridge may have been used.',
    scenarioCActionMixer: 'Engage specialized demixing service',
    scenarioCActionNoMixer: 'Check destination chains for continued activity',
    entryPointBold: (brand) => `${brand} Entry Point (Victim Funding):`,
    entryPointText: (brand) => `The victim funded this wallet via ${brand}. A subpoena to ${brand} compliance can confirm victim identity for case-file completeness, but does NOT identify the scammer. Use this primarily for (a) victim identity verification in legal proceedings, and (b) detecting whether the scammer ever transferred funds back to a ${brand} account.`,
    counterpartyExitBold: 'Counterparty Exit Trace (required for scammer identification):',
    counterpartyExitText: 'The observed pattern is consistent with coordinated control of the funds within this wallet’s transaction history. Identifying the cash-out exchange requires tracing one or more hops beyond the cluster — this expanded analysis is the recommended next investigative step.',
    kycExitBold: 'KYC Exit Point Identified:',
    kycExitText: (brand) => `Funds reached ${brand}. File an urgent preservation/discovery request with that exchange’s compliance team to pursue the account holder behind the cash-out.`,
    ic3Bold: 'File FBI IC3 / Local Police Report:',
    ic3Text: 'Report at ic3.gov (if US-based) or via your local cybercrime unit. Reference this Case ID and attach this report as supporting documentation.',
    exchangeComplianceBold: 'Exchange Compliance Notification:',
    exchangeComplianceText: "Submit a preservation request to the compliance teams of the identified exchanges. Even absent a scammer KYC exit, this creates an official record and may assist the exchange's internal risk review.",
    tokenIssuerBold: 'Token Issuer Coordination:',
    tokenIssuerText: 'For USDT-denominated transfers to flagged wallets, submit an evidence package to Tether legal (legal@tether.to) for compliance review (enforcement decisions are at Tether\'s discretion).',
    courtCertifiedBold: 'Court-Certified Forensic Investigation:',
    courtCertifiedText: 'For court testimony, certified methodology, or an expanded counterparty trace, contact LedgerHound at contact@ledgerhound.vip for a certified expanded forensic investigation.',
    assessmentLabel: {
      MODERATE: 'Moderate — multiple positive factors present, but recovery still requires sustained legal action',
      LOW_TO_MODERATE: 'Low to moderate — some positive factors, but recovery requires sustained legal effort and is not guaranteed',
      LOW: 'Low — recovery requires sustained legal effort and may take 6-18 months',
      VERY_LOW: 'Very low — recovery is unlikely but documentation enables legal/tax claims',
    },
    assessmentDisclaimer: 'Statistical estimate based on case characteristics. Most cryptocurrency fraud cases do not result in full recovery. This metric is not a guarantee, prediction, or promise. Actual recovery depends on law enforcement action, exchange cooperation, and legal proceedings.',
    factorKycExchange: (label) => `Funds routed through KYC exchange (${label}) — records may be obtainable through legal process`,
    factorFraudCluster: 'Counterparty linked to identified fraud cluster — strengthens legal case',
    factorPhishingTag: (n) => `${n} address(es) in the poisoning cluster officially tagged Fake_Phishing by Etherscan — independent evidence the vanity cluster belongs to a known phishing operation`,
    factorRecent30: 'Recent activity (<30 days) — funds may still be in early laundering stages',
    factorRecent7: 'Very recent activity (<7 days) — improves the chance of an exchange/issuer compliance hold (at their discretion)',
    factorMixer: 'Mixer (Tornado Cash / Blender / Sinbad) usage detected — funds heavily obfuscated',
    factorLargeOutflow: 'Large outflow volume — scammers prioritize rapid cash-out for high-value cases',
    factorStale: 'Stale activity (>6 months) — funds likely already cashed out',
  },
  findings: {
    ofacCritical: (labels) => `CRITICAL: Wallet interacted with OFAC-sanctioned address(es): ${labels}. US persons are prohibited from transacting with these addresses.`,
    mixerDetected: 'Interactions with known mixer/tumbler services detected (Tornado Cash or similar). This is a significant risk indicator.',
    exchangesInteracted: (exchanges) => `Funds interacted with identified exchanges: ${exchanges}. KYC data may be available via subpoena.`,
    scamFlagged: 'Interactions with flagged/scam-associated addresses detected.',
    scamDbMatch: (addrShort, platforms, reports, totalLoss) => `Counterparty ${addrShort} linked to "${platforms}" in LedgerHound Scam Database (${reports} reports, $${totalLoss} total losses).`,
    stableSent: (amount, symbol, n) => `sent ${amount} ${symbol} across ${n} transfer${n === 1 ? '' : 's'}`,
    stableReceived: (amount, symbol, n) => `received ${amount} ${symbol} across ${n} transfer${n === 1 ? '' : 's'}`,
    stableWallet: (parts) => `Wallet ${parts}.`,
    nativeDust: (amount, currency, n) => `Native ${currency} movement: ${amount} ${currency} across ${n} transaction${n === 1 ? '' : 's'} — gas/dust, separate from the stablecoin volume above.`,
    nativeSent: (amount, currency, n) => `Wallet sent ${amount} ${currency} across ${n} native transaction${n === 1 ? '' : 's'}.`,
    inactive: (days, lastActivity) => `Wallet inactive for ${days} days (last activity: ${lastActivity}). Funds may have been moved to other wallets.`,
    spamFiltered: (n) => `${n} spam/airdrop token transfers were detected and filtered from this analysis.`,
    crossChainBridge: (n, summary) => `CROSS-CHAIN: ${n} bridge interaction${n === 1 ? '' : 's'} detected. ${summary}`,
    multiChain: (chains, chainList) => `MULTI-CHAIN: Wallet active on ${chains} chains: ${chainList}.`,
    laundering: (confidence, reason) => `CRITICAL: Cross-chain intent analysis indicates likely laundering behavior (${confidence}% confidence). ${reason}`,
    behavioral: (name, confidence, evidence) => `BEHAVIORAL: ${name} detected (${confidence}% confidence). ${evidence}`,
    none: 'No high-risk indicators detected in automated analysis. Manual review recommended for comprehensive assessment.',
  },
  steps: {
    stepLabel: (n) => `STEP ${n}`,
    recoveryPathIdentified: 'RECOVERY PATH IDENTIFIED',
    recoveryRequiresInvestigation: 'RECOVERY REQUIRES INVESTIGATION',
    recoveryPathBody: 'Funds were traced to KYC-regulated exchange(s). The account holder identity may be obtainable through legal process (subject to exchange cooperation and data availability). Time-sensitive action is required to prevent fund withdrawal.',
    recoveryPathVictimBody: 'The KYC entry point was identified (your funding exchange), which confirms your identity to the authorities. NOTE: NO scammer KYC cash-out point was identified in the direct trace of this wallet — an expanded counterparty trace (upgrade available) may identify one. Priority: preserve records now.',
    recoveryPathGeneric: 'EVIDENCE PRESERVATION OPPORTUNITY',
    recoveryPathGenericBody: 'Although no KYC cash-out point was identified in the direct trace, evidence preservation and an expanded counterparty trace can improve the chances of recovery.',
    recoveryRequiresBody: 'No direct exchange exits identified. Recovery may require advanced tracing, law enforcement cooperation, or specialized forensic analysis.',
    step1Title: 'Submit Preservation Request to Exchange Compliance',
    step1Body: 'The exchange(s) below received funds from this wallet and hold the relevant KYC records AND the technical ability to flag the receiving wallets in their internal systems. An early preservation request becomes part of the official record.',
    step1Closing: (caseId) => `Send a preservation request to the compliance department referencing your police report number and this case ID (${caseId}). Request preservation of records and subscriber-information disclosure. Where the exchange confirms suspicious activity, you may request a precautionary account hold (granted at the exchange's discretion).`,
    step1BannerVictim: 'KYC FUNDING POINT IDENTIFIED (VICTIM)',
    step1TitleVictim: 'Request Preservation of Your KYC Records (Funding Exchange)',
    step1BodyVictim: 'Your wallet was funded through the exchange(s) below, which confirms your identity as the victim. These KYC records belong to you and should be preserved officially for legal proceedings. NOTE: direct tracing of this wallet did NOT identify a KYC cash-out point used by the scammer — an expanded counterparty trace (upgrade available) may identify one. An early preservation request still becomes part of the official record and can help flag the receiving wallets.',
    step1ClosingVictim: (caseId) => `Send a preservation request to the compliance department referencing your police report number and this case ID (${caseId}). Request preservation of your KYC records and ask the exchange to flag the receiving wallets in their internal systems.`,
    step1TitleGeneric: 'Submit Preservation Request to Exchange Compliance',
    step1BodyGeneric: 'The exchange(s) below interacted with this wallet and may hold relevant records. An early preservation request becomes part of the official record, even where the scammer\'s cash-out point has not yet been confirmed.',
    step1ClosingGeneric: (caseId) => `Send a preservation request to the compliance department referencing your police report number and this case ID (${caseId}). Request preservation of records and subscriber-information disclosure.`,
    step1Interactions: (interactions, addrCount) => `${interactions} interaction(s) · ${addrCount} hot wallet${addrCount > 1 ? 's' : ''}`,
    step1MoreAddrs: (n) => ` (+${n} more)`,
    step1NoContact: 'No published law-enforcement contact recorded — consult attorney for proper service channel.',
    step1BinanceChannel: "Access your Binance account -> Support -> 'Report fraud/scam' category. The Law Enforcement portal (lawenforcement.binance.com) is for authorities only.",
    lawEnforcementTitle: 'File Law Enforcement Reports',
    ic3Bullet: 'FBI IC3 complaint — ic3.gov (reference this report)',
    localPoliceBullet: 'Local police report — needed for exchange compliance requests',
    ftcBullet: 'FTC report — reportfraud.ftc.gov',
    sarBullet: 'Request SAR filing — transit wallet pattern indicates a coordinated fraud pattern',
    lawEnforcementClosing: (caseId) => `Include Case ID ${caseId}, wallet address, and attach this forensic report as evidence.`,
    legalProceedingsTitle: 'Legal Proceedings',
    legalSubpoena: (brand) => `Retain attorney for emergency subpoena to ${brand}`,
    legalIdentityRequest: 'Request account holder identity: name, address, government ID, bank info',
    legalCivilRecovery: 'File civil asset recovery proceedings once identity obtained',
    legalPreservationLetter: 'Send Preservation Letter to request preservation and compliance review of related accounts',
    legalConsultAttorney: 'Consult attorney experienced in cryptocurrency fraud recovery',
    legalAdvancedTracing: 'Explore advanced blockchain tracing and cross-chain analysis',
    legalInternational: 'Consider international cooperation if funds crossed jurisdictions',
    preserveEvidenceTitle: 'Preserve Evidence',
    preserve1: 'Save all communications with the scammer (screenshots, emails, messages)',
    preserve2: 'Preserve this forensic report as supporting documentation for legal proceedings',
    preserve3: 'Document the timeline of events in writing',
    preserve4: 'Do not communicate with the scammer further',
    ctaTitle: 'Need Help Executing These Steps?',
    ctaBody: 'LedgerHound offers certified forensic investigations with expert testimony, full chain-of-custody documentation, and direct coordination with law enforcement and exchanges.',
  },
  disclaimer: {
    para1: 'This report was generated automatically by LedgerHound, a service of USPROJECT LLC. It is provided for informational purposes only and does not constitute legal, financial, or investment advice.',
    para2: 'The analysis contained herein is based on publicly available blockchain data retrieved at the time of report generation. Blockchain data is permanent and immutable; however, the attribution of wallet addresses to known entities is based on proprietary and open-source intelligence databases that may not be comprehensive.',
    para3: 'This automated report is not a substitute for a certified forensic investigation conducted by a qualified blockchain forensic analyst. For matters requiring court testimony, certified methodology, or regulatory compliance, a certified expanded forensic investigation is recommended.',
    para4: 'Risk scores are generated algorithmically and should be interpreted as preliminary indicators only. A low risk score does not guarantee legitimacy, and a high risk score does not definitively indicate criminal activity.',
    para5: 'LedgerHound and USPROJECT LLC are not law firms and do not provide legal representation. Users should consult with qualified legal counsel before taking any legal action based on the contents of this report.',
    para6: 'By purchasing and using this report, you agree that USPROJECT LLC\'s liability is limited to the purchase price of the report.',
    tagline: 'Blockchain Forensics & Crypto Asset Tracing',
    integrityTitle: 'Integrity Verification (SHA-256)',
    integrityNote: 'Computed over the forensic report content excluding this verification field. Allows verification that the report content has not been altered since generation. The same value is included in the delivery email.',
  },
  fundFlow: {
    intro: 'Visual representation of fund movements between the analyzed wallet and its top counterparties by transaction volume.',
    colNum: '#',
    colLabel: 'Label',
    colType: 'Type',
    colVolume: 'Volume',
    colDirection: 'Direction',
    nodeType: (type) => (({
      source: 'SOURCE', exchange: 'EXCHANGE', mixer: 'MIXER', scam: 'SCAM',
      scam_db: 'SCAM DB', defi: 'DEFI', bridge: 'BRIDGE', unknown: 'UNKNOWN',
    } as Record<string, string>)[type.toLowerCase()] ?? type.toUpperCase()),
    legendYourWallet: 'Your Wallet',
    legendExchange: 'Exchange',
    legendMixer: 'Mixer',
    legendDefi: 'DeFi',
    legendScam: 'Scam',
    legendScamDb: 'Scam DB',
    legendUnknown: 'Unknown',
    legendIncoming: 'Incoming',
    legendOutgoing: 'Outgoing',
    noGraph: 'Fund flow graph could not be generated for this wallet. This may occur when the wallet has very few transactions or all counterparties are filtered as dust.',
    interactiveLine: 'For an interactive fund flow visualization, visit www.ledgerhound.vip/graph-tracer',
    realFlowLegend: 'Real funds flow',
    spoofFlowLegend: 'Fake token (no market value)',
    fakeNoValueWarning: 'no value',
  },
  transactions: {
    titleSuffix: (n) => ` (Top ${n})`,
    colDate: 'Date',
    colDir: 'Dir',
    colFrom: 'From',
    colTo: 'To',
    colValue: 'Value',
    colToken: 'Token',
    spoofFootnote: '⚠ Highlighted rows are Unicode-spoof tokens (fake symbols mimicking real currencies) — see Attack Technique Analysis.',
    spamFilteredNote: (n) => `Showing legitimate transfers only. ${n} spam/airdrop token transfers were filtered from this analysis.`,
    truncationNote: (shown, total) => `Showing ${shown} representative transfers (up to 3 per asset) of ${total} total. The full transaction history is available on-chain (e.g. Etherscan).`,
  },
  countryGuidance: {
    peru: {
      title: 'Peru-Specific Recovery Resources',
      intro: 'The following Peruvian authorities and organizations can help advance this case. Submit this forensic report as supporting documentation for access to their respective legal channels.',
      divindatTitle: 'DIVINDAT — Division of High Technology Crime Investigation',
      divindatAddress: 'Av. España 323, Cercado de Lima',
      divindatPhone: 'Phone: (01) 431-8898',
      divindatEmail: 'Email: divindat.pnp@gmail.com',
      divindatHours: 'Hours: Monday-Friday, 8:00-17:00',
      divindatDescription: 'DIVINDAT investigates cybercrime including cryptocurrency fraud. Submit a personal complaint together with this forensic report.',
      ministerioPublicoTitle: 'Ministerio Público — Online Complaints',
      ministerioPublicoUrl: 'https://denuncias.mpfn.gob.pe/',
      ministerioPublicoDescription: 'Official system for filing formal complaints. Keep the case number assigned to you.',
      sbsTitle: 'SBS — Superintendency of Banking, Insurance and AFP',
      sbsPhone: 'Toll-free: 0-800-10840',
      sbsEmail: 'Email: solucion@sbs.gob.pe',
      sbsDescription: 'For cases involving local financial entities. SBS can issue alerts on suspicious accounts.',
      indecopiTitle: 'INDECOPI — Consumer Defense',
      indecopiPhone: 'Phone: 224-7777',
      indecopiUrl: 'https://www.consumidor.gob.pe/',
      indecopiDescription: 'If the scam involved local investment services with deceptive advertising, INDECOPI can initiate administrative proceedings against the offender.',
      calTitle: 'Colegio de Abogados de Lima (CAL)',
      calUrl: 'https://www.cal.org.pe/',
      calDescription: 'Before hiring a lawyer, verify active membership at CAL or the corresponding regional bar association. For crypto fraud cases, seek lawyers with experience in economic crimes.',
      reniecTitle: 'RENIEC — Identity Protection',
      reniecUrl: 'https://www.reniec.gob.pe/',
      reniecDescription: 'If you provided your DNI (national ID) to scammers during a fake KYC process, consider an identity alert at RENIEC and credit monitoring through Equifax Perú or Sentinel.',
      disclaimer: 'This forensic report may be presented as supporting documentation to any of the authorities listed above.',
      documentsTitle: 'Documents in this package',
      documentsIntro: 'This report is accompanied by 3 recovery templates (.md), to be used in this order:',
      documentsDivindat: 'divindat-denuncia-es.md — Formal complaint for DIVINDAT Lima (file first, this week).',
      documentsBinance: "binance-compliance-es.md — Report to Binance support, category 'Report fraud/scam' (within 7 days after the complaint).",
      documentsTether: 'tether-legal-es.md — Email to Tether Legal (send after you have the police case number).',
      documentsOrder: 'Each template references this forensic report as supporting evidence.',
    },
    india: INDIA_GUIDANCE,
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
    rowScamEntity: 'Contraparte marcada como estafa',
    rowHighOutflow: 'Alta salida de moneda nativa sin exchange',
    rowLowActivity: 'Número de transacciones muy bajo',
    rowPhishingTag: 'Wallet(s) marcada(s) por fuentes internas/comunitarias (phishing)',
    rowFederationScam: 'Contraparte(s) marcada(s) como estafa por fuentes externas',
    rowPoisoning: 'Campaña de envenenamiento de direcciones confirmada',
    rowUnicode: 'Suplantación de tokens Unicode detectada',
    rowEtherscanTag: 'Verificación independiente Etherscan (etiqueta Fake_Phishing)',
    rowSanctionsFloor: 'Marca de sanciones externa (piso de severidad)',
    rowBehavioralFloor: 'Piso de severidad por patrón conductual',
    rowCap: 'Puntuación limitada al máximo (100)',
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
    totalEconomicLossLine: (real, misdirected, spoofUnits) => {
      let s = `Pérdida económica confirmada de la víctima: ${real} enviados a direcciones del grupo de fraude`;
      if (misdirected) s += ` (de los cuales ${misdirected} fueron desviados a una dirección de suplantación por envenenamiento)`;
      s += '.';
      if (spoofUnits) s += ` Adicionalmente, ${spoofUnits} unidades de tokens falsificados sin valor económico fueron enviadas al mismo grupo como técnica de ocultamiento — ver Análisis de Técnicas de Ataque.`;
      return s;
    },
    fundFlow: 'Flujo de Fondos',
    sourceDeposits: (n) => `~${n} Depósito(s) de Origen`,
    victimsCount: (n) => `${n} Víctimas`,
    inclCexDeposits: '(incl. depósitos de exchange)',
    victimWalletBadge: 'WALLET DE VÍCTIMA',
    scamWalletBadge: 'WALLET DE ESTAFA',
    counterpartyWallets: (n) => `${n} Wallet(s) de Contraparte`,
    counterpartyWalletsReal: (n) => `${n} Wallet(s) recibieron fondos reales`,
    spoofRecipientsNote: (n) => `+ ${n} con tokens falsificados (sin valor)`,
    receiversCount: (n) => `${n} Receptores`,
    kycExchange: 'Exchange KYC',
    suspectedScammerCluster: 'Grupo Sospechoso de Estafa',
    oneOfManySources: (n) => `Nota: Esta wallet es una de aproximadamente ${n > 0 ? n : 'varias'} fuente(s) que envían fondos al mismo grupo receptor. El patrón es consistente con que el dueño de la wallet sea una víctima, no un operador de estafa.`,
    ifYouSentFunds: 'Si Usted Envió Fondos a Esta Wallet:',
    transactionPath: (label) => `Su transacción probablemente siguió esta ruta: USTED → Esta Wallet (${label})`,
    cashOutSuffix: (exchange) => ` → ${exchange} (Retiro)`,
    counterpartyGroupSuffix: ' → Grupo de Contraparte (rastreo ampliado pendiente)',
    toLocateTransaction: 'Para localizar su transacción específica:',
    locateStep1: 'Encuentre su TXID en la sección Historial de Transacciones de este informe',
    locateStep2: 'Anote la fecha, el monto y el hash de la transacción',
    locateStep3: 'Incluya esta información en su denuncia policial y en su reclamo ante el exchange',
    evidenceStrengthTitle: 'Solidez de la Evidencia',
    evidenceMethodologyNote: 'Puntuación = la proporción de los factores evidenciarios listados abajo que se cumplen. Mide la integridad de la documentación, no la probabilidad de recuperación.',
    reportSuitabilityTitle: 'Usos del Informe',
    exchangeKycEntryVsExit: 'KYC del Exchange — Entrada vs Salida',
    kycEntryPointLabel: 'PUNTO DE ENTRADA KYC (fuente de financiamiento de la víctima)',
    binanceComplianceChannel: "canal de cumplimiento — víctimas: ticket de soporte categoría 'Report fraud/scam' (NO use un email de cumplimiento directo)",
    interactions: (n) => `${n} interacción(es)`,
    noneDetected: 'Ninguno detectado.',
    identifiesVictimAccount: 'Identifica la cuenta de exchange de la VÍCTIMA — útil para confirmar la identidad de la víctima en procedimientos legales, no la del estafador.',
    kycExitPointLabel: 'PUNTO DE SALIDA KYC (retiro del estafador)',
    exitNotDetected: 'No detectado en el historial directo de la wallet analizada. El patrón observado es consistente con control coordinado de los fondos por los operadores del fraude; identificar un exchange de retiro requiere un rastreo ampliado de la contraparte (uno o más saltos más allá de esta wallet).',
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
      victimForwarded: (realCount, spoofOnlyCount) => {
        const tail = ' — consistente con envíos a wallets presuntamente controladas por los operadores del fraude';
        if (realCount === 0) return `Envió únicamente tokens falsificados sin valor a ${spoofOnlyCount} dirección(es) desconocida(s)${tail}`;
        const base = `Reenvió fondos a ${realCount} dirección(es) desconocida(s) con valor económico real`;
        return spoofOnlyCount > 0
          ? `${base} (y a ${spoofOnlyCount} dirección(es) adicional(es) que solo recibieron tokens falsificados sin valor)${tail}`
          : `${base}${tail}`;
      },
      victimLimitedHistory: (n) => `Historial de transacciones limitado (${n} txs) — perfil típico de usuario minorista`,
      victimRapidForward: (pct) => `${pct}% de los fondos reenviados en 24h (por volumen) — acción rápida bajo presión de ingeniería social`,
      aggregatorSenders: (senders, receivers) => `${senders} remitentes únicos agregados en ${receivers} destino(s)`,
      aggregatorConsolidated: (exchange) => `Fondos consolidados y reenviados a un exchange KYC (${exchange}) — característico de una wallet de recolección de estafa`,
      transitForwarded: (pct) => `${pct}% de los fondos reenviados en 24h (por volumen)`,
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
      summaryVictim: (inDisp, kycDeposits, pct, receivers, outDisp, nativeSuffix) => `Esta wallet muestra el perfil conductual de una wallet de víctima. Recibió ${inDisp} de ${kycDeposits} depósito(s) de exchange KYC, luego reenvió ${pct}% de esos fondos (por volumen) a ${receivers} dirección(es) de contraparte desconocida(s) en 24 horas. Salida total: ${outDisp}.${nativeSuffix}`,
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
      courtUpgrade: 'Documentación de Apoyo para Procedimientos Legales (versión certificada disponible)',
    },
  },
  attackTechnique: {
    intro: 'El análisis forense identificó técnicas de estafa específicas utilizadas contra esta wallet. Estos son métodos profesionales empleados por operaciones coordinadas de fraude con criptomonedas y constituyen documentación de apoyo importante para procedimientos legales y administrativos.',
    poisoningHeader: 'Campaña de Envenenamiento de Direcciones Detectada',
    poisoningMechanismNote: 'Cómo funciona el envenenamiento: estas direcciones enviaron transacciones de valor cero (0 USDT) o microcantidades (dust) HACIA la wallet de la víctima — no para transferir fondos, sino para que la dirección suplantada aparezca en el historial de transacciones de la víctima. Cuando la víctima posteriormente copia una dirección de ese historial para hacer un pago, puede copiar por error la dirección suplantada en vez de la legítima. Las direcciones que solo sembraron dust y no recibieron fondos reales forman parte del ataque aunque no tengan valor.',
    poisoningIntro: 'Se identificó un ataque coordinado de envenenamiento de direcciones. Se desplegó un grupo de direcciones visualmente similares (que comparten patrones de prefijo y sufijo) para confundir a la víctima y distribuir las entradas fraudulentas entre múltiples wallets — dificultando las acciones de cumplimiento e investigación. Todas las direcciones de este grupo son consistentes con control coordinado; la dirección de mayor volumen funciona como recolector principal, mientras que el resto operan como suplantaciones secundarias.',
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
    mainCollectorDesc: (desc, txCount) => `Recibió ${desc} en ${txCount} transacción(es) — wallet receptora principal observada en este patrón coordinado.`,
    mainCollectorSendersNote: 'Nota: el número de transacciones al recolector principal puede diferir del número total de remitentes únicos a esta wallet, ya que algunos remitentes corresponden a intentos de envenenamiento de direcciones del mismo grupo de fraude, no a depósitos de la víctima.',
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
    forensicInterpretationBody: (pattern, count) => `El patrón vanity (${pattern}) compartido entre ${count} direcciones es estadísticamente improbable por azar (~1 en 4.3 mil millones por par para 8 caracteres coincidentes). Esto es característico de una campaña de envenenamiento de direcciones deliberada y coordinada por una operación coordinada multi-wallet, con tres objetivos: (1) confusión — engañar a la víctima para que copie la dirección equivocada del historial; (2) distribución del riesgo — repartir las entradas entre wallets para evadir el bloqueo; (3) ofuscación de la investigación — fragmentar el destino para complicar el rastreo.`,
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
    combiningMarksNote: 'Usa marcas diacríticas combinantes; la visualización muestra la forma normalizada NFC para legibilidad — la secuencia original de bytes se preserva arriba. (NFC = Normalization Form Canonical Composition, estándar Unicode para la representación consistente de caracteres combinantes.)',
    exampleLine: (date, addr) => `ej. ${date} · de ${addr}`,
    bottomMethodology: 'Metodología: La detección de envenenamiento de direcciones compara las direcciones de contraparte con los receptores reales sobre una base de prefijo de 4 caracteres + sufijo de 4 caracteres (8 caracteres hexadecimales de superposición visual). La detección de suplantación Unicode normaliza los símbolos de los tokens (descomposición NFKD + un mapa curado de caracteres confundibles entre Lisu, cirílico, griego y latín de ancho completo) y los compara con tickers legítimos. Los puntos de código se muestran en notación U+ estándar para que la evidencia sea verificable independientemente de la representación de la fuente.',
  },
  assetSummary: {
    realAssetsHeader: 'Activos Reales',
    colToken: 'Token',
    colTotalIn: 'Total Entrada',
    colTotalOut: 'Total Salida',
    colNet: 'Flujo neto en cuenta',
    netFlowClarification: 'Nota: el "Flujo neto en cuenta" es el balance contable del período, NO la pérdida económica. Los fondos entrantes corresponden en su mayoría a depósitos propios de la víctima (p. ej. desde su exchange), no a recuperación. La pérdida económica confirmada se indica en el Resumen Ejecutivo.',
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
    footnoteSpoofUnits: (breakdown) => ` Por separado, ${breakdown} de unidades de tokens falsificados sin valor de mercado fueron enviados a direcciones asociadas al patrón coordinado.`,
    footnoteTail: ' Ver Análisis de Técnicas de Ataque. Los fondos reales se perdieron por confusión visual de direcciones, no fueron transferidos legítimamente; las unidades de tokens falsificados no tienen valor y se reportan por separado.',
  },
  timeline: {
    walletFirstActive: 'Wallet activada por primera vez',
    received: (amount, token, from) => `Recibido ${amount} ${token} de ${from}...`,
    sent: (amount, token, to) => `Enviado ${amount} ${token} a ${to}`,
    lastActivity: 'Última actividad registrada',
    keyEventBadge: 'EVENTO CLAVE',
    misdirectionBadge: '⚠ DESVÍO POR ENVENENAMIENTO',
    sentToSpoofNote: 'Enviado a una suplantación de envenenamiento de direcciones — no es el destinatario previsto.',
    sentToRole: (amount, token, role) => `Enviado ${amount} ${token} ${role}`,
    roleMainCollector: 'al RECOLECTOR PRINCIPAL',
    roleSpoofAddress: 'a una DIRECCIÓN DE SUPLANTACIÓN',
    poisoningCollisionNote: 'Nota: el recolector principal y la dirección de suplantación son transacciones distintas a direcciones visualmente similares (mismo prefijo/sufijo, distinto el centro) — la firma del ataque de envenenamiento de direcciones. El monto desviado ya está incluido una sola vez en el total de USDT real reenviado (no se cuenta dos veces).',
    totalActivePeriod: (first, last) => `Período Activo Total: ${first} a ${last}`,
    inactiveSuffix: (n) => ` (inactiva por ${n} días)`,
    noTimeline: 'No hay transacciones con marca de tiempo disponibles para construir la cronología.',
    abbreviatedNote: 'Cronología abreviada — solo eventos clave seleccionados. Los montos mostrados son una selección y, de forma intencional, no suman el total reportado; consulte la página de Historial de Transacciones (o Etherscan) para el listado completo de transferencias.',
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
      `${pct}% de los depósitos entrantes reenviados en 24 horas (por número de depósitos)`,
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
    directionLegend: 'IN = fondos recibidos por la wallet analizada (p. ej., un depósito de exchange); OUT = fondos enviados por la wallet analizada.',
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
    exitTruncatedNote: 'Mostrando destinos principales por volumen. Ver el Historial Completo de Transacciones para todas las transferencias.',
    exitAggregateNote: 'Los montos son el total acumulado enviado a cada destino; el número entre paréntesis es la cantidad de transacciones.',
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
  recovery: {
    probabilityLabel: 'Probabilidad:',
    recoveryIfConfirmedLabel: 'Recuperación si se confirma:',
    overallRecoveryProbability: 'PROBABILIDAD GENERAL DE RECUPERACIÓN',
    chance: { HIGH: 'ALTA', MEDIUM: 'MEDIA', LOW: 'BAJA' },
    ofacNoticeTitle: 'AVISO DE CUMPLIMIENTO OFAC',
    ofacNoticeBody: 'La interacción con direcciones SDN activa obligaciones de bloqueo. Consulte a un asesor de cumplimiento OFAC.',
    recommendedActions: 'Acciones Recomendadas',
    scenarioAName: 'Escenario A: Los fondos llegaron a un exchange KYC',
    scenarioADescKyc: 'Exchange detectado. Una citación judicial puede revelar la identidad del titular de la cuenta.',
    scenarioADescNoKyc: 'Aún no se detectó salida por exchange. Un rastreo más profundo puede revelar el punto final del exchange.',
    scenarioAActionKyc: 'Presentar una citación judicial al departamento de cumplimiento del exchange',
    scenarioAActionNoKyc: 'Encargar un rastreo profundo para encontrar el punto final del exchange',
    scenarioBName: 'Escenario B: Fondos en wallets desconocidas',
    scenarioBDesc: 'Los fondos se mantienen en wallets no identificadas. Pueden ser intermediarias o el destino final.',
    scenarioBAction: 'Continuar el monitoreo para detectar movimiento hacia un exchange',
    scenarioCName: 'Escenario C: Fondos mezclados o puenteados',
    scenarioCDescMixer: 'Uso de mezclador detectado. Se requiere un análisis profesional de desmezclado.',
    scenarioCDescNoMixer: 'No se detectó mezclador. Es posible que se haya usado un puente entre cadenas.',
    scenarioCActionMixer: 'Contratar un servicio especializado de desmezclado',
    scenarioCActionNoMixer: 'Revisar las cadenas de destino para detectar actividad continua',
    entryPointBold: (brand) => `Punto de Entrada de ${brand} (Financiamiento de la Víctima):`,
    entryPointText: (brand) => `La víctima financió esta wallet a través de ${brand}. Una citación judicial al cumplimiento de ${brand} puede confirmar la identidad de la víctima para completar el expediente, pero NO identifica al estafador. Úsela principalmente para (a) la verificación de identidad de la víctima en procedimientos legales, y (b) detectar si el estafador alguna vez transfirió fondos de vuelta a una cuenta de ${brand}.`,
    counterpartyExitBold: 'Rastreo de Salida de la Contraparte (requerido para identificar al estafador):',
    counterpartyExitText: 'El patrón observado es consistente con control coordinado de los fondos dentro del historial de transacciones de esta wallet. Identificar el exchange de retiro requiere rastrear uno o más saltos más allá del grupo — este análisis ampliado es el siguiente paso de investigación recomendado.',
    kycExitBold: 'Punto de Salida KYC Identificado:',
    kycExitText: (brand) => `Los fondos llegaron a ${brand}. Presente una solicitud urgente de preservación/descubrimiento ante el equipo de cumplimiento de ese exchange para perseguir al titular de la cuenta detrás del retiro.`,
    ic3Bold: 'Presentar Denuncia ante FBI IC3 / Policía Local:',
    ic3Text: 'Denuncie en ic3.gov (si está en EE. UU.) o a través de su unidad local de cibercrimen. Haga referencia a este ID de Caso y adjunte este informe como documentación de apoyo.',
    exchangeComplianceBold: 'Notificación al Cumplimiento del Exchange:',
    exchangeComplianceText: 'Envíe una solicitud de preservación a los equipos de cumplimiento de los exchanges identificados. Incluso sin una salida KYC del estafador, esto crea un registro oficial y puede asistir en la revisión interna de riesgo del exchange.',
    tokenIssuerBold: 'Coordinación con el Emisor del Token:',
    tokenIssuerText: 'Para transferencias en USDT a wallets marcadas, envíe un paquete de evidencia al equipo legal de Tether (legal@tether.to) para revisión de cumplimiento (las decisiones de aplicación quedan a discreción de Tether).',
    courtCertifiedBold: 'Investigación Forense Certificada para Tribunales:',
    courtCertifiedText: 'Para testimonio en tribunales, metodología certificada o un rastreo ampliado de la contraparte, contacte a LedgerHound en contact@ledgerhound.vip para una investigación forense ampliada certificada.',
    assessmentLabel: {
      MODERATE: 'Moderada — múltiples factores positivos presentes, pero la recuperación aún requiere acción legal sostenida',
      LOW_TO_MODERATE: 'Baja a moderada — algunos factores positivos, pero la recuperación requiere un esfuerzo legal sostenido y no está garantizada',
      LOW: 'Baja — la recuperación requiere un esfuerzo legal sostenido y puede tomar de 6 a 18 meses',
      VERY_LOW: 'Muy baja — la recuperación es improbable, pero la documentación permite reclamos legales/tributarios',
    },
    assessmentDisclaimer: 'Estimación estadística basada en las características del caso. La mayoría de los casos de fraude con criptomonedas no resultan en recuperación total. Esta métrica no es una garantía, predicción ni promesa. La recuperación real depende de la acción de las autoridades, la cooperación de los exchanges y los procedimientos legales.',
    factorKycExchange: (label) => `Fondos enrutados a través de un exchange con KYC (${label}) — los registros pueden obtenerse mediante proceso legal`,
    factorFraudCluster: 'Contraparte vinculada a un grupo de fraude identificado — fortalece el caso legal',
    factorPhishingTag: (n) => `${n} dirección(es) del grupo de envenenamiento etiquetada(s) oficialmente como Fake_Phishing por Etherscan — evidencia independiente de que el grupo vanity pertenece a una operación de phishing conocida`,
    factorRecent30: 'Actividad reciente (<30 días) — los fondos pueden estar aún en etapas tempranas de lavado',
    factorRecent7: 'Actividad muy reciente (<7 días) — mejora la posibilidad de una retención por cumplimiento del exchange/emisor (a su discreción)',
    factorMixer: 'Uso de mezclador (Tornado Cash / Blender / Sinbad) detectado — fondos fuertemente ofuscados',
    factorLargeOutflow: 'Alto volumen de salida — los estafadores priorizan el retiro rápido en casos de alto valor',
    factorStale: 'Actividad inactiva (>6 meses) — los fondos probablemente ya fueron retirados',
  },
  findings: {
    ofacCritical: (labels) => `CRÍTICO: La wallet interactuó con dirección(es) sancionada(s) por OFAC: ${labels}. Las personas estadounidenses tienen prohibido transar con estas direcciones.`,
    mixerDetected: 'Se detectaron interacciones con servicios de mezcla/tumbler conocidos (Tornado Cash o similar). Este es un indicador de riesgo significativo.',
    exchangesInteracted: (exchanges) => `Los fondos interactuaron con exchanges identificados: ${exchanges}. Los datos KYC pueden estar disponibles mediante citación judicial.`,
    scamFlagged: 'Se detectaron interacciones con direcciones marcadas o asociadas a estafas.',
    scamDbMatch: (addrShort, platforms, reports, totalLoss) => `Contraparte ${addrShort} vinculada a "${platforms}" en la Base de Datos de Estafas de LedgerHound (${reports} reportes, $${totalLoss} en pérdidas totales).`,
    stableSent: (amount, symbol, n) => `envió ${amount} ${symbol} en ${n} transferencia${n === 1 ? '' : 's'}`,
    stableReceived: (amount, symbol, n) => `recibió ${amount} ${symbol} en ${n} transferencia${n === 1 ? '' : 's'}`,
    stableWallet: (parts) => `La wallet ${parts}.`,
    nativeDust: (amount, currency, n) => `Movimiento de ${currency} nativo: ${amount} ${currency} en ${n} ${n === 1 ? 'transacción' : 'transacciones'} — gas/dust, separado del volumen de stablecoin anterior.`,
    nativeSent: (amount, currency, n) => `La wallet envió ${amount} ${currency} en ${n} ${n === 1 ? 'transacción nativa' : 'transacciones nativas'}.`,
    inactive: (days, lastActivity) => `Wallet inactiva durante ${days} días (última actividad: ${lastActivity}). Los fondos pueden haber sido movidos a otras wallets.`,
    spamFiltered: (n) => `Se detectaron y filtraron ${n} transferencias de tokens de spam/airdrop de este análisis.`,
    crossChainBridge: (n, summary) => `MULTICADENA: ${n} ${n === 1 ? 'interacción' : 'interacciones'} con puentes detectada${n === 1 ? '' : 's'}. ${summary}`,
    multiChain: (chains, chainList) => `MULTICADENA: Wallet activa en ${chains} cadenas: ${chainList}.`,
    laundering: (confidence, reason) => `CRÍTICO: El análisis de intención entre cadenas indica probable comportamiento de lavado (${confidence}% de confianza). ${reason}`,
    behavioral: (name, confidence, evidence) => `CONDUCTUAL: ${name} detectado (${confidence}% de confianza). ${evidence}`,
    none: 'No se detectaron indicadores de alto riesgo en el análisis automatizado. Se recomienda revisión manual para una evaluación integral.',
  },
  steps: {
    stepLabel: (n) => `PASO ${n}`,
    recoveryPathIdentified: 'CAMINO DE RECUPERACIÓN IDENTIFICADO',
    recoveryRequiresInvestigation: 'LA RECUPERACIÓN REQUIERE INVESTIGACIÓN',
    recoveryPathBody: 'Los fondos fueron rastreados hasta exchange(s) regulado(s) con KYC. La identidad del titular de la cuenta puede obtenerse mediante un proceso legal (sujeto a la cooperación del exchange y la disponibilidad de datos). Se requiere acción urgente para evitar el retiro de los fondos.',
    recoveryPathVictimBody: 'Se identificó el punto de entrada KYC (su exchange de financiamiento), lo que confirma su identidad ante las autoridades. NOTA: NO se identificó un punto de salida KYC del estafador en el rastreo directo de esta wallet — un rastreo ampliado de la contraparte (mejora disponible) puede identificarlo. Prioridad: preservar los registros ahora.',
    recoveryPathGeneric: 'OPORTUNIDAD DE PRESERVACIÓN DE EVIDENCIA',
    recoveryPathGenericBody: 'Aunque no se identificó un punto de salida KYC en el rastreo directo, la preservación de evidencia y el rastreo ampliado de la contraparte pueden mejorar las posibilidades de recuperación.',
    recoveryRequiresBody: 'No se identificaron salidas directas por exchange. La recuperación puede requerir rastreo avanzado, cooperación de las autoridades o análisis forense especializado.',
    step1Title: 'Enviar Solicitud de Preservación al Cumplimiento del Exchange',
    step1Body: 'El/los exchange(s) a continuación recibieron fondos de esta wallet y poseen los registros KYC relevantes Y la capacidad técnica de marcar las wallets receptoras en sus sistemas internos. Una solicitud de preservación temprana pasa a formar parte del registro oficial.',
    step1Closing: (caseId) => `Envíe una solicitud de preservación al departamento de cumplimiento haciendo referencia al número de su denuncia policial y a este ID de caso (${caseId}). Solicite la preservación de registros y la divulgación de la información del suscriptor. Cuando el exchange confirme actividad sospechosa, puede solicitar una retención preventiva de la cuenta (otorgada a discreción del exchange).`,
    step1BannerVictim: 'PUNTO DE FINANCIAMIENTO KYC IDENTIFICADO (VÍCTIMA)',
    step1TitleVictim: 'Solicitar Preservación de sus Registros KYC (Exchange de Financiamiento)',
    step1BodyVictim: 'Su wallet fue financiada a través del/los exchange(s) indicados a continuación, lo que confirma su identidad como víctima. Esos registros KYC le pertenecen a usted y deben preservarse oficialmente para los procedimientos legales. NOTA: el rastreo directo de esta wallet NO identificó un punto de retiro KYC utilizado por el estafador — un rastreo ampliado de la contraparte (mejora disponible) puede identificarlo. Una solicitud de preservación temprana igualmente pasa a formar parte del registro oficial y puede ayudar a marcar las wallets receptoras.',
    step1ClosingVictim: (caseId) => `Envíe una solicitud de preservación al departamento de cumplimiento haciendo referencia al número de su denuncia policial y a este ID de caso (${caseId}). Solicite la preservación de sus registros KYC y pida al exchange marcar las wallets receptoras en sus sistemas internos.`,
    step1TitleGeneric: 'Enviar Solicitud de Preservación al Cumplimiento del Exchange',
    step1BodyGeneric: 'El/los exchange(s) a continuación interactuaron con esta wallet y pueden poseer registros relevantes. Una solicitud de preservación temprana pasa a formar parte del registro oficial, aun cuando el punto de retiro del estafador no se haya confirmado todavía.',
    step1ClosingGeneric: (caseId) => `Envíe una solicitud de preservación al departamento de cumplimiento haciendo referencia al número de su denuncia policial y a este ID de caso (${caseId}). Solicite la preservación de registros y la divulgación de la información del suscriptor.`,
    step1Interactions: (interactions, addrCount) => `${interactions} interacci${interactions > 1 ? 'ones' : 'ón'} · ${addrCount} hot wallet${addrCount > 1 ? 's' : ''}`,
    step1MoreAddrs: (n) => ` (+${n} más)`,
    step1NoContact: 'No hay contacto publicado para autoridades — consulte a un abogado para el canal de notificación adecuado.',
    step1BinanceChannel: "Acceda a su cuenta Binance -> Soporte -> categoría 'Report fraud/scam'. El Portal de Autoridades (lawenforcement.binance.com) es solo para autoridades.",
    lawEnforcementTitle: 'Presentar Denuncias ante las Autoridades',
    ic3Bullet: 'Denuncia ante FBI IC3 — ic3.gov (haga referencia a este informe)',
    localPoliceBullet: 'Denuncia ante la policía local — necesaria para las solicitudes de cumplimiento del exchange',
    ftcBullet: 'Denuncia ante la FTC — reportfraud.ftc.gov',
    sarBullet: 'Solicitar la presentación de un SAR — el patrón de wallet de tránsito indica un patrón de fraude coordinado',
    lawEnforcementClosing: (caseId) => `Incluya el ID de Caso ${caseId}, la dirección de la wallet, y adjunte este informe forense como evidencia.`,
    legalProceedingsTitle: 'Procedimientos Legales',
    legalSubpoena: (brand) => `Contratar un abogado para una citación judicial de emergencia a ${brand}`,
    legalIdentityRequest: 'Solicitar la identidad del titular de la cuenta: nombre, dirección, documento de identidad oficial, datos bancarios',
    legalCivilRecovery: 'Iniciar procedimientos civiles de recuperación de activos una vez obtenida la identidad',
    legalPreservationLetter: 'Enviar una Carta de Preservación para solicitar la preservación y revisión de cumplimiento de las cuentas relacionadas',
    legalConsultAttorney: 'Consultar a un abogado con experiencia en recuperación de fraude con criptomonedas',
    legalAdvancedTracing: 'Explorar el rastreo avanzado de blockchain y el análisis entre cadenas',
    legalInternational: 'Considerar la cooperación internacional si los fondos cruzaron jurisdicciones',
    preserveEvidenceTitle: 'Preservar la Evidencia',
    preserve1: 'Guarde todas las comunicaciones con el estafador (capturas de pantalla, correos, mensajes)',
    preserve2: 'Conserve este informe forense como documentación de apoyo para procedimientos legales',
    preserve3: 'Documente la cronología de los eventos por escrito',
    preserve4: 'No se comunique más con el estafador',
    ctaTitle: '¿Necesita Ayuda para Ejecutar Estos Pasos?',
    ctaBody: 'LedgerHound ofrece investigaciones forenses certificadas con testimonio de expertos, documentación completa de cadena de custodia y coordinación directa con las autoridades y los exchanges.',
  },
  disclaimer: {
    para1: 'Este informe fue generado automáticamente por LedgerHound, un servicio de USPROJECT LLC. Se proporciona únicamente con fines informativos y no constituye asesoramiento legal, financiero ni de inversión.',
    para2: 'El análisis aquí contenido se basa en datos de blockchain disponibles públicamente, obtenidos al momento de la generación del informe. Los datos de blockchain son permanentes e inmutables; sin embargo, la atribución de direcciones de wallet a entidades conocidas se basa en bases de datos de inteligencia propietarias y de código abierto que pueden no ser exhaustivas.',
    para3: 'Este informe automatizado no sustituye una investigación forense certificada realizada por un analista forense de blockchain calificado. Para asuntos que requieran testimonio en tribunales, metodología certificada o cumplimiento regulatorio, se recomienda una investigación forense ampliada certificada.',
    para4: 'Las puntuaciones de riesgo se generan algorítmicamente y deben interpretarse únicamente como indicadores preliminares. Una puntuación de riesgo baja no garantiza la legitimidad, y una puntuación alta no indica de manera definitiva actividad delictiva.',
    para5: 'LedgerHound y USPROJECT LLC no son firmas de abogados y no brindan representación legal. Los usuarios deben consultar con un asesor legal calificado antes de emprender cualquier acción legal basada en el contenido de este informe.',
    para6: 'Al comprar y usar este informe, usted acepta que la responsabilidad de USPROJECT LLC se limita al precio de compra del informe.',
    tagline: 'Análisis Forense de Blockchain y Rastreo de Criptoactivos',
    integrityTitle: 'Verificación de Integridad (SHA-256)',
    integrityNote: 'Calculado sobre el contenido del informe forense excluyendo este campo de verificación. Permite verificar que el contenido del informe no ha sido alterado desde su generación. El mismo valor se incluye en el email de entrega.',
  },
  fundFlow: {
    intro: 'Representación visual de los movimientos de fondos entre la wallet analizada y sus principales contrapartes por volumen de transacciones.',
    colNum: '#',
    colLabel: 'Etiqueta',
    colType: 'Tipo',
    colVolume: 'Volumen',
    colDirection: 'Dirección',
    nodeType: (type) => (({
      source: 'ORIGEN', exchange: 'EXCHANGE', mixer: 'MEZCLADOR', scam: 'ESTAFA',
      scam_db: 'BASE DE DATOS', defi: 'DEFI', bridge: 'PUENTE', unknown: 'DESCONOCIDA',
    } as Record<string, string>)[type.toLowerCase()] ?? type.toUpperCase()),
    legendYourWallet: 'Su Wallet',
    legendExchange: 'Exchange',
    legendMixer: 'Mezclador',
    legendDefi: 'DeFi',
    legendScam: 'Estafa',
    legendScamDb: 'Base de Datos de Estafas',
    legendUnknown: 'Desconocida',
    legendIncoming: 'Entrante',
    legendOutgoing: 'Saliente',
    noGraph: 'No se pudo generar el gráfico de flujo de fondos para esta wallet. Esto puede ocurrir cuando la wallet tiene muy pocas transacciones o todas las contrapartes se filtran como dust.',
    interactiveLine: 'Para una visualización interactiva del flujo de fondos, visite www.ledgerhound.vip/graph-tracer',
    realFlowLegend: 'Flujo de fondos reales',
    spoofFlowLegend: 'Token falsificado (sin valor de mercado)',
    fakeNoValueWarning: 'sin valor',
  },
  transactions: {
    titleSuffix: (n) => ` (${n} principales)`,
    colDate: 'Fecha',
    colDir: 'Dir',
    colFrom: 'De',
    colTo: 'A',
    colValue: 'Valor',
    colToken: 'Token',
    spoofFootnote: '⚠ Las filas resaltadas son tokens de suplantación Unicode (símbolos falsos que imitan monedas reales) — ver Análisis de Técnicas de Ataque.',
    spamFilteredNote: (n) => `Mostrando solo transferencias legítimas. ${n} transferencias de tokens de spam/airdrop fueron filtradas de este análisis.`,
    truncationNote: (shown, total) => `Se muestran ${shown} transferencias representativas (hasta 3 por activo) de ${total} en total. El historial completo está disponible en la cadena (p. ej., Etherscan).`,
  },
  countryGuidance: {
    peru: {
      title: 'Recursos Específicos para Perú',
      intro: 'Las siguientes autoridades y organismos peruanos pueden ayudarle a avanzar este caso. Para acceder a sus respectivos canales legales, presente este informe forense como documentación de apoyo.',
      divindatTitle: 'DIVINDAT — División de Investigación de Delitos de Alta Tecnología',
      divindatAddress: 'Av. España 323, Cercado de Lima',
      divindatPhone: 'Teléfono: (01) 431-8898',
      divindatEmail: 'Email: divindat.pnp@gmail.com',
      divindatHours: 'Horario: Lunes a viernes, 8:00-17:00',
      divindatDescription: 'DIVINDAT investiga delitos cibernéticos, incluyendo el fraude con criptomonedas. Presente una denuncia personal junto con este informe forense.',
      ministerioPublicoTitle: 'Ministerio Público — Denuncias en Línea',
      ministerioPublicoUrl: 'https://denuncias.mpfn.gob.pe/',
      ministerioPublicoDescription: 'Sistema oficial para presentar denuncias formales. Conserve el número de expediente que se le asigne.',
      sbsTitle: 'SBS — Superintendencia de Banca, Seguros y AFP',
      sbsPhone: 'Teléfono gratuito: 0-800-10840',
      sbsEmail: 'Email: solucion@sbs.gob.pe',
      sbsDescription: 'Para casos donde están involucradas entidades financieras locales. La SBS puede emitir alertas sobre cuentas sospechosas.',
      indecopiTitle: 'INDECOPI — Defensa del Consumidor',
      indecopiPhone: 'Teléfono: 224-7777',
      indecopiUrl: 'https://www.consumidor.gob.pe/',
      indecopiDescription: 'Si la estafa involucró servicios de inversión locales con publicidad engañosa, INDECOPI puede iniciar un procedimiento administrativo contra el infractor.',
      calTitle: 'Colegio de Abogados de Lima (CAL)',
      calUrl: 'https://www.cal.org.pe/',
      calDescription: 'Antes de contratar un abogado, verifique la colegiatura activa en el CAL o el colegio correspondiente de su región. Para casos de fraude cripto, busque abogados con experiencia en delitos económicos.',
      reniecTitle: 'RENIEC — Protección de Identidad',
      reniecUrl: 'https://www.reniec.gob.pe/',
      reniecDescription: 'Si proporcionó su DNI a los estafadores durante un proceso de KYC falso, considere una alerta de identidad en RENIEC y monitoreo crediticio a través de Equifax Perú o Sentinel.',
      disclaimer: 'Este informe forense puede ser presentado como documentación de apoyo ante cualquiera de las autoridades arriba mencionadas.',
      documentsTitle: 'Documentos en este paquete',
      documentsIntro: 'Este informe se acompaña de 3 plantillas de recuperación (.md), para usar en este orden:',
      documentsDivindat: 'divindat-denuncia-es.md — Denuncia formal para DIVINDAT Lima (presentar primero, esta semana).',
      documentsBinance: "binance-compliance-es.md — Reporte a soporte de Binance, categoría 'Report fraud/scam' (dentro de 7 días después de la denuncia).",
      documentsTether: 'tether-legal-es.md — Email a Tether Legal (enviar después de tener el número de expediente policial).',
      documentsOrder: 'Cada plantilla referencia este informe forense como evidencia de apoyo.',
    },
    india: INDIA_GUIDANCE,
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

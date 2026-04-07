export interface CountryResearch {
  code: string;
  name: string;
  language: string;
  lastUpdated: string;

  policeAgency: {
    name: string;
    shortName: string;
    url: string;
    complaintUrl: string;
    requiredFields: string[];
    responseTime: string;
    jurisdiction: string;
  };

  financialRegulator: {
    name: string;
    shortName: string;
    url: string;
    tipUrl: string;
    scope: string;
  };

  additionalAgencies: {
    name: string;
    type: string;
    url: string;
    when: string;
  }[];

  legalBasis: {
    criminalCode: string;
    civilRemedies: string[];
    statuteOfLimitations: string;
  };

  preservationLetter: {
    legalBasis: string;
    typicalResponse: string;
    requiredElements: string[];
  };

  localizedTerms: {
    police: string;
    complaint: string;
    fraud: string;
    cryptoFraud: string;
  };

  contacts: {
    emergencyPhone: string;
    cybercrimeEmail: string;
    consumerProtection: string;
  };

  notes: string[];
}

export interface CaseData {
  caseId: string;
  date: string;
  victimName: string;
  victimEmail: string;
  country: string;
  incidentDate: string;
  lossAmount: number;
  lossCurrency: string;
  cryptoType: string;
  scammerAddress: string;
  txid: string;
  platformName: string;
  network: string;
  scamType: string;
  description: string;
  contactMethod?: string;
  exchange?: string;
  // Additional fields
  victimPhone?: string;
  state?: string;
  platformUrl?: string;
  sourceWallet?: string;
  txDateTime?: string;
  blockNumber?: string;
  paymentMethod?: string;
  promisedReturns?: string;
  policeReportNumber?: string;
  otherVictimsCount?: number;
  totalEstimatedLosses?: number;
  victimGroupSlug?: string;
  // Recovery analysis fields (populated by emergency wizard)
  recoveryScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  urgencyLevel?: string;
  timeWindow?: string;
  daysOld?: number;
  hops?: number;
  detectedExchange?: string;
  exchangeSupportsLE?: boolean;
  mixerDetected?: boolean;
  finalDestination?: string;
}

export type TemplateType = 'police-complaint' | 'preservation-letter' | 'regulator-complaint' | 'action-guide';

export interface PipelineStatus {
  lastFullRefresh: string;
  countries: Record<string, CountryStatus>;
}

export interface CountryStatus {
  researchedAt: string | null;
  generatedAt: string | null;
  validatedAt: string | null;
  status: 'ready' | 'needs_review' | 'missing' | 'error';
  templatesGenerated: number;
  validationPassed: boolean;
  error?: string;
}

export interface ValidationResult {
  country: string;
  template: TemplateType;
  passed: boolean;
  checks: {
    name: string;
    passed: boolean;
    message?: string;
  }[];
}

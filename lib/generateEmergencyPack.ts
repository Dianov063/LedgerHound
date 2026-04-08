import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Resend } from 'resend';
import { getResearch } from '@/lib/legal-packs/s3';
import {
  PoliceComplaintDoc,
  PreservationLetterDoc,
  RegulatorComplaintDoc,
  ActionGuideDoc,
} from '@/lib/legal-packs/templates';
import type { CaseData, TemplateType, CountryResearch } from '@/lib/legal-packs/types';
import { calcRecoveryScore } from '@/lib/scam-db';
import logger from '@/lib/logger';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;
const PREFIX = 'legal-packs';

const TEMPLATE_LABELS: Record<TemplateType, string> = {
  'police-complaint': 'Police Complaint',
  'preservation-letter': 'Preservation Letter',
  'regulator-complaint': 'Regulator Complaint',
  'action-guide': 'Emergency Action Guide',
};

function getDocumentElement(
  templateType: TemplateType,
  research: CountryResearch,
  caseData: CaseData,
): React.ReactElement {
  const props = { research, caseData };
  switch (templateType) {
    case 'police-complaint':
      return React.createElement(PoliceComplaintDoc, props);
    case 'preservation-letter':
      return React.createElement(PreservationLetterDoc, props);
    case 'regulator-complaint':
      return React.createElement(RegulatorComplaintDoc, props);
    case 'action-guide':
      return React.createElement(ActionGuideDoc, props);
  }
}

async function saveCasePdf(caseId: string, templateType: string, pdfBuffer: Buffer): Promise<string> {
  const key = `${PREFIX}/cases/${caseId}/${templateType}.pdf`;
  await getS3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ServerSideEncryption: 'aws:kms',
      Metadata: { 'generated-at': new Date().toISOString() },
    }),
  );
  return key;
}

async function getPresignedUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket(),
    Key: key,
    ResponseContentDisposition: `attachment; filename="${key.split('/').pop()}"`,
  });
  return getSignedUrl(getS3(), command, { expiresIn: 86400 }); // 24 hours
}

export interface EnrichmentData {
  forensicCaseId?: string;
  riskScore?: number;
  recoveryScore?: number;
  recoveryLabel?: string;
  identifiedExchanges?: { name: string; address: string }[];
  mixerDetected?: boolean;
  ofacWarning?: boolean;
  hops?: number;
  keyFindings?: string[];
}

export interface GeneratePackInput {
  caseId: string;
  countryCode: string;
  email: string;
  victimName: string;
  lossAmount: number;
  lossCurrency?: string;
  scamType: string;
  walletAddress: string;
  victimWallet?: string;
  txHashes: string[];
  description: string;
  txDate?: string;
  platformName?: string;
  platformUrl?: string;
  network?: string;
  contactMethod?: string;
  victimPhone?: string;
  victimState?: string;
  enrichment?: EnrichmentData;
}

export interface GeneratePackResult {
  success: boolean;
  caseId: string;
  country: string;
  templates: { type: TemplateType; label: string; url: string }[];
}

/**
 * Generate Emergency Pack (4 legal PDFs), save to S3, email download links.
 * Can be called from webhook or API route.
 */
export async function generateEmergencyPack(input: GeneratePackInput): Promise<GeneratePackResult> {
  const {
    caseId,
    countryCode,
    email,
    victimName,
    lossAmount,
    lossCurrency: inputCurrency,
    scamType,
    walletAddress,
    victimWallet,
    txHashes,
    description,
    txDate,
    platformName,
    platformUrl,
    network: inputNetwork,
    contactMethod,
    victimPhone,
    victimState,
  } = input;

  // Load research for the country
  const code = countryCode.toUpperCase();
  const research = await getResearch(code);
  if (!research) {
    throw new Error(`No legal research available for country: ${code}. Run the research pipeline first.`);
  }

  // Derive display names from network identifier
  const NETWORK_MAP: Record<string, { cryptoType: string; networkName: string }> = {
    eth: { cryptoType: 'ETH', networkName: 'Ethereum' },
    btc: { cryptoType: 'BTC', networkName: 'Bitcoin' },
    bnb: { cryptoType: 'BNB', networkName: 'BNB Smart Chain' },
    trx: { cryptoType: 'TRX', networkName: 'Tron' },
    sol: { cryptoType: 'SOL', networkName: 'Solana' },
    polygon: { cryptoType: 'MATIC', networkName: 'Polygon' },
    avax: { cryptoType: 'AVAX', networkName: 'Avalanche' },
    arb: { cryptoType: 'ETH', networkName: 'Arbitrum' },
    op: { cryptoType: 'ETH', networkName: 'Optimism' },
    base: { cryptoType: 'ETH', networkName: 'Base' },
    linea: { cryptoType: 'ETH', networkName: 'Linea' },
    zksync: { cryptoType: 'ETH', networkName: 'zkSync Era' },
    scroll: { cryptoType: 'ETH', networkName: 'Scroll' },
    mantle: { cryptoType: 'MNT', networkName: 'Mantle' },
  };
  const netKey = (inputNetwork || 'eth').toLowerCase();
  const { cryptoType, networkName } = NETWORK_MAP[netKey] || { cryptoType: 'ETH', networkName: 'Ethereum' };

  // Calculate recovery score (same algorithm used in scam-db)
  const incidentDate = txDate || new Date().toISOString().split('T')[0];
  const daysOld = Math.floor((Date.now() - new Date(incidentDate).getTime()) / 86400000);
  const recovery = calcRecoveryScore({
    lossDate: incidentDate,
    blockchainConfirmed: !!(txHashes?.[0]),
    network: netKey,
    lossAmount: lossAmount || 0,
  });

  // Determine risk and urgency levels
  const riskLevel: 'low' | 'medium' | 'high' | 'critical' =
    daysOld <= 3 ? 'critical' : daysOld <= 14 ? 'high' : daysOld <= 60 ? 'medium' : 'low';
  const urgencyLevel =
    daysOld <= 3 ? 'CRITICAL — Act within 24 hours' :
    daysOld <= 14 ? 'URGENT — Act this week' :
    daysOld <= 60 ? 'MODERATE — Act within 30 days' :
    'REDUCED — Extended timeline';
  const timeWindow =
    daysOld <= 7 ? '24-72 hours for exchange freeze' :
    daysOld <= 30 ? '1-2 weeks for preservation requests' :
    daysOld <= 90 ? '30-60 days for legal proceedings' :
    '90+ days — focus on law enforcement';

  // Use enrichment from Forensic Report if available, fallback to self-calculated
  const enrichment = input.enrichment || {};
  const finalRecoveryScore = enrichment.recoveryScore ?? recovery.score;
  const finalRiskScore = enrichment.riskScore ?? 50;
  const identifiedExchanges = enrichment.identifiedExchanges || [];
  const mixerDetected = enrichment.mixerDetected ?? false;
  const hops = enrichment.hops ?? 0;

  // Build CaseData
  const caseData: CaseData = {
    caseId,
    date: new Date().toISOString().split('T')[0],
    victimName: victimName || '',
    victimEmail: email,
    victimPhone: victimPhone || '',
    state: victimState || '',
    country: code,
    incidentDate,
    lossAmount: lossAmount || 0,
    lossCurrency: inputCurrency || 'USD',
    cryptoType,
    scammerAddress: walletAddress || '',
    sourceWallet: victimWallet || '',
    txid: txHashes?.[0] || '',
    platformName: platformName || '',
    platformUrl: platformUrl || '',
    network: networkName,
    scamType: scamType || '',
    description: description || '',
    contactMethod: contactMethod || '',
    // Recovery analysis fields
    recoveryScore: finalRecoveryScore,
    riskLevel,
    urgencyLevel,
    timeWindow,
    daysOld,
    hops,
    detectedExchange: identifiedExchanges.map(e => e.name).join(', '),
    exchangeSupportsLE: identifiedExchanges.length > 0,
    mixerDetected,
  };

  // Render template PDFs
  const templates: { type: TemplateType; label: string; key: string; url: string }[] = [];

  // Standard templates (always generated)
  const STANDARD_TEMPLATES: TemplateType[] = ['police-complaint', 'regulator-complaint', 'action-guide'];

  for (const templateType of STANDARD_TEMPLATES) {
    const doc = getDocumentElement(templateType, research, caseData);
    const buffer = await renderToBuffer(doc);
    const pdfBuffer = Buffer.from(buffer);
    const key = await saveCasePdf(caseId, templateType, pdfBuffer);
    const url = await getPresignedUrl(key);
    templates.push({ type: templateType, label: TEMPLATE_LABELS[templateType], key, url });
  }

  // Preservation Letters — one per identified exchange + one generic
  if (identifiedExchanges.length > 0) {
    for (const exchange of identifiedExchanges) {
      // Look up compliance email from research data
      const exchangeContact = research.exchangeContacts?.find(
        (c) => c.name.toLowerCase() === exchange.name.toLowerCase()
      );
      const exchangeData = {
        name: exchange.name,
        address: exchange.address,
        complianceEmail: exchangeContact?.complianceEmail || `[Contact ${exchange.name} compliance directly via their website]`,
        lawEnforcementPortal: exchangeContact?.lawEnforcementPortal || '',
      };
      const exchangeCaseData = { ...caseData, exchange: exchange.name, exchangeAddress: exchange.address, exchangeEmail: exchangeData.complianceEmail };
      const doc = getDocumentElement('preservation-letter', research, exchangeCaseData);
      const buffer = await renderToBuffer(doc);
      const pdfBuffer = Buffer.from(buffer);
      const slug = exchange.name.toLowerCase().replace(/\s+/g, '-');
      const key = await saveCasePdf(caseId, `preservation-letter-${slug}`, pdfBuffer);
      const url = await getPresignedUrl(key);
      templates.push({
        type: 'preservation-letter' as TemplateType,
        label: `Preservation Letter — ${exchange.name}`,
        key,
        url,
      });
    }
  } else {
    // Generic preservation letter if no exchanges identified
    const doc = getDocumentElement('preservation-letter', research, caseData);
    const buffer = await renderToBuffer(doc);
    const pdfBuffer = Buffer.from(buffer);
    const key = await saveCasePdf(caseId, 'preservation-letter', pdfBuffer);
    const url = await getPresignedUrl(key);
    templates.push({ type: 'preservation-letter' as TemplateType, label: 'Preservation Letter', key, url });
  }

  // Send email with download links
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const downloadLinks = templates
      .map((t) => `- ${t.label}: ${t.url}`)
      .join('\n');

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LedgerHound <noreply@ledgerhound.vip>',
      to: email,
      subject: `Your LedgerHound Legal Pack is Ready — Case ${caseId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">LedgerHound Emergency Pack</h2>
          <p>Hi ${victimName || 'there'},</p>
          <p>Your legal documents for case <strong>${caseId}</strong> (${research.name}) have been generated and are ready for download.</p>
          <p>The following documents are included:</p>
          <ul>
            ${templates.map((t) => `<li><a href="${t.url}">${t.label}</a></li>`).join('\n            ')}
          </ul>
          <p style="color: #64748b; font-size: 13px;">These links expire in 24 hours. If you need new links, contact our support team.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px;">
            LedgerHound by USPROJECT LLC &mdash; Crypto Fraud Recovery<br />
            contact@ledgerhound.vip &middot; +1 (833) 559-1334
          </p>
        </div>
      `,
      text: `LedgerHound Emergency Pack\n\nHi ${victimName || 'there'},\n\nYour legal documents for case ${caseId} (${research.name}) are ready.\n\nDownload your documents (links expire in 24 hours):\n${downloadLinks}\n\nLedgerHound by USPROJECT LLC\ncontact@ledgerhound.vip`,
    });
    logger.info({ email }, '[generateEmergencyPack] Email sent');
  } catch (emailErr: any) {
    logger.error({ err: emailErr }, '[generateEmergencyPack] Email send failed');
  }

  return {
    success: true,
    caseId,
    country: code,
    templates: templates.map((t) => ({
      type: t.type,
      label: t.label,
      url: t.url,
    })),
  };
}

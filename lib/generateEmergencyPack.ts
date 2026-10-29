import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEmailTransport, sendEmailOnce } from '@/lib/idempotent-email';
import { readPackManifest, writePackManifestOnce, type PackManifest } from '@/lib/legal-packs/manifest';
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

/**
 * Stores a pack document once. If an interrupted earlier attempt already
 * stored this document, that version is kept: a document is never replaced
 * by a different rendering.
 */
async function saveCasePdf(caseId: string, templateType: string, pdfBuffer: Buffer): Promise<string> {
  const key = `${PREFIX}/cases/${caseId}/${templateType}.pdf`;
  try {
    await getS3().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ServerSideEncryption: 'aws:kms',
        Metadata: { 'generated-at': new Date().toISOString() },
        IfNoneMatch: '*',
      }),
    );
  } catch (err: unknown) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e.$metadata?.httpStatusCode !== 412 && e.name !== 'PreconditionFailed') throw err;
    logger.info({ key }, '[generateEmergencyPack] Keeping document stored by an earlier attempt');
  }
  return key;
}

/**
 * One letter per address: the same exchange label often covers several hot
 * wallets. Entries that would map to the same document are dropped, so every
 * manifest entry points to its own PDF.
 */
function uniqueExchangeAddresses(exchanges: { name: string; address: string }[]): { name: string; address: string }[] {
  const seen = new Set<string>();
  return exchanges.filter((e) => {
    const id = preservationLetterName(e);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * Document name of a preservation letter. It includes the address, so letters
 * for different addresses of one exchange never share an S3 key (saveCasePdf
 * keeps the first document stored under a key).
 */
export function preservationLetterName(exchange: { name: string; address: string }): string {
  const slug = exchange.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'exchange';
  // EVM hex addresses are case-insensitive; base58 ones (Tron, Solana, BTC) are not.
  const raw = /^0x[0-9a-f]+$/i.test(exchange.address) ? exchange.address.toLowerCase() : exchange.address;
  const address = raw.replace(/[^A-Za-z0-9]/g, '');
  return address ? `preservation-letter-${slug}-${address}` : `preservation-letter-${slug}`;
}

function shortAddress(address: string): string {
  return address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

function resultFrom(manifest: PackManifest, country: string): GeneratePackResult {
  return {
    success: true,
    caseId: manifest.caseId,
    country,
    templates: manifest.documents.map((d) => ({ type: d.type as TemplateType, label: d.label, url: d.url })),
  };
}

/** Sends the frozen pack email; throws when it is not sent. */
async function sendPackEmail(manifest: PackManifest, idempotencyKey?: string): Promise<void> {
  const sent = await sendEmailOnce(manifest.email, idempotencyKey, {
    transport: manifest.emailTransport ?? 'resend',
  });
  logger.info({ caseId: manifest.caseId, result: sent }, '[generateEmergencyPack] Email processing complete');
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
  /** Same key on every retry of one purchase, so the pack email goes out once. */
  idempotencyKey?: string;
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
 *
 * Throws if any document cannot be rendered or saved, or if the email with
 * the links is not sent: the pack is delivered only when both happened.
 *
 * Retries deliver the frozen pack: once the manifest exists (all documents
 * stored, email payload fixed) a retry only re-sends that exact email.
 */
export async function generateEmergencyPack(input: GeneratePackInput): Promise<GeneratePackResult> {
  const frozen = await readPackManifest(input.caseId);
  if (frozen) {
    await sendPackEmail(frozen, input.idempotencyKey);
    return resultFrom(frozen, input.countryCode.toUpperCase());
  }

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

  // Preservation Letters — one per identified exchange address + one generic
  if (identifiedExchanges.length > 0) {
    for (const exchange of uniqueExchangeAddresses(identifiedExchanges)) {
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
      const key = await saveCasePdf(caseId, preservationLetterName(exchange), pdfBuffer);
      const url = await getPresignedUrl(key);
      templates.push({
        type: 'preservation-letter' as TemplateType,
        label: `Preservation Letter — ${exchange.name}${exchange.address ? ` (${shortAddress(exchange.address)})` : ''}`,
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
  // Freeze the complete set and the email, then send (throws when not sent:
  // the documents are useless to a buyer who never gets the links).
  {
    const downloadLinks = templates
      .map((t) => `- ${t.label}: ${t.url}`)
      .join('\n');

    const packEmail = {
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
    };
    const manifest = await writePackManifestOnce({
      caseId,
      createdAt: new Date().toISOString(),
      documents: templates.map((t) => ({ type: t.type, label: t.label, key: t.key, url: t.url })),
      email: packEmail,
      emailTransport: getEmailTransport(),
    });
    await sendPackEmail(manifest, input.idempotencyKey);
    return resultFrom(manifest, code);
  }
}


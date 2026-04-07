import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Resend } from 'resend';
import { getResearch } from '@/lib/legal-packs/s3';
import {
  PoliceComplaintDoc,
  PreservationLetterDoc,
  RegulatorComplaintDoc,
  ActionGuideDoc,
} from '@/lib/legal-packs/templates';
import type { CaseData, TemplateType, CountryResearch } from '@/lib/legal-packs/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60; // PDF rendering can be slow

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

const TEMPLATE_TYPES: TemplateType[] = [
  'police-complaint',
  'preservation-letter',
  'regulator-complaint',
  'action-guide',
];

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

interface GeneratePackRequest {
  caseId: string;
  countryCode: string;
  email: string;
  victimName: string;
  lossAmount: number;
  scamType: string;
  walletAddress: string;
  txHashes: string | string[];
  description: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GeneratePackRequest;
    const {
      caseId,
      countryCode,
      email,
      victimName,
      lossAmount,
      scamType,
      walletAddress,
      txHashes,
      description,
    } = body;

    // Validate required fields
    if (!caseId || !countryCode || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: caseId, countryCode, email' },
        { status: 400 },
      );
    }

    // Load research for the country
    const code = countryCode.toUpperCase();
    const research = await getResearch(code);
    if (!research) {
      return NextResponse.json(
        { error: `No legal research available for country: ${code}. Run the research pipeline first.` },
        { status: 404 },
      );
    }

    // Build CaseData from request body
    const txHashArray = Array.isArray(txHashes) ? txHashes : txHashes ? [txHashes] : [];
    const caseData: CaseData = {
      caseId,
      date: new Date().toISOString().split('T')[0],
      victimName: victimName || '',
      victimEmail: email,
      country: code,
      incidentDate: new Date().toISOString().split('T')[0],
      lossAmount: lossAmount || 0,
      lossCurrency: 'USD',
      cryptoType: 'ETH',
      scammerAddress: walletAddress || '',
      txid: txHashArray[0] || '',
      platformName: '',
      network: 'Ethereum',
      scamType: scamType || '',
      description: description || '',
    };

    // Render all 4 template PDFs and save to S3
    const templates: { type: TemplateType; label: string; key: string; url: string }[] = [];

    for (const templateType of TEMPLATE_TYPES) {
      const doc = getDocumentElement(templateType, research, caseData);
      const buffer = await renderToBuffer(doc);
      const pdfBuffer = Buffer.from(buffer);

      const key = await saveCasePdf(caseId, templateType, pdfBuffer);
      const url = await getPresignedUrl(key);

      templates.push({
        type: templateType,
        label: TEMPLATE_LABELS[templateType],
        key,
        url,
      });
    }

    // Send email via Resend with download links
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
            <h2 style="color: #2563eb;">LedgerHound Legal Pack</h2>
            <p>Hi ${victimName || 'there'},</p>
            <p>Your legal documents for case <strong>${caseId}</strong> (${research.name}) have been generated and are ready for download.</p>
            <p>The following documents are included:</p>
            <ul>
              ${templates.map((t) => `<li><a href="${t.url}">${t.label}</a></li>`).join('\n              ')}
            </ul>
            <p style="color: #64748b; font-size: 13px;">These links expire in 24 hours. If you need new links, contact our support team.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #64748b; font-size: 12px;">
              LedgerHound by USPROJECT LLC &mdash; Crypto Fraud Recovery<br />
              contact@ledgerhound.vip &middot; +1 (833) 559-1334
            </p>
          </div>
        `,
        text: `LedgerHound Legal Pack\n\nHi ${victimName || 'there'},\n\nYour legal documents for case ${caseId} (${research.name}) are ready.\n\nDownload your documents (links expire in 24 hours):\n${downloadLinks}\n\nLedgerHound by USPROJECT LLC\ncontact@ledgerhound.vip`,
      });
    } catch (emailErr: any) {
      // Log but don't fail the request — PDFs were already generated
      console.error('[generate-pack] Email send failed:', emailErr.message);
    }

    return NextResponse.json({
      success: true,
      caseId,
      country: code,
      templates: templates.map((t) => ({
        type: t.type,
        label: t.label,
        url: t.url,
      })),
    });
  } catch (err: any) {
    console.error('[generate-pack]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

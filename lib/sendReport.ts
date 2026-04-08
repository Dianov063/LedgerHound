import { Resend } from 'resend';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function sendReport(email: string, walletAddress: string, pdfBuffer: Buffer, caseId: string, downloadUrl?: string) {
  const shortAddr = `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`;

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'LedgerHound <noreply@ledgerhound.vip>',
    to: email,
    subject: `Your LedgerHound Forensic Report is Ready — ${caseId}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: #2563eb; color: white; font-weight: bold; font-size: 14px; padding: 8px 16px; border-radius: 8px; letter-spacing: 0.5px;">
            LedgerHound
          </div>
        </div>

        <h1 style="font-size: 24px; color: #0f172a; margin-bottom: 8px; text-align: center;">
          Your Forensic Report is Ready
        </h1>
        <p style="color: #64748b; text-align: center; margin-bottom: 32px;">
          Case ID: ${caseId}
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #475569; margin: 0 0 8px 0; font-size: 14px;">
            <strong>Wallet analyzed:</strong>
          </p>
          <p style="color: #0f172a; font-family: monospace; font-size: 13px; margin: 0; word-break: break-all;">
            ${walletAddress}
          </p>
        </div>

        <p style="color: #475569; line-height: 1.6;">
          Your automated forensic wallet report is attached as a PDF. The report includes risk scoring, transaction analysis, entity identification, and legal recommendations.
        </p>

        ${downloadUrl ? `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="color: #166534; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">
            Your report is also available for download:
          </p>
          <a href="${downloadUrl}" style="display: inline-block; background: #16a34a; color: white; font-weight: 600; font-size: 13px; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
            Download PDF Report
          </a>
          <p style="color: #6b7280; font-size: 11px; margin: 10px 0 0 0;">
            Link valid for 7 days
          </p>
        </div>
        ` : ''}

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="color: #1e40af; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">
            Need a certified investigation?
          </p>
          <p style="color: #3b82f6; font-size: 13px; margin: 0 0 12px 0;">
            Our forensic team provides court-ready reports with expert testimony, certified methodology, and attorney support.
          </p>
          <a href="https://www.ledgerhound.vip/free-evaluation" style="display: inline-block; background: #2563eb; color: white; font-weight: 600; font-size: 13px; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
            Get Free Evaluation →
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />

        <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">
          LedgerHound · USPROJECT LLC<br />
          Blockchain Forensics &amp; Crypto Asset Tracing<br />
          contact@ledgerhound.vip · +1 (833) 559-1334
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `LedgerHound-Report-${caseId}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}

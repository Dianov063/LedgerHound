import { Resend } from 'resend';
import type { PaymentSafetyCorrection } from '@/lib/non-crypto-scam-db';

const SITE_URL = 'https://www.ledgerhound.vip';
const ADMIN_EMAIL = 'contact@ledgerhound.vip';

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');
  return new Resend(process.env.RESEND_API_KEY);
}

function fromAddress() {
  return process.env.RESEND_FROM_EMAIL || 'LedgerHound <noreply@ledgerhound.vip>';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendPaymentReportVerification(input: {
  to: string;
  reportId: string;
  token: string;
}) {
  const reportId = escapeHtml(input.reportId);
  const verifyUrl = `${SITE_URL}/api/non-crypto-scam-database/verify-email?token=${encodeURIComponent(input.token)}`;
  await getResend().emails.send({
    from: fromAddress(),
    to: input.to,
    subject: `Verify your payment safety report ${reportId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#0f172a">
        <h1 style="font-size:22px;margin:0 0 12px">Verify your email</h1>
        <p style="line-height:1.6;color:#475569">Confirm that you submitted payment safety report <strong>${reportId}</strong>. Unverified reports cannot be accepted or included in public warning counts.</p>
        <p style="margin:28px 0"><a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px">Verify report</a></p>
        <p style="font-size:13px;color:#64748b">This link expires in 24 hours. If you did not submit this report, ignore this email.</p>
        <p style="font-size:12px;color:#94a3b8;margin-top:28px">LedgerHound by USPROJECT LLC</p>
      </div>
    `,
  });
}

export async function sendPaymentCorrectionEmails(correction: PaymentSafetyCorrection) {
  const id = escapeHtml(correction.id);
  const identity = escapeHtml(correction.identityMask);
  const contact = escapeHtml(correction.contactEmail);
  const resend = getResend();
  await Promise.all([
    resend.emails.send({
      from: fromAddress(),
      to: correction.contactEmail,
      subject: `Correction request received ${id}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#0f172a"><h1 style="font-size:22px">Correction request received</h1><p>Request <strong>${id}</strong> regarding <strong>${identity}</strong> is now in the moderation queue.</p><p style="color:#475569;line-height:1.6">Submitting a correction does not automatically change a warning. We will review the matching reports and supporting evidence.</p><p style="font-size:12px;color:#94a3b8;margin-top:28px">LedgerHound by USPROJECT LLC</p></div>`,
    }),
    resend.emails.send({
      from: fromAddress(),
      to: ADMIN_EMAIL,
      subject: `[ACTION] Payment correction ${id}`,
      html: `<div style="font-family:Arial,sans-serif;padding:24px"><h2>New payment safety correction</h2><p><strong>ID:</strong> ${id}</p><p><strong>Identity:</strong> ${identity}</p><p><strong>Contact:</strong> ${contact}</p><p><a href="${SITE_URL}/en/admin/payment-safety">Review in Payment Safety Admin</a></p></div>`,
    }),
  ]);
}

export async function sendPaymentCorrectionResolution(correction: PaymentSafetyCorrection) {
  const id = escapeHtml(correction.id);
  const status = escapeHtml(correction.status);
  const note = correction.resolutionNote ? `<p><strong>Reviewer note:</strong> ${escapeHtml(correction.resolutionNote)}</p>` : '';
  await getResend().emails.send({
    from: fromAddress(),
    to: correction.contactEmail,
    subject: `Correction request update ${id}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#0f172a"><h1 style="font-size:22px">Correction request updated</h1><p>Request <strong>${id}</strong> is now <strong>${status}</strong>.</p>${note}<p style="font-size:12px;color:#94a3b8;margin-top:28px">LedgerHound by USPROJECT LLC</p></div>`,
  });
}

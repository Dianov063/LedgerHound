import { Resend } from 'resend';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = 'contact@ledgerhound.vip';
const FROM = 'LedgerHound <disputes@ledgerhound.vip>';

/**
 * Send dispute notification to admin + confirmation to submitter.
 */
export async function sendDisputeEmails(disputeId: string, platformSlug: string, submitterEmail: string) {
  const resend = getResend();

  // 1. Confirmation to submitter
  await resend.emails.send({
    from: FROM,
    to: submitterEmail,
    subject: `Dispute Received — ${disputeId}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: #2563eb; color: white; font-weight: bold; font-size: 14px; padding: 8px 16px; border-radius: 8px;">
            LedgerHound
          </div>
        </div>

        <h1 style="font-size: 22px; color: #0f172a; margin-bottom: 8px; text-align: center;">
          Dispute Received
        </h1>
        <p style="color: #64748b; text-align: center; margin-bottom: 24px;">
          Dispute ID: ${disputeId}
        </p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #166534; font-weight: 600; margin: 0 0 8px 0;">Your dispute has been submitted successfully.</p>
          <p style="color: #15803d; margin: 0; line-height: 1.6;">
            Our team will review your dispute regarding platform <strong>${platformSlug}</strong> within <strong>7 business days</strong>.
            You will receive an email notification when a decision has been made.
          </p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.6;">
            <strong>What happens next:</strong><br />
            1. Our compliance team reviews your submission<br />
            2. Evidence and claims are evaluated against our records<br />
            3. A decision is communicated to you via email<br />
            4. If upheld, the listing will be updated or removed
          </p>
        </div>

        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 32px;">
          If you have additional evidence, reply to this email with your dispute ID.<br />
          LedgerHound · USPROJECT LLC · contact@ledgerhound.vip
        </p>
      </div>
    `,
  });

  // 2. Admin notification
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[ACTION] New Dispute: ${disputeId} — ${platformSlug}`,
    html: `
      <div style="font-family: monospace; padding: 20px;">
        <h2 style="color: #dc2626;">New Dispute Submitted</h2>
        <table style="border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Dispute ID:</td><td>${disputeId}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Platform:</td><td>${platformSlug}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Submitter:</td><td>${submitterEmail}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Time:</td><td>${new Date().toISOString()}</td></tr>
        </table>
        <p style="margin-top: 16px;">
          <a href="https://www.ledgerhound.vip/admin/disputes" style="color: #2563eb;">Review in Admin Dashboard →</a>
        </p>
      </div>
    `,
  });
}

/**
 * Send resolution email to dispute submitter.
 */
export async function sendDisputeResolution(
  submitterEmail: string,
  disputeId: string,
  platformSlug: string,
  resolution: 'resolved' | 'rejected',
  message: string
) {
  const resend = getResend();

  const isResolved = resolution === 'resolved';
  const subject = isResolved
    ? `Dispute Resolved — ${disputeId}`
    : `Dispute Decision — ${disputeId}`;

  await resend.emails.send({
    from: FROM,
    to: submitterEmail,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: #2563eb; color: white; font-weight: bold; font-size: 14px; padding: 8px 16px; border-radius: 8px;">
            LedgerHound
          </div>
        </div>

        <h1 style="font-size: 22px; color: #0f172a; margin-bottom: 8px; text-align: center;">
          ${isResolved ? 'Dispute Resolved' : 'Dispute Decision'}
        </h1>
        <p style="color: #64748b; text-align: center; margin-bottom: 24px;">
          Dispute ID: ${disputeId} · Platform: ${platformSlug}
        </p>

        <div style="background: ${isResolved ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${isResolved ? '#bbf7d0' : '#fecaca'}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: ${isResolved ? '#166534' : '#991b1b'}; font-weight: 600; margin: 0 0 8px 0;">
            ${isResolved ? 'Your dispute has been upheld.' : 'After careful review, the listing remains.'}
          </p>
          <p style="color: ${isResolved ? '#15803d' : '#dc2626'}; margin: 0; line-height: 1.6;">
            ${isResolved
              ? 'The listing has been updated or removed based on your dispute. Thank you for helping us maintain accuracy.'
              : 'Our compliance team has reviewed the evidence and determined the listing is accurate based on available data.'}
          </p>
        </div>

        ${message ? `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="color: #475569; font-weight: 600; margin: 0 0 8px 0;">Reviewer Notes:</p>
          <p style="color: #475569; margin: 0; line-height: 1.6;">${message}</p>
        </div>
        ` : ''}

        ${!isResolved ? `
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          If you have additional evidence or wish to appeal, you may submit a new dispute or contact us at
          <a href="mailto:contact@ledgerhound.vip" style="color: #2563eb;">contact@ledgerhound.vip</a>.
        </p>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          LedgerHound · USPROJECT LLC<br />
          contact@ledgerhound.vip · +1 (833) 559-1334
        </p>
      </div>
    `,
  });
}

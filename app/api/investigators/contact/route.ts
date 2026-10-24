/**
 * POST /api/investigators/contact
 *
 * Receives a contact request for a specific investigator.
 * Investigator's email is NEVER returned to the public — we forward
 * the request through the configured email transport and save it to S3.
 */

import { NextRequest } from 'next/server';
import { getApproved, saveContactRequest, type ContactRequest } from '@/lib/investigators/storage';
import logger from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { isEmailDeliveryConfigured, sendEmail } from '@/lib/idempotent-email';

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  /* Rate limit: 3 requests/min per IP (low because each one emails; distributed via Upstash) */
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rl = await checkRateLimit(ip, { name: 'investigator-contact', limit: 3, windowSec: 60 });
  if (!rl.success) {
    return Response.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    investigatorId,
    fromName,
    fromEmail,
    fromPhone,
    caseSummary,
    estimatedLoss,
    urgency = 'normal',
  } = body;

  /* Validate */
  if (!investigatorId || typeof investigatorId !== 'string') return Response.json({ error: 'Missing investigatorId' }, { status: 400 });
  if (!fromName || typeof fromName !== 'string' || fromName.length < 2) return Response.json({ error: 'Invalid name' }, { status: 400 });
  if (!fromEmail || !isEmail(fromEmail)) return Response.json({ error: 'Invalid email' }, { status: 400 });
  if (!caseSummary || typeof caseSummary !== 'string' || caseSummary.length < 20) return Response.json({ error: 'Case summary must be at least 20 characters' }, { status: 400 });
  if (caseSummary.length > 2000) return Response.json({ error: 'Case summary too long (max 2000 chars)' }, { status: 400 });
  if (!['urgent', 'normal', 'consultation'].includes(urgency)) return Response.json({ error: 'Invalid urgency' }, { status: 400 });

  const inv = await getApproved(investigatorId);
  if (!inv) return Response.json({ error: 'Investigator not found' }, { status: 404 });
  if (!inv.isActive) return Response.json({ error: 'Investigator is not currently accepting requests' }, { status: 400 });

  const contactReq: ContactRequest = {
    ts: new Date().toISOString(),
    investigatorId,
    investigatorName: inv.name,
    fromName: fromName.slice(0, 200),
    fromEmail,
    fromPhone: fromPhone?.slice(0, 50),
    caseSummary: caseSummary.slice(0, 2000),
    estimatedLoss: estimatedLoss?.slice(0, 50),
    urgency,
    ip,
    userAgent: req.headers.get('user-agent')?.slice(0, 500),
  };

  /* Save to S3 */
  try {
    await saveContactRequest(contactReq);
  } catch (err) {
    logger.error({ err }, '[investigators/contact] S3 save failed');
    // Still try to send email
  }

  /* Forward through the configured email transport (best effort). */
  if (isEmailDeliveryConfigured()) {
    try {
      const escape = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c));
      const urgencyLabel = urgency === 'urgent' ? 'URGENT' : urgency === 'consultation' ? 'Consultation only' : 'Normal';

      const internalEmail = `<div style="font-family: -apple-system, sans-serif; max-width: 600px; padding: 20px;">
  <h2 style="color: #0f172a;">New investigator contact request</h2>
  <p><strong>Investigator:</strong> ${escape(inv.name)} (${escape(inv.id)})</p>
  <p><strong>Urgency:</strong> ${escape(urgencyLabel)}</p>
  <hr />
  <h3>From the client</h3>
  <p><strong>Name:</strong> ${escape(fromName)}</p>
  <p><strong>Email:</strong> <a href="mailto:${escape(fromEmail)}">${escape(fromEmail)}</a></p>
  ${fromPhone ? `<p><strong>Phone:</strong> ${escape(fromPhone)}</p>` : ''}
  ${estimatedLoss ? `<p><strong>Est. loss:</strong> ${escape(estimatedLoss)}</p>` : ''}
  <hr />
  <h3>Case summary</h3>
  <p style="white-space: pre-wrap;">${escape(caseSummary)}</p>
  <hr />
  <p style="font-size: 11px; color: #64748b;">Logged at ${escape(contactReq.ts)} from IP ${escape(ip)}</p>
</div>`;

      // 1. Email to LedgerHound (admin / matching team)
      await sendEmail({
        from: process.env.RESEND_FROM_EMAIL || 'LedgerHound <noreply@ledgerhound.vip>',
        to: 'contact@ledgerhound.vip',
        replyTo: fromEmail,
        subject: `[${urgencyLabel}] New contact request for ${inv.name}`,
        html: internalEmail,
      });

      // 2. If investigator is not the in-house team, notify them too
      if (!inv.isTeam && inv.email) {
        const investigatorEmail = `<div style="font-family: -apple-system, sans-serif; max-width: 600px; padding: 20px;">
  <h2 style="color: #0f172a;">New case lead — ${escape(urgencyLabel)}</h2>
  <p>You received a contact request through the LedgerHound network.</p>
  <hr />
  <p><strong>From:</strong> ${escape(fromName)} (<a href="mailto:${escape(fromEmail)}">${escape(fromEmail)}</a>)</p>
  ${fromPhone ? `<p><strong>Phone:</strong> ${escape(fromPhone)}</p>` : ''}
  ${estimatedLoss ? `<p><strong>Est. loss:</strong> ${escape(estimatedLoss)}</p>` : ''}
  <h3>Case summary</h3>
  <p style="white-space: pre-wrap;">${escape(caseSummary)}</p>
  <hr />
  <p style="font-size: 11px; color: #64748b;">Reminder: cases booked through LedgerHound network are subject to a 15% referral fee. Please coordinate billing through LedgerHound. Reply directly to the client to accept or decline.</p>
</div>`;

        await sendEmail({
          from: process.env.RESEND_FROM_EMAIL || 'LedgerHound <noreply@ledgerhound.vip>',
          to: inv.email,
          replyTo: fromEmail,
          subject: `[LedgerHound Network] New case lead from ${fromName}`,
          html: investigatorEmail,
        });
      }

      // 3. Confirmation to the client
      await sendEmail({
        from: process.env.RESEND_FROM_EMAIL || 'LedgerHound <noreply@ledgerhound.vip>',
        to: fromEmail,
        subject: 'Your request has been received — LedgerHound',
        html: `<div style="font-family: -apple-system, sans-serif; max-width: 600px; padding: 20px;">
          <h2 style="color: #0f172a;">Thanks, ${escape(fromName)}</h2>
          <p>Your request to ${escape(inv.name)} has been received.</p>
          <p>We'll forward it within 24 hours. ${inv.isTeam ? '' : 'The investigator will reply directly to your email if they accept the case.'}</p>
          <p>If your case is urgent, you can also reach our team directly at <a href="mailto:contact@ledgerhound.vip">contact@ledgerhound.vip</a> or +1 (833) 559-1334.</p>
          <hr />
          <p style="font-size: 11px; color: #64748b;">— LedgerHound Investigations</p>
        </div>`,
      });
    } catch (err) {
      logger.error({ err }, '[investigators/contact] Email send failed (request still saved)');
    }
  }

  return Response.json({ ok: true, message: 'Your request has been received. We\'ll respond within 24 hours.' });
}

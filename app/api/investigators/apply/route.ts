/**
 * POST /api/investigators/apply
 *
 * Receives an application from an aspiring investigator.
 * Saves it to S3 (applications/) and notifies LedgerHound team via email.
 */

import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { saveApplication, saveResume, generateInvestigatorId } from '@/lib/investigators/storage';
import {
  CERTIFICATIONS,
  SPECIALIZATIONS,
  YEARS_EXPERIENCE_OPTIONS,
  type Investigator,
  type InvestigatorApplication,
  type Certification,
  type Specialization,
} from '@/lib/investigators/schema';
import logger from '@/lib/logger';

export const maxDuration = 30;

/* Rate limit: 3 applications/hour per IP */
const RATE_LIMIT_WINDOW = 3_600_000;
const rateLimit = new Map<string, { count: number; reset: number }>();
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimit.entries()).forEach(([k, v]) => { if (v.reset <= now) rateLimit.delete(k); });
}, 600_000);

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isUrl(s: string): boolean {
  try { new URL(s); return true; } catch { return false; }
}

const VALID_CERTS = new Set(CERTIFICATIONS.map((c) => c.value));
const VALID_SPECS = new Set(SPECIALIZATIONS);

export async function POST(req: NextRequest) {
  /* Rate limit */
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (entry && entry.reset > now) {
    if (entry.count >= 3) {
      return Response.json({ error: 'Too many applications. Try again later.' }, { status: 429 });
    }
    entry.count++;
  } else {
    rateLimit.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW });
  }

  let body: InvestigatorApplication;
  try {
    body = (await req.json()) as InvestigatorApplication;
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  /* ── Validate ── */
  if (!body.name || body.name.length < 2) return Response.json({ error: 'Name is required' }, { status: 400 });
  if (!body.email || !isEmail(body.email)) return Response.json({ error: 'Invalid email' }, { status: 400 });
  if (!body.city || !body.country) return Response.json({ error: 'Location is required' }, { status: 400 });
  if (!body.bio || body.bio.length < 50) return Response.json({ error: 'Bio must be at least 50 characters' }, { status: 400 });
  if (body.bio.length > 500) return Response.json({ error: 'Bio max 500 characters' }, { status: 400 });
  if (!Array.isArray(body.certifications) || body.certifications.length === 0) {
    return Response.json({ error: 'At least one certification is required' }, { status: 400 });
  }
  for (const c of body.certifications) {
    if (!VALID_CERTS.has(c)) return Response.json({ error: `Invalid certification: ${c}` }, { status: 400 });
  }
  if (body.certifications.includes('Other' as Certification) && !body.certificationsOther) {
    return Response.json({ error: 'Specify "Other" certification' }, { status: 400 });
  }
  if (!Array.isArray(body.specializations) || body.specializations.length === 0) {
    return Response.json({ error: 'At least one specialization is required' }, { status: 400 });
  }
  for (const s of body.specializations) {
    if (!VALID_SPECS.has(s)) return Response.json({ error: `Invalid specialization: ${s}` }, { status: 400 });
  }
  if (!Array.isArray(body.languages) || body.languages.length === 0) {
    return Response.json({ error: 'At least one language is required' }, { status: 400 });
  }
  if (!YEARS_EXPERIENCE_OPTIONS.includes(body.yearsExperience)) {
    return Response.json({ error: 'Invalid years of experience' }, { status: 400 });
  }
  if (body.linkedinUrl && !isUrl(body.linkedinUrl)) return Response.json({ error: 'Invalid LinkedIn URL' }, { status: 400 });
  if (body.websiteUrl && !isUrl(body.websiteUrl)) return Response.json({ error: 'Invalid website URL' }, { status: 400 });
  if (!body.agreementAccepted) return Response.json({ error: 'You must accept the agreement' }, { status: 400 });

  /* ── Build record ── */
  const id = generateInvestigatorId();
  const ts = new Date().toISOString();

  /* Resume upload */
  let resumeS3Key: string | undefined;
  if (body.resumeBase64 && body.resumeFileName) {
    try {
      resumeS3Key = await saveResume(id, body.resumeBase64, body.resumeFileName);
    } catch (err: any) {
      logger.error({ err: err.message }, '[investigators/apply] Resume upload failed');
      // Continue without resume — it's optional
    }
  }

  const inv: Investigator = {
    id,
    name: body.name.slice(0, 200),
    email: body.email,
    phone: body.phone?.slice(0, 50),
    photo: null,
    city: body.city.slice(0, 100),
    country: body.country.slice(0, 100),
    certifications: body.certifications,
    certificationsOther: body.certificationsOther?.slice(0, 200),
    specializations: body.specializations,
    languages: body.languages,
    yearsExperience: body.yearsExperience,
    bio: body.bio,
    linkedinUrl: body.linkedinUrl,
    websiteUrl: body.websiteUrl,
    availability: 'available',
    isApproved: false,
    isActive: false,
    identityVerified: false,
    certificationVerified: false,
    topInvestigator: false,
    showStats: false,
    hourlyRateMin: body.hourlyRateMin,
    hourlyRateMax: body.hourlyRateMax,
    minCaseSize: body.minCaseSize,
    acceptsContingency: body.acceptsContingency,
    licensedIn: body.licensedIn,
    expertWitnessIn: body.expertWitnessIn,
    sampleCaseStudy: body.sampleCaseStudy?.slice(0, 3000),
    resumeS3Key,
    howDidYouHear: body.howDidYouHear,
    agreementAcceptedAt: ts,
    appliedAt: ts,
    updatedAt: ts,
  };

  try {
    await saveApplication(inv);
  } catch (err: any) {
    logger.error({ err: err.message }, '[investigators/apply] Save failed');
    return Response.json({ error: 'Failed to save application' }, { status: 500 });
  }

  /* Notify admins + send confirmation */
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const escape = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c));

      // 1. Notification to LedgerHound team
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'LedgerHound <noreply@ledgerhound.vip>',
        to: 'contact@ledgerhound.vip',
        replyTo: body.email,
        subject: `[Investigator Network] New application: ${body.name}`,
        html: `<div style="font-family: -apple-system, sans-serif; max-width: 600px; padding: 20px;">
          <h2 style="color: #0f172a;">New investigator application</h2>
          <p><strong>ID:</strong> ${id}</p>
          <p><strong>Name:</strong> ${escape(body.name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escape(body.email)}">${escape(body.email)}</a></p>
          ${body.phone ? `<p><strong>Phone:</strong> ${escape(body.phone)}</p>` : ''}
          <p><strong>Location:</strong> ${escape(body.city)}, ${escape(body.country)}</p>
          <p><strong>Experience:</strong> ${escape(body.yearsExperience)} years</p>
          <p><strong>Certifications:</strong> ${body.certifications.map(escape).join(', ')}</p>
          <p><strong>Specializations:</strong> ${body.specializations.map(escape).join(', ')}</p>
          <p><strong>Languages:</strong> ${body.languages.join(', ')}</p>
          ${body.linkedinUrl ? `<p><strong>LinkedIn:</strong> ${escape(body.linkedinUrl)}</p>` : ''}
          ${body.websiteUrl ? `<p><strong>Website:</strong> ${escape(body.websiteUrl)}</p>` : ''}
          <hr />
          <h3>Bio</h3>
          <p style="white-space: pre-wrap;">${escape(body.bio)}</p>
          ${body.sampleCaseStudy ? `<h3>Sample case study</h3><p style="white-space: pre-wrap;">${escape(body.sampleCaseStudy)}</p>` : ''}
          <hr />
          <p><strong>Review at:</strong> https://www.ledgerhound.vip/admin/investigators</p>
        </div>`,
      });

      // 2. Confirmation to applicant
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'LedgerHound <noreply@ledgerhound.vip>',
        to: body.email,
        subject: 'Your application has been received — LedgerHound Network',
        html: `<div style="font-family: -apple-system, sans-serif; max-width: 600px; padding: 20px;">
          <h2 style="color: #0f172a;">Thanks, ${escape(body.name)}</h2>
          <p>Your application to the LedgerHound Investigator Network has been received.</p>
          <p>Our team reviews applications within 5 business days. We verify each certification independently before approving profiles.</p>
          <p>If approved, we'll get back to you with next steps including the NDA and onboarding details.</p>
          <p style="font-size: 11px; color: #64748b; margin-top: 24px;">— LedgerHound Investigations<br />contact@ledgerhound.vip</p>
        </div>`,
      });
    } catch (err) {
      logger.error({ err }, '[investigators/apply] Email failed (application still saved)');
    }
  }

  return Response.json({
    ok: true,
    id,
    message: 'Your application has been submitted. We review applications within 5 business days.',
  });
}

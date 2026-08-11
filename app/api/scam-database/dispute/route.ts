import { NextRequest } from 'next/server';
import { saveDispute } from '@/lib/scam-db';
import { sendDisputeEmails } from '@/lib/dispute-emails';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rl = await checkRateLimit(ip, { name: 'scam-dispute', limit: 5, windowSec: 3600 });
    if (!rl.success) {
      return Response.json({ error: 'Rate limit exceeded. Try again in 1 hour.' }, { status: 429 });
    }

    const body = await req.json();
    const { platformSlug, contactEmail, relationship, evidenceType, reason, evidenceFiles, perjuryAcknowledge } = body;

    // Validation
    if (!platformSlug || typeof platformSlug !== 'string') {
      return Response.json({ error: 'Platform selection is required.' }, { status: 400 });
    }
    if (!contactEmail || typeof contactEmail !== 'string' || !contactEmail.includes('@')) {
      return Response.json({ error: 'Valid contact email is required.' }, { status: 400 });
    }
    if (!relationship || !['platform_owner', 'legal_representative', 'other'].includes(relationship)) {
      return Response.json({ error: 'Valid relationship type is required.' }, { status: 400 });
    }
    if (!evidenceType || !['proof_of_legitimacy', 'incorrect_information', 'defamation_claim'].includes(evidenceType)) {
      return Response.json({ error: 'Valid evidence type is required.' }, { status: 400 });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 500) {
      return Response.json({ error: 'Description must be at least 500 characters.' }, { status: 400 });
    }
    if (!perjuryAcknowledge) {
      return Response.json({ error: 'You must acknowledge the perjury declaration.' }, { status: 400 });
    }

    const id = await saveDispute({
      platformSlug,
      contactEmail: contactEmail.trim(),
      reason: reason.trim(),
      relationship,
      evidenceType,
      evidenceFiles: Array.isArray(evidenceFiles) ? evidenceFiles : [],
    });

    // Send notification emails (non-blocking)
    sendDisputeEmails(id, platformSlug, contactEmail.trim()).catch((err) =>
      console.error('[dispute] Email send failed:', err)
    );

    return Response.json({
      disputeId: id,
      message: 'Your dispute has been submitted and will be reviewed within 7 business days.',
    });
  } catch (err: any) {
    console.error('[scam-database/dispute]', err);
    return Response.json({ error: 'Failed to submit dispute' }, { status: 500 });
  }
}

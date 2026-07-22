import { NextRequest } from 'next/server';
import {
  savePaymentSafetyCorrection,
  type PaymentRail,
  type PaymentSafetyCorrection,
} from '@/lib/non-crypto-scam-db';
import { sendPaymentCorrectionEmails } from '@/lib/payment-safety-emails';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_RAILS: PaymentRail[] = [
  'zelle', 'cashapp', 'venmo', 'paypal', 'apple_cash', 'chime', 'wise', 'revolut',
  'iban', 'bank_account', 'phone', 'email', 'social_handle', 'marketplace_profile', 'other',
];
const VALID_RELATIONSHIPS: PaymentSafetyCorrection['relationship'][] = [
  'account_owner', 'authorized_representative', 'affected_person', 'other',
];
const VALID_REASONS: PaymentSafetyCorrection['reason'][] = [
  'wrong_recipient', 'inaccurate_information', 'identifier_reassigned', 'false_or_duplicate_reports', 'other',
];

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rl = await checkRateLimit(ip, { name: 'payment-safety-correction', limit: 5, windowSec: 3600 });
    if (!rl.success) return Response.json({ error: 'Try again in 1 hour.' }, { status: 429 });

    const body = await req.json();
    const rail = body.rail as PaymentRail;
    const relationship = body.relationship as PaymentSafetyCorrection['relationship'];
    const reason = body.reason as PaymentSafetyCorrection['reason'];
    if (!VALID_RAILS.includes(rail)) return Response.json({ error: 'Valid payment method is required.' }, { status: 400 });
    if (!body.paymentIdentifier || String(body.paymentIdentifier).trim().length < 3) return Response.json({ error: 'Payment identifier is required.' }, { status: 400 });
    if (!body.contactName || String(body.contactName).trim().length < 3) return Response.json({ error: 'Contact name is required.' }, { status: 400 });
    if (!body.contactEmail || !/^\S+@\S+\.\S+$/.test(String(body.contactEmail).trim())) return Response.json({ error: 'Valid contact email is required.' }, { status: 400 });
    if (!VALID_RELATIONSHIPS.includes(relationship)) return Response.json({ error: 'Valid relationship is required.' }, { status: 400 });
    if (!VALID_REASONS.includes(reason)) return Response.json({ error: 'Valid correction reason is required.' }, { status: 400 });
    if (!body.explanation || String(body.explanation).trim().length < 200) return Response.json({ error: 'Explanation must be at least 200 characters.' }, { status: 400 });
    if (body.declarationAccepted !== true) return Response.json({ error: 'The accuracy declaration is required.' }, { status: 400 });

    const evidenceFiles = Array.isArray(body.evidenceFiles)
      ? body.evidenceFiles
        .filter((key: unknown): key is string => typeof key === 'string' && key.startsWith('non-crypto-scam-database/evidence/'))
        .slice(0, 5)
      : [];
    const correction = await savePaymentSafetyCorrection({
      country: body.country,
      rail,
      paymentIdentifier: String(body.paymentIdentifier),
      contactName: String(body.contactName),
      contactEmail: String(body.contactEmail),
      relationship,
      reason,
      explanation: String(body.explanation),
      evidenceFiles,
    });
    try {
      await sendPaymentCorrectionEmails(correction);
    } catch (emailError) {
      console.error('[payment-safety-correction email]', emailError);
    }
    return Response.json({ correctionId: correction.id, message: 'Correction request received.' });
  } catch (err) {
    console.error('[non-crypto-scam-database/correction]', err);
    return Response.json({ error: 'Unable to submit correction request.' }, { status: 500 });
  }
}

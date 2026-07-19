import { NextRequest } from 'next/server';
import {
  saveNonCryptoReport,
  type EvidenceType,
  type NonCryptoScamCategory,
  type PaymentRail,
} from '@/lib/non-crypto-scam-db';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_RAILS: PaymentRail[] = [
  'zelle',
  'cashapp',
  'venmo',
  'paypal',
  'wise',
  'revolut',
  'iban',
  'bank_account',
  'phone',
  'email',
  'social_handle',
  'marketplace_profile',
  'other',
];

const VALID_CATEGORIES: NonCryptoScamCategory[] = [
  'non_delivery_goods',
  'fake_service',
  'deposit_advance_fee',
  'rental_scam',
  'ticket_scam',
  'marketplace_scam',
  'employment_scam',
  'other',
];

const VALID_EVIDENCE: EvidenceType[] = [
  'payment_receipt',
  'chat_screenshot',
  'invoice',
  'delivery_promise',
  'marketplace_listing',
  'other',
];

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rl = await checkRateLimit(ip, { name: 'non-crypto-scam-report', limit: 5, windowSec: 3600 });
    if (!rl.success) {
      return Response.json({ error: 'Too many reports. Try again in 1 hour.' }, { status: 429 });
    }

    const body = await req.json();
    const {
      country,
      rail,
      paymentMethodDetails,
      paymentIdentifier,
      recipientName,
      businessName,
      aliases,
      category,
      categoryDetails,
      amount,
      currency,
      incidentDate,
      description,
      reporterEmail,
      evidenceTypes,
      evidenceFiles,
    } = body;

    if (!rail || !VALID_RAILS.includes(rail)) {
      return Response.json({ error: `Invalid payment rail. Must be one of: ${VALID_RAILS.join(', ')}` }, { status: 400 });
    }
    if (!paymentIdentifier || typeof paymentIdentifier !== 'string' || paymentIdentifier.trim().length < 3) {
      return Response.json({ error: 'Payment identifier is required.' }, { status: 400 });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return Response.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 });
    }
    if (rail === 'other' && (!paymentMethodDetails || typeof paymentMethodDetails !== 'string' || paymentMethodDetails.trim().length < 3)) {
      return Response.json({ error: 'Payment method details are required when payment method is Other.' }, { status: 400 });
    }
    if (category === 'other' && (!categoryDetails || typeof categoryDetails !== 'string' || categoryDetails.trim().length < 3)) {
      return Response.json({ error: 'Category details are required when category is Other.' }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 80) {
      return Response.json({ error: 'Description is required (minimum 80 characters).' }, { status: 400 });
    }

    const cleanEvidence = Array.isArray(evidenceTypes)
      ? evidenceTypes.filter((e: EvidenceType) => VALID_EVIDENCE.includes(e))
      : [];
    const cleanEvidenceFiles = Array.isArray(evidenceFiles)
      ? evidenceFiles
        .filter((key: unknown): key is string => typeof key === 'string')
        .filter((key) => key.startsWith('non-crypto-scam-database/evidence/'))
        .slice(0, 5)
      : [];

    const result = await saveNonCryptoReport({
      country,
      rail,
      paymentMethodDetails,
      paymentIdentifier,
      recipientName,
      businessName,
      aliases: Array.isArray(aliases) ? aliases : [],
      category,
      categoryDetails,
      amount: typeof amount === 'number' ? amount : (parseFloat(amount) || undefined),
      currency: currency || 'USD',
      incidentDate,
      description,
      reporterEmail,
      evidenceTypes: cleanEvidence,
      evidenceFiles: cleanEvidenceFiles,
      ip,
    });

    return Response.json({
      reportId: result.id,
      identity: result.identity,
      message: result.identity.publicEligible
        ? 'Report received. This payment identity has multiple independent reports.'
        : 'Report received. It will remain private until corroborated by independent reports.',
    });
  } catch (err: any) {
    console.error('[non-crypto-scam-database/report]', err);
    return Response.json({ error: err.message || 'Failed to submit report' }, { status: 500 });
  }
}

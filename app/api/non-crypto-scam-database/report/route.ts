import { NextRequest } from 'next/server';
import {
  createNonCryptoEmailVerification,
  COMMUNITY_LANGUAGES,
  normalizePaymentIdentifier,
  saveNonCryptoReport,
  REPORT_DESTINATIONS,
  SALE_CHANNELS,
  type EvidenceType,
  type CommunityLanguage,
  type NonCryptoScamCategory,
  type PaymentRail,
  type ReportDestination,
  type SaleChannel,
} from '@/lib/non-crypto-scam-db';
import { sendPaymentReportVerification } from '@/lib/payment-safety-emails';
import {
  abuseErrorResponse,
  authorizeReportSubmission,
  enforceReportLimits,
  getClientIp,
  verifySubmissionSession,
} from '@/lib/payment-report-abuse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_RAILS: PaymentRail[] = [
  'zelle',
  'cashapp',
  'venmo',
  'paypal',
  'apple_cash',
  'chime',
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
    const ip = getClientIp(req.headers);
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 100_000) {
      return Response.json({ error: 'Report payload is too large.' }, { status: 413 });
    }
    const submissionToken = req.headers.get('x-submission-token') || '';
    verifySubmissionSession(submissionToken, ip);
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
      saleChannel,
      saleChannelDetails,
      usState,
      communityLanguage,
      communityName,
      sellerProfile,
      listingUrl,
      itemOrService,
      promisedDeliveryDate,
      refundRequested,
      refundRequestDate,
      lastContactDate,
      transactionReference,
      reportedTo,
      externalReportReference,
      description,
      reporterEmail,
      locale,
      evidenceTypes,
      evidenceFiles,
    } = body;

    if (!rail || !VALID_RAILS.includes(rail)) {
      return Response.json({ error: `Invalid payment rail. Must be one of: ${VALID_RAILS.join(', ')}` }, { status: 400 });
    }
    const cleanPaymentIdentifier = typeof paymentIdentifier === 'string'
      ? paymentIdentifier.trim().slice(0, 320)
      : '';
    const cleanReporterEmail = typeof reporterEmail === 'string'
      ? reporterEmail.trim().toLowerCase().slice(0, 320)
      : '';
    const cleanDescription = typeof description === 'string'
      ? description.trim().slice(0, 5000)
      : '';

    if (cleanPaymentIdentifier.length < 3) {
      return Response.json({ error: 'Payment identifier is required.' }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanReporterEmail)) {
      return Response.json({ error: 'A valid email is required for report verification.' }, { status: 400 });
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
    if (!saleChannel || !SALE_CHANNELS.includes(saleChannel as SaleChannel)) {
      return Response.json({ error: `Invalid sale channel. Must be one of: ${SALE_CHANNELS.join(', ')}` }, { status: 400 });
    }
    if (saleChannel === 'other' && (!saleChannelDetails || typeof saleChannelDetails !== 'string' || saleChannelDetails.trim().length < 3)) {
      return Response.json({ error: 'Sale channel details are required when sale channel is Other.' }, { status: 400 });
    }
    if (communityLanguage && !COMMUNITY_LANGUAGES.includes(communityLanguage as CommunityLanguage)) {
      return Response.json({ error: 'Invalid community language.' }, { status: 400 });
    }
    if (!itemOrService || typeof itemOrService !== 'string' || itemOrService.trim().length < 3) {
      return Response.json({ error: 'Item or service is required.' }, { status: 400 });
    }
    if (listingUrl) {
      try {
        const parsedUrl = new URL(String(listingUrl));
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('protocol');
      } catch {
        return Response.json({ error: 'Listing URL must be a valid http or https URL.' }, { status: 400 });
      }
    }
    if (cleanDescription.length < 80) {
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
    const cleanReportedTo = Array.isArray(reportedTo)
      ? reportedTo.filter((destination: ReportDestination) => REPORT_DESTINATIONS.includes(destination))
      : [];

    const identity = normalizePaymentIdentifier(rail, cleanPaymentIdentifier, country);
    await authorizeReportSubmission(submissionToken, ip);
    await enforceReportLimits({
      ip,
      reporterEmail: cleanReporterEmail,
      identityHash: identity.hash,
    });

    const result = await saveNonCryptoReport({
      country,
      rail,
      paymentMethodDetails,
      paymentIdentifier: cleanPaymentIdentifier,
      recipientName,
      businessName,
      aliases: Array.isArray(aliases) ? aliases : [],
      category,
      categoryDetails,
      amount: typeof amount === 'number' ? amount : (parseFloat(amount) || undefined),
      currency: currency || 'USD',
      incidentDate,
      saleChannel,
      saleChannelDetails,
      usState,
      communityLanguage,
      communityName,
      sellerProfile,
      listingUrl,
      itemOrService,
      promisedDeliveryDate,
      refundRequested: refundRequested === true,
      refundRequestDate,
      lastContactDate,
      transactionReference,
      reportedTo: cleanReportedTo,
      externalReportReference,
      description: cleanDescription,
      reporterEmail: cleanReporterEmail,
      evidenceTypes: cleanEvidence,
      evidenceFiles: cleanEvidenceFiles,
      ip,
    });

    let verificationEmailSent = false;
    try {
      const verification = await createNonCryptoEmailVerification(result.id, cleanReporterEmail, locale);
      await sendPaymentReportVerification({
        to: cleanReporterEmail,
        reportId: result.id,
        token: verification.token,
      });
      verificationEmailSent = true;
    } catch (emailError) {
      console.error('[non-crypto-scam-database/report verification email]', emailError);
    }

    return Response.json({
      reportId: result.id,
      identity: result.identity,
      verificationRequired: true,
      verificationEmailSent,
      message: verificationEmailSent
        ? 'Report received. Verify your email before moderation can begin.'
        : 'Report received, but the verification email could not be sent. Use resend verification.',
    });
  } catch (err: any) {
    const abuseResponse = abuseErrorResponse(err);
    if (abuseResponse) return abuseResponse;
    if (err instanceof SyntaxError) {
      return Response.json({ error: 'Report payload must be valid JSON.' }, { status: 400 });
    }
    console.error('[non-crypto-scam-database/report]', err);
    return Response.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}

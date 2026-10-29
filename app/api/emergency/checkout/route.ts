import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import logger from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { CASE_ID_RE, verifyCaseSecret } from '@/lib/emergency-case-access';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const s3Bucket = () => process.env.AWS_S3_BUCKET!;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getStripe = () => {
  // @ts-expect-error Stripe types mismatch with ESM default import
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
};

/* ── Product definitions ── */
const PRODUCTS = {
  emergency_pack: {
    name: 'Emergency Preservation Pack',
    description: 'Police report, preservation letters, chain of custody evidence',
    unit_amount: 7900,
  },
  summary_report: {
    name: 'Victim Summary Report',
    description: 'Evidence package for local police filing',
    unit_amount: 1900,
  },
} as const;

type ProductKey = keyof typeof PRODUCTS;

/** Loads the case written by emergency/analyze; null when it does not exist. */
async function loadCase(caseId: string): Promise<Record<string, unknown> | null> {
  try {
    const resp = await getS3().send(
      new GetObjectCommand({ Bucket: s3Bucket(), Key: `emergency-cases/${caseId}.json` }),
    );
    const body = await resp.Body?.transformToString();
    return body ? JSON.parse(body) : null;
  } catch (err: unknown) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

/** Every Checkout Session ever created for a case, one object each (no read-modify-write race). */
const SESSIONS_PREFIX = 'emergency-case-sessions/';

async function listCaseSessionIds(caseId: string): Promise<string[]> {
  const list = await getS3().send(
    new ListObjectsV2Command({ Bucket: s3Bucket(), Prefix: `${SESSIONS_PREFIX}${caseId}/` }),
  );
  return (list.Contents ?? [])
    .map((o) => o.Key?.split('/').pop()?.replace(/\.json$/, '') || '')
    .filter(Boolean);
}

async function recordCaseSession(caseId: string, sessionId: string, product: string): Promise<void> {
  await getS3().send(
    new PutObjectCommand({
      Bucket: s3Bucket(),
      Key: `${SESSIONS_PREFIX}${caseId}/${sessionId}.json`,
      Body: JSON.stringify({ sessionId, product, createdAt: new Date().toISOString() }),
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms',
    }),
  );
}

/**
 * True once any Checkout Session of this case has been paid (asked to Stripe,
 * so it holds for every product and before any document exists), or once
 * documents were generated (cases paid before sessions were recorded).
 */
async function caseIsPaid(caseId: string): Promise<boolean> {
  const stripe = getStripe();
  for (const id of await listCaseSessionIds(caseId)) {
    const session = await stripe.checkout.sessions.retrieve(id);
    if (session.payment_status === 'paid') return true;
  }
  const docs = await getS3().send(
    new ListObjectsV2Command({ Bucket: s3Bucket(), Prefix: `legal-packs/cases/${caseId}/`, MaxKeys: 1 }),
  );
  return (docs.KeyCount ?? docs.Contents?.length ?? 0) > 0;
}

export async function POST(req: NextRequest) {
  try {
    /* ── Rate limiting ── */
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rl = await checkRateLimit(ip, { name: 'emergency-checkout', limit: 5, windowSec: 3600 });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 },
      );
    }

    /* ── Parse body ── */
    const body = await req.json();
    const {
      product,
      caseId,
      caseSecret,
      email,
      country,
      walletAddress,
      network,
      platformName,
      scamType,
      route,
      lossAmount,
      lossBracket,
      lossCurrency,
      txid,
      txDate,
      detectedNetwork,
      description,
      contactMethod,
      victimPhone,
      victimState,
      platformUrl,
      victimWallet,
    } = body;

    /* ── Validate product ── */
    if (!product || !(product in PRODUCTS)) {
      return NextResponse.json(
        { error: `Invalid product. Must be one of: ${Object.keys(PRODUCTS).join(', ')}` },
        { status: 400 },
      );
    }

    if (!caseId) {
      return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
    }

    // Only cases created by the current emergency/analyze can be checked out.
    // This rejects legacy, enumerable timestamp-only ids outright.
    if (typeof caseId !== 'string' || !CASE_ID_RE.test(caseId)) {
      return NextResponse.json({ error: 'Invalid caseId' }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    /* ── Ownership: only the browser that created the case may write to it ── */
    const existing = await loadCase(caseId);
    if (!existing || !verifyCaseSecret(caseSecret, existing.ownerSecretHash)) {
      logger.warn({ caseId, exists: !!existing }, '[emergency/checkout] Case ownership check failed');
      return NextResponse.json({ error: 'Case not found or access denied' }, { status: 403 });
    }

    // A paid case is immutable: the webhook generates the purchase from this data.
    if (await caseIsPaid(caseId)) {
      return NextResponse.json({ error: 'This case has already been paid. Start a new case for a new purchase.' }, { status: 409 });
    }

    const productDef = PRODUCTS[product as ProductKey];

    /* ── Save full case data to S3 for webhook retrieval ── */
    try {
      const casePayload = {
        // Keep analyze's fields (analysis, createdAt, ...) and its owner hash.
        ...existing,
        caseId,
        ownerSecretHash: existing.ownerSecretHash,
        product,
        email,
        country: country || '',
        walletAddress: walletAddress || '',
        victimWallet: victimWallet || '',
        network: network || '',
        detectedNetwork: detectedNetwork || network || '',
        platformName: platformName || '',
        platformUrl: platformUrl || '',
        scamType: scamType || '',
        route: route || '',
        lossAmount: lossAmount || '',
        lossBracket: lossBracket || '',
        lossCurrency: lossCurrency || 'USD',
        txid: txid || '',
        txDate: txDate || '',
        description: description || '',
        contactMethod: contactMethod || '',
        victimPhone: victimPhone || '',
        victimState: victimState || '',
        savedAt: new Date().toISOString(),
      };

      await getS3().send(
        new PutObjectCommand({
          Bucket: s3Bucket(),
          Key: `emergency-cases/${caseId}.json`,
          Body: JSON.stringify(casePayload),
          ContentType: 'application/json',
          ServerSideEncryption: 'aws:kms',
        }),
      );
      logger.info({ caseId }, '[emergency/checkout] Case data saved to S3');
    } catch (s3Err: unknown) {
      logger.error({ err: s3Err }, '[emergency/checkout] Failed to save case data to S3');
      return NextResponse.json({ error: 'Unable to save case data. Please try again.' }, { status: 500 });
    }

    /* ── Create Stripe checkout session ── */
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productDef.name,
              description: productDef.description,
            },
            unit_amount: productDef.unit_amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        caseId,
        product,
        email,
        country: country || '',
        walletAddress: walletAddress || '',
        network: network || '',
        platformName: platformName || '',
        scamType: scamType || '',
        route: route || '',
        lossAmount: String(lossAmount || ''),
        txid: txid || '',
      },
      customer_email: email,
      success_url: `${req.nextUrl.origin}/emergency/success?session_id={CHECKOUT_SESSION_ID}&case_id=${encodeURIComponent(caseId)}&product=${encodeURIComponent(product)}`,
      cancel_url: `${req.nextUrl.origin}/emergency`,
    });

    // Record the session before handing out its URL: the paid check above can
    // only see sessions it knows about. If recording fails, the session is
    // expired so it can never be paid unrecorded.
    try {
      await recordCaseSession(caseId, session.id, product);
    } catch (recordErr: unknown) {
      logger.error({ err: recordErr, caseId }, '[emergency/checkout] Could not record session; expiring it');
      try {
        await getStripe().checkout.sessions.expire(session.id);
      } catch (expireErr: unknown) {
        logger.error({ err: expireErr, sessionId: session.id }, '[emergency/checkout] Could not expire unrecorded session');
      }
      return NextResponse.json({ error: 'Unable to start checkout. Please try again.' }, { status: 500 });
    }

    logger.info({ sessionId: session.id, caseId, product }, '[emergency/checkout] Session created');

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    logger.error({ err }, '[emergency/checkout] Error');
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

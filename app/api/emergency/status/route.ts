import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAdmin } from '@/lib/admin-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { ANY_CASE_ID_RE, verifyPaidSessionForCase } from '@/lib/emergency-case-access';

export const dynamic = 'force-dynamic';

const getStripe = () => {
  // @ts-expect-error Stripe types mismatch with ESM default import
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
};

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;

const TEMPLATE_LABELS: Record<string, string> = {
  'police-complaint': 'Police Complaint',
  'preservation-letter': 'Preservation Letter',
  'regulator-complaint': 'Regulator Complaint',
  'action-guide': 'Emergency Action Guide',
};

/**
 * GET /api/emergency/status?case_id=XXX&session_id=cs_...
 *
 * Returns the generation status and download URLs for an emergency pack.
 * The success page polls this until documents appear.
 *
 * Access: the case id alone is never sufficient (legacy ids are enumerable).
 * The caller must present the PAID Stripe Checkout session that bought this
 * case (Stripe appends it to the success URL), or the admin key.
 */
export async function GET(req: NextRequest) {
  const caseId = req.nextUrl.searchParams.get('case_id');
  if (!caseId) {
    return NextResponse.json({ error: 'Missing case_id' }, { status: 400 });
  }

  // Sanitise — only allow alphanumeric, dashes, underscores
  if (!ANY_CASE_ID_RE.test(caseId)) {
    return NextResponse.json({ error: 'Invalid case_id' }, { status: 400 });
  }

  if (req.headers.get('x-admin-key')) {
    const denied = await requireAdmin(req);
    if (denied) return denied;
  } else {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    // The success page polls every 5s for up to 5 minutes (60 requests).
    const rl = await checkRateLimit(ip, { name: 'emergency-status', limit: 120, windowSec: 3600 });
    if (!rl.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
    }

    const sessionId = req.nextUrl.searchParams.get('session_id') || '';
    const allowed = await verifyPaidSessionForCase(sessionId, caseId, (id) =>
      getStripe().checkout.sessions.retrieve(id),
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  try {
    const s3 = getS3();
    const prefix = `legal-packs/cases/${caseId}/`;

    // List all PDFs under the case prefix
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket(),
        Prefix: prefix,
      }),
    );

    const objects = (list.Contents || []).filter((o) => o.Key?.endsWith('.pdf'));

    if (objects.length === 0) {
      // Also check if case data exists (payment was made but generation hasn't finished)
      let caseExists = false;
      try {
        await s3.send(
          new GetObjectCommand({
            Bucket: bucket(),
            Key: `emergency-cases/${caseId}.json`,
          }),
        );
        caseExists = true;
      } catch {
        // Case data doesn't exist either
      }

      return NextResponse.json({
        status: caseExists ? 'generating' : 'not_found',
        caseId,
        documents: [],
      });
    }

    // Generate presigned download URLs for each PDF
    const settled = await Promise.allSettled(
      objects.map(async (obj) => {
        const key = obj.Key!;
        const filename = key.split('/').pop()!.replace('.pdf', '');

        // Determine label — handle per-exchange preservation letters
        let label: string;
        if (filename.startsWith('preservation-letter-')) {
          const exchangeSlug = filename.replace('preservation-letter-', '');
          const exchangeName = exchangeSlug
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          label = `Preservation Letter — ${exchangeName}`;
        } else {
          label = TEMPLATE_LABELS[filename] || filename;
        }

        const command = new GetObjectCommand({
          Bucket: bucket(),
          Key: key,
          ResponseContentDisposition: `attachment; filename="${filename}.pdf"`,
        });
        const url = await getSignedUrl(s3, command, { expiresIn: 86400 });

        return {
          type: filename,
          label,
          url,
          size: obj.Size || 0,
          generatedAt: obj.LastModified?.toISOString() || '',
        };
      }),
    );
    const failed = settled.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`[emergency/status] ${failed.length}/${settled.length} presigned URL generations failed`);
    }
    const documents = settled
      .filter((r): r is PromiseFulfilledResult<{ type: string; label: string; url: string; size: number; generatedAt: string }> => r.status === 'fulfilled')
      .map(r => r.value);

    // Sort: action-guide first, then police, regulator, preservation letters
    const ORDER = ['action-guide', 'police-complaint', 'regulator-complaint'];
    documents.sort((a, b) => {
      const ai = ORDER.indexOf(a.type);
      const bi = ORDER.indexOf(b.type);
      const aIdx = ai >= 0 ? ai : 10;
      const bIdx = bi >= 0 ? bi : 10;
      return aIdx - bIdx;
    });

    // Load case data to get email
    let email = '';
    try {
      const caseResp = await s3.send(
        new GetObjectCommand({
          Bucket: bucket(),
          Key: `emergency-cases/${caseId}.json`,
        }),
      );
      const body = await caseResp.Body?.transformToString();
      if (body) {
        const caseData = JSON.parse(body);
        email = caseData.email || '';
      }
    } catch {
      // ok
    }

    return NextResponse.json({
      status: 'ready',
      caseId,
      email,
      documentCount: documents.length,
      documents,
    });
  } catch (err: any) {
    console.error('[emergency/status] Error:', err.message);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 },
    );
  }
}

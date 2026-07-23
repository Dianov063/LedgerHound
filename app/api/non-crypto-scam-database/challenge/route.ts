import { NextRequest } from 'next/server';
import {
  abuseErrorResponse,
  getClientIp,
  getTurnstileSiteKey,
  issueSubmissionSession,
  limitTurnstileAttempts,
  validateTurnstileToken,
} from '@/lib/payment-report-abuse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    return Response.json({ siteKey: getTurnstileSiteKey() });
  } catch (error) {
    return abuseErrorResponse(error)
      || Response.json({ error: 'Security check unavailable.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    await limitTurnstileAttempts(ip);
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 4096) {
      return Response.json({ error: 'Security check request is too large.' }, { status: 413 });
    }
    const body = await req.json();
    await validateTurnstileToken(String(body.token || ''), ip);
    return Response.json({
      submissionToken: issueSubmissionSession(ip),
      expiresIn: 600,
    });
  } catch (error) {
    return abuseErrorResponse(error)
      || Response.json({ error: 'Security check failed.' }, { status: 400 });
  }
}

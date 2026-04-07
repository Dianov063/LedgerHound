import { NextRequest } from 'next/server';

/* ── Admin auth rate limiting: 5 attempts/min per IP ── */
const authRateLimit = new Map<string, { count: number; reset: number }>();
setInterval(() => { const now = Date.now(); Array.from(authRateLimit.entries()).forEach(([k, v]) => { if (v.reset <= now) authRateLimit.delete(k); }); }, 60000);

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const now = Date.now();
  const entry = authRateLimit.get(ip);
  if (entry && entry.reset > now) {
    if (entry.count >= 5) {
      return Response.json({ error: 'Too many auth attempts. Try again later.' }, { status: 429 });
    }
    entry.count++;
  } else {
    authRateLimit.set(ip, { count: 1, reset: now + 60000 });
  }

  const authHeader = request.headers.get('x-admin-key');
  if (!authHeader || authHeader !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({
    aws: {
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET,
    },
    stripe: {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
    resend: {
      hasApiKey: !!process.env.RESEND_API_KEY,
    },
    admin: {
      hasPassword: !!process.env.ADMIN_PASSWORD,
    }
  });
}

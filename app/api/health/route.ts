import { inFlightCount, isDraining } from '@/lib/background-tasks';
import { isEmailDeliveryConfigured } from '@/lib/idempotent-email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Runtime configuration the app cannot take a paid order without. */
const REQUIRED_ENV = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
  'ADMIN_PASSWORD',
] as const;

function missingEmailConfiguration(): string[] {
  const transport = (process.env.EMAIL_TRANSPORT || 'resend').toLowerCase();
  if (transport === 'resend') return isEmailDeliveryConfigured() ? [] : ['RESEND_API_KEY'];
  if (transport === 'mailhub') return isEmailDeliveryConfigured() ? [] : ['MAILHUB_API_KEY'];
  if (transport === 'log') return isEmailDeliveryConfigured() ? [] : ['EMAIL_TRANSPORT'];
  return ['EMAIL_TRANSPORT'];
}

/**
 * GET /api/health — readiness for the container health check and deploys.
 * 503 while shutting down ('draining') or when required configuration is
 * missing (names are logged server-side, never returned). No external calls,
 * so a provider outage cannot flap it.
 */
export async function GET() {
  if (isDraining()) {
    return Response.json({ status: 'draining', backgroundTasks: inFlightCount() }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const missing = [...REQUIRED_ENV.filter((name) => !process.env[name]), ...missingEmailConfiguration()];
  if (missing.length > 0) {
    console.error('[health] Missing required env:', missing.join(', '));
    return Response.json({ status: 'misconfigured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  return Response.json(
    {
      status: 'ok',
      version: process.env.LEDGERHOUND_GIT_SHA || 'unknown',
      backgroundTasks: inFlightCount(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { checkRateLimit, claimOnce } from '@/lib/rate-limit';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_ACTION = 'payment_report';
const TEST_SITE_KEY = '1x00000000000000000000AA';
const TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';
const SESSION_TTL_SECONDS = 10 * 60;

interface TurnstileResponse {
  success: boolean;
  hostname?: string;
  action?: string;
  'error-codes'?: string[];
}

interface SubmissionSessionPayload {
  v: 1;
  nonce: string;
  ipHash: string;
  expiresAt: number;
}

export class AbuseProtectionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}

export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headers.get('x-real-ip')?.trim()
    || 'unknown';
}

export function abuseHash(scope: string, value: string): string {
  return createHash('sha256')
    .update(`ledgerhound-abuse:v1:${scope}:${value.trim().toLowerCase()}`)
    .digest('hex');
}

function turnstileSecret(): string {
  if (process.env.TURNSTILE_SECRET_KEY) return process.env.TURNSTILE_SECRET_KEY;
  if (process.env.NODE_ENV !== 'production') return TEST_SECRET_KEY;
  throw new AbuseProtectionError('Security check is not configured.', 503, 'turnstile_not_configured');
}

export function getTurnstileSiteKey(): string {
  if (process.env.TURNSTILE_SITE_KEY) return process.env.TURNSTILE_SITE_KEY;
  if (process.env.NODE_ENV !== 'production') return TEST_SITE_KEY;
  throw new AbuseProtectionError('Security check is not configured.', 503, 'turnstile_not_configured');
}

function allowedTurnstileHostnames(): Set<string> {
  const configured = process.env.TURNSTILE_ALLOWED_HOSTNAMES
    || 'ledgerhound.vip,www.ledgerhound.vip';
  return new Set(configured.split(',').map((hostname) => hostname.trim().toLowerCase()).filter(Boolean));
}

export async function validateTurnstileToken(token: string, ip: string): Promise<void> {
  if (!token || token.length > 2048) {
    throw new AbuseProtectionError('Complete the security check before submitting.', 400, 'turnstile_required');
  }

  const secret = turnstileSecret();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const form = new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
      idempotency_key: randomUUID(),
    });
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new AbuseProtectionError('Security check is temporarily unavailable.', 503, 'turnstile_unavailable');
    }
    const result = await response.json() as TurnstileResponse;
    if (!result.success) {
      console.warn('[payment-report turnstile rejected]', result['error-codes'] || []);
      throw new AbuseProtectionError('Security check expired or failed. Try again.', 403, 'turnstile_rejected');
    }

    if (process.env.NODE_ENV === 'production') {
      if (result.action !== TURNSTILE_ACTION) {
        throw new AbuseProtectionError('Security check context is invalid.', 403, 'turnstile_action_mismatch');
      }
      if (!result.hostname || !allowedTurnstileHostnames().has(result.hostname.toLowerCase())) {
        throw new AbuseProtectionError('Security check hostname is invalid.', 403, 'turnstile_hostname_mismatch');
      }
    }
  } catch (error) {
    if (error instanceof AbuseProtectionError) throw error;
    console.error('[payment-report turnstile]', error);
    throw new AbuseProtectionError('Security check is temporarily unavailable.', 503, 'turnstile_unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

function sessionSignature(encodedPayload: string): string {
  return createHmac('sha256', turnstileSecret())
    .update(`ledgerhound-payment-report-session:v1:${encodedPayload}`)
    .digest('base64url');
}

export function issueSubmissionSession(ip: string, now = Date.now()): string {
  const payload: SubmissionSessionPayload = {
    v: 1,
    nonce: randomUUID(),
    ipHash: abuseHash('network', ip),
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${sessionSignature(encodedPayload)}`;
}

export function verifySubmissionSession(token: string, ip: string, now = Date.now()): SubmissionSessionPayload {
  const [encodedPayload, signature, extra] = token.split('.');
  if (!encodedPayload || !signature || extra) {
    throw new AbuseProtectionError('Security session is invalid.', 403, 'submission_session_invalid');
  }

  const expected = sessionSignature(encodedPayload);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
    throw new AbuseProtectionError('Security session is invalid.', 403, 'submission_session_invalid');
  }

  let payload: SubmissionSessionPayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SubmissionSessionPayload;
  } catch {
    throw new AbuseProtectionError('Security session is invalid.', 403, 'submission_session_invalid');
  }
  if (
    payload.v !== 1
    || !payload.nonce
    || payload.ipHash !== abuseHash('network', ip)
    || !Number.isFinite(payload.expiresAt)
    || payload.expiresAt <= now
  ) {
    throw new AbuseProtectionError('Security session expired. Complete the check again.', 403, 'submission_session_expired');
  }
  return payload;
}

export async function limitTurnstileAttempts(ip: string): Promise<void> {
  const result = await checkRateLimit(abuseHash('network', ip), {
    name: 'payment-report-turnstile',
    limit: 20,
    windowSec: 3600,
  });
  if (!result.success) {
    throw new AbuseProtectionError('Too many security checks. Try again later.', 429, 'turnstile_rate_limited');
  }
}

export async function authorizeEvidenceUpload(sessionToken: string, ip: string): Promise<void> {
  const session = verifySubmissionSession(sessionToken, ip);
  const result = await checkRateLimit(session.nonce, {
    name: 'payment-report-session-upload',
    limit: 5,
    windowSec: SESSION_TTL_SECONDS,
  });
  if (!result.success) {
    throw new AbuseProtectionError('This security session has reached its upload limit.', 429, 'upload_session_exhausted');
  }
}

export async function authorizeReportSubmission(sessionToken: string, ip: string): Promise<void> {
  const session = verifySubmissionSession(sessionToken, ip);
  const result = await checkRateLimit(session.nonce, {
    name: 'payment-report-session-submit',
    limit: 1,
    windowSec: SESSION_TTL_SECONDS,
  });
  if (!result.success) {
    throw new AbuseProtectionError('This security session has already been used.', 409, 'submission_session_used');
  }
}

async function requireLimit(
  identifier: string,
  name: string,
  limit: number,
  windowSec: number,
  message: string,
  code: string,
): Promise<void> {
  const result = await checkRateLimit(identifier, { name, limit, windowSec });
  if (!result.success) throw new AbuseProtectionError(message, 429, code);
}

export async function enforceReportLimits(input: {
  ip: string;
  reporterEmail: string;
  identityHash: string;
}): Promise<void> {
  const networkKey = abuseHash('network', input.ip);
  const emailKey = abuseHash('email', input.reporterEmail);
  const identityKey = abuseHash('identity', input.identityHash);
  const duplicateKey = abuseHash('email-identity', `${emailKey}:${identityKey}`);

  await requireLimit(
    networkKey,
    'non-crypto-scam-report-hour',
    5,
    3600,
    'Too many reports from this network. Try again in 1 hour.',
    'network_hour_limit',
  );
  await requireLimit(
    networkKey,
    'non-crypto-scam-report-day',
    20,
    86400,
    'Daily report limit reached for this network.',
    'network_day_limit',
  );
  await requireLimit(
    emailKey,
    'non-crypto-scam-report-email-day',
    3,
    86400,
    'Daily report limit reached for this email.',
    'email_day_limit',
  );
  await requireLimit(
    identityKey,
    'non-crypto-scam-report-identity-day',
    50,
    86400,
    'This recipient has received an unusually high number of reports today. Try again later.',
    'identity_day_limit',
  );
  const duplicate = await claimOnce(duplicateKey, {
    name: 'non-crypto-scam-report-duplicate',
    ttlSec: 86400,
  });
  if (!duplicate.success) {
    throw new AbuseProtectionError(
      'A report from this email about this recipient was already received in the last 24 hours.',
      429,
      'duplicate_report',
    );
  }
}

export function abuseErrorResponse(error: unknown): Response | null {
  if (!(error instanceof AbuseProtectionError)) return null;
  return Response.json(
    { error: error.message, code: error.code },
    {
      status: error.status,
      headers: error.status === 429 ? { 'Retry-After': '3600' } : undefined,
    },
  );
}

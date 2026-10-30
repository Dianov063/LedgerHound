/**
 * The site's public origin, for absolute URLs that leave the server (Stripe
 * return URLs, redirects, requests back to the site).
 *
 * Behind a reverse proxy the Next standalone server builds req.url from its
 * bind address (HOSTNAME=0.0.0.0), not from the Host header, so the request
 * URL cannot be used there. Self-hosted, the origin comes from
 * LEDGERHOUND_PUBLIC_ORIGIN and nothing else: Host and X-Forwarded-Host are
 * never trusted. A missing or invalid value is an explicit error, never a
 * silent fall back to the request URL.
 *
 * On Vercel and in local development the variable is normally unset and the
 * request origin is correct (it also keeps preview deployments on their own
 * URL). A value set there is validated and used the same way.
 */
export class PublicOriginError extends Error {
  constructor(reason: string) {
    super(`LEDGERHOUND_PUBLIC_ORIGIN: ${reason}`);
    this.name = 'PublicOriginError';
  }
}

/** Bind-all addresses: never a place a browser or another server can reach. */
const BIND_ADDRESSES = new Set(['0.0.0.0', '[::]']);

function isInternalHost(hostname: string): boolean {
  return BIND_ADDRESSES.has(hostname)
    || hostname === 'localhost'
    || hostname.startsWith('127.')
    || !hostname.includes('.'); // [::1] and container names such as ledgerhound-web
}

function parseOrigin(raw: string): string {
  if (/[\s\\]/.test(raw)) throw new PublicOriginError('must not contain spaces or backslashes');
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new PublicOriginError('is not a valid URL');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new PublicOriginError('scheme must be https or http');
  if (url.username || url.password) throw new PublicOriginError('must not contain credentials');
  if (raw.includes('?')) throw new PublicOriginError('must not contain a query');
  if (raw.includes('#')) throw new PublicOriginError('must not contain a fragment');
  if (raw.replace(/\/$/, '').toLowerCase() !== url.origin.toLowerCase()) {
    throw new PublicOriginError('must be only a scheme and host, with no path');
  }
  if (process.env.NODE_ENV === 'production') {
    if (url.protocol !== 'https:') throw new PublicOriginError('must use https in production');
    if (isInternalHost(url.hostname)) throw new PublicOriginError('must be a public host in production');
  }
  return url.origin;
}

const isSelfHosted = () => process.env.LEDGERHOUND_SELF_HOST === '1';

/** Absolute origin for URLs built from `req`. Throws PublicOriginError when misconfigured. */
export function getPublicOrigin(req: { nextUrl: { origin: string; hostname: string } }): string {
  const raw = process.env.LEDGERHOUND_PUBLIC_ORIGIN;
  if (raw) return parseOrigin(raw);
  if (isSelfHosted()) throw new PublicOriginError('is required on a self-hosted deployment');
  if (BIND_ADDRESSES.has(req.nextUrl.hostname)) {
    throw new PublicOriginError(`is required: the request URL has the bind address ${req.nextUrl.hostname}`);
  }
  return req.nextUrl.origin;
}

/** For start-up and health checks: what is wrong with the configuration, or null. */
export function publicOriginProblem(): string | null {
  const raw = process.env.LEDGERHOUND_PUBLIC_ORIGIN;
  try {
    if (raw) parseOrigin(raw);
    else if (isSelfHosted()) throw new PublicOriginError('is required on a self-hosted deployment');
    return null;
  } catch (err) {
    return (err as Error).message;
  }
}

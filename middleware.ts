import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

const CSP_DIRECTIVES = [
  "default-src 'self'",
  // Google Analytics 4 (@next/third-parties): tag is loaded from googletagmanager
  // and beacons go to *.google-analytics.com (region-prefixed: region1.*, etc.)
  // plus analytics.google.com. Wildcard kept so non-US regions also report.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://api.stripe.com https://*.alchemy.com https://*.etherscan.io https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com",
  "frame-src https://js.stripe.com",
].join('; ');

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('Content-Security-Policy', CSP_DIRECTIVES);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', 'https://www.ledgerhound.vip');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight for API routes (except webhook — Stripe needs open access)
  if (pathname.startsWith('/api/') && pathname !== '/api/webhook') {
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      addCorsHeaders(response);
      addSecurityHeaders(response);
      return response;
    }
  }

  // API routes don't need i18n middleware
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    addCorsHeaders(response);
    return response;
  }

  // All other routes go through i18n middleware
  const response = intlMiddleware(request);
  addSecurityHeaders(response);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

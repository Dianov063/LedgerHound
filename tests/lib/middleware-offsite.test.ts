// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

/* The second check does not depend on knowing the bypass: whatever next-intl
   answers, a redirect or rewrite to another origin is never sent. */
const answer = vi.hoisted(() => ({ make: (): Response => new Response(null) }));
vi.mock('next-intl/middleware', () => ({ default: () => () => answer.make() }));

const run = async (make: () => Response) => {
  answer.make = make;
  const { default: middleware } = await import('@/middleware');
  return middleware(new NextRequest('https://www.ledgerhound.vip/en/pricing'));
};

describe('off-site answers from the locale middleware', () => {
  it.each([
    ['a redirect to another host', () => NextResponse.redirect('https://evil.example/')],
    ['a protocol-relative redirect', () => new NextResponse(null, { status: 307, headers: { location: '//evil.example/x' } })],
    ['a redirect to another scheme', () => new NextResponse(null, { status: 307, headers: { location: 'javascript:alert(1)' } })],
    ['a rewrite to another host', () => NextResponse.rewrite('https://evil.example/')],
  ])('refuses %s', async (_name, make) => {
    const res = await run(make);
    expect(res.status).toBe(400);
    expect(res.headers.get('location')).toBeNull();
  });

  it('passes a same-origin redirect', async () => {
    const res = await run(() => NextResponse.redirect('https://www.ledgerhound.vip/pricing'));
    expect(res.headers.get('location')).toBe('https://www.ledgerhound.vip/pricing');
  });
});

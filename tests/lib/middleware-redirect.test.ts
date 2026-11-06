// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import middleware from '@/middleware';

const ORIGIN = 'https://www.ledgerhound.vip';
const EVIL = 'evil.example';

/* Paths that try to make a locale redirect leave the site: literal and encoded
   slashes and backslashes, and control characters the URL parser drops
   (tab, LF, CR) or that are otherwise invisible. */
const SEPARATORS = [
  '/', '//', '\\', '/\\', '\\/',
  '%2F', '%2f', '%2F%2F', '%5C', '%5c', '%5C%5C', '%2F%5C', '%5C%2F',
  '%09', '%0A', '%0D', '%0a', '%0d', '%00', '%0B', '%0C', '%1F', '%7F', '%20',
  '%09%09', '%0A%0D', '/%09', '%09/', '/%0A/', '%E2%80%8B', '%C2%A0', '%E3%80%82',
  '%252F', '%255C', '%2509',
];
const PREFIXES = ['', '/en', '/ru', '/ar', '/EN', '/en/'];
const COOKIES = [undefined, 'NEXT_LOCALE=ru', 'NEXT_LOCALE=en'];

const cases = PREFIXES.flatMap((prefix) =>
  SEPARATORS.flatMap((sep) => [`${prefix}/${sep}${EVIL}`, `${prefix}/${sep}/${EVIL}/path`, `${prefix}${sep}${EVIL}`]),
);

function request(path: string, cookie?: string) {
  const headers = new Headers({ host: 'www.ledgerhound.vip', 'accept-language': 'ru-RU,ru;q=0.9' });
  if (cookie) headers.set('cookie', cookie);
  // Build from the raw string so the path reaches the middleware the way a client sends it.
  return new NextRequest(new URL(ORIGIN + (path.startsWith('/') ? path : `/${path}`)), { headers });
}

/** Every URL the response sends the browser or Next.js to. */
function targets(res: Response) {
  return ['location', 'x-middleware-rewrite'].map((h) => res.headers.get(h)).filter((v): v is string => !!v);
}

describe('locale redirects stay on the site', () => {
  it.each(COOKIES)('no path leaves the origin (cookie %s)', (cookie) => {
    const escaped: string[] = [];
    for (const path of cases) {
      let res: Response;
      try {
        res = middleware(request(path, cookie));
      } catch {
        continue; // an unparseable request is refused, which is not a redirect
      }
      for (const target of targets(res)) {
        const url = new URL(target, ORIGIN);
        if (url.origin !== ORIGIN) escaped.push(`${path} -> ${target}`);
      }
    }
    expect(escaped).toEqual([]);
  });

  it('still redirects an ordinary default-locale path', () => {
    const res = middleware(request('/en/scam-checker'));
    expect(res.headers.get('location')).toBe(`${ORIGIN}/scam-checker`);
  });

  it('still prefixes an ordinary path for a returning Russian visitor', () => {
    const res = middleware(request('/pricing?x=1', 'NEXT_LOCALE=ru'));
    expect(res.headers.get('location')).toBe(`${ORIGIN}/ru/pricing?x=1`);
  });
});

describe('the guard itself', () => {
  it.each(['/en/%09/evil.example', '/en/%0A/x', '/ru/%00', '/en/%5Cevil.example', '/en/%E0%A4%A', '/%7F'])(
    'refuses %s with 400 before locale handling',
    (path) => {
      const res = middleware(request(path));
      expect(res.status).toBe(400);
      expect(res.headers.get('location')).toBeNull();
      expect(res.headers.get('x-frame-options')).toBe('DENY');
    },
  );

  it.each(['/ru/%D0%B1%D0%BB%D0%BE%D0%B3', '/zh/%E5%8D%9A%E5%AE%A2', '/en/a%2509b', '/blog/some-post'])('lets %s through', (path) => {
    expect(middleware(request(path)).status).not.toBe(400);
  });
});

// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as generatePack } from '@/app/api/emergency/generate-pack/route';
import { POST as blogAgent } from '@/app/api/blog-agent/route';
import { requireAdmin } from '@/lib/admin-auth';

vi.mock('@aws-sdk/client-s3', () => import('./helpers/aws-s3-mock'));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: async () => ({ success: true, remaining: 99, backend: 'memory' }),
}));
const generateEmergencyPack = vi.hoisted(() => vi.fn(async () => ({ templates: [] })));
vi.mock('@/lib/generateEmergencyPack', () => ({ generateEmergencyPack }));

const ADMIN = 'correct-horse-battery-staple';

function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`https://www.ledgerhound.vip${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const packBody = { caseId: 'ER-X', countryCode: 'US', email: 'anyone@example.com' };
let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  process.env.ADMIN_PASSWORD = ADMIN;
  process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
  process.env.TAVILY_API_KEY = 'test-tavily-key';
  generateEmergencyPack.mockClear();
  fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network must not be used'));
});

afterEach(() => {
  fetchSpy.mockRestore();
});

describe('emergency/generate-pack is admin-only', () => {
  it('rejects anonymous callers without generating or emailing anything', async () => {
    const res = await generatePack(post('/api/emergency/generate-pack', packBody));
    expect(res.status).toBe(401);
    expect(generateEmergencyPack).not.toHaveBeenCalled();
  });

  it('rejects a wrong admin key', async () => {
    const res = await generatePack(post('/api/emergency/generate-pack', packBody, { 'x-admin-key': 'wrong' }));
    expect(res.status).toBe(401);
    expect(generateEmergencyPack).not.toHaveBeenCalled();
  });

  it('runs for the admin', async () => {
    const res = await generatePack(post('/api/emergency/generate-pack', packBody, { 'x-admin-key': ADMIN }));
    expect(res.status).toBe(200);
    expect(generateEmergencyPack).toHaveBeenCalledTimes(1);
  });
});

describe('blog-agent is admin-only (paid LLM / research APIs)', () => {
  it.each(['research', 'suggest-topics', 'legacy'])('rejects anonymous mode=%s without any outbound call', async (mode) => {
    const res = await blogAgent(post('/api/blog-agent', { mode, query: 'x' }));
    expect(res.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('requireAdmin', () => {
  it('fails closed when ADMIN_PASSWORD is not configured', async () => {
    delete process.env.ADMIN_PASSWORD;
    const denied = await requireAdmin(new Request('https://x/api', { headers: { 'x-admin-key': '' } }));
    expect(denied?.status).toBe(401);
  });

  it('rejects keys that differ only in length or case', async () => {
    for (const key of [ADMIN.slice(0, -1), `${ADMIN}x`, ADMIN.toUpperCase()]) {
      const denied = await requireAdmin(new Request('https://x/api', { headers: { 'x-admin-key': key } }));
      expect(denied?.status).toBe(401);
    }
    expect(await requireAdmin(new Request('https://x/api', { headers: { 'x-admin-key': ADMIN } }))).toBeNull();
  });
});

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiting with Upstash (Redis) as the shared, cross-instance store and a
 * process-local in-memory fallback (fallback "A").
 *
 * Why the fallback: on Vercel serverless an in-memory-only limiter is unreliable
 * (resets on cold start, not shared between concurrent instances). Upstash fixes
 * that. But if Upstash is not configured OR is momentarily unreachable, we must
 * NOT silently drop all protection — we fall back to the in-memory limiter so a
 * (weaker, process-local) limit still applies. Service stays up either way.
 */

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/** True when Upstash is configured (surfaced via /api/check-env for ops). */
export const hasUpstash = !!redis;

// Cache one Upstash limiter per unique (name, limit, windowSec) so repeated
// calls reuse the same instance instead of rebuilding it per request.
const upstashCache = new Map<string, Ratelimit>();
function getUpstashLimiter(name: string, limit: number, windowSec: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${name}:${limit}:${windowSec}`;
  let rl = upstashCache.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis,
      // fixedWindow matches the routes' original semantics (count resets at the
      // end of a fixed window) and is cheap on Redis.
      limiter: Ratelimit.fixedWindow(limit, `${windowSec} s`),
      analytics: true,
      prefix: `rl:${name}`,
    });
    upstashCache.set(key, rl);
  }
  return rl;
}

// ── In-memory fallback (process-local fixed window) ──
const memStore = new Map<string, { count: number; reset: number }>();
const memClaims = new Map<string, number>();
setInterval(() => {
  const now = Date.now();
  Array.from(memStore.entries()).forEach(([k, v]) => { if (v.reset <= now) memStore.delete(k); });
  Array.from(memClaims.entries()).forEach(([k, expiresAt]) => { if (expiresAt <= now) memClaims.delete(k); });
}, 600000).unref?.();

function checkMemory(key: string, limit: number, windowSec: number): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = memStore.get(key);
  if (entry && entry.reset > now) {
    if (entry.count >= limit) return { success: false, remaining: 0 };
    entry.count++;
    return { success: true, remaining: limit - entry.count };
  }
  memStore.set(key, { count: 1, reset: now + windowSec * 1000 });
  return { success: true, remaining: limit - 1 };
}

export interface RateLimitConfig {
  /** Stable bucket name → Redis key prefix + in-memory namespace. */
  name: string;
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
}

/**
 * Check (and consume) one unit against the limit for `identifier` (usually IP).
 * Tries Upstash first; on missing config OR runtime error falls back to the
 * in-memory limiter (fallback A). Never throws.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<{ success: boolean; remaining: number; backend: 'upstash' | 'memory' }> {
  const { name, limit, windowSec } = config;
  const limiter = getUpstashLimiter(name, limit, windowSec);
  if (limiter) {
    try {
      const r = await limiter.limit(identifier);
      return { success: r.success, remaining: r.remaining, backend: 'upstash' };
    } catch (err) {
      console.warn(`[rate-limit] Upstash error for "${name}", falling back to in-memory:`, err);
      // fall through to in-memory (fallback A)
    }
  }
  return { ...checkMemory(`${name}:${identifier}`, limit, windowSec), backend: 'memory' };
}

/**
 * Atomically claim an identifier for an exact TTL. This is useful for
 * deduplication windows where fixed-window rate limiting can admit a request
 * immediately before and after a bucket boundary.
 */
export async function claimOnce(
  identifier: string,
  config: { name: string; ttlSec: number },
): Promise<{ success: boolean; backend: 'upstash' | 'memory' }> {
  const key = `claim:${config.name}:${identifier}`;
  if (redis) {
    try {
      const result = await redis.set(key, '1', { nx: true, ex: config.ttlSec });
      return { success: result === 'OK', backend: 'upstash' };
    } catch (err) {
      console.warn(`[rate-limit] Upstash error for claim "${config.name}", falling back to in-memory:`, err);
    }
  }

  const now = Date.now();
  const expiresAt = memClaims.get(key);
  if (expiresAt && expiresAt > now) return { success: false, backend: 'memory' };
  memClaims.set(key, now + config.ttlSec * 1000);
  return { success: true, backend: 'memory' };
}

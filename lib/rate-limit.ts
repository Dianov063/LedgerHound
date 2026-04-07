import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'rl:api',
    })
  : null;

export const checkoutRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'rl:checkout',
    })
  : null;

export const adminRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'rl:admin',
    })
  : null;

export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null = apiRateLimit
): Promise<{ success: boolean; remaining: number }> {
  if (!limiter) {
    return { success: true, remaining: 999 };
  }
  try {
    const result = await limiter.limit(identifier);
    return { success: result.success, remaining: result.remaining };
  } catch (err) {
    console.warn('[rate-limit] Upstash error, allowing request:', err);
    return { success: true, remaining: 999 };
  }
}

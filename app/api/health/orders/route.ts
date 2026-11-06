import { getOrderHealth } from '@/lib/order-health';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/health/orders — paid-order queues for monitoring.
 *
 * Counts only (pending, age of the oldest pending, failed, manual review), no
 * ids or personal data; null means the queue could not be read ("unknown").
 * Always HTTP 200 with a `status` field ('ok' | 'attention' | 'unknown'):
 * it must never be used as the container health check, because a parked
 * order is not fixed by restarting a healthy container. Shared for a minute
 * per process, so polling it cannot multiply S3 list calls.
 */
export async function GET() {
  const orders = await getOrderHealth();
  return Response.json(orders, { headers: { 'Cache-Control': 'no-store' } });
}

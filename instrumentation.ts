/**
 * Server start hook. Enabled only in the self-hosted build
 * (LEDGERHOUND_SELF_HOST=1 turns on experimental.instrumentationHook).
 *
 * Next's own SIGTERM handler closes the server and exits without waiting for
 * work that continues after a response (report / pack generation). The image
 * sets NEXT_MANUAL_SIG_HANDLE=true so Next leaves the signals to us. On a
 * signal we enter the draining state (new webhooks and sweeps get 503 so
 * Stripe and the cron redeliver to the next process; health reports
 * 'draining'), wait for in-flight background work bounded by
 * LEDGERHOUND_DRAIN_TIMEOUT_MS (keep it below compose's stop_grace_period),
 * then exit. Anything still unfinished is resumed after restart by
 * /api/admin/resume-webhook-jobs. Pages keep being served until exit.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.LEDGERHOUND_SELF_HOST !== '1') return;

  const { beginDrain, drainBackgroundTasks, inFlightCount } = await import('@/lib/background-tasks');
  const { hasUpstash } = await import('@/lib/rate-limit');
  const { publicOriginProblem } = await import('@/lib/public-origin');

  const originProblem = publicOriginProblem();
  if (originProblem) {
    console.error(`[startup] ${originProblem}. Checkouts and email links are refused and /api/health reports misconfigured until it is fixed.`);
  }

  if (!hasUpstash) {
    console.warn('[startup] UPSTASH_REDIS_REST_URL not set: rate limits use this process only (correct for a single container, not for several replicas)');
  }

  const timeoutMs = Number(process.env.LEDGERHOUND_DRAIN_TIMEOUT_MS || 100_000);
  let stopping = false;

  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    // From here new work is refused (webhook / sweep → 503, health → draining).
    beginDrain();
    console.log(`[shutdown] ${signal}: waiting for ${inFlightCount()} background task(s), up to ${timeoutMs} ms`);
    const { drained, remaining } = await drainBackgroundTasks(timeoutMs);
    console.log(drained
      ? '[shutdown] background work finished; exiting'
      : `[shutdown] ${remaining} task(s) still running; exiting, recovery sweep will resume them`);
    process.exit(0);
  };

  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT', () => { void shutdown('SIGINT'); });
}

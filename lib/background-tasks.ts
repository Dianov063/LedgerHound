import { waitUntil } from '@vercel/functions';

/**
 * Tracks work that continues after an HTTP response has been sent.
 *
 * On Vercel, `waitUntil` keeps the function alive until the promise settles.
 * Off Vercel there is no request context, so `waitUntil` registers nothing:
 * the promise still runs in the long-lived Node process, but nothing waits for
 * it on shutdown. This registry lets the SIGTERM handler (instrumentation.ts)
 * drain in-flight work before the process exits.
 *
 * The registry lives on globalThis because route bundles and the
 * instrumentation bundle can each get their own copy of this module.
 */
interface Registry {
  tasks: Set<Promise<unknown>>;
  labels: Set<string>;
}

const KEY = Symbol.for('ledgerhound.backgroundTasks');

function registry(): Registry {
  const g = globalThis as unknown as Record<symbol, Registry | undefined>;
  if (!g[KEY]) g[KEY] = { tasks: new Set(), labels: new Set() };
  return g[KEY]!;
}

/**
 * Runs `task` after the response. `label` (e.g. a Stripe event id) marks the
 * work as in flight so a recovery sweep does not start it a second time.
 * Errors must be handled inside `task`; anything that escapes is swallowed
 * here so it cannot crash the process.
 */
export function runInBackground(task: Promise<unknown>, label?: string): void {
  const reg = registry();
  if (label) reg.labels.add(label);
  const tracked: Promise<unknown> = task
    .catch(() => undefined)
    .finally(() => {
      reg.tasks.delete(tracked);
      if (label) reg.labels.delete(label);
    });
  reg.tasks.add(tracked);
  waitUntil(tracked);
}

export function isInFlight(label: string): boolean {
  return registry().labels.has(label);
}

export function inFlightCount(): number {
  return registry().tasks.size;
}

/** Waits for in-flight work, up to `timeoutMs`. Resolves with what is left. */
export async function drainBackgroundTasks(timeoutMs: number): Promise<{ drained: boolean; remaining: number }> {
  const reg = registry();
  const deadline = Date.now() + timeoutMs;
  while (reg.tasks.size > 0 && Date.now() < deadline) {
    const left = deadline - Date.now();
    await Promise.race([
      Promise.allSettled(Array.from(reg.tasks)),
      new Promise((resolve) => setTimeout(resolve, Math.max(0, left))),
    ]);
  }
  return { drained: reg.tasks.size === 0, remaining: reg.tasks.size };
}

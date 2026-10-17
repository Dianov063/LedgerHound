/**
 * In-process "one at a time" guard for scheduled jobs.
 *
 * The self-hosted deployment runs a single web container, so a process-level
 * flag is enough to stop the cron runner (or a manual call) from starting a
 * second copy of a job that is still running. The flag lives on globalThis
 * because separate route bundles can each load their own copy of this module.
 */
const KEY = Symbol.for('ledgerhound.runLocks');

function locks(): Set<string> {
  const g = globalThis as unknown as Record<symbol, Set<string> | undefined>;
  if (!g[KEY]) g[KEY] = new Set();
  return g[KEY]!;
}

/** Runs `fn` unless `name` is already running; returns null when skipped. */
export async function withRunLock<T>(name: string, fn: () => Promise<T>): Promise<T | null> {
  const held = locks();
  if (held.has(name)) return null;
  held.add(name);
  try {
    return await fn();
  } finally {
    held.delete(name);
  }
}

export const ALREADY_RUNNING = () =>
  Response.json({ error: 'Already running' }, { status: 409 });

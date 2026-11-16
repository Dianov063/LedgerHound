/**
 * Server start hook. Next loads this file itself (stable since Next 15); it acts
 * only in the self-hosted build (LEDGERHOUND_SELF_HOST=1) and only in the Node.js
 * runtime. The work itself (startup checks, graceful SIGTERM drain) is in
 * instrumentation-node.ts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.LEDGERHOUND_SELF_HOST === '1') {
    const { registerNode } = await import('./instrumentation-node');
    registerNode();
  }
}

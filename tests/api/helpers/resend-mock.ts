/**
 * Stand-in for the `resend` package with Resend's idempotency semantics, used via
 *   vi.mock('resend', () => import('./helpers/resend-mock'))
 *
 * - Errors are returned as `{ data: null, error }`, never thrown (like the SDK).
 * - A key seen before with the same body returns the original result without
 *   sending; with a different body it returns `invalid_idempotent_request`.
 * - A failed send does not register its key.
 * `sentEmails` holds only emails that were really sent.
 */
interface Payload { to?: string | string[]; subject?: string; attachments?: { filename?: string }[] }

export const sentEmails: Payload[] = [];
const keys = new Map<string, string>();
/** Queue of failures: each send consumes one entry (null = succeed). */
export const resendFailures: ({ name: string; message: string } | null)[] = [];

export function resetResend(): void {
  sentEmails.length = 0;
  keys.clear();
  resendFailures.length = 0;
}

export class Resend {
  emails = {
    send: async (payload: Payload, opts?: { idempotencyKey?: string }) => {
      const failure = resendFailures.length ? resendFailures.shift() : null;
      if (failure) return { data: null, error: { ...failure, statusCode: 500 } };
      const body = JSON.stringify({ ...payload, attachments: payload.attachments?.map((a) => a.filename) });
      const key = opts?.idempotencyKey;
      if (key && keys.has(key)) {
        return keys.get(key) === body
          ? { data: { id: 'email_cached' }, error: null }
          : { data: null, error: { name: 'invalid_idempotent_request', message: 'Same key, different body', statusCode: 409 } };
      }
      if (key) keys.set(key, body);
      sentEmails.push(payload);
      return { data: { id: `email_${sentEmails.length}` }, error: null };
    },
  };
  constructor(_key?: string) {}
}

import { Resend, type CreateEmailOptions } from 'resend';

/**
 * Sends one transactional email through Resend, at most once per key.
 *
 * Resend's SDK does not throw on API errors; it resolves `{ data, error }`.
 * Ignoring `error` made failed sends look successful, so this helper turns
 * any error into a thrown exception, except one case:
 *
 * With an `idempotencyKey`, Resend refuses to send twice. A retry whose body
 * differs from the first attempt (regenerated PDF, fresh presigned links)
 * gets `invalid_idempotent_request`: the first attempt with that key was
 * accepted, so the customer already has the email. That is reported as
 * 'already-sent'. Resend keeps keys for 24 hours, which is why webhook jobs
 * expire within that window (lib/webhook-jobs.ts).
 */
export type SendResult = 'sent' | 'already-sent';

export class EmailNotSentError extends Error {
  constructor(readonly code: string, message: string) {
    super(`Email not sent (${code}): ${message}`);
  }
}

export async function sendEmailOnce(payload: CreateEmailOptions, idempotencyKey?: string): Promise<SendResult> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send(payload, idempotencyKey ? { idempotencyKey } : undefined);
  if (!error) return 'sent';
  if (idempotencyKey && error.name === 'invalid_idempotent_request') return 'already-sent';
  throw new EmailNotSentError(error.name, error.message);
}

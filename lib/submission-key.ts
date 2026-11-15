/**
 * Submission key of the scam report form (package 58, Codex round 5).
 *
 * The form creates one key when it opens and sends the same key with every attempt, including a
 * retry after an error. The server derives the report id from it (lib/scam-db submissionReportId),
 * so a retry completes the report an earlier attempt may already have saved instead of adding a
 * second one. Client-safe: no Node modules.
 */

/** What the server accepts as a key: a random UUID or similar (letters, digits, dashes). */
export const SUBMISSION_KEY_PATTERN = /^[A-Za-z0-9-]{16,64}$/;

export const isSubmissionKey = (value: unknown): value is string =>
  typeof value === 'string' && SUBMISSION_KEY_PATTERN.test(value);

/** A new random key (crypto.randomUUID where available, else 128 random bits as hex). */
export function newSubmissionKey(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

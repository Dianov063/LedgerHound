import { Resend, type CreateEmailOptions } from 'resend';
import logger from './logger';

export type EmailTransport = 'resend' | 'mailhub' | 'log';
export type SendResult = 'sent' | 'already-sent' | 'suppressed' | 'logged';
export type SendEmailOptions = {
  /** Pin retries to the provider recorded with the frozen email. */
  transport?: EmailTransport;
  /** Exact download URL that must remain in a link-only oversized message. */
  requiredLink?: string;
};

const MAILHUB_ATTACHMENT_LIMIT = 10 * 1024 * 1024;
const MAILHUB_ATTACHMENT_COUNT_LIMIT = 10;
const DEFAULT_MAILHUB_URL = 'https://api.hubmail.vip';
const DEFAULT_TIMEOUT_MS = 10_000;

export class EmailNotSentError extends Error {
  constructor(readonly code: string, message: string) {
    super(`Email not sent (${code}): ${message}`);
    this.name = 'EmailNotSentError';
  }
}

function isProductionEnvironment(): boolean {
  return [process.env.NODE_ENV, process.env.APP_ENV, process.env.PLATFORM_ENV]
    .some((value) => value?.toLowerCase() === 'production');
}

export function getEmailTransport(override?: EmailTransport): EmailTransport {
  const configured = (override || process.env.EMAIL_TRANSPORT || 'resend').toLowerCase();
  if (configured === 'log' && isProductionEnvironment()) {
    throw new EmailNotSentError('log_transport_forbidden', 'EMAIL_TRANSPORT=log is forbidden in production');
  }
  if (configured === 'resend' || configured === 'mailhub' || configured === 'log') return configured;
  throw new EmailNotSentError('invalid_email_transport', `Unsupported EMAIL_TRANSPORT: ${configured}`);
}

export function isEmailDeliveryConfigured(): boolean {
  try {
    const transport = getEmailTransport();
    if (transport === 'log') return true;
    if (transport === 'mailhub') return Boolean(process.env.MAILHUB_API_KEY);
    return Boolean(process.env.RESEND_API_KEY);
  } catch {
    return false;
  }
}

function asArray(value?: string | string[]): string[] | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value : [value];
}

function mailboxAddress(value: string): string {
  const match = value.trim().match(/<([^<>]+)>\s*$/);
  return (match?.[1] || value).trim();
}

function attachmentType(filename: string, declared?: string): string {
  if (declared) return declared;
  const extension = filename.split('.').pop()?.toLowerCase();
  const known: Record<string, string> = {
    pdf: 'application/pdf',
    md: 'text/markdown',
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    zip: 'application/zip',
  };
  return (extension && known[extension]) || 'application/octet-stream';
}

type MailHubAttachment = { filename: string; content: string; contentType: string };

function mailHubAttachments(payload: CreateEmailOptions, requiredLink?: string): MailHubAttachment[] | undefined {
  const attachments = payload.attachments || [];
  if (!attachments.length) return undefined;
  if (attachments.length > MAILHUB_ATTACHMENT_COUNT_LIMIT) {
    throw new EmailNotSentError('too_many_attachments', `MailHub accepts at most ${MAILHUB_ATTACHMENT_COUNT_LIMIT} attachments`);
  }

  const encoded = attachments.map((attachment) => {
    if (!attachment.filename || attachment.path || attachment.contentId || attachment.content === undefined) {
      throw new EmailNotSentError('unsupported_attachment', 'MailHub attachments require filename and inline content');
    }
    const bytes = Buffer.isBuffer(attachment.content)
      ? attachment.content
      : Buffer.from(attachment.content, 'utf8');
    return {
      filename: attachment.filename,
      content: bytes.toString('base64'),
      contentType: attachmentType(attachment.filename, attachment.contentType),
      size: bytes.length,
    };
  });

  const totalBytes = encoded.reduce((sum, attachment) => sum + attachment.size, 0);
  if (totalBytes > MAILHUB_ATTACHMENT_LIMIT) {
    const content = `${'html' in payload ? payload.html || '' : ''}\n${'text' in payload ? payload.text || '' : ''}`;
    if (!requiredLink || !content.includes(requiredLink)) {
      throw new EmailNotSentError('attachment_too_large_no_download_link', 'Attachments exceed 10 MB and the required download link is missing');
    }
    logger.warn(
      { attachmentCount: encoded.length, attachmentBytes: totalBytes },
      '[email] Attachments exceed MailHub limit; sending the link-only message',
    );
    return undefined;
  }

  return encoded.map(({ size: _size, ...attachment }) => attachment);
}

function oneReplyTo(value?: string | string[]): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    if (value.length > 1) throw new EmailNotSentError('unsupported_reply_to', 'MailHub accepts one reply-to address');
    return value[0];
  }
  return value;
}

function assertMailHubCompatible(payload: CreateEmailOptions): void {
  if ('react' in payload && payload.react) throw new EmailNotSentError('unsupported_react_email', 'MailHub requires html or text content');
  if ('template' in payload && payload.template) throw new EmailNotSentError('unsupported_resend_template', 'Resend templates cannot be sent through MailHub');
  if (payload.headers || payload.tags || payload.scheduledAt || payload.topicId) {
    throw new EmailNotSentError('unsupported_email_option', 'MailHub does not support Resend headers, tags, topics, or scheduling');
  }
}

function timeoutMs(): number {
  const parsed = Number(process.env.MAILHUB_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

async function sendViaMailHub(payload: CreateEmailOptions, idempotencyKey?: string, options: SendEmailOptions = {}): Promise<SendResult> {
  const apiKey = process.env.MAILHUB_API_KEY;
  if (!apiKey) throw new EmailNotSentError('mailhub_not_configured', 'MAILHUB_API_KEY is not configured');
  assertMailHubCompatible(payload);

  // Validate and encode locally before the network error boundary, so a bad
  // payload is never mislabeled as a retryable MailHub connection failure.
  const requestBody = JSON.stringify({
    from: mailboxAddress(payload.from),
    to: asArray(payload.to),
    cc: asArray(payload.cc),
    bcc: asArray(payload.bcc),
    replyTo: oneReplyTo(payload.replyTo),
    subject: payload.subject,
    html: 'html' in payload ? payload.html : undefined,
    text: 'text' in payload ? payload.text : undefined,
    attachments: mailHubAttachments(payload, options.requiredLink),
    messageCategory: 'transactional',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  let response: Response;
  try {
    response = await fetch(`${(process.env.MAILHUB_API_URL || DEFAULT_MAILHUB_URL).replace(/\/$/, '')}/api/v1/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: requestBody,
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new EmailNotSentError(aborted ? 'mailhub_timeout' : 'mailhub_network_error', aborted ? 'MailHub request timed out' : 'MailHub request failed');
  } finally {
    clearTimeout(timer);
  }

  let body: { id?: string; status?: string; error?: string; code?: string; message?: string } = {};
  try {
    body = (await response.json()) as typeof body;
  } catch {
    // A status and a bounded generic message are sufficient; never echo response bodies.
  }

  if (response.status === 202) {
    logger.info({ transport: 'mailhub', emailId: body.id, status: body.status }, '[email] MailHub accepted email');
    return 'sent';
  }
  const code = body.code || body.error || `mailhub_http_${response.status}`;
  if (response.status === 422 && code === 'suppressed_recipient') {
    logger.warn({ transport: 'mailhub', code }, '[email] Recipient is suppressed; no retry');
    return 'suppressed';
  }
  if (response.status === 409 && code === 'idempotency_key_conflict') {
    logger.warn({ transport: 'mailhub', code }, '[email] MailHub already accepted this idempotency key');
    return 'already-sent';
  }
  throw new EmailNotSentError(code, body.message || `MailHub returned HTTP ${response.status}`);
}

async function sendViaResend(payload: CreateEmailOptions, idempotencyKey?: string): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) throw new EmailNotSentError('resend_not_configured', 'RESEND_API_KEY is not configured');
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send(payload, idempotencyKey ? { idempotencyKey } : undefined);
  if (!error) return 'sent';
  if (idempotencyKey && error.name === 'invalid_idempotent_request') return 'already-sent';
  throw new EmailNotSentError(error.name, error.message);
}

/**
 * Sends through the explicitly selected transport. There is deliberately no
 * provider fallback: after a timeout the first provider may already have
 * accepted the message, so falling back could send a duplicate.
 */
export async function sendEmail(payload: CreateEmailOptions, idempotencyKey?: string, options: SendEmailOptions = {}): Promise<SendResult> {
  const transport = getEmailTransport(options.transport);
  if (transport === 'mailhub') return sendViaMailHub(payload, idempotencyKey, options);
  if (transport === 'resend') return sendViaResend(payload, idempotencyKey);
  logger.info(
    { transport: 'log', idempotency: Boolean(idempotencyKey), attachmentCount: payload.attachments?.length || 0 },
    '[email] Log transport accepted email without external delivery',
  );
  return 'logged';
}

/** Backwards-compatible name for callers that supply a stable key. */
export const sendEmailOnce = sendEmail;

import { getBrowserAppPlatformConfig } from './config';

export class AppPlatformError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId?: string | null,
  ) {
    super(message);
  }
}

function requestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `lh-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function appPlatformJson<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    token?: string;
  } = {},
): Promise<T> {
  const config = getBrowserAppPlatformConfig();
  const headers: Record<string, string> = {
    'X-App-Slug': config.appSlug,
    'X-Request-ID': requestId(),
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(`${config.baseUrl}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
  });

  const responseRequestId = response.headers.get('X-Request-ID');
  if (!response.ok) {
    let message = `App Platform request failed with ${response.status}`;
    try {
      const payload = await response.json();
      message = String(payload.detail || payload.error || message);
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new AppPlatformError(message, response.status, responseRequestId);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  APPROVED_APP_PLATFORM_STAGING_URL,
  LEDGERHOUND_STAGING_APP_SLUG,
} from '@/lib/app-platform/config';
import { appPlatformJson, AppPlatformError } from '@/lib/app-platform/client';
import { createPaymentSafetyDraft } from '@/lib/app-platform/drafts';

describe('App Platform client boundary', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_PLATFORM_BASE_URL', APPROVED_APP_PLATFORM_STAGING_URL);
    vi.stubEnv('NEXT_PUBLIC_APP_PLATFORM_APP_SLUG', LEDGERHOUND_STAGING_APP_SLUG);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('sends app slug, bearer token, request ID, and strict draft metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'X-Request-ID': 'req-test-1' }),
      json: async () => ({
        id: 'draft-1',
        title: 'Draft',
        payment_method_type: 'zelle',
        scam_category: 'marketplace_scam',
        progress_step: 1,
        created_at: '2026-08-31T00:00:00Z',
        updated_at: '2026-08-31T00:00:00Z',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await createPaymentSafetyDraft('token-123', {
      title: 'Draft',
      payment_method_type: 'zelle',
      scam_category: 'marketplace_scam',
      progress_step: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${APPROVED_APP_PLATFORM_STAGING_URL}/v1/apps/ledgerhound_staging/ledgerhound/payment-safety-drafts`);
    expect(init.headers.Authorization).toBe('Bearer token-123');
    expect(init.headers['X-App-Slug']).toBe(LEDGERHOUND_STAGING_APP_SLUG);
    expect(init.headers['X-Request-ID']).toBeTruthy();
    expect(JSON.parse(init.body)).toEqual({
      title: 'Draft',
      payment_method_type: 'zelle',
      scam_category: 'marketplace_scam',
      progress_step: 1,
    });
  });

  it('surfaces platform errors with response request IDs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ 'X-Request-ID': 'req-denied' }),
      json: async () => ({ detail: 'origin not allowed' }),
    }));

    await expect(appPlatformJson('/v1/auth/login')).rejects.toMatchObject({
      message: 'origin not allowed',
      status: 403,
      requestId: 'req-denied',
    } satisfies Partial<AppPlatformError>);
  });

  it('fails closed when browser config points away from platform staging', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_PLATFORM_BASE_URL', 'https://www.ledgerhound.vip');
    vi.stubGlobal('fetch', vi.fn());

    await expect(appPlatformJson('/v1/auth/login')).rejects.toThrow(
      'App Platform browser configuration is not approved',
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});

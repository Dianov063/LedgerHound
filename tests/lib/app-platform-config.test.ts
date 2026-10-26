import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  APPROVED_APP_PLATFORM_STAGING_URL,
  LEDGERHOUND_STAGING_APP_SLUG,
  getAppPlatformConfig,
  isAppPlatformPilotEnabled,
} from '@/lib/app-platform/config';

describe('App Platform pilot gate', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is disabled by default', () => {
    expect(isAppPlatformPilotEnabled({
      flag: undefined,
      nodeEnv: 'development',
      baseUrl: APPROVED_APP_PLATFORM_STAGING_URL,
      appSlug: LEDGERHOUND_STAGING_APP_SLUG,
    })).toBe(false);
  });

  it('is disabled in production even when the feature flag is set', () => {
    expect(isAppPlatformPilotEnabled({
      flag: 'true',
      nodeEnv: 'production',
      baseUrl: APPROVED_APP_PLATFORM_STAGING_URL,
      appSlug: LEDGERHOUND_STAGING_APP_SLUG,
    })).toBe(false);
  });

  it('requires the exact approved staging platform URL', () => {
    expect(isAppPlatformPilotEnabled({
      flag: 'true',
      nodeEnv: 'development',
      baseUrl: 'https://api.ledgerhound.vip',
      appSlug: LEDGERHOUND_STAGING_APP_SLUG,
    })).toBe(false);
  });

  it('returns the approved staging config only when every gate condition passes', () => {
    vi.stubEnv('LEDGERHOUND_APP_PLATFORM_PILOT', 'true');
    vi.stubEnv('NEXT_PUBLIC_APP_PLATFORM_BASE_URL', APPROVED_APP_PLATFORM_STAGING_URL);
    vi.stubEnv('NEXT_PUBLIC_APP_PLATFORM_APP_SLUG', LEDGERHOUND_STAGING_APP_SLUG);

    expect(getAppPlatformConfig()).toEqual({
      baseUrl: APPROVED_APP_PLATFORM_STAGING_URL,
      appSlug: LEDGERHOUND_STAGING_APP_SLUG,
    });
  });
});

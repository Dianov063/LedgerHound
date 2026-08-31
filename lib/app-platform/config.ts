export const APPROVED_APP_PLATFORM_STAGING_URL = 'https://platform-staging.hubmail.vip';
export const LEDGERHOUND_STAGING_APP_SLUG = 'ledgerhound_staging';

export interface AppPlatformConfig {
  baseUrl: string;
  appSlug: string;
}

export function isAppPlatformPilotEnabled(input: {
  flag?: string;
  nodeEnv?: string;
  baseUrl?: string;
  appSlug?: string;
} = {}): boolean {
  const flag = input.flag ?? process.env.LEDGERHOUND_APP_PLATFORM_PILOT;
  const nodeEnv = input.nodeEnv ?? process.env.NODE_ENV;
  const baseUrl = input.baseUrl ?? process.env.NEXT_PUBLIC_APP_PLATFORM_BASE_URL;
  const appSlug = input.appSlug ?? process.env.NEXT_PUBLIC_APP_PLATFORM_APP_SLUG;

  return flag === 'true'
    && nodeEnv !== 'production'
    && baseUrl === APPROVED_APP_PLATFORM_STAGING_URL
    && appSlug === LEDGERHOUND_STAGING_APP_SLUG;
}

export function getAppPlatformConfig(): AppPlatformConfig {
  if (!isAppPlatformPilotEnabled()) {
    throw new Error('App Platform pilot is disabled');
  }

  return getBrowserAppPlatformConfig();
}

export function getBrowserAppPlatformConfig(): AppPlatformConfig {
  if (
    process.env.NEXT_PUBLIC_APP_PLATFORM_BASE_URL !== APPROVED_APP_PLATFORM_STAGING_URL
    || process.env.NEXT_PUBLIC_APP_PLATFORM_APP_SLUG !== LEDGERHOUND_STAGING_APP_SLUG
  ) {
    throw new Error('App Platform browser configuration is not approved for the LedgerHound pilot');
  }

  return {
    baseUrl: APPROVED_APP_PLATFORM_STAGING_URL,
    appSlug: LEDGERHOUND_STAGING_APP_SLUG,
  };
}

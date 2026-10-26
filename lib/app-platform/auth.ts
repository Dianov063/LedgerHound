import { LEDGERHOUND_STAGING_APP_SLUG } from './config';
import { appPlatformJson } from './client';
import type { AppPlatformSession, AppPlatformUser, RegisterResult } from './types';

export function registerPilotUser(email: string, password: string): Promise<RegisterResult> {
  return appPlatformJson<RegisterResult>('/v1/auth/register', {
    method: 'POST',
    body: {
      app_slug: LEDGERHOUND_STAGING_APP_SLUG,
      email,
      password,
    },
  });
}

export function verifyPilotEmail(email: string, code: string): Promise<{ status: string }> {
  return appPlatformJson<{ status: string }>('/v1/auth/verify-email', {
    method: 'POST',
    body: {
      app_slug: LEDGERHOUND_STAGING_APP_SLUG,
      email,
      code,
    },
  });
}

export function loginPilotUser(email: string, password: string): Promise<AppPlatformSession> {
  return appPlatformJson<AppPlatformSession>('/v1/auth/login', {
    method: 'POST',
    body: {
      app_slug: LEDGERHOUND_STAGING_APP_SLUG,
      email,
      password,
    },
  });
}

export function getPilotUser(token: string): Promise<AppPlatformUser> {
  return appPlatformJson<AppPlatformUser>(`/v1/apps/${LEDGERHOUND_STAGING_APP_SLUG}/me`, { token });
}

export function logoutPilotUser(token: string): Promise<{ status: string }> {
  return appPlatformJson<{ status: string }>(
    `/v1/apps/${LEDGERHOUND_STAGING_APP_SLUG}/sessions/logout`,
    {
      method: 'POST',
      token,
    },
  );
}

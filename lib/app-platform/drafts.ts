import { LEDGERHOUND_STAGING_APP_SLUG } from './config';
import { appPlatformJson } from './client';
import type { PaymentSafetyDraft, PaymentSafetyDraftInput, PaymentSafetyDraftList } from './types';

const DRAFTS_PATH = `/v1/apps/${LEDGERHOUND_STAGING_APP_SLUG}/ledgerhound/payment-safety-drafts`;

export function createPaymentSafetyDraft(
  token: string,
  draft: PaymentSafetyDraftInput,
): Promise<PaymentSafetyDraft> {
  return appPlatformJson<PaymentSafetyDraft>(DRAFTS_PATH, {
    method: 'POST',
    token,
    body: draft,
  });
}

export function listPaymentSafetyDrafts(token: string): Promise<PaymentSafetyDraftList> {
  return appPlatformJson<PaymentSafetyDraftList>(DRAFTS_PATH, { token });
}

export function readPaymentSafetyDraft(token: string, draftId: string): Promise<PaymentSafetyDraft> {
  return appPlatformJson<PaymentSafetyDraft>(`${DRAFTS_PATH}/${encodeURIComponent(draftId)}`, { token });
}

export function updatePaymentSafetyDraft(
  token: string,
  draftId: string,
  draft: Partial<PaymentSafetyDraftInput>,
): Promise<PaymentSafetyDraft> {
  return appPlatformJson<PaymentSafetyDraft>(`${DRAFTS_PATH}/${encodeURIComponent(draftId)}`, {
    method: 'PATCH',
    token,
    body: draft,
  });
}

export function deletePaymentSafetyDraft(token: string, draftId: string): Promise<{ status: string }> {
  return appPlatformJson<{ status: string }>(`${DRAFTS_PATH}/${encodeURIComponent(draftId)}`, {
    method: 'DELETE',
    token,
  });
}

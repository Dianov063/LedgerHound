export interface AppPlatformSession {
  access_token: string;
  token_type: 'bearer';
  session_id: string;
  expires_in_seconds: number;
}

export interface AppPlatformUser {
  user_id: string;
  email: string;
  app_slug: string;
  email_verified: boolean;
}

export interface RegisterResult {
  user_id: string;
  verification_request_id: string;
  mailhub_job_id: string;
  test_verification_code?: string;
}

export type PaymentMethodType =
  | 'zelle'
  | 'cashapp'
  | 'venmo'
  | 'paypal'
  | 'apple_cash'
  | 'chime'
  | 'wise'
  | 'revolut'
  | 'iban'
  | 'bank_account'
  | 'phone'
  | 'email'
  | 'social_handle'
  | 'marketplace_profile'
  | 'other';

export type ScamCategory =
  | 'non_delivery_goods'
  | 'fake_service'
  | 'deposit_advance_fee'
  | 'rental_scam'
  | 'ticket_scam'
  | 'marketplace_scam'
  | 'employment_scam'
  | 'other';

export interface PaymentSafetyDraft {
  id: string;
  title: string;
  payment_method_type: PaymentMethodType | null;
  scam_category: ScamCategory | null;
  progress_step: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentSafetyDraftInput {
  title: string;
  payment_method_type?: PaymentMethodType;
  scam_category?: ScamCategory;
  progress_step?: number;
}

export interface PaymentSafetyDraftList {
  items: PaymentSafetyDraft[];
}

/** Technical identity of a scenario. Its text lives in lib/payment-scam-i18n.ts. */
export interface PaymentScamScenario {
  slug: string;
  category: string;
  channel?: string;
}

export const PAYMENT_SCAM_SCENARIOS: PaymentScamScenario[] = [
  {
    slug: 'telegram-payment-scams',
    category: 'marketplace_scam',
    channel: 'telegram',
  },
  {
    slug: 'marketplace-payment-scam',
    category: 'marketplace_scam',
  },
  {
    slug: 'ticket-payment-scam',
    category: 'ticket_scam',
  },
  {
    slug: 'goods-not-delivered-payment-scam',
    category: 'non_delivery_goods',
  },
  {
    slug: 'fake-local-service-scam',
    category: 'fake_service',
  },
];

export function getPaymentScamScenario(slug: string): PaymentScamScenario | undefined {
  if (slug === 'telegram-russian-community-scams') {
    return PAYMENT_SCAM_SCENARIOS.find((scenario) => scenario.slug === 'telegram-payment-scams');
  }
  return PAYMENT_SCAM_SCENARIOS.find((scenario) => scenario.slug === slug);
}

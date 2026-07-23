export interface PaymentScamScenario {
  slug: string;
  title: string;
  description: string;
  category: string;
  channel?: string;
  examples: string[];
  collect: string[];
}

export const PAYMENT_SCAM_SCENARIOS: PaymentScamScenario[] = [
  {
    slug: 'telegram-payment-scams',
    title: 'Report a Telegram Payment Scam',
    description: 'Report seller, service, ticket, rental, job, and deposit scams that begin in Telegram groups, channels, or private messages in any country.',
    category: 'marketplace_scam',
    channel: 'telegram',
    examples: [
      'A seller takes payment for an item and disappears.',
      'A service provider takes a deposit but does not provide the promised work.',
      'A ticket, apartment, job, delivery, or currency-exchange offer posted in Telegram is not real.',
    ],
    collect: ['Telegram @username', 'group or channel name', 'message screenshots', 'payment receipt', 'transaction reference'],
  },
  {
    slug: 'marketplace-payment-scam',
    title: 'Report a Marketplace Payment Scam',
    description: 'Report a seller who moved a marketplace purchase to a payment app and did not deliver the promised item.',
    category: 'marketplace_scam',
    examples: ['Facebook Marketplace deposits', 'OfferUp or Craigslist payments', 'social media sellers who disappear after payment'],
    collect: ['seller profile', 'listing URL', 'chat screenshots', 'payment receipt', 'promised delivery date'],
  },
  {
    slug: 'ticket-payment-scam',
    title: 'Report a Ticket Payment Scam',
    description: 'Report fake, reused, invalid, or undelivered event tickets paid through a peer-to-peer payment app.',
    category: 'ticket_scam',
    examples: ['concert tickets', 'sports tickets', 'festival passes', 'tickets never transferred after payment'],
    collect: ['event and ticket details', 'seller handle', 'chat screenshots', 'payment receipt', 'transfer promise'],
  },
  {
    slug: 'goods-not-delivered-payment-scam',
    title: 'Report Goods Paid For but Not Delivered',
    description: 'Report a small purchase paid by Zelle, Cash App, Venmo, Apple Cash, Chime, or another payment method when the goods never arrived.',
    category: 'non_delivery_goods',
    examples: ['custom orders', 'electronics', 'clothing', 'food or cake orders', 'local pickup deposits'],
    collect: ['item description', 'seller profile', 'payment receipt', 'delivery promise', 'last seller response'],
  },
  {
    slug: 'fake-local-service-scam',
    title: 'Report a Fake Local Service or Deposit Scam',
    description: 'Report a small service deposit or advance fee when the provider never performs the promised work.',
    category: 'fake_service',
    examples: ['repairs', 'moving help', 'cleaning', 'design work', 'beauty appointments', 'document assistance'],
    collect: ['service description', 'provider profile', 'invoice or promise', 'payment receipt', 'refund messages'],
  },
];

export function getPaymentScamScenario(slug: string): PaymentScamScenario | undefined {
  if (slug === 'telegram-russian-community-scams') {
    return PAYMENT_SCAM_SCENARIOS.find((scenario) => scenario.slug === 'telegram-payment-scams');
  }
  return PAYMENT_SCAM_SCENARIOS.find((scenario) => scenario.slug === slug);
}

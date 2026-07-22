export interface PaymentScamScenario {
  slug: string;
  title: string;
  description: string;
  category: string;
  channel?: string;
  communityLanguage?: string;
  examples: string[];
  collect: string[];
}

export const PAYMENT_SCAM_SCENARIOS: PaymentScamScenario[] = [
  {
    slug: 'telegram-russian-community-scams',
    title: 'Telegram Scams in Russian-Speaking US Communities',
    description: 'Report small seller, service, ticket, rental, and deposit scams that begin in Russian-speaking Telegram groups in the United States.',
    category: 'marketplace_scam',
    channel: 'telegram',
    communityLanguage: 'russian',
    examples: [
      'A seller takes Zelle or Cash App payment for an item and disappears.',
      'A cake, repair, moving, document, or beauty service takes a deposit and is not provided.',
      'A ticket, apartment, job, or delivery offer is posted in a local Telegram group and is not real.',
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
  return PAYMENT_SCAM_SCENARIOS.find((scenario) => scenario.slug === slug);
}

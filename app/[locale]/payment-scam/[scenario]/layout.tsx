import type { Metadata } from 'next';
import { getPaymentScamScenario } from '@/lib/payment-scam-scenarios';
import { getTelegramScamCopy } from '@/lib/payment-scam-i18n';

export async function generateMetadata({ params }: { params: { locale: string; scenario: string } }): Promise<Metadata> {
  const scenario = getPaymentScamScenario(params.scenario);
  if (!scenario) return {};
  const telegramCopy = scenario.slug === 'telegram-payment-scams'
    ? getTelegramScamCopy(params.locale)
    : null;
  return {
    title: telegramCopy?.metadataTitle || `${scenario.title} | LedgerHound`,
    description: telegramCopy?.metadataDescription || scenario.description,
    alternates: { canonical: `/payment-scam/${scenario.slug}` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

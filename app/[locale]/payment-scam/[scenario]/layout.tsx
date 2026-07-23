import type { Metadata } from 'next';
import { getPaymentScamScenario } from '@/lib/payment-scam-scenarios';

export async function generateMetadata({ params }: { params: { locale: string; scenario: string } }): Promise<Metadata> {
  const scenario = getPaymentScamScenario(params.scenario);
  if (!scenario) return {};
  const isRussianTelegram = params.locale === 'ru' && scenario.slug === 'telegram-payment-scams';
  return {
    title: isRussianTelegram ? 'Как сообщить о мошенничестве в Telegram | LedgerHound' : `${scenario.title} | LedgerHound`,
    description: isRussianTelegram
      ? 'Сообщить о мошенничестве в Telegram в любой стране: товары, услуги, билеты, аренда, работа, обмен валют и депозиты.'
      : scenario.description,
    alternates: { canonical: `/payment-scam/${scenario.slug}` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

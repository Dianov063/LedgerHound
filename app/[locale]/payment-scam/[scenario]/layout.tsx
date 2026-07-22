import type { Metadata } from 'next';
import { getPaymentScamScenario } from '@/lib/payment-scam-scenarios';

export async function generateMetadata({ params }: { params: { locale: string; scenario: string } }): Promise<Metadata> {
  const scenario = getPaymentScamScenario(params.scenario);
  if (!scenario) return {};
  const isRussianTelegram = params.locale === 'ru' && scenario.slug === 'telegram-russian-community-scams';
  return {
    title: isRussianTelegram ? 'Мошенничество в Telegram-группах США | LedgerHound' : `${scenario.title} | LedgerHound`,
    description: isRussianTelegram
      ? 'Сообщить о мелком мошенничестве в русскоязычной Telegram-группе США: товары, услуги, билеты, аренда и депозиты.'
      : scenario.description,
    alternates: { canonical: `/payment-scam/${scenario.slug}` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

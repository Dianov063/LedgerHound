import type { Metadata } from 'next';
import { makeMetadata } from '@/lib/metadata';
import { translatePaymentSafety } from '@/lib/payment-safety-i18n';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  return makeMetadata({
    locale: params.locale,
    path: '/payment-safety',
    title: translatePaymentSafety(params.locale, 'Payment Recipient Safety Check | LedgerHound'),
    description: translatePaymentSafety(params.locale, 'Check and report payment recipients across Zelle, Cash App, Venmo, Apple Cash, Chime, Telegram sellers, bank accounts, phone, email, and marketplace profiles.'),
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

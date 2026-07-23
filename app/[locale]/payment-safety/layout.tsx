import type { Metadata } from 'next';
import { translatePaymentSafety } from '@/lib/payment-safety-i18n';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return {
    title: translatePaymentSafety(params.locale, 'Payment Recipient Safety Check | LedgerHound'),
    description: translatePaymentSafety(params.locale, 'Check and report payment recipients across Zelle, Cash App, Venmo, Apple Cash, Chime, Telegram sellers, bank accounts, phone, email, and marketplace profiles.'),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

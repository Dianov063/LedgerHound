import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Payment Recipient Safety Check | LedgerHound',
    description: 'Check and report payment recipients across Zelle, Cash App, Venmo, Apple Cash, Chime, Telegram sellers, bank accounts, phone, email, and marketplace profiles.',
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

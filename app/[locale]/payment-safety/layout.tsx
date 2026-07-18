import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Payment Recipient Safety Check | LedgerHound',
    description: 'Check and report payment recipients across Zelle, Cash App, Venmo, PayPal, bank accounts, IBAN, phone, email, and marketplace profiles.',
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

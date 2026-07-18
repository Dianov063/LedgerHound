import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Report a Payment Scam | Zelle, Cash App, PayPal, Bank Transfer',
  description:
    'Report a non-crypto payment scam involving Zelle, Cash App, Venmo, PayPal, bank transfer, IBAN, phone, email, or marketplace profiles. LedgerHound keeps single reports private until corroborated.',
  alternates: {
    canonical: '/payment-scam-report',
  },
};

export default function PaymentScamReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

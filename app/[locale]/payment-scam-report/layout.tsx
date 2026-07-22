import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Report a Payment Scam | Zelle, Cash App, Telegram, Apple Cash',
  description:
    'Report a non-crypto payment scam involving Zelle, Cash App, Venmo, Apple Cash, Chime, Telegram sellers, bank transfers, or marketplace profiles.',
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

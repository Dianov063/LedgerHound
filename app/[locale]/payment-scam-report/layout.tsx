import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/payment-scam-report',
    metadataKey: 'paymentScamReport',
  });
}

export default function PaymentScamReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

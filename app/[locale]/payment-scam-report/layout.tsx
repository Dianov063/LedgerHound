import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

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

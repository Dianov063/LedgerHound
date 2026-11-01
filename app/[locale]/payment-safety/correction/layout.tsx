import type { Metadata } from 'next';
import { translatePaymentSafety } from '@/lib/payment-safety-i18n';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  return {
    title: translatePaymentSafety(locale, 'Payment Warning Correction Request | LedgerHound'),
    description: translatePaymentSafety(locale, 'Request review or correction of a LedgerHound payment recipient warning.'),
    robots: { index: false, follow: false },
    // Not indexed, so it must not inherit the canonical and hreflang of /payment-safety.
    alternates: null,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

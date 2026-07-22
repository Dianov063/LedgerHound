import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Warning Correction Request | LedgerHound',
  description: 'Request review or correction of a LedgerHound payment recipient warning.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

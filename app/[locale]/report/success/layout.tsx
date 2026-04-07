import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/report/success',
    title: 'Report Submitted | LedgerHound',
    description: 'Your scam report has been submitted successfully.',
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

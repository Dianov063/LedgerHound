import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return await makeMetadata({
    locale,
    path: '/report/success',
    title: 'Report Submitted | LedgerHound',
    description: 'Your scam report has been submitted successfully.',
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/emergency',
    title: 'Emergency Crypto Recovery | LedgerHound',
    description: 'Urgent crypto fraud response. Get legal documents and recovery guidance within minutes.',
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/emergency/success',
    title: 'Recovery Pack Ready | LedgerHound',
    description: 'Your emergency recovery documents are ready for download.',
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

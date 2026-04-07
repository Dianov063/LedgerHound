import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/admin/legal-packs',
    title: 'Admin Legal Packs | LedgerHound',
    description: 'Internal admin panel.',
    noIndex: true,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

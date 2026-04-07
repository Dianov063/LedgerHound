import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/blog-agent',
    title: 'Blog | LedgerHound',
    description: 'Latest insights on cryptocurrency fraud recovery and blockchain forensics.',
    noIndex: true,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

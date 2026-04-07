import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/contact',
    title: "Contact Us | LedgerHound",
    description: "Get in touch with LedgerHound for crypto fraud recovery assistance.",
    keywords: ["contact ledgerhound","crypto investigation contact"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/contact',
    title: "Contact LedgerHound | Blockchain Forensics Consultation",
    description: "Contact our blockchain forensics team for a free case evaluation. We respond within 24 hours.",
    keywords: ["contact ledgerhound","crypto investigation contact"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/scam-database/report',
    title: "Report a Crypto Scam | Submit Evidence | LedgerHound",
    description: "Submit a scam report with blockchain evidence. Transaction auto-verification, recovery score assessment, and community fraud registry.",
    keywords: ["report crypto scam","submit scam evidence","crypto fraud report"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

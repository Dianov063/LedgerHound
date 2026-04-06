import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/scam-database',
    title: "Scam Address Database | Community Crypto Fraud Registry | LedgerHound",
    description: "Community-driven database of reported crypto scam platforms. Search by platform name or wallet address. Report scams and help protect others.",
    keywords: ["crypto scam database","scam address database","report crypto scam","scam platform list"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/report',
    title: "Report Crypto Fraud | File Investigation Request | LedgerHound",
    description: "Report cryptocurrency fraud or submit an investigation request. Our blockchain forensics team will assess your case.",
    keywords: ["report crypto fraud","crypto investigation request"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

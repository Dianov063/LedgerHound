import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/scam-checker',
    title: "Free Crypto Address Scam Checker | Risk Assessment | LedgerHound",
    description: "Check any Bitcoin, Ethereum, TRON, or Solana address against our scam database. Instant risk assessment with OFAC sanctions check.",
    keywords: ["crypto scam checker","check scam address","crypto address risk","OFAC sanctions check"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

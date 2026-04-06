import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/tx-lookup',
    title: "Multi-Chain Transaction Lookup | Trace Any TX Hash | LedgerHound",
    description: "Look up any transaction across Ethereum, Bitcoin, TRON, BNB Chain, and more. Auto-detect chain, verify amounts, and check for scam addresses.",
    keywords: ["crypto transaction lookup","trace tx hash","blockchain transaction search"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

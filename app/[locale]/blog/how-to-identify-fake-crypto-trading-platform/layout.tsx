import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/blog/how-to-identify-fake-crypto-trading-platform',
    title: "How to Identify Fake Crypto Trading Platforms | LedgerHound",
    description: "Learn to spot fraudulent cryptocurrency exchanges and protect your funds.",
    keywords: ["fake crypto exchange","identify scam platform","crypto trading scam signs"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/blog/how-to-identify-fake-crypto-trading-platform',
    title: "How to Identify a Fake Crypto Trading Platform | LedgerHound",
    description: "Learn the red flags of fake cryptocurrency trading platforms. Protect yourself from common crypto scam tactics used by fraudulent exchanges.",
    keywords: ["fake crypto exchange","identify scam platform","crypto trading scam signs"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

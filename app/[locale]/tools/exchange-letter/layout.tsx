import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/tools/exchange-letter',
    title: 'Free Crypto Exchange Preservation Letter Generator | LedgerHound',
    description:
      'Generate professional preservation and freeze request letters to cryptocurrency exchanges like Binance, Coinbase, Kraken, and OKX. Free tool for crypto fraud victims to contact exchange compliance departments.',
    keywords: [
      'crypto exchange preservation letter',
      'how to contact binance compliance',
      'cryptocurrency fraud preservation letter template',
      'report crypto scam to exchange',
      'freeze crypto exchange account',
      'exchange compliance email',
      'crypto fraud recovery letter',
      'binance compliance email',
      'coinbase compliance request',
      'kraken fraud report',
    ],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

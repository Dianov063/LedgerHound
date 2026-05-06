import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/investigators',
    title: 'Certified Crypto Fraud Investigators | LedgerHound Network',
    description: 'Our network of CTCE, CFE, and CAMS certified investigators trace stolen cryptocurrency worldwide. Multilingual experts available for fraud cases, expert witness testimony, and corporate investigations.',
    keywords: [
      'certified crypto investigators',
      'blockchain forensics expert',
      'crypto fraud investigator',
      'CTCE certified',
      'CFE crypto',
      'CAMS investigator',
      'cryptocurrency expert witness',
    ],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

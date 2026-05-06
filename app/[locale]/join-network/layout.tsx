import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/join-network',
    title: 'Join Our Investigator Network | LedgerHound',
    description: 'Partner with LedgerHound on crypto fraud cases. Apply to join our certified investigator network. Referral fees, tool access, and qualified leads.',
    keywords: [
      'join investigator network',
      'crypto investigator jobs',
      'blockchain forensics partnership',
      'certified investigator referrals',
      'crypto expert witness opportunities',
    ],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

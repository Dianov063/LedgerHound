import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/legal/investigator-agreement',
    title: 'Investigator Network Agreement | LedgerHound',
    description: 'Terms of the LedgerHound Investigator Network — referral fee structure, NDA requirements, code of conduct, and liability framework.',
    keywords: ['investigator agreement', 'crypto investigator terms', 'referral fee structure'],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

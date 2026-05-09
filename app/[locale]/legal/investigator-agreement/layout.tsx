import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return await makeMetadata({
    locale,
    path: '/legal/investigator-agreement',
    metadataKey: 'legal.investigatorAgreement',
});
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

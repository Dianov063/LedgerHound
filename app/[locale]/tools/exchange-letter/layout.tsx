import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return await makeMetadata({
    locale,
    path: '/tools/exchange-letter',
    metadataKey: 'tools.exchangeLetter',
});
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

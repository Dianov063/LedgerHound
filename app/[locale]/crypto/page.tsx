import CryptoHome from '@/components/CryptoHome';
import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return await makeMetadata({
    locale,
    path: '/crypto',
    metadataKey: 'home',
  });
}

export default function CryptoPage() {
  return <CryptoHome />;
}

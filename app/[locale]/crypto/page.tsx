import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import CryptoHome from '@/components/CryptoHome';
import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

  return await makeMetadata({
    locale,
    path: '/crypto',
    metadataKey: 'home',
  });
}

export default function CryptoPage(props: { params: Promise<{ locale: string }> }) {
  // Static rendering: the layout's setRequestLocale does not cover the page (Next 15+).
  setRequestLocale(use(props.params).locale);
  return <CryptoHome />;
}

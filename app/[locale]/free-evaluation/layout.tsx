import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

  return await makeMetadata({
    locale,
    path: '/free-evaluation',
    metadataKey: 'freeEvaluation',
});
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

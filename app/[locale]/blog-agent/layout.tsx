import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

  return await makeMetadata({
    locale,
    path: '/blog-agent',
    title: 'Blog | LedgerHound',
    description: 'Latest insights on cryptocurrency fraud recovery and blockchain forensics.',
    noIndex: true,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

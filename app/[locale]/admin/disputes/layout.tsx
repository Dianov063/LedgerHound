import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

  return await makeMetadata({
    locale,
    path: '/admin/disputes',
    title: 'Admin Disputes | LedgerHound',
    description: 'Internal admin panel.',
    noIndex: true,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

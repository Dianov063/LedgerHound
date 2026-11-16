import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    locale
  } = params;

  return await makeMetadata({
    locale,
    path: '/report/success',
    title: 'Report Submitted | LedgerHound',
    description: 'Your scam report has been submitted successfully.',
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

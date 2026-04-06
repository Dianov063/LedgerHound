import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/blog/how-to-trace-stolen-bitcoin',
    title: "How to Trace Stolen Bitcoin: Complete Guide | LedgerHound",
    description: "Step-by-step guide on tracing stolen Bitcoin using blockchain forensics. Learn how investigators follow the money across the Bitcoin network.",
    keywords: ["trace stolen bitcoin","bitcoin tracing guide","stolen crypto recovery"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

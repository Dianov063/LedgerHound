import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/blog/how-to-trace-stolen-bitcoin',
    title: "How to Trace Stolen Bitcoin | LedgerHound",
    description: "Step-by-step guide to tracing stolen Bitcoin using blockchain forensics.",
    keywords: ["trace stolen bitcoin","bitcoin tracing guide","stolen crypto recovery"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

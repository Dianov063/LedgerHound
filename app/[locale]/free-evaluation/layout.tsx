import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/free-evaluation',
    title: "Free Case Evaluation | LedgerHound",
    description: "Get a free evaluation of your cryptocurrency fraud case.",
    keywords: ["free crypto recovery evaluation","crypto case assessment"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

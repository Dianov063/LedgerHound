import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/free-evaluation',
    title: "Free Case Evaluation | Crypto Recovery Assessment | LedgerHound",
    description: "Get a free evaluation of your cryptocurrency recovery case. Our blockchain forensics experts assess traceability, recovery potential, and next steps.",
    keywords: ["free crypto recovery evaluation","crypto case assessment"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

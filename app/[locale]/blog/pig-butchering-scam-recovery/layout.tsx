import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/blog/pig-butchering-scam-recovery',
    title: "Pig Butchering Scam Recovery Guide | LedgerHound",
    description: "Complete guide to recovering from pig butchering cryptocurrency scams.",
    keywords: ["pig butchering scam recovery","romance scam crypto","pig butchering help"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

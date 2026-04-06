import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/blog/pig-butchering-scam-recovery',
    title: "Pig Butchering Scam Recovery: What Victims Can Do | LedgerHound",
    description: "Comprehensive guide for pig butchering scam victims. Learn how blockchain forensics can help trace stolen cryptocurrency and support recovery efforts.",
    keywords: ["pig butchering scam recovery","romance scam crypto","pig butchering help"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import { makeMetadata } from '@/lib/metadata';

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/blog/usdt-trc20-scam-recovery-guide-2026',
    title: "USDT TRC20 Scam Recovery Guide 2026 | LedgerHound",
    description: "Expert guide to recovering USDT TRC20 funds lost to cryptocurrency scams.",
    keywords: ["USDT TRC20 scam recovery","TRON scam recovery","USDT recovery guide"],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

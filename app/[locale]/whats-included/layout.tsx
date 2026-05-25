import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const isEs = locale === 'es';
  const meta = await makeMetadata({
    locale,
    path: '/whats-included',
    title: isEs
      ? 'Qué Incluye Tu Informe Forense | LedgerHound'
      : "What's Included in Your Forensic Report | LedgerHound",
    description: isEs
      ? 'Informe forense blockchain por $49: puntuación de riesgo, documentación de técnicas de ataque, 3 plantillas de denuncia listas para usar y guía legal por país (Perú). Inglés y español.'
      : 'A $49 blockchain forensic report: risk scoring, attack-technique documentation, 3 ready-to-use complaint templates, and country-specific legal guidance (Peru). English and Spanish.',
    keywords: isEs
      ? ['informe forense cripto', 'qué incluye informe blockchain', 'denuncia estafa cripto Perú', 'DIVINDAT', 'envenenamiento de direcciones']
      : ['crypto forensic report', "what's in a blockchain forensic report", 'crypto fraud report', 'address poisoning report', 'DIVINDAT complaint'],
  });

  // NOTE on og:type: Next 14 validates openGraph.type against a fixed set and
  // rejects 'product' at runtime ("Invalid OpenGraph type: product"), so we keep
  // the default 'website'. Product semantics for search engines are carried by the
  // Product JSON-LD rendered in the page body instead (the lever Google actually uses).
  return meta;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import { makeMetadata } from '@/lib/metadata';

type Meta = { title: string; description: string; keywords: string[] };

const META: Record<string, Meta> = {
  en: {
    title: 'DZHLWK Crypto Scam — Victim Identification & Coordinated Investigation | LedgerHound',
    description: 'Victim of the DZHLWK / DZHLWK Fintech cryptocurrency investment scam? Join the coordinated forensic investigation. Free case submission, no upfront fees. Preliminary blockchain analysis points to 200+ affected victims.',
    keywords: ['DZHLWK scam', 'DZHLWK Fintech', 'DZHLWK fraud', 'DZHLWK USDT', 'DZHLWK recover', 'DZHLWK victims', 'pig butchering', 'crypto scam recovery'],
  },
  es: {
    title: 'Estafa Cripto DZHLWK — Identificación de Víctimas e Investigación Coordinada | LedgerHound',
    description: '¿Víctima de la estafa de inversión cripto DZHLWK / DZHLWK Fintech? Únase a la investigación forense coordinada. Registro de caso gratuito, sin pagos adelantados. El análisis blockchain preliminar apunta a más de 200 víctimas afectadas.',
    keywords: ['estafa DZHLWK', 'DZHLWK Fintech', 'fraude DZHLWK', 'DZHLWK USDT', 'recuperar cripto DZHLWK', 'estafa cripto', 'estafa USDT', 'pig butchering'],
  },
  zh: {
    title: 'DZHLWK 加密货币诈骗 — 受害者识别与协同调查 | LedgerHound',
    description: '您是 DZHLWK / DZHLWK Fintech 加密货币投资诈骗（杀猪盘）的受害者吗？加入协同区块链取证调查。免费提交案件，绝无预付费用。初步链上分析显示可能影响 200 多名受害者。',
    keywords: ['DZHLWK 骗局', 'DZHLWK 诈骗', 'DZHLWK Fintech', 'DZHLWK USDT', 'USDT 被骗', '加密货币诈骗', '杀猪盘', '区块链取证'],
  },
  fr: {
    title: 'Arnaque Crypto DZHLWK — Identification des Victimes et Enquête Coordonnée | LedgerHound',
    description: "Victime de l'arnaque d'investissement crypto DZHLWK / DZHLWK Fintech ? Rejoignez l'enquête forensique coordonnée. Soumission de dossier gratuite, sans frais initiaux. L'analyse blockchain préliminaire évoque plus de 200 victimes touchées.",
    keywords: ['arnaque DZHLWK', 'DZHLWK Fintech', 'fraude DZHLWK', 'DZHLWK USDT', 'récupérer crypto DZHLWK', 'arnaque crypto', 'pig butchering'],
  },
  ar: {
    title: 'احتيال DZHLWK للعملات الرقمية — تحديد الضحايا والتحقيق المنسّق | LedgerHound',
    description: 'هل أنت ضحية لاحتيال DZHLWK / DZHLWK Fintech الاستثماري في العملات الرقمية؟ انضم إلى التحقيق الجنائي الرقمي المنسّق. تقديم الحالة مجاني، بدون رسوم مُقدّمة. يشير التحليل الأولي على السلسلة إلى احتمال تأثّر أكثر من 200 ضحية.',
    keywords: ['احتيال DZHLWK', 'DZHLWK Fintech', 'احتيال العملات الرقمية', 'DZHLWK USDT', 'احتيال USDT', 'استرداد العملات الرقمية', 'pig butchering'],
  },
  ru: {
    title: 'Криптомошенничество DZHLWK — Идентификация жертв и скоординированное расследование | LedgerHound',
    description: 'Пострадали от инвестиционного криптомошенничества DZHLWK / DZHLWK Fintech? Присоединяйтесь к скоординированному форензик-расследованию. Подача заявки бесплатна, без предоплат. Предварительный анализ блокчейна указывает на 200+ пострадавших.',
    keywords: ['мошенничество DZHLWK', 'DZHLWK Fintech', 'DZHLWK развод', 'DZHLWK USDT', 'вернуть крипту DZHLWK', 'криптомошенничество', 'вернуть USDT', 'pig butchering'],
  },
};

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const m = META[locale] || META.en;
  const meta = await makeMetadata({
    locale,
    path: '/dzhlwk-victims',
    title: m.title,
    description: m.description,
    keywords: m.keywords,
  });
  // og:type "article" is valid in Next 14's OpenGraph union (unlike "product").
  return {
    ...meta,
    openGraph: { ...meta.openGraph, type: 'article' as const },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

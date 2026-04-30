import { makeMetadata } from '@/lib/metadata';

const titles: Record<string, string> = {
  en: 'AI Crypto Fraud Surge: IRS Investigators Reveal 2026 Trends',
  ru: 'Всплеск криптомошенничества с ИИ: тренды 2026 года от следователей IRS',
  es: 'Aumento del fraude cripto con IA: investigadores del IRS revelan tendencias 2026',
  zh: 'AI加密货币欺诈激增：IRS调查人员揭示2026年趋势',
  fr: 'Recrudescence des fraudes crypto par IA : les enquêteurs de l\'IRS révèlent les tendances 2026',
  ar: 'طفرة احتيال العملات الرقمية بالذكاء الاصطناعي: محققو مصلحة الضرائب يكشفون اتجاهات 2026',
};
const descriptions: Record<string, string> = {
  en: 'AI is fueling a massive surge in crypto fraud. IRS investigators report $7.2B lost in 2025. Learn how deepfakes and automation work—and how to trace stolen funds.',
  ru: 'ИИ вызывает массовый всплеск криптомошенничества. Следователи IRS сообщают о потерях в $7,2 млрд в 2025 году. Узнайте, как работают дипфейки и автоматизация — и как отследить украденные средства.',
  es: 'La IA está impulsando un enorme aumento en el fraude cripto. Los investigadores del IRS reportan $7.2 mil millones perdidos en 2025. Aprende cómo funcionan los deepfakes y la automatización, y cómo rastrear fondos robados.',
  zh: 'AI正在助长加密货币欺诈的大规模激增。IRS调查人员报告2025年损失达72亿美元。了解深度伪造和自动化如何运作——以及如何追踪被盗资金。',
  fr: 'L\'IA alimente une énorme recrudescence des fraudes crypto. Les enquêteurs de l\'IRS signalent 7,2 milliards de dollars de pertes en 2025. Découvrez comment fonctionnent les deepfakes et l\'automatisation—et comment retracer les fonds volés.',
  ar: 'الذكاء الاصطناعي يغذي طفرة هائلة في احتيال العملات الرقمية. محققو مصلحة الضرائب يبلغون عن خسائر 7.2 مليار دولار في 2025. تعلم كيف يعمل التزييف العميق والأتمتة - وكيفية تتبع الأموال المسروقة.',
};

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/blog/ai-fueling-crypto-fraud-irs-investigators-2026',
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    keywords: ['AI crypto fraud', 'IRS investigators', 'crypto investment scams', 'deepfake scams', 'pig butchering', 'FBI IC3 2025 report', 'blockchain forensics', 'LedgerHound'],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

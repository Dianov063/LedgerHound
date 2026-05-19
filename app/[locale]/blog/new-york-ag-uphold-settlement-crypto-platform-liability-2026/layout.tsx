import { makeMetadata } from '@/lib/metadata';

const titles: Record<string, string> = {
  en: 'NY AG $5M Uphold Settlement: Crypto Platform Liability Explained',
  ru: 'Урегулирование NY AG с Uphold на $5 млн: ответственность криптоплатформ объяснена',
  es: 'Acuerdo de $5M de la Fiscalía de NY con Uphold: Responsabilidad de Plataformas Cripto Explicada',
  zh: '纽约总检察长500万美元Uphold和解：加密平台责任解析',
  fr: 'Règlement NY AG 5 M$ Uphold : responsabilité des plateformes crypto expliquée',
  ar: 'تسوية NY AG بقيمة 5 ملايين دولار مع Uphold: شرح مسؤولية منصة العملات المشفرة',
};
const descriptions: Record<string, string> = {
  en: 'The New York AG secured over $5M from Uphold for promoting a fraudulent crypto scheme. This article breaks down the liability implications for exchanges and what it means for investors.',
  ru: 'Генеральный прокурор Нью-Йорка добился более $5 млн от Uphold за продвижение мошеннической криптосхемы. Эта статья разбирает последствия для бирж и что это значит для инвесторов.',
  es: 'La Fiscalía de Nueva York obtuvo más de $5M de Uphold por promocionar un esquema cripto fraudulento. Este artículo desglosa las implicaciones de responsabilidad para los exchanges y lo que significa para los inversores.',
  zh: '纽约总检察长因Uphold推广欺诈性加密计划而获得超过500万美元和解。本文解析交易所的责任影响及其对投资者的意义。',
  fr: 'Le procureur général de New York a obtenu plus de 5 M$ d\'Uphold pour avoir promu un système frauduleux. Cet article détaille les implications en matière de responsabilité pour les exchanges et ce que cela signifie pour les investisseurs.',
  ar: 'حصل المدعي العام لنيويورك على أكثر من 5 ملايين دولار من Uphold للترويج لمخطط احتيال للعملات المشفرة. تحلل هذه المقالة آثار المسؤولية على البورصات وما يعنيه للمستثمرين.',
};

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/blog/new-york-ag-uphold-settlement-crypto-platform-liability-2026',
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    keywords: ['Uphold settlement', 'New York AG', 'crypto platform liability', 'Cred fraud', 'exchange due diligence', 'investor protection', 'crypto regulation'],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

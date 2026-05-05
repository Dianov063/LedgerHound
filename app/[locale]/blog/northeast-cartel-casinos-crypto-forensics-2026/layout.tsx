import { makeMetadata } from '@/lib/metadata';

const titles: Record<string, string> = {
  en: 'Northeast Cartel Casinos: Crypto-Forensics Analysis 2026',
  ru: 'Казино картеля «Норте»: анализ крипто-форензики 2026',
  es: 'Casinos del Cártel del Noreste: Análisis de Cripto-Forense 2026',
  zh: '东北卡特尔赌场：加密货币取证分析2026',
  fr: 'Casinos du Cartel du Nord-Est : analyse de crypto-forensique 2026',
  ar: 'كازينوهات كارتل الشمال الشرقي: تحليل جنائي للعملات الرقمية 2026',
};
const descriptions: Record<string, string> = {
  en: 'The U.S. Treasury sanctioned two Mexican casinos over ties to the Northeast Cartel. Learn how casinos launder crypto cash and how blockchain forensics traces it.',
  ru: 'Минфин США ввел санкции против двух мексиканских казино из-за связей с картелем «Норте». Узнайте, как казино отмывают крипто-наличные и как блокчейн-форензика отслеживает это.',
  es: 'El Tesoro de EE.UU. sancionó dos casinos mexicanos por vínculos con el Cártel del Noreste. Aprenda cómo los casinos lavan dinero cripto y cómo la forense blockchain lo rastrea.',
  zh: '美国财政部因东北卡特尔关联制裁了两家墨西哥赌场。了解赌场如何清洗加密货币现金，以及区块链取证如何追踪。',
  fr: 'Le Trésor américain a sanctionné deux casinos mexicains pour leurs liens avec le Cartel du Nord-Est. Découvrez comment les casinos blanchissent de la crypto-monnaie et comment la forensique blockchain suit la piste.',
  ar: 'فرضت وزارة الخزانة الأمريكية عقوبات على كازينوهين مكسيكيين بسبب صلاتهما بكارتل الشمال الشرقي. تعرف على كيفية غسل الكازينوهات للأموال الرقمية وكيف يتتبعها الطب الشرعي لسلسلة الكتل.',
};

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return makeMetadata({
    locale,
    path: '/blog/northeast-cartel-casinos-crypto-forensics-2026',
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    keywords: ['Northeast Cartel', 'CDN', 'casino money laundering', 'OFAC sanctions', 'crypto forensics', 'blockchain tracing', 'cash smuggling', 'Mexican cartels'],
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

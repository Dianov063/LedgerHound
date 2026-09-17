import { makeMetadata } from '@/lib/metadata';

const metadataByLocale: Record<string, { title: string; description: string; keywords: string[] }> = {
  en: {
    title: 'Pig Butchering Scam Recovery Guide 2026 | LedgerHound',
    description: 'Learn how pig butchering scams work, what to do after a crypto romance investment fraud, and how blockchain evidence can support recovery efforts.',
    keywords: ['pig butchering scam recovery', 'romance scam crypto', 'pig butchering help'],
  },
  ru: {
    title: 'Возврат после pig butchering scam в криптовалюте | LedgerHound',
    description: 'Разберите схему pig butchering и крипто-романс мошенничества: что делать после перевода, как собрать доказательства и начать путь к взысканию.',
    keywords: ['pig butchering scam', 'крипто романс мошенничество', 'возврат криптовалюты'],
  },
  zh: {
    title: '杀猪盘加密货币诈骗追回指南 | LedgerHound',
    description: '了解杀猪盘和加密货币恋爱投资诈骗的运作方式：转账后如何保存证据、追踪链上资金，并为冻结账户或追回行动做准备。',
    keywords: ['杀猪盘 追回', '加密货币 恋爱诈骗', '区块链取证'],
  },
  es: {
    title: 'Recuperacion tras pig butchering cripto | LedgerHound',
    description: 'Guia sobre estafas pig butchering y romance cripto: que hacer tras enviar fondos, como preservar pruebas y como apoyar una posible recuperacion.',
    keywords: ['pig butchering cripto', 'estafa romantica crypto', 'recuperacion criptomonedas'],
  },
  fr: {
    title: 'Recuperation apres arnaque pig butchering crypto | LedgerHound',
    description: 'Guide des arnaques pig butchering et romance crypto: quoi faire apres un virement, quelles preuves garder et comment appuyer une recuperation.',
    keywords: ['arnaque pig butchering', 'romance scam crypto', 'recuperation crypto'],
  },
  ar: {
    title: 'دليل استرداد احتيال Pig Butchering بالعملات المشفرة | LedgerHound',
    description: 'تعرف على احتيال Pig Butchering والرومانسية الاستثمارية: ماذا تفعل بعد التحويل، كيف تحفظ الادلة، وكيف تدعم فرص استرداد العملات.',
    keywords: ['احتيال pig butchering', 'احتيال رومانسي بالعملات المشفرة', 'استرداد العملات المشفرة'],
  },
};

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const meta = metadataByLocale[locale] || metadataByLocale.en;

  return await makeMetadata({
    locale,
    path: '/blog/pig-butchering-scam-recovery',
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

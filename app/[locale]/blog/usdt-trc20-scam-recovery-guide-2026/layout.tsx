import { makeMetadata } from '@/lib/metadata';

const metadataByLocale: Record<string, { title: string; description: string; keywords: string[] }> = {
  en: {
    title: 'USDT TRC20 Scam Recovery Guide 2026 | LedgerHound',
    description: 'Learn how USDT TRC20 scam recovery works in 2026: preserve evidence, trace TRON transactions, report quickly, and prepare exchange or legal requests.',
    keywords: ['USDT TRC20 scam recovery', 'TRON scam recovery', 'USDT recovery guide'],
  },
  ru: {
    title: 'Возврат USDT TRC20 после мошенничества 2026 | LedgerHound',
    description: 'Пошаговое руководство по возврату USDT TRC20: как сохранить доказательства, отследить TRON-транзакции, обратиться в биржу и подготовить юридические запросы.',
    keywords: ['возврат USDT TRC20', 'мошенничество TRON', 'как вернуть USDT'],
  },
  zh: {
    title: 'USDT TRC20 诈骗追回指南 2026 | LedgerHound',
    description: '了解 2026 年 USDT TRC20 诈骗追回流程：保存证据、追踪 TRON 交易、快速报案，并准备交易所冻结或法律请求材料。',
    keywords: ['USDT TRC20 诈骗追回', 'TRON 诈骗追回', 'USDT 追回指南'],
  },
  es: {
    title: 'Guia 2026 para recuperar USDT TRC20 robado | LedgerHound',
    description: 'Aprende como funciona la recuperacion de USDT TRC20 tras una estafa: preservar pruebas, rastrear transacciones TRON y preparar solicitudes legales.',
    keywords: ['recuperar USDT TRC20', 'estafa TRON', 'guia recuperacion USDT'],
  },
  fr: {
    title: 'Guide 2026 pour recuperer des USDT TRC20 voles | LedgerHound',
    description: 'Comprenez la recuperation apres une arnaque USDT TRC20: conserver les preuves, tracer les transactions TRON et preparer les demandes aux exchanges.',
    keywords: ['recuperation USDT TRC20', 'arnaque TRON', 'guide recuperation USDT'],
  },
  ar: {
    title: 'دليل استرداد احتيال USDT TRC20 لعام 2026 | LedgerHound',
    description: 'دليل عملي لاسترداد USDT TRC20 بعد الاحتيال: حفظ الادلة، تتبع معاملات TRON، الابلاغ السريع، وتجهيز طلبات التجميد او الاجراءات القانونية.',
    keywords: ['استرداد USDT TRC20', 'احتيال TRON', 'دليل استرداد USDT'],
  },
};

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const meta = metadataByLocale[locale] || metadataByLocale.en;

  return await makeMetadata({
    locale,
    path: '/blog/usdt-trc20-scam-recovery-guide-2026',
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

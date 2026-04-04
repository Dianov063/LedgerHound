export type BlogLocale = 'en' | 'ru' | 'es' | 'zh' | 'fr' | 'ar';

interface BlogUIStrings {
  home: string;
  blog: string;
  minRead: string;
  author: string;
  tableOfContents: string;
  needHelp: string;
  needHelpDesc: string;
  getFreeEvaluation: string;
  shareArticle: string;
  copyLink: string;
  copied: string;
  relatedArticles: string;
  sources: string;
  legalNote: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaBtn: string;
  midCtaTitle: string;
  midCtaDesc: string;
  midCtaBtn: string;
  phone: string;
  speakRussian: string;
}

export const blogUI: Record<BlogLocale, BlogUIStrings> = {
  en: {
    home: "Home",
    blog: "Blog",
    minRead: "min read",
    author: "LedgerHound Investigations Team",
    tableOfContents: "Table of Contents",
    needHelp: "Need Help?",
    needHelpDesc: "Free case evaluation within 24 hours. No obligation.",
    getFreeEvaluation: "Get Free Evaluation",
    shareArticle: "Share this article:",
    copyLink: "Copy Link",
    copied: "Copied!",
    relatedArticles: "Related Articles",
    sources: "Sources",
    legalNote:
      "LedgerHound is a blockchain forensics firm. We are not a law firm and do not provide legal advice. Forensic investigation services only.",
    ctaTitle: "Your Funds Left a Trail. Let's Find It.",
    ctaDesc:
      "No obligation. No upfront cost. Just an honest assessment of what we can find and what it will take.",
    ctaBtn: "Get Free Case Evaluation",
    midCtaTitle: "Think you may be a victim?",
    midCtaDesc:
      "Get a free, confidential case evaluation within 24 hours. No obligation, no upfront cost.",
    midCtaBtn: "Get Free Case Evaluation",
    phone: "+1 (833) 559-1334",
    speakRussian: "Говорите по-русски? Мы тоже.",
  },
  ru: {
    home: "Главная",
    blog: "Блог",
    minRead: "мин. чтения",
    author: "Следственная группа LedgerHound",
    tableOfContents: "Содержание",
    needHelp: "Нужна помощь?",
    needHelpDesc:
      "Бесплатная оценка дела в течение 24 часов. Без обязательств.",
    getFreeEvaluation: "Получить бесплатную оценку",
    shareArticle: "Поделиться статьёй:",
    copyLink: "Копировать ссылку",
    copied: "Скопировано!",
    relatedArticles: "Похожие статьи",
    sources: "Источники",
    legalNote:
      "LedgerHound — компания в области блокчейн-криминалистики. Мы не являемся юридической фирмой и не оказываем юридических консультаций. Только услуги криминалистического расследования.",
    ctaTitle: "Ваши средства оставили след. Давайте его найдём.",
    ctaDesc:
      "Без обязательств. Без предоплаты. Только честная оценка того, что мы можем найти и что для этого потребуется.",
    ctaBtn: "Получить бесплатную оценку дела",
    midCtaTitle: "Думаете, что стали жертвой?",
    midCtaDesc:
      "Получите бесплатную конфиденциальную оценку дела в течение 24 часов. Без обязательств, без предоплаты.",
    midCtaBtn: "Получить бесплатную оценку дела",
    phone: "+1 (833) 559-1334",
    speakRussian: "Говорите по-русски? Мы тоже.",
  },
  es: {
    home: "Inicio",
    blog: "Blog",
    minRead: "min de lectura",
    author: "Equipo de Investigaciones LedgerHound",
    tableOfContents: "Tabla de contenidos",
    needHelp: "Necesita ayuda?",
    needHelpDesc:
      "Evaluacion gratuita del caso en 24 horas. Sin compromiso.",
    getFreeEvaluation: "Obtener evaluacion gratuita",
    shareArticle: "Compartir este articulo:",
    copyLink: "Copiar enlace",
    copied: "Copiado!",
    relatedArticles: "Articulos relacionados",
    sources: "Fuentes",
    legalNote:
      "LedgerHound es una firma de analisis forense de blockchain. No somos un bufete de abogados y no brindamos asesoramiento legal. Solo servicios de investigacion forense.",
    ctaTitle: "Sus fondos dejaron un rastro. Encontremoslo.",
    ctaDesc:
      "Sin compromiso. Sin costo inicial. Solo una evaluacion honesta de lo que podemos encontrar y lo que se necesitara.",
    ctaBtn: "Obtener evaluacion gratuita del caso",
    midCtaTitle: "Cree que puede ser una victima?",
    midCtaDesc:
      "Obtenga una evaluacion gratuita y confidencial del caso en 24 horas. Sin compromiso, sin costo inicial.",
    midCtaBtn: "Obtener evaluacion gratuita del caso",
    phone: "+1 (833) 559-1334",
    speakRussian: "Говорите по-русски? Мы тоже.",
  },
  zh: {
    home: "首页",
    blog: "博客",
    minRead: "分钟阅读",
    author: "LedgerHound 调查团队",
    tableOfContents: "目录",
    needHelp: "需要帮助？",
    needHelpDesc: "24小时内免费案件评估。无任何义务。",
    getFreeEvaluation: "获取免费评估",
    shareArticle: "分享本文：",
    copyLink: "复制链接",
    copied: "已复制！",
    relatedArticles: "相关文章",
    sources: "来源",
    legalNote:
      "LedgerHound 是一家区块链取证公司。我们不是律师事务所，不提供法律建议。仅提供取证调查服务。",
    ctaTitle: "您的资金留下了痕迹。让我们找到它。",
    ctaDesc:
      "无任何义务。无预付费用。只是对我们能找到什么以及需要付出什么的诚实评估。",
    ctaBtn: "获取免费案件评估",
    midCtaTitle: "认为自己可能是受害者？",
    midCtaDesc:
      "在24小时内获得免费、保密的案件评估。无任何义务，无预付费用。",
    midCtaBtn: "获取免费案件评估",
    phone: "+1 (833) 559-1334",
    speakRussian: "Говорите по-русски? Мы тоже.",
  },
  fr: {
    home: "Accueil",
    blog: "Blog",
    minRead: "min de lecture",
    author: "Equipe d'investigations LedgerHound",
    tableOfContents: "Table des matieres",
    needHelp: "Besoin d'aide ?",
    needHelpDesc:
      "Evaluation gratuite de votre dossier sous 24 heures. Sans engagement.",
    getFreeEvaluation: "Obtenir une evaluation gratuite",
    shareArticle: "Partager cet article :",
    copyLink: "Copier le lien",
    copied: "Copie !",
    relatedArticles: "Articles associes",
    sources: "Sources",
    legalNote:
      "LedgerHound est une societe d'investigation numerique blockchain. Nous ne sommes pas un cabinet d'avocats et ne fournissons pas de conseils juridiques. Services d'investigation numerique uniquement.",
    ctaTitle: "Vos fonds ont laisse une trace. Trouvons-la.",
    ctaDesc:
      "Sans engagement. Sans frais initiaux. Juste une evaluation honnete de ce que nous pouvons trouver et de ce qu'il faudra.",
    ctaBtn: "Obtenir une evaluation gratuite du dossier",
    midCtaTitle: "Pensez-vous etre une victime ?",
    midCtaDesc:
      "Obtenez une evaluation gratuite et confidentielle de votre dossier sous 24 heures. Sans engagement, sans frais initiaux.",
    midCtaBtn: "Obtenir une evaluation gratuite du dossier",
    phone: "+1 (833) 559-1334",
    speakRussian: "Говорите по-русски? Мы тоже.",
  },
  ar: {
    home: "الرئيسية",
    blog: "المدونة",
    minRead: "دقائق للقراءة",
    author: "فريق تحقيقات LedgerHound",
    tableOfContents: "جدول المحتويات",
    needHelp: "هل تحتاج مساعدة؟",
    needHelpDesc:
      "تقييم مجاني للقضية خلال 24 ساعة. بدون أي التزام.",
    getFreeEvaluation: "احصل على تقييم مجاني",
    shareArticle: "شارك هذا المقال:",
    copyLink: "نسخ الرابط",
    copied: "تم النسخ!",
    relatedArticles: "مقالات ذات صلة",
    sources: "المصادر",
    legalNote:
      "LedgerHound هي شركة تحقيقات جنائية رقمية متخصصة في البلوكتشين. نحن لسنا مكتب محاماة ولا نقدم استشارات قانونية. خدمات التحقيق الجنائي الرقمي فقط.",
    ctaTitle: "أموالك تركت أثراً. دعنا نجده.",
    ctaDesc:
      "بدون التزام. بدون تكلفة مسبقة. مجرد تقييم صادق لما يمكننا العثور عليه وما سيتطلبه الأمر.",
    ctaBtn: "احصل على تقييم مجاني للقضية",
    midCtaTitle: "هل تعتقد أنك قد تكون ضحية؟",
    midCtaDesc:
      "احصل على تقييم مجاني وسري للقضية خلال 24 ساعة. بدون التزام، بدون تكلفة مسبقة.",
    midCtaBtn: "احصل على تقييم مجاني للقضية",
    phone: "+1 (833) 559-1334",
    speakRussian: "Говорите по-русски? Мы тоже.",
  },
};

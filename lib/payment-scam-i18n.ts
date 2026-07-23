import type { Locale } from '@/i18n';

export interface TelegramScamCopy {
  title: string;
  description: string;
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  report: string;
  cases: string;
  examples: string[];
  save: string;
  collect: string[];
  verify: string;
  verifyText: string;
  private: string;
  privateText: string;
  warn: string;
  warnText: string;
  actions: string;
  actionsText: string;
  ftcLink: string;
  ic3Link: string;
  telegramLink: string;
  faqPublicQuestion: string;
  faqPublicAnswer: string;
  faqMethodsQuestion: string;
  faqMethodsAnswer: string;
}

const TELEGRAM_SCAM_COPY: Record<Locale, TelegramScamCopy> = {
  en: {
    title: 'How to report a Telegram payment scam',
    description: 'Report fraud involving goods, services, tickets, rentals, jobs, currency exchange, or deposits that began in a Telegram group, channel, or private message in any country.',
    metadataTitle: 'How to Report a Telegram Payment Scam | LedgerHound',
    metadataDescription: 'Privately report a Telegram payment scam in any country involving goods, services, tickets, rentals, jobs, currency exchange, or deposits.',
    eyebrow: 'Telegram payment scam reporting',
    report: 'Open private report form',
    cases: 'Cases this form covers',
    examples: [
      'A seller takes payment for an item and disappears.',
      'A service provider takes a deposit but does not provide the promised work.',
      'A ticket, apartment, job, delivery, or currency-exchange offer posted in Telegram is not real.',
    ],
    save: 'Save before reporting',
    collect: ['Telegram @username', 'group or channel name', 'message screenshots', 'payment receipt', 'transaction reference'],
    verify: 'Verify the reporter',
    verifyText: 'Email verification is required before moderation.',
    private: 'Match privately',
    privateText: 'Full payment identifiers and community names are not published.',
    warn: 'Warn after corroboration',
    warnText: 'Three independent accepted reports are required for a masked warning.',
    actions: 'Immediate reporting options',
    actionsText: 'Contact the payment provider and funding bank first. Report the account and messages inside Telegram, then contact the cybercrime or consumer protection authority in your country. US victims can also file with the FTC and IC3.',
    ftcLink: 'US: FTC ReportFraud',
    ic3Link: 'US: FBI IC3',
    telegramLink: 'Telegram help',
    faqPublicQuestion: 'Will one report become a public accusation?',
    faqPublicAnswer: 'No. A single report remains private. Public warnings require at least three independent verified and moderator-accepted reports.',
    faqMethodsQuestion: 'What payment methods can I report?',
    faqMethodsAnswer: 'Reports can include payment apps, bank transfers, phone numbers, emails, social handles, marketplace profiles, and local payment methods.',
  },
  ru: {
    title: 'Как сообщить о мошенничестве в Telegram',
    description: 'Сообщите об обмане с товарами, услугами, билетами, арендой, работой, обменом валют или депозитами, который начался в Telegram-группе, канале или личной переписке в любой стране.',
    metadataTitle: 'Как сообщить о мошенничестве в Telegram | LedgerHound',
    metadataDescription: 'Приватно сообщите о мошенничестве в Telegram в любой стране: товары, услуги, билеты, аренда, работа, обмен валют или депозиты.',
    eyebrow: 'Мошенничество через Telegram',
    report: 'Открыть приватную форму',
    cases: 'Какие случаи можно сообщить',
    examples: [
      'Продавец получил перевод за товар и исчез.',
      'Исполнитель взял депозит, но не предоставил обещанную услугу.',
      'В Telegram разместили фальшивое предложение билетов, аренды, работы, доставки или обмена валют.',
    ],
    save: 'Что сохранить до подачи жалобы',
    collect: ['Telegram @username', 'название группы или канала', 'скриншоты переписки', 'квитанция платежа', 'номер транзакции'],
    verify: 'Проверяем заявителя',
    verifyText: 'До модерации необходимо подтвердить email.',
    private: 'Сопоставляем приватно',
    privateText: 'Полные платёжные данные и названия сообществ не публикуются.',
    warn: 'Предупреждаем после подтверждений',
    warnText: 'Для маскированного предупреждения нужны три независимые принятые жалобы.',
    actions: 'Куда сообщить сразу',
    actionsText: 'Сначала обратитесь в платёжную систему и банк, из которого ушли деньги. Пожалуйтесь на аккаунт и сообщения внутри Telegram, затем сообщите в орган по борьбе с интернет-мошенничеством или защите потребителей своей страны. Для пострадавших в США доступны FTC и IC3.',
    ftcLink: 'США: FTC ReportFraud',
    ic3Link: 'США: FBI IC3',
    telegramLink: 'Помощь Telegram',
    faqPublicQuestion: 'Станет ли одна жалоба публичным обвинением?',
    faqPublicAnswer: 'Нет. Одна жалоба остаётся приватной. Для публичного предупреждения нужны как минимум три независимые, подтверждённые и принятые модератором жалобы.',
    faqMethodsQuestion: 'О каких способах оплаты можно сообщить?',
    faqMethodsAnswer: 'Можно сообщать о платёжных приложениях, банковских переводах, номерах телефонов, email, аккаунтах в соцсетях, профилях маркетплейсов и местных способах оплаты.',
  },
  es: {
    title: 'Cómo denunciar una estafa de pago en Telegram',
    description: 'Denuncia fraudes relacionados con productos, servicios, entradas, alquileres, empleos, cambio de divisas o depósitos que comenzaron en un grupo, canal o mensaje privado de Telegram en cualquier país.',
    metadataTitle: 'Cómo denunciar una estafa de pago en Telegram | LedgerHound',
    metadataDescription: 'Denuncia de forma privada una estafa de pago en Telegram en cualquier país relacionada con productos, servicios, entradas, alquileres, empleos, cambio de divisas o depósitos.',
    eyebrow: 'Denuncias de estafas de pago en Telegram',
    report: 'Abrir formulario privado',
    cases: 'Casos que puedes denunciar',
    examples: [
      'Un vendedor recibe el pago de un producto y desaparece.',
      'Un proveedor cobra un depósito, pero no realiza el trabajo prometido.',
      'Una oferta de entradas, alquiler, empleo, entrega o cambio de divisas publicada en Telegram es falsa.',
    ],
    save: 'Qué guardar antes de denunciar',
    collect: ['@usuario de Telegram', 'nombre del grupo o canal', 'capturas de los mensajes', 'comprobante de pago', 'referencia de la transacción'],
    verify: 'Verificamos al denunciante',
    verifyText: 'Es necesario verificar el correo electrónico antes de la moderación.',
    private: 'Buscamos coincidencias en privado',
    privateText: 'Los identificadores de pago completos y los nombres de comunidades no se publican.',
    warn: 'Alertamos tras la corroboración',
    warnText: 'Se requieren tres denuncias independientes aceptadas para publicar una alerta anonimizada.',
    actions: 'Opciones de denuncia inmediata',
    actionsText: 'Contacta primero con el proveedor de pago y el banco de origen. Denuncia la cuenta y los mensajes dentro de Telegram y luego acude a la autoridad de ciberdelincuencia o protección al consumidor de tu país. Las víctimas en EE. UU. también pueden denunciar ante la FTC y el IC3.',
    ftcLink: 'EE. UU.: FTC ReportFraud',
    ic3Link: 'EE. UU.: FBI IC3',
    telegramLink: 'Ayuda de Telegram',
    faqPublicQuestion: '¿Una sola denuncia se convertirá en una acusación pública?',
    faqPublicAnswer: 'No. Una sola denuncia permanece privada. Las alertas públicas requieren al menos tres denuncias independientes, verificadas y aceptadas por moderación.',
    faqMethodsQuestion: '¿Qué métodos de pago puedo denunciar?',
    faqMethodsAnswer: 'Las denuncias pueden incluir aplicaciones de pago, transferencias bancarias, teléfonos, correos electrónicos, perfiles sociales, perfiles de marketplace y métodos de pago locales.',
  },
  zh: {
    title: '如何举报 Telegram 支付诈骗',
    description: '举报在任何国家通过 Telegram 群组、频道或私聊开始的商品、服务、票务、租房、求职、货币兑换或订金诈骗。',
    metadataTitle: '如何举报 Telegram 支付诈骗 | LedgerHound',
    metadataDescription: '私密举报发生在任何国家、涉及商品、服务、票务、租房、求职、货币兑换或订金的 Telegram 支付诈骗。',
    eyebrow: 'Telegram 支付诈骗举报',
    report: '打开私密举报表',
    cases: '可以举报的情况',
    examples: [
      '卖家收到商品付款后消失。',
      '服务提供者收取订金后没有提供承诺的服务。',
      'Telegram 中发布的票务、租房、工作、配送或货币兑换信息是虚假的。',
    ],
    save: '举报前请保存',
    collect: ['Telegram 用户名', '群组或频道名称', '聊天截图', '付款凭证', '交易参考号'],
    verify: '验证举报人',
    verifyText: '进入审核前必须验证电子邮箱。',
    private: '私密匹配',
    privateText: '完整支付标识和社区名称不会公开。',
    warn: '核实后发布警示',
    warnText: '至少需要三份独立且审核通过的举报，才会发布脱敏警示。',
    actions: '立即举报渠道',
    actionsText: '请先联系支付服务商和付款银行。在 Telegram 内举报相关账号和消息，然后联系所在国家的网络犯罪或消费者保护机构。美国受害者还可以向 FTC 和 IC3 举报。',
    ftcLink: '美国：FTC ReportFraud',
    ic3Link: '美国：FBI IC3',
    telegramLink: 'Telegram 帮助',
    faqPublicQuestion: '一份举报会变成公开指控吗？',
    faqPublicAnswer: '不会。单份举报保持私密。公开警示至少需要三份独立、已验证并经审核接受的举报。',
    faqMethodsQuestion: '可以举报哪些支付方式？',
    faqMethodsAnswer: '举报可涉及支付应用、银行转账、电话号码、电子邮箱、社交账号、交易平台资料和本地支付方式。',
  },
  fr: {
    title: 'Comment signaler une arnaque au paiement sur Telegram',
    description: 'Signalez une fraude liée à des biens, services, billets, locations, emplois, opérations de change ou acomptes ayant commencé dans un groupe, un canal ou un message privé Telegram, quel que soit le pays.',
    metadataTitle: 'Comment signaler une arnaque au paiement sur Telegram | LedgerHound',
    metadataDescription: 'Signalez en privé une arnaque au paiement sur Telegram dans n’importe quel pays concernant des biens, services, billets, locations, emplois, opérations de change ou acomptes.',
    eyebrow: 'Signalement des arnaques au paiement sur Telegram',
    report: 'Ouvrir le formulaire privé',
    cases: 'Situations pouvant être signalées',
    examples: [
      'Un vendeur reçoit le paiement d’un article puis disparaît.',
      'Un prestataire encaisse un acompte sans fournir le service promis.',
      'Une offre de billets, de location, d’emploi, de livraison ou de change publiée sur Telegram est fausse.',
    ],
    save: 'Éléments à conserver avant le signalement',
    collect: ['@nom d’utilisateur Telegram', 'nom du groupe ou du canal', 'captures des messages', 'reçu de paiement', 'référence de la transaction'],
    verify: 'Vérification du déclarant',
    verifyText: 'La vérification de l’adresse e-mail est requise avant la modération.',
    private: 'Rapprochement privé',
    privateText: 'Les identifiants de paiement complets et les noms des communautés ne sont pas publiés.',
    warn: 'Alerte après corroboration',
    warnText: 'Trois signalements indépendants acceptés sont requis pour publier une alerte masquée.',
    actions: 'Options de signalement immédiat',
    actionsText: 'Contactez d’abord le prestataire de paiement et la banque ayant financé le paiement. Signalez le compte et les messages dans Telegram, puis contactez l’autorité de lutte contre la cybercriminalité ou de protection des consommateurs de votre pays. Les victimes aux États-Unis peuvent aussi saisir la FTC et l’IC3.',
    ftcLink: 'États-Unis : FTC ReportFraud',
    ic3Link: 'États-Unis : FBI IC3',
    telegramLink: 'Aide Telegram',
    faqPublicQuestion: 'Un seul signalement deviendra-t-il une accusation publique ?',
    faqPublicAnswer: 'Non. Un signalement unique reste privé. Une alerte publique exige au moins trois signalements indépendants, vérifiés et acceptés par la modération.',
    faqMethodsQuestion: 'Quels moyens de paiement puis-je signaler ?',
    faqMethodsAnswer: 'Les signalements peuvent concerner des applications de paiement, virements bancaires, numéros de téléphone, e-mails, profils sociaux, profils de marketplace et moyens de paiement locaux.',
  },
  ar: {
    title: 'كيفية الإبلاغ عن احتيال دفع عبر Telegram',
    description: 'أبلغ عن الاحتيال المتعلق بالسلع أو الخدمات أو التذاكر أو الإيجارات أو الوظائف أو صرف العملات أو العربون، إذا بدأ في مجموعة أو قناة أو رسالة خاصة على Telegram في أي بلد.',
    metadataTitle: 'كيفية الإبلاغ عن احتيال دفع عبر Telegram | LedgerHound',
    metadataDescription: 'أبلغ بشكل خاص عن احتيال دفع عبر Telegram في أي بلد يتعلق بالسلع أو الخدمات أو التذاكر أو الإيجارات أو الوظائف أو صرف العملات أو العربون.',
    eyebrow: 'الإبلاغ عن احتيال الدفع عبر Telegram',
    report: 'فتح نموذج الإبلاغ الخاص',
    cases: 'الحالات التي يمكن الإبلاغ عنها',
    examples: [
      'يتلقى البائع ثمن سلعة ثم يختفي.',
      'يتلقى مقدم الخدمة عربونًا ولا يقدم العمل المتفق عليه.',
      'يكون عرض التذاكر أو الإيجار أو العمل أو التوصيل أو صرف العملات المنشور على Telegram مزيفًا.',
    ],
    save: 'ما يجب حفظه قبل الإبلاغ',
    collect: ['اسم مستخدم Telegram', 'اسم المجموعة أو القناة', 'لقطات شاشة للمحادثة', 'إيصال الدفع', 'مرجع المعاملة'],
    verify: 'التحقق من المبلّغ',
    verifyText: 'يجب التحقق من البريد الإلكتروني قبل المراجعة.',
    private: 'مطابقة خاصة',
    privateText: 'لا ننشر معرّفات الدفع الكاملة أو أسماء المجتمعات.',
    warn: 'تحذير بعد التحقق',
    warnText: 'يلزم وجود ثلاثة بلاغات مستقلة ومقبولة لنشر تحذير ببيانات مخفية.',
    actions: 'خيارات الإبلاغ الفوري',
    actionsText: 'تواصل أولًا مع مزود خدمة الدفع والبنك الذي موّل العملية. أبلغ عن الحساب والرسائل داخل Telegram، ثم تواصل مع جهة مكافحة الجرائم الإلكترونية أو حماية المستهلك في بلدك. ويمكن للضحايا في الولايات المتحدة الإبلاغ أيضًا إلى FTC وIC3.',
    ftcLink: 'الولايات المتحدة: FTC ReportFraud',
    ic3Link: 'الولايات المتحدة: FBI IC3',
    telegramLink: 'مساعدة Telegram',
    faqPublicQuestion: 'هل يتحول بلاغ واحد إلى اتهام علني؟',
    faqPublicAnswer: 'لا. يظل البلاغ الواحد خاصًا. ويتطلب التحذير العام ثلاثة بلاغات مستقلة على الأقل، تم التحقق منها وقبولها من فريق المراجعة.',
    faqMethodsQuestion: 'ما طرق الدفع التي يمكنني الإبلاغ عنها؟',
    faqMethodsAnswer: 'يمكن أن تشمل البلاغات تطبيقات الدفع والتحويلات البنكية وأرقام الهواتف والبريد الإلكتروني وحسابات التواصل وملفات الأسواق وطرق الدفع المحلية.',
  },
};

export function getTelegramScamCopy(locale: string): TelegramScamCopy {
  return TELEGRAM_SCAM_COPY[locale as Locale] || TELEGRAM_SCAM_COPY.en;
}

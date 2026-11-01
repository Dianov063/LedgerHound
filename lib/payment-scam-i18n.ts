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

/** Text of a non-Telegram scenario. Everything else on the page is shared with the Telegram copy. */
type ScenarioText = Pick<TelegramScamCopy, 'title' | 'description' | 'metadataTitle' | 'examples' | 'collect'>;

const SHARED_SCENARIO_COPY: Record<Locale, Pick<TelegramScamCopy, 'eyebrow' | 'actionsText'>> = {
  en: {
    eyebrow: 'Payment scam reporting',
    actionsText: 'Contact the payment provider and funding bank first. Report the seller\'s account and messages to the platform where you met them, then contact the cybercrime or consumer protection authority in your country. US victims can also file with the FTC and IC3.',
  },
  ru: {
    eyebrow: 'Жалобы на платёжное мошенничество',
    actionsText: 'Сначала свяжитесь с платёжным сервисом и банком, с которого был списан платёж. Сообщите о счёте продавца и переписке с ним на платформу, где вы познакомились, затем обратитесь в орган по киберпреступлениям или защите прав потребителей в вашей стране. Пострадавшие из США также могут подать жалобу в FTC и IC3.',
  },
  es: {
    eyebrow: 'Denuncias de estafas de pago',
    actionsText: 'Primero comunícate con el proveedor de pagos y con el banco vinculado a tu método de pago. Reporta la cuenta del vendedor y sus mensajes a la plataforma donde lo conociste, y luego contacta a la autoridad de ciberdelincuencia o de protección al consumidor de tu país. Las víctimas en EE. UU. también pueden presentar una denuncia ante la FTC y la IC3.',
  },
  zh: {
    eyebrow: '支付诈骗举报',
    actionsText: '请先联系支付服务商和资金来源银行。将卖家的账户及消息举报至您与其相识的平台，然后联系您所在国家的网络犯罪或消费者保护机构。美国受害者还可以向 FTC 和 IC3 提交举报。',
  },
  fr: {
    eyebrow: 'Signalement d’arnaques de paiement',
    actionsText: 'Contactez d’abord le prestataire de paiement et la banque qui a financé le paiement. Signalez le compte du vendeur et ses messages à la plateforme où vous l’avez rencontré, puis contactez l’autorité de lutte contre la cybercriminalité ou de protection des consommateurs de votre pays. Les victimes américaines peuvent aussi effectuer un signalement auprès de la FTC et de l’IC3.',
  },
  ar: {
    eyebrow: 'الإبلاغ عن احتيال المدفوعات',
    actionsText: 'تواصل أولاً مع مزوّد الدفع والبنك المرتبط بحسابك. أبلغ عن حساب البائع ورسائله للمنصة التي تعرّفت عليه من خلالها، ثم تواصل مع جهة مكافحة الجرائم الإلكترونية أو جهة حماية المستهلك في بلدك. ويمكن لضحايا الولايات المتحدة أيضاً تقديم بلاغ إلى FTC وIC3.',
  },
};

const SCENARIO_COPY: Record<string, Record<Locale, ScenarioText>> = {
  'marketplace-payment-scam': {
    en: {
      title: 'Report a Marketplace Payment Scam',
      description: 'Report a seller who moved a marketplace purchase to a payment app and did not deliver the promised item.',
      metadataTitle: 'Report a Marketplace Payment Scam | LedgerHound',
      examples: ['Facebook Marketplace deposits', 'OfferUp or Craigslist payments', 'social media sellers who disappear after payment'],
      collect: ['seller profile', 'listing URL', 'chat screenshots', 'payment receipt', 'promised delivery date'],
    },
    ru: {
      title: 'Подать жалобу на мошенничество с оплатой на маркетплейсе',
      description: 'Подайте жалобу на продавца, который перевёл покупку с маркетплейса в платёжное приложение и не передал обещанный товар.',
      metadataTitle: 'Подать жалобу на мошенничество с оплатой на маркетплейсе | LedgerHound',
      examples: ['задатки на Facebook Marketplace', 'платежи через OfferUp или Craigslist', 'продавцы в соцсетях, которые пропадают после оплаты'],
      collect: ['профиль продавца', 'ссылка на объявление', 'скриншоты переписки', 'квитанция об оплате', 'обещанная дата доставки'],
    },
    es: {
      title: 'Denuncia una estafa de pago en un marketplace',
      description: 'Denuncia a un vendedor que trasladó una compra en un marketplace a una app de pagos y no entregó el artículo prometido.',
      metadataTitle: 'Denuncia una estafa de pago en un marketplace | LedgerHound',
      examples: ['Depósitos en Facebook Marketplace', 'Pagos por OfferUp o Craigslist', 'vendedores en redes sociales que desaparecen después del pago'],
      collect: ['perfil del vendedor', 'URL del anuncio', 'capturas de pantalla del chat', 'comprobante de pago', 'fecha de entrega prometida'],
    },
    zh: {
      title: '举报市场支付诈骗',
      description: '举报卖家在市场交易中将购买款转至支付应用后，未交付承诺商品的情况。',
      metadataTitle: '举报市场支付诈骗 | LedgerHound',
      examples: ['Facebook Marketplace 定金', 'OfferUp 或 Craigslist 付款', '付款后消失的社交媒体卖家'],
      collect: ['卖家资料', '商品链接', '聊天截图', '付款凭证', '承诺的交付日期'],
    },
    fr: {
      title: 'Signaler une arnaque de paiement sur une place de marché',
      description: 'Signalez un vendeur qui a transféré un achat sur une place de marché vers une application de paiement et n’a pas livré l’article promis.',
      metadataTitle: 'Signaler une arnaque de paiement sur une place de marché | LedgerHound',
      examples: ['acomptes sur Facebook Marketplace', 'paiements OfferUp ou Craigslist', 'vendeurs sur les réseaux sociaux qui disparaissent après le paiement'],
      collect: ['profil du vendeur', 'URL de l’annonce', 'captures d’écran des discussions', 'reçu de paiement', 'date de livraison promise'],
    },
    ar: {
      title: 'الإبلاغ عن احتيال دفع في سوق إلكتروني',
      description: 'أبلغ عن بائع نقل عملية شراء من سوق إلكتروني إلى تطبيق دفع ولم يسلّم السلعة الموعودة.',
      metadataTitle: 'الإبلاغ عن احتيال دفع في سوق إلكتروني | LedgerHound',
      examples: ['عرابين Facebook Marketplace', 'مدفوعات OfferUp أو Craigslist', 'بائعون على وسائل التواصل يختفون بعد الدفع'],
      collect: ['ملف تعريف البائع', 'رابط الإعلان', 'لقطات شاشة للمحادثات', 'إيصال الدفع', 'تاريخ التسليم الموعود'],
    },
  },
  'ticket-payment-scam': {
    en: {
      title: 'Report a Ticket Payment Scam',
      description: 'Report fake, reused, invalid, or undelivered event tickets paid through a peer-to-peer payment app.',
      metadataTitle: 'Report a Ticket Payment Scam | LedgerHound',
      examples: ['concert tickets', 'sports tickets', 'festival passes', 'tickets never transferred after payment'],
      collect: ['event and ticket details', 'seller handle', 'chat screenshots', 'payment receipt', 'transfer promise'],
    },
    ru: {
      title: 'Подать жалобу на мошенничество с оплатой билетов',
      description: 'Подайте жалобу на поддельные, повторно использованные, недействительные или не переданные билеты на мероприятия, оплаченные через приложение для переводов между людьми.',
      metadataTitle: 'Подать жалобу на мошенничество с оплатой билетов | LedgerHound',
      examples: ['билеты на концерты', 'билеты на спортивные события', 'пропуска на фестивали', 'билеты, которые так и не передали после оплаты'],
      collect: ['данные о мероприятии и билете', 'никнейм продавца', 'скриншоты переписки', 'квитанция об оплате', 'обещание передачи билета'],
    },
    es: {
      title: 'Denuncia una estafa de pago de boletos',
      description: 'Denuncia boletos de eventos falsos, reutilizados, inválidos o no entregados que se pagaron mediante una app de pagos entre personas.',
      metadataTitle: 'Denuncia una estafa de pago de boletos | LedgerHound',
      examples: ['boletos de conciertos', 'boletos deportivos', 'pases de festival', 'boletos que nunca se transfirieron después del pago'],
      collect: ['datos del evento y del boleto', 'usuario del vendedor', 'capturas de pantalla del chat', 'comprobante de pago', 'promesa de transferencia'],
    },
    zh: {
      title: '举报票务支付诈骗',
      description: '举报通过点对点支付应用付款购买的虚假、重复使用、无效或未交付的活动票务。',
      metadataTitle: '举报票务支付诈骗 | LedgerHound',
      examples: ['演唱会门票', '体育赛事门票', '音乐节通行证', '付款后票务从未转让'],
      collect: ['活动和票务详情', '卖家账号名', '聊天截图', '付款凭证', '转让承诺'],
    },
    fr: {
      title: 'Signaler une arnaque de paiement de billets',
      description: 'Signalez des billets d’événement faux, réutilisés, invalides ou non livrés, payés via une application de paiement entre particuliers.',
      metadataTitle: 'Signaler une arnaque de paiement de billets | LedgerHound',
      examples: ['billets de concert', 'billets de sport', 'pass de festival', 'billets jamais transférés après le paiement'],
      collect: ['détails de l’événement et du billet', 'identifiant du vendeur', 'captures d’écran des discussions', 'reçu de paiement', 'promesse de transfert'],
    },
    ar: {
      title: 'الإبلاغ عن احتيال دفع ثمن التذاكر',
      description: 'أبلغ عن تذاكر فعاليات مزيفة أو مُعاد استخدامها أو غير صالحة أو لم تُسلَّم، دُفع ثمنها عبر تطبيق دفع من فرد لفرد.',
      metadataTitle: 'الإبلاغ عن احتيال دفع ثمن التذاكر | LedgerHound',
      examples: ['تذاكر حفلات', 'تذاكر رياضية', 'تصاريح مهرجانات', 'تذاكر لم تُنقل أبداً بعد الدفع'],
      collect: ['تفاصيل الفعالية والتذكرة', 'معرّف البائع', 'لقطات شاشة للمحادثات', 'إيصال الدفع', 'وعد النقل'],
    },
  },
  'goods-not-delivered-payment-scam': {
    en: {
      title: 'Report Goods Paid For but Not Delivered',
      description: 'Report a small purchase paid by Zelle, Cash App, Venmo, Apple Cash, Chime, or another payment method when the goods never arrived.',
      metadataTitle: 'Report Goods Paid For but Not Delivered | LedgerHound',
      examples: ['custom orders', 'electronics', 'clothing', 'food or cake orders', 'local pickup deposits'],
      collect: ['item description', 'seller profile', 'payment receipt', 'delivery promise', 'last seller response'],
    },
    ru: {
      title: 'Подать жалобу на товар, оплаченный, но не доставленный',
      description: 'Подайте жалобу на небольшую покупку, оплаченную через Zelle, Cash App, Venmo, Apple Cash, Chime или другой способ оплаты, если товар так и не пришёл.',
      metadataTitle: 'Подать жалобу на товар, оплаченный, но не доставленный | LedgerHound',
      examples: ['индивидуальные заказы', 'электроника', 'одежда', 'заказы еды или тортов', 'задатки за самовывоз'],
      collect: ['описание товара', 'профиль продавца', 'квитанция об оплате', 'обещание доставки', 'последний ответ продавца'],
    },
    es: {
      title: 'Denuncia productos pagados que no fueron entregados',
      description: 'Denuncia una compra pequeña pagada con Zelle, Cash App, Venmo, Apple Cash, Chime u otro método de pago cuando el producto nunca llegó.',
      metadataTitle: 'Denuncia productos pagados que no fueron entregados | LedgerHound',
      examples: ['pedidos personalizados', 'electrónicos', 'ropa', 'pedidos de comida o de pasteles', 'depósitos por recogida en persona'],
      collect: ['descripción del artículo', 'perfil del vendedor', 'comprobante de pago', 'promesa de entrega', 'última respuesta del vendedor'],
    },
    zh: {
      title: '举报已付款但未送达的商品',
      description: '举报通过 Zelle、Cash App、Venmo、Apple Cash、Chime 或其他支付方式支付的小额购买，商品从未送达的情况。',
      metadataTitle: '举报已付款但未送达的商品 | LedgerHound',
      examples: ['定制订单', '电子产品', '服装', '食品或蛋糕订单', '本地自提定金'],
      collect: ['商品描述', '卖家资料', '付款凭证', '交付承诺', '卖家最后一次回复'],
    },
    fr: {
      title: 'Signaler des marchandises payées mais non livrées',
      description: 'Signalez un petit achat payé par Zelle, Cash App, Venmo, Apple Cash, Chime ou un autre moyen de paiement lorsque la marchandise n’est jamais arrivée.',
      metadataTitle: 'Signaler des marchandises payées mais non livrées | LedgerHound',
      examples: ['commandes personnalisées', 'électronique', 'vêtements', 'commandes de nourriture ou de gâteaux', 'acomptes pour retrait sur place'],
      collect: ['description de l’article', 'profil du vendeur', 'reçu de paiement', 'promesse de livraison', 'dernière réponse du vendeur'],
    },
    ar: {
      title: 'الإبلاغ عن سلع دُفع ثمنها ولم تُسلَّم',
      description: 'أبلغ عن عملية شراء بمبلغ صغير دُفعت عبر Zelle أو Cash App أو Venmo أو Apple Cash أو Chime أو وسيلة دفع أخرى، ولم تصل السلعة أبداً.',
      metadataTitle: 'الإبلاغ عن سلع دُفع ثمنها ولم تُسلَّم | LedgerHound',
      examples: ['طلبات مخصصة', 'أجهزة إلكترونية', 'ملابس', 'طلبات طعام أو كعك', 'عرابين استلام شخصي'],
      collect: ['وصف السلعة', 'ملف تعريف البائع', 'إيصال الدفع', 'وعد التسليم', 'آخر رد من البائع'],
    },
  },
  'fake-local-service-scam': {
    en: {
      title: 'Report a Fake Local Service or Deposit Scam',
      description: 'Report a small service deposit or advance fee when the provider never performs the promised work.',
      metadataTitle: 'Report a Fake Local Service or Deposit Scam | LedgerHound',
      examples: ['repairs', 'moving help', 'cleaning', 'design work', 'beauty appointments', 'document assistance'],
      collect: ['service description', 'provider profile', 'invoice or promise', 'payment receipt', 'refund messages'],
    },
    ru: {
      title: 'Подать жалобу на поддельную местную услугу или задаток',
      description: 'Подайте жалобу на небольшой задаток за услугу или авансовый платёж, если исполнитель так и не выполнил обещанную работу.',
      metadataTitle: 'Подать жалобу на поддельную услугу или задаток | LedgerHound',
      examples: ['ремонт', 'помощь с переездом', 'уборка', 'дизайнерские работы', 'записи в салон красоты', 'помощь с документами'],
      collect: ['описание услуги', 'профиль исполнителя', 'счёт или обещание', 'квитанция об оплате', 'сообщения о возврате средств'],
    },
    es: {
      title: 'Denuncia un servicio local falso o una estafa de depósito',
      description: 'Denuncia un depósito por un servicio pequeño o un pago anticipado de tarifas cuando el proveedor nunca realiza el trabajo prometido.',
      metadataTitle: 'Denuncia un servicio local falso o una estafa de depósito | LedgerHound',
      examples: ['reparaciones', 'ayuda con mudanzas', 'limpieza', 'trabajos de diseño', 'citas de belleza', 'asistencia con documentos'],
      collect: ['descripción del servicio', 'perfil del proveedor', 'factura o promesa', 'comprobante de pago', 'mensajes de reembolso'],
    },
    zh: {
      title: '举报虚假本地服务或定金诈骗',
      description: '举报小额服务定金或预付费用后，服务提供者从未履行承诺工作的情况。',
      metadataTitle: '举报虚假本地服务或定金诈骗 | LedgerHound',
      examples: ['维修', '搬家帮忙', '清洁', '设计工作', '美容预约', '文件协助'],
      collect: ['服务描述', '服务提供者资料', '发票或承诺', '付款凭证', '退款相关消息'],
    },
    fr: {
      title: 'Signaler un faux service local ou une arnaque à l’acompte',
      description: 'Signalez un acompte pour un service ou des frais d’avance lorsque le prestataire n’effectue jamais le travail promis.',
      metadataTitle: 'Signaler un faux service local ou une arnaque à l’acompte | LedgerHound',
      examples: ['réparations', 'aide au déménagement', 'nettoyage', 'travaux de design', 'rendez-vous beauté', 'aide aux démarches administratives'],
      collect: ['description du service', 'profil du prestataire', 'facture ou promesse', 'reçu de paiement', 'messages de remboursement'],
    },
    ar: {
      title: 'الإبلاغ عن خدمة محلية وهمية أو احتيال عربون',
      description: 'أبلغ عن عربون خدمة صغير أو رسوم مقدّمة عندما لا يقوم مزوّد الخدمة بالعمل الموعود أبداً.',
      metadataTitle: 'الإبلاغ عن خدمة محلية وهمية أو احتيال عربون | LedgerHound',
      examples: ['إصلاحات', 'مساعدة في النقل', 'تنظيف', 'أعمال تصميم', 'مواعيد تجميل', 'مساعدة في المستندات'],
      collect: ['وصف الخدمة', 'ملف تعريف مزوّد الخدمة', 'الفاتورة أو الوعد', 'إيصال الدفع', 'رسائل استرداد المبلغ'],
    },
  },
};

/** The single record of which scenarios are translated: the page, its metadata and the sitemap all read it. */
export const TRANSLATED_SCENARIO_SLUGS: readonly string[] = ['telegram-payment-scams', ...Object.keys(SCENARIO_COPY)];

export function getTelegramScamCopy(locale: string): TelegramScamCopy {
  return TELEGRAM_SCAM_COPY[locale as Locale] || TELEGRAM_SCAM_COPY.en;
}

export function getScenarioCopy(slug: string, locale: string): TelegramScamCopy {
  const base = getTelegramScamCopy(locale);
  const text = SCENARIO_COPY[slug];
  if (!text) return base;
  const key = (locale in text ? locale : 'en') as Locale;
  return {
    ...base,
    ...SHARED_SCENARIO_COPY[key],
    ...text[key],
    metadataDescription: text[key].description,
  };
}

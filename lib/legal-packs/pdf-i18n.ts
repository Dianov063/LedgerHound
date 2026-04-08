/**
 * PDF Template Internationalization
 * Separate from UI i18n (next-intl) — these are used in server-side PDF rendering only.
 *
 * Preservation Letter is ALWAYS in English (exchanges are international).
 * Action Guide, Police Complaint, Regulator Complaint use victim's country language.
 */

/* ─── Country → Language mapping ─── */
export const COUNTRY_LANG: Record<string, string> = {
  US: 'en', UK: 'en', AU: 'en', CA: 'en', SG: 'en',
  RU: 'ru', KZ: 'ru',
  DE: 'de', CH: 'de',
  FR: 'fr',
  ES: 'es',
  UA: 'uk',
  NL: 'nl',
  IT: 'it',
  AE: 'en', // Arabic RTL too complex for React-PDF, keep English for now
};

export function getLangForCountry(code: string): string {
  return COUNTRY_LANG[code.toUpperCase()] || 'en';
}

/* ─── Translation type ─── */
export interface PdfTranslations {
  common: {
    yes: string;
    no: string;
    none: string;
    unknown: string;
    pending: string;
    to_be_filled: string;
    under_investigation: string;
    optional: string;
    see_attached: string;
    available_upon_request: string;
    prepared_with: string;
    page: string;
    or: string;
  };
  action_guide: {
    title: string;
    subtitle: string;
    case_summary: string;
    victim: string;
    loss_amount: string;
    date_of_loss: string;
    fraud_type: string;
    recovery_analysis: string;
    recovery: string;
    risk_score: string;
    fund_status: string;
    exchanges_found: string;
    exchange_detected: string;
    no_exchange: string;
    exchange_positive: string;
    exchange_positive_text: string;
    no_exchange_caution: string;
    no_exchange_caution_text: string;
    mixer_warning: string;
    critical_window: string;
    critical_window_text: string;
    action_plan: string;
    step1_title: string;
    step1_when: string;
    step1_why: string;
    step1_instructions: string;
    expected_response: string;
    step2_title: string;
    step2_when: string;
    step2_why: string;
    send_to: string;
    step2_instructions: string;
    step2_no_exchange: string;
    step3_title: string;
    step3_when: string;
    step3_why: string;
    step3_instructions: string;
    step4_title: string;
    step4_when: string;
    step4_why: string;
    save_now: string;
    evidence_screenshots: string;
    evidence_receipts: string;
    evidence_wallets: string;
    evidence_platform: string;
    evidence_timeline: string;
    evidence_chats: string;
    evidence_social: string;
    evidence_bank: string;
    evidence_storage: string;
    step5_title: string;
    step5_when: string;
    step5_why: string;
    civil_remedies_in: string;
    statute_of_limitations: string;
    loss_small_title: string;
    loss_small_text: string;
    loss_medium_title: string;
    loss_medium_text: string;
    loss_significant_title: string;
    loss_significant_text: string;
    loss_major_title: string;
    loss_major_text: string;
    additional_agencies: string;
    when_to_use: string;
    expected_timeline: string;
    timeline_report: string;
    timeline_exchange: string;
    timeline_police: string;
    timeline_regulator: string;
    timeline_investigation: string;
    timeline_recovery: string;
    emergency_contacts: string;
    need_investigation: string;
    need_investigation_text: string;
    disclaimer: string;
    /* layout labels */
    step_prefix: string;
    why_matters: string;
    where_label: string;
    url_label: string;
    /* timeline time values */
    time_same_day: string;
    time_1_7_days: string;
    time_2_8_weeks: string;
    time_1_3_months: string;
    time_3_12_months: string;
  };
  police: {
    title: string;
    subtitle: string;
    filing_info: string;
    filing_with: string;
    jurisdiction: string;
    online_portal: string;
    reference: string;
    complainant: string;
    full_name: string;
    email: string;
    phone: string;
    country: string;
    state_region: string;
    incident_details: string;
    date_of_incident: string;
    amount_lost: string;
    cryptocurrency: string;
    network: string;
    fraud_type: string;
    platform_name: string;
    platform_url: string;
    transaction_evidence: string;
    scammer_wallet: string;
    transaction_hash: string;
    datetime: string;
    my_wallet: string;
    blockchain_verification: string;
    risk_score: string;
    recovery_probability: string;
    exchanges_identified: string;
    full_report: string;
    type_of_fraud: string;
    fraud_romance: string;
    fraud_investment: string;
    fraud_ponzi: string;
    fraud_phishing: string;
    fraud_rugpull: string;
    fraud_other: string;
    description: string;
    description_placeholder: string;
    applicable_law: string;
    filed_under: string;
    statute_of_limitations: string;
    evidence_checklist: string;
    evidence_blockchain: string;
    evidence_screenshots: string;
    evidence_platform: string;
    evidence_bank: string;
    evidence_other: string;
    declaration: string;
    declaration_text: string;
    signature: string;
    date: string;
  };
  regulator: {
    title: string;
    subtitle: string;
    regulatory_body: string;
    filing_with: string;
    online_portal: string;
    scope: string;
    complainant: string;
    name: string;
    email: string;
    country: string;
    police_report: string;
    subject_of_complaint: string;
    platform_entity: string;
    website: string;
    type_of_activity: string;
    period: string;
    financial_details: string;
    amount_lost: string;
    cryptocurrency: string;
    payment_method: string;
    crypto_transfer: string;
    nature_of_violation: string;
    violation_unregistered: string;
    violation_investment: string;
    violation_manipulation: string;
    violation_unlicensed: string;
    violation_misleading: string;
    violation_ponzi: string;
    violation_other: string;
    description: string;
    evidence_summary: string;
    blockchain_verified: string;
    transaction_traced: string;
    police_filed: string;
    other_victims: string;
    aware_of_victims: string;
    estimated_victims: string;
    total_losses: string;
    requested_action: string;
    action_investigate: string;
    action_enforcement: string;
    action_coordination: string;
    action_warning: string;
    declaration: string;
    declaration_text: string;
    signature: string;
    date: string;
  };
}

/* ═══════════════════════════════════════════════════════════
   TRANSLATIONS
   ═══════════════════════════════════════════════════════════ */

const en: PdfTranslations = {
  common: {
    yes: 'Yes', no: 'No', none: 'None', unknown: 'Unknown', pending: 'Pending',
    to_be_filled: '[TO BE FILLED]', under_investigation: '[Under investigation]',
    optional: '[OPTIONAL]', see_attached: '[See attached records]',
    available_upon_request: '[Available upon request]',
    prepared_with: 'Prepared with LedgerHound', page: 'Page', or: 'or',
  },
  action_guide: {
    title: 'EMERGENCY RECOVERY ACTION GUIDE',
    subtitle: 'Personalized Recovery Plan',
    case_summary: 'YOUR CASE SUMMARY',
    victim: 'Victim', loss_amount: 'Loss Amount', date_of_loss: 'Date of Loss', fraud_type: 'Fraud Type',
    recovery_analysis: 'RECOVERY ANALYSIS', recovery: 'RECOVERY', risk_score: 'Risk Score',
    fund_status: 'Fund Status', exchanges_found: 'Exchanges Found',
    exchange_detected: 'KYC exchange detected',
    no_exchange: 'No KYC exchange detected yet',
    exchange_positive: 'POSITIVE: Funds detected on KYC exchange(s)',
    exchange_positive_text: 'This significantly increases recovery chances. Exchanges can be compelled to freeze assets and provide account holder information via subpoena.',
    no_exchange_caution: 'CAUTION: No KYC exchanges identified yet.',
    no_exchange_caution_text: 'Funds may be in private wallets or unregulated platforms. Recovery will require deeper investigation.',
    mixer_warning: 'Funds mixed — reduced traceability',
    critical_window: 'CRITICAL WINDOW',
    critical_window_text: 'The first 24-72 hours are critical. Exchanges are more likely to freeze assets BEFORE funds are withdrawn. EVERY HOUR OF DELAY REDUCES YOUR CHANCES.',
    action_plan: '5-STEP ACTION PLAN',
    step1_title: 'REPORT TO POLICE', step1_when: 'TODAY',
    step1_why: 'Creates official record required by exchanges and courts. Without it, your case has no legal standing.',
    step1_instructions: '1. Use attached "Police Complaint" document\n2. Submit online or in person\n3. SAVE your complaint reference number',
    expected_response: 'Expected response',
    step2_title: 'NOTIFY EXCHANGES', step2_when: 'TODAY',
    step2_why: 'Exchanges can freeze accounts within HOURS. This prevents scammer from withdrawing your funds.',
    send_to: 'SEND PRESERVATION LETTER TO:',
    step2_instructions: '1. Use attached "Preservation Letter" document\n2. Include your police report reference\n3. Send via email AND certified mail if possible\n4. Follow up in 24-48 hours if no response',
    step2_no_exchange: 'No exchanges identified yet. If you discover exchange involvement, send the attached Preservation Letter immediately.',
    step3_title: 'REPORT TO FINANCIAL REGULATOR', step3_when: 'THIS WEEK',
    step3_why: 'Regulatory complaints trigger investigations. Multiple complaints about same entity lead to enforcement action.',
    step3_instructions: '1. Use attached "Regulator Complaint" document\n2. Reference your police report number\n3. Submit online',
    step4_title: 'PRESERVE ALL EVIDENCE', step4_when: 'ONGOING',
    step4_why: 'Digital evidence disappears. Scammers delete profiles, platforms go offline, chats expire.',
    save_now: 'SAVE NOW:',
    evidence_screenshots: 'Screenshots of ALL conversations',
    evidence_receipts: 'Transaction receipts and confirmations',
    evidence_wallets: 'All wallet addresses involved',
    evidence_platform: 'Platform URLs and screenshots',
    evidence_timeline: 'Complete timeline with dates',
    evidence_chats: 'Exported chat histories (WhatsApp, Telegram, email)',
    evidence_social: 'Social media profiles of scammer',
    evidence_bank: 'Bank statements showing fiat transfers',
    evidence_storage: 'STORAGE: Use cloud backup (Google Drive, iCloud). NOT on same device that may be compromised.',
    step5_title: 'EVALUATE LEGAL OPTIONS', step5_when: '1-2 WEEKS',
    step5_why: 'Civil litigation can recover funds even when criminal prosecution stalls.',
    civil_remedies_in: 'CIVIL REMEDIES IN',
    statute_of_limitations: 'Statute of Limitations',
    loss_small_title: 'SMALL LOSS (< $1,000)',
    loss_small_text: 'Complete Steps 1-4. Legal fees likely exceed recovery. Focus on reporting to prevent future victims. Join victim group if available.',
    loss_medium_title: 'MEDIUM LOSS ($1,000 - $10,000)',
    loss_medium_text: 'Complete Steps 1-4. Consider small claims court. Preservation letters may recover funds without litigation.',
    loss_significant_title: 'SIGNIFICANT LOSS ($10,000 - $50,000)',
    loss_significant_text: 'Complete Steps 1-4. Consult attorney experienced in crypto fraud. Civil suit may be viable. Consider LedgerHound Full Investigation.',
    loss_major_title: 'MAJOR LOSS (> $50,000)',
    loss_major_text: 'Complete Steps 1-4 IMMEDIATELY. Retain attorney ASAP. Request emergency asset freeze via court order. LedgerHound Full Investigation recommended. Civil recovery likely viable.',
    additional_agencies: 'ADDITIONAL AGENCIES',
    when_to_use: 'When to use',
    expected_timeline: 'EXPECTED TIMELINE',
    timeline_report: 'Report submission', timeline_exchange: 'Exchange preservation response',
    timeline_police: 'Police acknowledgment', timeline_regulator: 'Regulatory review',
    timeline_investigation: 'Investigation phase', timeline_recovery: 'Legal action / recovery',
    emergency_contacts: 'EMERGENCY CONTACTS',
    need_investigation: 'NEED DEEPER INVESTIGATION?',
    need_investigation_text: 'This automated pack provides templates based on blockchain analysis. For complex cases requiring multi-hop fund tracing, identification of additional exchange endpoints, links to other victims, court-ready forensic reports, or expert witness testimony:',
    disclaimer: 'DISCLAIMER: This guide is for informational purposes only and does not constitute legal advice. LedgerHound (USPROJECT LLC) is not a law firm. Recovery is not guaranteed. Consult qualified legal counsel in your jurisdiction.',
    step_prefix: 'STEP',
    why_matters: 'WHY THIS MATTERS:',
    where_label: 'WHERE',
    url_label: 'URL',
    time_same_day: 'Same day',
    time_1_7_days: '1-7 days',
    time_2_8_weeks: '2-8 weeks',
    time_1_3_months: '1-3 months',
    time_3_12_months: '3-12 months',
  },
  police: {
    title: 'POLICE COMPLAINT', subtitle: 'Cryptocurrency Fraud Report',
    filing_info: 'FILING INFORMATION', filing_with: 'Filing with', jurisdiction: 'Jurisdiction',
    online_portal: 'Online portal', reference: 'Reference',
    complainant: 'COMPLAINANT', full_name: 'Full Name', email: 'Email', phone: 'Phone',
    country: 'Country', state_region: 'State/Region',
    incident_details: 'INCIDENT DETAILS', date_of_incident: 'Date of Incident',
    amount_lost: 'Amount Lost', cryptocurrency: 'Cryptocurrency', network: 'Network',
    fraud_type: 'Fraud Type', platform_name: 'Platform Name', platform_url: 'Platform URL',
    transaction_evidence: 'TRANSACTION EVIDENCE', scammer_wallet: 'Scammer Wallet',
    transaction_hash: 'Transaction Hash', datetime: 'Date/Time', my_wallet: 'My Wallet',
    blockchain_verification: 'BLOCKCHAIN VERIFICATION (by LedgerHound)',
    risk_score: 'Risk Score', recovery_probability: 'Recovery Probability',
    exchanges_identified: 'Exchanges Identified', full_report: 'Full Report',
    type_of_fraud: 'TYPE OF FRAUD',
    fraud_romance: 'Romance Scam / Pig Butchering', fraud_investment: 'Fake Investment Platform',
    fraud_ponzi: 'Ponzi / Pyramid Scheme', fraud_phishing: 'Phishing / Wallet Drain',
    fraud_rugpull: 'Rug Pull / Exit Scam', fraud_other: 'Other',
    description: 'DESCRIPTION',
    description_placeholder: 'Please describe how you were contacted, what was promised, and when you realized it was fraud.',
    applicable_law: 'APPLICABLE LAW', filed_under: 'This complaint is filed under:',
    statute_of_limitations: 'Statute of Limitations',
    evidence_checklist: 'EVIDENCE CHECKLIST',
    evidence_blockchain: 'Blockchain transaction proof (LedgerHound verified)',
    evidence_screenshots: 'Screenshots of communications', evidence_platform: 'Platform screenshots',
    evidence_bank: 'Bank/exchange statements', evidence_other: 'Other',
    declaration: 'DECLARATION',
    declaration_text: 'I, {name}, declare under penalty of perjury that the information provided in this complaint is true and accurate to the best of my knowledge.',
    signature: 'Signature', date: 'Date',
  },
  regulator: {
    title: 'FINANCIAL REGULATOR COMPLAINT', subtitle: 'Cryptocurrency Investment Fraud',
    regulatory_body: 'REGULATORY BODY', filing_with: 'Filing with', online_portal: 'Online portal', scope: 'Scope',
    complainant: 'COMPLAINANT', name: 'Name', email: 'Email', country: 'Country', police_report: 'Police Report',
    subject_of_complaint: 'SUBJECT OF COMPLAINT', platform_entity: 'Platform/Entity',
    website: 'Website', type_of_activity: 'Type of Activity', period: 'Period',
    financial_details: 'FINANCIAL DETAILS', amount_lost: 'Amount Lost', cryptocurrency: 'Cryptocurrency',
    payment_method: 'Payment Method', crypto_transfer: 'Cryptocurrency transfer',
    nature_of_violation: 'NATURE OF VIOLATION',
    violation_unregistered: 'Unregistered securities offering', violation_investment: 'Investment fraud',
    violation_manipulation: 'Market manipulation', violation_unlicensed: 'Unlicensed money transmission',
    violation_misleading: 'Misleading advertising', violation_ponzi: 'Ponzi/pyramid scheme', violation_other: 'Other',
    description: 'DESCRIPTION',
    evidence_summary: 'EVIDENCE SUMMARY',
    blockchain_verified: 'Blockchain evidence verified by LedgerHound',
    transaction_traced: 'Transaction traced to', police_filed: 'Police complaint filed with',
    other_victims: 'OTHER VICTIMS', aware_of_victims: 'I am aware of other victims',
    estimated_victims: 'Estimated number of victims', total_losses: 'Total estimated losses',
    requested_action: 'REQUESTED ACTION',
    action_investigate: 'Investigation of {platform}', action_enforcement: 'Enforcement action if violations confirmed',
    action_coordination: 'Coordination with {police}', action_warning: 'Public warning to prevent additional victims',
    declaration: 'DECLARATION',
    declaration_text: 'I, {name}, declare under penalty of perjury that the information provided is true and accurate to the best of my knowledge.',
    signature: 'Signature', date: 'Date',
  },
};

const ru: PdfTranslations = {
  common: {
    yes: 'Да', no: 'Нет', none: 'Нет', unknown: 'Неизвестно', pending: 'Ожидает',
    to_be_filled: '[ЗАПОЛНИТЬ]', under_investigation: '[На рассмотрении]',
    optional: '[НЕОБЯЗАТЕЛЬНО]', see_attached: '[См. прилагаемые документы]',
    available_upon_request: '[Предоставляется по запросу]',
    prepared_with: 'Подготовлено с помощью LedgerHound', page: 'Стр.', or: 'или',
  },
  action_guide: {
    title: 'ЭКСТРЕННОЕ РУКОВОДСТВО ПО ВОЗВРАТУ СРЕДСТВ',
    subtitle: 'Персональный план восстановления',
    case_summary: 'СВОДКА ПО ВАШЕМУ ДЕЛУ',
    victim: 'Пострадавший', loss_amount: 'Сумма ущерба', date_of_loss: 'Дата потери', fraud_type: 'Тип мошенничества',
    recovery_analysis: 'АНАЛИЗ ВОЗВРАТА', recovery: 'ВОЗВРАТ', risk_score: 'Оценка риска',
    fund_status: 'Статус средств', exchanges_found: 'Биржи обнаружены',
    exchange_detected: 'Обнаружена KYC-биржа',
    no_exchange: 'KYC-биржи пока не обнаружены',
    exchange_positive: 'ПОЛОЖИТЕЛЬНО: Средства обнаружены на KYC-бирже(ах)',
    exchange_positive_text: 'Это значительно увеличивает шансы на возврат. Биржи могут заморозить активы и предоставить данные владельца счёта по запросу суда.',
    no_exchange_caution: 'ВНИМАНИЕ: KYC-биржи не обнаружены.',
    no_exchange_caution_text: 'Средства могут находиться в приватных кошельках или на нерегулируемых платформах. Для возврата потребуется углублённое расследование.',
    mixer_warning: 'Средства прошли через миксер — отслеживание затруднено',
    critical_window: 'КРИТИЧЕСКОЕ ОКНО',
    critical_window_text: 'Первые 24-72 часа критически важны. Биржи с большей вероятностью заморозят активы ДО того, как средства будут выведены. КАЖДЫЙ ЧАС ЗАДЕРЖКИ СНИЖАЕТ ВАШИ ШАНСЫ.',
    action_plan: 'ПЛАН ДЕЙСТВИЙ ИЗ 5 ШАГОВ',
    step1_title: 'ПОДАТЬ ЗАЯВЛЕНИЕ В ПОЛИЦИЮ', step1_when: 'СЕГОДНЯ',
    step1_why: 'Создаёт официальную запись, необходимую биржам и судам. Без неё ваше дело не имеет юридической силы.',
    step1_instructions: '1. Используйте прилагаемый документ «Заявление в полицию»\n2. Подайте онлайн или лично\n3. СОХРАНИТЕ номер вашего заявления',
    expected_response: 'Ожидаемый ответ',
    step2_title: 'УВЕДОМИТЬ БИРЖИ', step2_when: 'СЕГОДНЯ',
    step2_why: 'Биржи могут заморозить счета в течение ЧАСОВ. Это не позволит мошеннику вывести ваши средства.',
    send_to: 'ОТПРАВИТЬ ПИСЬМО О СОХРАНЕНИИ:',
    step2_instructions: '1. Используйте прилагаемое «Письмо о сохранении активов»\n2. Укажите номер вашего заявления в полицию\n3. Отправьте по email И заказным письмом\n4. Уточните через 24-48 часов при отсутствии ответа',
    step2_no_exchange: 'Биржи пока не обнаружены. При выявлении биржи немедленно отправьте прилагаемое Письмо о сохранении.',
    step3_title: 'ПОДАТЬ ЖАЛОБУ РЕГУЛЯТОРУ', step3_when: 'НА ЭТОЙ НЕДЕЛЕ',
    step3_why: 'Жалобы регулятору инициируют расследования. Множественные жалобы на одну организацию приводят к принудительным мерам.',
    step3_instructions: '1. Используйте прилагаемую «Жалобу регулятору»\n2. Укажите номер заявления в полицию\n3. Подайте онлайн',
    step4_title: 'СОХРАНИТЬ ВСЕ ДОКАЗАТЕЛЬСТВА', step4_when: 'ПОСТОЯННО',
    step4_why: 'Цифровые доказательства исчезают. Мошенники удаляют профили, платформы закрываются, чаты истекают.',
    save_now: 'СОХРАНИТЕ СЕЙЧАС:',
    evidence_screenshots: 'Скриншоты ВСЕХ переписок',
    evidence_receipts: 'Квитанции и подтверждения транзакций',
    evidence_wallets: 'Все адреса кошельков',
    evidence_platform: 'URL и скриншоты платформы',
    evidence_timeline: 'Полная хронология с датами',
    evidence_chats: 'Экспорт чатов (WhatsApp, Telegram, email)',
    evidence_social: 'Профили мошенника в соцсетях',
    evidence_bank: 'Банковские выписки по фиатным переводам',
    evidence_storage: 'ХРАНЕНИЕ: Используйте облако (Google Drive, iCloud). НЕ на устройстве, которое может быть скомпрометировано.',
    step5_title: 'ОЦЕНИТЬ ЮРИДИЧЕСКИЕ ВОЗМОЖНОСТИ', step5_when: '1-2 НЕДЕЛИ',
    step5_why: 'Гражданский иск может вернуть средства, даже когда уголовное преследование затягивается.',
    civil_remedies_in: 'ГРАЖДАНСКИЕ СРЕДСТВА ЗАЩИТЫ В',
    statute_of_limitations: 'Срок давности',
    loss_small_title: 'МАЛЫЙ УЩЕРБ (< $1,000)',
    loss_small_text: 'Выполните шаги 1-4. Юридические расходы вероятно превысят возврат. Сосредоточьтесь на подаче заявлений для предотвращения будущих жертв.',
    loss_medium_title: 'СРЕДНИЙ УЩЕРБ ($1,000 - $10,000)',
    loss_medium_text: 'Выполните шаги 1-4. Рассмотрите мировой суд. Письма о сохранении могут вернуть средства без судебного разбирательства.',
    loss_significant_title: 'ЗНАЧИТЕЛЬНЫЙ УЩЕРБ ($10,000 - $50,000)',
    loss_significant_text: 'Выполните шаги 1-4. Проконсультируйтесь с юристом по крипто-мошенничеству. Гражданский иск может быть целесообразен.',
    loss_major_title: 'КРУПНЫЙ УЩЕРБ (> $50,000)',
    loss_major_text: 'Выполните шаги 1-4 НЕМЕДЛЕННО. Наймите адвоката КАК МОЖНО СКОРЕЕ. Запросите экстренную заморозку активов через суд. Рекомендуется полное расследование LedgerHound.',
    additional_agencies: 'ДОПОЛНИТЕЛЬНЫЕ ОРГАНЫ',
    when_to_use: 'Когда обращаться',
    expected_timeline: 'ОЖИДАЕМЫЕ СРОКИ',
    timeline_report: 'Подача заявления', timeline_exchange: 'Ответ биржи на запрос',
    timeline_police: 'Подтверждение полиции', timeline_regulator: 'Рассмотрение регулятором',
    timeline_investigation: 'Фаза расследования', timeline_recovery: 'Судебные действия / возврат',
    emergency_contacts: 'ЭКСТРЕННЫЕ КОНТАКТЫ',
    need_investigation: 'НУЖНО УГЛУБЛЁННОЕ РАССЛЕДОВАНИЕ?',
    need_investigation_text: 'Этот автоматический пакет предоставляет шаблоны на основе блокчейн-анализа. Для сложных дел, требующих многоступенчатого отслеживания средств, идентификации дополнительных бирж, связей с другими жертвами, судебных экспертных заключений:',
    disclaimer: 'ОТКАЗ ОТ ОТВЕТСТВЕННОСТИ: Данное руководство носит информационный характер и не является юридической консультацией. LedgerHound (USPROJECT LLC) — не юридическая фирма. Возврат средств не гарантирован. Проконсультируйтесь с квалифицированным юристом.',
    step_prefix: 'ШАГ',
    why_matters: 'ПОЧЕМУ ЭТО ВАЖНО:',
    where_label: 'КУДА',
    url_label: 'URL',
    time_same_day: 'В тот же день',
    time_1_7_days: '1-7 дней',
    time_2_8_weeks: '2-8 недель',
    time_1_3_months: '1-3 месяца',
    time_3_12_months: '3-12 месяцев',
  },
  police: {
    title: 'ЗАЯВЛЕНИЕ В ПОЛИЦИЮ', subtitle: 'Отчёт о криптовалютном мошенничестве',
    filing_info: 'ИНФОРМАЦИЯ О ПОДАЧЕ', filing_with: 'Подаётся в', jurisdiction: 'Юрисдикция',
    online_portal: 'Онлайн-портал', reference: 'Номер дела',
    complainant: 'ЗАЯВИТЕЛЬ', full_name: 'ФИО', email: 'Электронная почта', phone: 'Телефон',
    country: 'Страна', state_region: 'Регион/область',
    incident_details: 'ДЕТАЛИ ИНЦИДЕНТА', date_of_incident: 'Дата инцидента',
    amount_lost: 'Сумма ущерба', cryptocurrency: 'Криптовалюта', network: 'Сеть',
    fraud_type: 'Тип мошенничества', platform_name: 'Название платформы', platform_url: 'URL платформы',
    transaction_evidence: 'ДОКАЗАТЕЛЬСТВА ТРАНЗАКЦИИ', scammer_wallet: 'Кошелёк мошенника',
    transaction_hash: 'Хэш транзакции', datetime: 'Дата/время', my_wallet: 'Мой кошелёк',
    blockchain_verification: 'ВЕРИФИКАЦИЯ БЛОКЧЕЙНА (LedgerHound)',
    risk_score: 'Оценка риска', recovery_probability: 'Вероятность возврата',
    exchanges_identified: 'Обнаруженные биржи', full_report: 'Полный отчёт',
    type_of_fraud: 'ТИП МОШЕННИЧЕСТВА',
    fraud_romance: 'Романтическое мошенничество', fraud_investment: 'Поддельная инвестиционная платформа',
    fraud_ponzi: 'Схема Понци / пирамида', fraud_phishing: 'Фишинг / кража из кошелька',
    fraud_rugpull: 'Rug Pull / Exit Scam', fraud_other: 'Другое',
    description: 'ОПИСАНИЕ',
    description_placeholder: 'Опишите, как с вами связались, что обещали и когда вы поняли, что это мошенничество.',
    applicable_law: 'ПРИМЕНИМОЕ ЗАКОНОДАТЕЛЬСТВО', filed_under: 'Заявление подаётся на основании:',
    statute_of_limitations: 'Срок давности',
    evidence_checklist: 'КОНТРОЛЬНЫЙ СПИСОК ДОКАЗАТЕЛЬСТВ',
    evidence_blockchain: 'Подтверждение транзакции в блокчейне (верифицировано LedgerHound)',
    evidence_screenshots: 'Скриншоты переписок', evidence_platform: 'Скриншоты платформы',
    evidence_bank: 'Банковские/биржевые выписки', evidence_other: 'Другое',
    declaration: 'ЗАЯВЛЕНИЕ',
    declaration_text: 'Я, {name}, заявляю под угрозой ответственности за ложные показания, что информация, представленная в данном заявлении, является правдивой и точной.',
    signature: 'Подпись', date: 'Дата',
  },
  regulator: {
    title: 'ЖАЛОБА ФИНАНСОВОМУ РЕГУЛЯТОРУ', subtitle: 'Криптовалютное инвестиционное мошенничество',
    regulatory_body: 'РЕГУЛИРУЮЩИЙ ОРГАН', filing_with: 'Подаётся в', online_portal: 'Онлайн-портал', scope: 'Компетенция',
    complainant: 'ЗАЯВИТЕЛЬ', name: 'ФИО', email: 'Электронная почта', country: 'Страна', police_report: 'Заявление в полицию',
    subject_of_complaint: 'ПРЕДМЕТ ЖАЛОБЫ', platform_entity: 'Платформа/организация',
    website: 'Веб-сайт', type_of_activity: 'Тип деятельности', period: 'Период',
    financial_details: 'ФИНАНСОВЫЕ ДЕТАЛИ', amount_lost: 'Сумма ущерба', cryptocurrency: 'Криптовалюта',
    payment_method: 'Способ оплаты', crypto_transfer: 'Криптовалютный перевод',
    nature_of_violation: 'ХАРАКТЕР НАРУШЕНИЯ',
    violation_unregistered: 'Незарегистрированное размещение ценных бумаг', violation_investment: 'Инвестиционное мошенничество',
    violation_manipulation: 'Манипулирование рынком', violation_unlicensed: 'Нелицензированная деятельность',
    violation_misleading: 'Вводящая в заблуждение реклама', violation_ponzi: 'Схема Понци/пирамида', violation_other: 'Другое',
    description: 'ОПИСАНИЕ',
    evidence_summary: 'СВОДКА ДОКАЗАТЕЛЬСТВ',
    blockchain_verified: 'Доказательства в блокчейне верифицированы LedgerHound',
    transaction_traced: 'Транзакция отслежена до', police_filed: 'Заявление в полицию подано в',
    other_victims: 'ДРУГИЕ ПОСТРАДАВШИЕ', aware_of_victims: 'Мне известно о других пострадавших',
    estimated_victims: 'Предполагаемое число пострадавших', total_losses: 'Общий предполагаемый ущерб',
    requested_action: 'ЗАПРАШИВАЕМЫЕ ДЕЙСТВИЯ',
    action_investigate: 'Расследование деятельности {platform}', action_enforcement: 'Принудительные меры при подтверждении нарушений',
    action_coordination: 'Координация с {police}', action_warning: 'Публичное предупреждение для предотвращения новых жертв',
    declaration: 'ЗАЯВЛЕНИЕ',
    declaration_text: 'Я, {name}, заявляю под угрозой ответственности за ложные показания, что представленная информация является правдивой и точной.',
    signature: 'Подпись', date: 'Дата',
  },
};

const de: PdfTranslations = {
  common: {
    yes: 'Ja', no: 'Nein', none: 'Keine', unknown: 'Unbekannt', pending: 'Ausstehend',
    to_be_filled: '[AUSZUFÜLLEN]', under_investigation: '[In Bearbeitung]',
    optional: '[OPTIONAL]', see_attached: '[Siehe beigefügte Unterlagen]',
    available_upon_request: '[Auf Anfrage verfügbar]',
    prepared_with: 'Erstellt mit LedgerHound', page: 'Seite', or: 'oder',
  },
  action_guide: {
    title: 'NOTFALL-LEITFADEN ZUR RÜCKGEWINNUNG',
    subtitle: 'Persönlicher Wiederherstellungsplan',
    case_summary: 'IHRE FALLZUSAMMENFASSUNG',
    victim: 'Geschädigter', loss_amount: 'Schadenssumme', date_of_loss: 'Datum des Verlusts', fraud_type: 'Art des Betrugs',
    recovery_analysis: 'RÜCKGEWINNUNGSANALYSE', recovery: 'RÜCKGEWINNUNG', risk_score: 'Risikobewertung',
    fund_status: 'Status der Mittel', exchanges_found: 'Börsen gefunden',
    exchange_detected: 'KYC-Börse erkannt',
    no_exchange: 'Noch keine KYC-Börse erkannt',
    exchange_positive: 'POSITIV: Gelder auf KYC-Börse(n) erkannt',
    exchange_positive_text: 'Dies erhöht die Rückgewinnungschancen erheblich. Börsen können per Gerichtsbeschluss zur Kontosperrung und Datenherausgabe verpflichtet werden.',
    no_exchange_caution: 'ACHTUNG: Keine KYC-Börsen identifiziert.',
    no_exchange_caution_text: 'Gelder befinden sich möglicherweise in privaten Wallets oder auf unregulierten Plattformen. Tiefere Ermittlungen erforderlich.',
    mixer_warning: 'Gelder über Mixer geleitet — eingeschränkte Rückverfolgbarkeit',
    critical_window: 'KRITISCHES ZEITFENSTER',
    critical_window_text: 'Die ersten 24-72 Stunden sind entscheidend. Börsen frieren Vermögenswerte eher ein, BEVOR sie abgehoben werden. JEDE STUNDE VERZÖGERUNG VERRINGERT IHRE CHANCEN.',
    action_plan: '5-SCHRITTE-AKTIONSPLAN',
    step1_title: 'ANZEIGE BEI DER POLIZEI', step1_when: 'HEUTE',
    step1_why: 'Erstellt einen offiziellen Bericht, der von Börsen und Gerichten benötigt wird. Ohne diesen hat Ihr Fall keine rechtliche Grundlage.',
    step1_instructions: '1. Verwenden Sie das beigefügte Dokument „Polizeiliche Anzeige"\n2. Online oder persönlich einreichen\n3. Aktenzeichen AUFBEWAHREN',
    expected_response: 'Erwartete Antwort',
    step2_title: 'BÖRSEN BENACHRICHTIGEN', step2_when: 'HEUTE',
    step2_why: 'Börsen können Konten innerhalb von STUNDEN einfrieren. Das verhindert, dass der Betrüger Ihre Gelder abhebt.',
    send_to: 'SICHERUNGSSCHREIBEN SENDEN AN:',
    step2_instructions: '1. Verwenden Sie das beigefügte „Sicherungsschreiben"\n2. Polizeiliches Aktenzeichen angeben\n3. Per E-Mail UND Einschreiben senden\n4. Nach 24-48 Stunden nachfragen',
    step2_no_exchange: 'Noch keine Börsen identifiziert. Bei Feststellung einer Börse sofort das beigefügte Sicherungsschreiben senden.',
    step3_title: 'MELDUNG AN FINANZAUFSICHT', step3_when: 'DIESE WOCHE',
    step3_why: 'Beschwerden bei der Aufsicht lösen Untersuchungen aus. Mehrere Beschwerden gegen dieselbe Organisation führen zu Durchsetzungsmaßnahmen.',
    step3_instructions: '1. Verwenden Sie die beigefügte „Beschwerde an die Aufsichtsbehörde"\n2. Polizeiliches Aktenzeichen angeben\n3. Online einreichen',
    step4_title: 'ALLE BEWEISE SICHERN', step4_when: 'LAUFEND',
    step4_why: 'Digitale Beweise verschwinden. Betrüger löschen Profile, Plattformen gehen offline, Chats verfallen.',
    save_now: 'JETZT SICHERN:',
    evidence_screenshots: 'Screenshots ALLER Gespräche',
    evidence_receipts: 'Transaktionsbelege und Bestätigungen',
    evidence_wallets: 'Alle beteiligten Wallet-Adressen',
    evidence_platform: 'Plattform-URLs und Screenshots',
    evidence_timeline: 'Vollständige Zeitleiste mit Daten',
    evidence_chats: 'Exportierte Chat-Verläufe (WhatsApp, Telegram, E-Mail)',
    evidence_social: 'Social-Media-Profile des Betrügers',
    evidence_bank: 'Kontoauszüge über Fiat-Überweisungen',
    evidence_storage: 'SPEICHERUNG: Cloud-Backup verwenden (Google Drive, iCloud). NICHT auf dem möglicherweise kompromittierten Gerät.',
    step5_title: 'RECHTLICHE OPTIONEN PRÜFEN', step5_when: '1-2 WOCHEN',
    step5_why: 'Zivilrechtliche Klagen können Gelder zurückbringen, auch wenn die Strafverfolgung stockt.',
    civil_remedies_in: 'ZIVILRECHTLICHE MITTEL IN',
    statute_of_limitations: 'Verjährungsfrist',
    loss_small_title: 'GERINGER SCHADEN (< $1.000)',
    loss_small_text: 'Schritte 1-4 ausführen. Rechtskosten übersteigen wahrscheinlich die Rückgewinnung. Meldung zur Prävention.',
    loss_medium_title: 'MITTLERER SCHADEN ($1.000 - $10.000)',
    loss_medium_text: 'Schritte 1-4 ausführen. Mahnverfahren in Betracht ziehen. Sicherungsschreiben können ohne Klage zur Rückgewinnung führen.',
    loss_significant_title: 'ERHEBLICHER SCHADEN ($10.000 - $50.000)',
    loss_significant_text: 'Schritte 1-4 ausführen. Anwalt für Krypto-Betrug konsultieren. Zivilklage kann sinnvoll sein.',
    loss_major_title: 'GROSSER SCHADEN (> $50.000)',
    loss_major_text: 'Schritte 1-4 SOFORT ausführen. Anwalt UMGEHEND einschalten. Notfall-Kontosperrung per Gerichtsbeschluss beantragen.',
    additional_agencies: 'WEITERE BEHÖRDEN',
    when_to_use: 'Wann kontaktieren',
    expected_timeline: 'ERWARTETER ZEITPLAN',
    timeline_report: 'Anzeige einreichen', timeline_exchange: 'Antwort der Börse',
    timeline_police: 'Bestätigung der Polizei', timeline_regulator: 'Prüfung durch Aufsicht',
    timeline_investigation: 'Ermittlungsphase', timeline_recovery: 'Rechtliche Schritte / Rückgewinnung',
    emergency_contacts: 'NOTFALLKONTAKTE',
    need_investigation: 'TIEFERE ERMITTLUNG NÖTIG?',
    need_investigation_text: 'Dieses automatisierte Paket bietet Vorlagen auf Basis der Blockchain-Analyse. Für komplexe Fälle mit mehrstufiger Mittelverfolgung, gerichtsfesten Gutachten oder Sachverständigenaussagen:',
    disclaimer: 'HAFTUNGSAUSSCHLUSS: Dieser Leitfaden dient nur zu Informationszwecken und stellt keine Rechtsberatung dar. LedgerHound (USPROJECT LLC) ist keine Anwaltskanzlei. Eine Rückgewinnung ist nicht garantiert.',
    step_prefix: 'SCHRITT',
    why_matters: 'WARUM DAS WICHTIG IST:',
    where_label: 'WO',
    url_label: 'URL',
    time_same_day: 'Am selben Tag',
    time_1_7_days: '1-7 Tage',
    time_2_8_weeks: '2-8 Wochen',
    time_1_3_months: '1-3 Monate',
    time_3_12_months: '3-12 Monate',
  },
  police: {
    title: 'STRAFANZEIGE', subtitle: 'Bericht über Kryptowährungsbetrug',
    filing_info: 'ANGABEN ZUR ANZEIGE', filing_with: 'Einreichung bei', jurisdiction: 'Zuständigkeit',
    online_portal: 'Online-Portal', reference: 'Aktenzeichen',
    complainant: 'ANZEIGEERSTATTER', full_name: 'Vollständiger Name', email: 'E-Mail', phone: 'Telefon',
    country: 'Land', state_region: 'Bundesland/Region',
    incident_details: 'VORFALLDETAILS', date_of_incident: 'Datum des Vorfalls',
    amount_lost: 'Schadenssumme', cryptocurrency: 'Kryptowährung', network: 'Netzwerk',
    fraud_type: 'Betrugsart', platform_name: 'Plattformname', platform_url: 'Plattform-URL',
    transaction_evidence: 'TRANSAKTIONSNACHWEISE', scammer_wallet: 'Wallet des Betrügers',
    transaction_hash: 'Transaktions-Hash', datetime: 'Datum/Uhrzeit', my_wallet: 'Mein Wallet',
    blockchain_verification: 'BLOCKCHAIN-VERIFIZIERUNG (durch LedgerHound)',
    risk_score: 'Risikobewertung', recovery_probability: 'Rückgewinnungswahrscheinlichkeit',
    exchanges_identified: 'Identifizierte Börsen', full_report: 'Vollständiger Bericht',
    type_of_fraud: 'ART DES BETRUGS',
    fraud_romance: 'Romance Scam / Pig Butchering', fraud_investment: 'Gefälschte Investmentplattform',
    fraud_ponzi: 'Ponzi-/Pyramidensystem', fraud_phishing: 'Phishing / Wallet-Diebstahl',
    fraud_rugpull: 'Rug Pull / Exit Scam', fraud_other: 'Sonstiges',
    description: 'BESCHREIBUNG',
    description_placeholder: 'Beschreiben Sie, wie Sie kontaktiert wurden, was versprochen wurde und wann Sie den Betrug erkannt haben.',
    applicable_law: 'ANWENDBARES RECHT', filed_under: 'Diese Anzeige wird erstattet auf Grundlage von:',
    statute_of_limitations: 'Verjährungsfrist',
    evidence_checklist: 'BEWEISMITTEL-CHECKLISTE',
    evidence_blockchain: 'Blockchain-Transaktionsnachweis (LedgerHound verifiziert)',
    evidence_screenshots: 'Screenshots der Kommunikation', evidence_platform: 'Screenshots der Plattform',
    evidence_bank: 'Bank-/Börsenkontoauszüge', evidence_other: 'Sonstiges',
    declaration: 'ERKLÄRUNG',
    declaration_text: 'Ich, {name}, erkläre an Eides statt, dass die in dieser Anzeige gemachten Angaben wahr und korrekt sind.',
    signature: 'Unterschrift', date: 'Datum',
  },
  regulator: {
    title: 'BESCHWERDE AN DIE FINANZAUFSICHT', subtitle: 'Kryptowährungs-Investmentbetrug',
    regulatory_body: 'AUFSICHTSBEHÖRDE', filing_with: 'Einreichung bei', online_portal: 'Online-Portal', scope: 'Zuständigkeitsbereich',
    complainant: 'BESCHWERDEFÜHRER', name: 'Name', email: 'E-Mail', country: 'Land', police_report: 'Polizeianzeige',
    subject_of_complaint: 'GEGENSTAND DER BESCHWERDE', platform_entity: 'Plattform/Unternehmen',
    website: 'Webseite', type_of_activity: 'Art der Tätigkeit', period: 'Zeitraum',
    financial_details: 'FINANZIELLE DETAILS', amount_lost: 'Schadenssumme', cryptocurrency: 'Kryptowährung',
    payment_method: 'Zahlungsmethode', crypto_transfer: 'Kryptowährungsüberweisung',
    nature_of_violation: 'ART DES VERSTOSSES',
    violation_unregistered: 'Nicht registriertes Wertpapierangebot', violation_investment: 'Anlagebetrug',
    violation_manipulation: 'Marktmanipulation', violation_unlicensed: 'Nicht lizenzierte Geldübermittlung',
    violation_misleading: 'Irreführende Werbung', violation_ponzi: 'Ponzi-/Pyramidensystem', violation_other: 'Sonstiges',
    description: 'BESCHREIBUNG',
    evidence_summary: 'BEWEISZUSAMMENFASSUNG',
    blockchain_verified: 'Blockchain-Beweise von LedgerHound verifiziert',
    transaction_traced: 'Transaktion verfolgt zu', police_filed: 'Strafanzeige erstattet bei',
    other_victims: 'WEITERE GESCHÄDIGTE', aware_of_victims: 'Mir sind weitere Geschädigte bekannt',
    estimated_victims: 'Geschätzte Anzahl der Geschädigten', total_losses: 'Geschätzter Gesamtschaden',
    requested_action: 'GEFORDERTE MASSNAHMEN',
    action_investigate: 'Untersuchung von {platform}', action_enforcement: 'Durchsetzungsmaßnahmen bei bestätigten Verstößen',
    action_coordination: 'Koordination mit {police}', action_warning: 'Öffentliche Warnung zur Prävention',
    declaration: 'ERKLÄRUNG',
    declaration_text: 'Ich, {name}, erkläre an Eides statt, dass die gemachten Angaben wahr und korrekt sind.',
    signature: 'Unterschrift', date: 'Datum',
  },
};

const es: PdfTranslations = {
  common: {
    yes: 'Sí', no: 'No', none: 'Ninguno', unknown: 'Desconocido', pending: 'Pendiente',
    to_be_filled: '[POR COMPLETAR]', under_investigation: '[En investigación]',
    optional: '[OPCIONAL]', see_attached: '[Ver documentos adjuntos]',
    available_upon_request: '[Disponible a solicitud]',
    prepared_with: 'Preparado con LedgerHound', page: 'Pág.', or: 'o',
  },
  action_guide: {
    title: 'GUÍA DE RECUPERACIÓN DE EMERGENCIA',
    subtitle: 'Plan de Recuperación Personalizado',
    case_summary: 'RESUMEN DE SU CASO',
    victim: 'Víctima', loss_amount: 'Monto perdido', date_of_loss: 'Fecha de pérdida', fraud_type: 'Tipo de fraude',
    recovery_analysis: 'ANÁLISIS DE RECUPERACIÓN', recovery: 'RECUPERACIÓN', risk_score: 'Puntuación de riesgo',
    fund_status: 'Estado de fondos', exchanges_found: 'Exchanges encontrados',
    exchange_detected: 'Exchange KYC detectado', no_exchange: 'Ningún exchange KYC detectado aún',
    exchange_positive: 'POSITIVO: Fondos detectados en exchange(s) KYC',
    exchange_positive_text: 'Esto aumenta significativamente las posibilidades de recuperación. Los exchanges pueden ser obligados a congelar activos y proporcionar información del titular de la cuenta.',
    no_exchange_caution: 'PRECAUCIÓN: No se han identificado exchanges KYC.',
    no_exchange_caution_text: 'Los fondos pueden estar en billeteras privadas o plataformas no reguladas. Se requiere una investigación más profunda.',
    mixer_warning: 'Fondos mezclados — trazabilidad reducida',
    critical_window: 'VENTANA CRÍTICA',
    critical_window_text: 'Las primeras 24-72 horas son críticas. Los exchanges son más propensos a congelar activos ANTES de que se retiren. CADA HORA DE RETRASO REDUCE SUS POSIBILIDADES.',
    action_plan: 'PLAN DE ACCIÓN DE 5 PASOS',
    step1_title: 'DENUNCIAR A LA POLICÍA', step1_when: 'HOY',
    step1_why: 'Crea un registro oficial requerido por exchanges y tribunales. Sin él, su caso no tiene validez legal.',
    step1_instructions: '1. Use el documento adjunto "Denuncia Policial"\n2. Presente en línea o en persona\n3. GUARDE el número de referencia',
    expected_response: 'Respuesta esperada',
    step2_title: 'NOTIFICAR A LOS EXCHANGES', step2_when: 'HOY',
    step2_why: 'Los exchanges pueden congelar cuentas en HORAS. Esto evita que el estafador retire sus fondos.',
    send_to: 'ENVIAR CARTA DE PRESERVACIÓN A:',
    step2_instructions: '1. Use la "Carta de Preservación" adjunta\n2. Incluya su número de denuncia policial\n3. Envíe por email Y correo certificado\n4. Haga seguimiento en 24-48 horas',
    step2_no_exchange: 'No se han identificado exchanges. Si descubre la participación de un exchange, envíe la Carta de Preservación inmediatamente.',
    step3_title: 'DENUNCIAR AL REGULADOR', step3_when: 'ESTA SEMANA',
    step3_why: 'Las quejas al regulador desencadenan investigaciones. Múltiples quejas contra la misma entidad llevan a acciones de cumplimiento.',
    step3_instructions: '1. Use la "Queja al Regulador" adjunta\n2. Incluya su número de denuncia policial\n3. Presente en línea',
    step4_title: 'PRESERVAR TODAS LAS PRUEBAS', step4_when: 'CONTINUO',
    step4_why: 'Las pruebas digitales desaparecen. Los estafadores eliminan perfiles, las plataformas cierran, los chats expiran.',
    save_now: 'GUARDAR AHORA:',
    evidence_screenshots: 'Capturas de TODAS las conversaciones',
    evidence_receipts: 'Recibos y confirmaciones de transacciones',
    evidence_wallets: 'Todas las direcciones de billeteras involucradas',
    evidence_platform: 'URLs y capturas de la plataforma',
    evidence_timeline: 'Cronología completa con fechas',
    evidence_chats: 'Historial de chats exportados (WhatsApp, Telegram, email)',
    evidence_social: 'Perfiles de redes sociales del estafador',
    evidence_bank: 'Estados bancarios de transferencias fiat',
    evidence_storage: 'ALMACENAMIENTO: Use respaldo en la nube (Google Drive, iCloud). NO en el mismo dispositivo que puede estar comprometido.',
    step5_title: 'EVALUAR OPCIONES LEGALES', step5_when: '1-2 SEMANAS',
    step5_why: 'La litigación civil puede recuperar fondos incluso cuando la acción penal se estanca.',
    civil_remedies_in: 'RECURSOS CIVILES EN',
    statute_of_limitations: 'Plazo de prescripción',
    loss_small_title: 'PÉRDIDA PEQUEÑA (< $1.000)',
    loss_small_text: 'Complete los pasos 1-4. Los costos legales probablemente superen la recuperación. Enfóquese en denunciar para prevenir futuras víctimas.',
    loss_medium_title: 'PÉRDIDA MEDIA ($1.000 - $10.000)',
    loss_medium_text: 'Complete los pasos 1-4. Considere reclamación de pequeña cuantía. Las cartas de preservación pueden recuperar fondos sin litigio.',
    loss_significant_title: 'PÉRDIDA SIGNIFICATIVA ($10.000 - $50.000)',
    loss_significant_text: 'Complete los pasos 1-4. Consulte un abogado especializado en fraude cripto. Una demanda civil puede ser viable.',
    loss_major_title: 'PÉRDIDA MAYOR (> $50.000)',
    loss_major_text: 'Complete los pasos 1-4 INMEDIATAMENTE. Contrate un abogado LO ANTES POSIBLE. Solicite congelamiento de emergencia por orden judicial.',
    additional_agencies: 'ORGANISMOS ADICIONALES', when_to_use: 'Cuándo contactar',
    expected_timeline: 'CRONOGRAMA ESPERADO',
    timeline_report: 'Presentación de denuncia', timeline_exchange: 'Respuesta del exchange',
    timeline_police: 'Confirmación policial', timeline_regulator: 'Revisión del regulador',
    timeline_investigation: 'Fase de investigación', timeline_recovery: 'Acción legal / recuperación',
    emergency_contacts: 'CONTACTOS DE EMERGENCIA',
    need_investigation: '¿NECESITA INVESTIGACIÓN MÁS PROFUNDA?',
    need_investigation_text: 'Este paquete automatizado proporciona plantillas basadas en análisis blockchain. Para casos complejos que requieran rastreo multi-salto, informes forenses judiciales o testimonio pericial:',
    disclaimer: 'AVISO LEGAL: Esta guía es solo informativa y no constituye asesoramiento legal. LedgerHound (USPROJECT LLC) no es un despacho de abogados. La recuperación no está garantizada.',
    step_prefix: 'PASO',
    why_matters: 'POR QUÉ ESTO IMPORTA:',
    where_label: 'DÓNDE',
    url_label: 'URL',
    time_same_day: 'El mismo día',
    time_1_7_days: '1-7 días',
    time_2_8_weeks: '2-8 semanas',
    time_1_3_months: '1-3 meses',
    time_3_12_months: '3-12 meses',
  },
  police: {
    title: 'DENUNCIA POLICIAL', subtitle: 'Informe de Fraude con Criptomonedas',
    filing_info: 'INFORMACIÓN DE PRESENTACIÓN', filing_with: 'Presentada ante', jurisdiction: 'Jurisdicción',
    online_portal: 'Portal en línea', reference: 'Referencia',
    complainant: 'DENUNCIANTE', full_name: 'Nombre completo', email: 'Correo electrónico', phone: 'Teléfono',
    country: 'País', state_region: 'Estado/Región',
    incident_details: 'DETALLES DEL INCIDENTE', date_of_incident: 'Fecha del incidente',
    amount_lost: 'Monto perdido', cryptocurrency: 'Criptomoneda', network: 'Red',
    fraud_type: 'Tipo de fraude', platform_name: 'Nombre de plataforma', platform_url: 'URL de plataforma',
    transaction_evidence: 'PRUEBAS DE TRANSACCIÓN', scammer_wallet: 'Billetera del estafador',
    transaction_hash: 'Hash de transacción', datetime: 'Fecha/hora', my_wallet: 'Mi billetera',
    blockchain_verification: 'VERIFICACIÓN BLOCKCHAIN (por LedgerHound)',
    risk_score: 'Puntuación de riesgo', recovery_probability: 'Probabilidad de recuperación',
    exchanges_identified: 'Exchanges identificados', full_report: 'Informe completo',
    type_of_fraud: 'TIPO DE FRAUDE',
    fraud_romance: 'Estafa romántica', fraud_investment: 'Plataforma de inversión falsa',
    fraud_ponzi: 'Esquema Ponzi / pirámide', fraud_phishing: 'Phishing / robo de billetera',
    fraud_rugpull: 'Rug Pull / Exit Scam', fraud_other: 'Otro',
    description: 'DESCRIPCIÓN',
    description_placeholder: 'Describa cómo fue contactado, qué le prometieron y cuándo se dio cuenta del fraude.',
    applicable_law: 'LEGISLACIÓN APLICABLE', filed_under: 'Esta denuncia se presenta en virtud de:',
    statute_of_limitations: 'Plazo de prescripción',
    evidence_checklist: 'LISTA DE VERIFICACIÓN DE PRUEBAS',
    evidence_blockchain: 'Prueba de transacción blockchain (verificada por LedgerHound)',
    evidence_screenshots: 'Capturas de comunicaciones', evidence_platform: 'Capturas de la plataforma',
    evidence_bank: 'Extractos bancarios/del exchange', evidence_other: 'Otro',
    declaration: 'DECLARACIÓN',
    declaration_text: 'Yo, {name}, declaro bajo pena de perjurio que la información proporcionada es veraz y exacta según mi leal saber y entender.',
    signature: 'Firma', date: 'Fecha',
  },
  regulator: {
    title: 'QUEJA AL REGULADOR FINANCIERO', subtitle: 'Fraude de Inversión en Criptomonedas',
    regulatory_body: 'ORGANISMO REGULADOR', filing_with: 'Presentada ante', online_portal: 'Portal en línea', scope: 'Ámbito',
    complainant: 'DENUNCIANTE', name: 'Nombre', email: 'Correo electrónico', country: 'País', police_report: 'Denuncia policial',
    subject_of_complaint: 'OBJETO DE LA QUEJA', platform_entity: 'Plataforma/Entidad',
    website: 'Sitio web', type_of_activity: 'Tipo de actividad', period: 'Período',
    financial_details: 'DETALLES FINANCIEROS', amount_lost: 'Monto perdido', cryptocurrency: 'Criptomoneda',
    payment_method: 'Método de pago', crypto_transfer: 'Transferencia de criptomonedas',
    nature_of_violation: 'NATURALEZA DE LA VIOLACIÓN',
    violation_unregistered: 'Oferta de valores no registrada', violation_investment: 'Fraude de inversión',
    violation_manipulation: 'Manipulación de mercado', violation_unlicensed: 'Transmisión de dinero sin licencia',
    violation_misleading: 'Publicidad engañosa', violation_ponzi: 'Esquema Ponzi/pirámide', violation_other: 'Otro',
    description: 'DESCRIPCIÓN',
    evidence_summary: 'RESUMEN DE PRUEBAS',
    blockchain_verified: 'Pruebas blockchain verificadas por LedgerHound',
    transaction_traced: 'Transacción rastreada hasta', police_filed: 'Denuncia presentada ante',
    other_victims: 'OTRAS VÍCTIMAS', aware_of_victims: 'Tengo conocimiento de otras víctimas',
    estimated_victims: 'Número estimado de víctimas', total_losses: 'Pérdidas totales estimadas',
    requested_action: 'ACCIÓN SOLICITADA',
    action_investigate: 'Investigación de {platform}', action_enforcement: 'Medidas de cumplimiento si se confirman violaciones',
    action_coordination: 'Coordinación con {police}', action_warning: 'Advertencia pública para prevenir víctimas adicionales',
    declaration: 'DECLARACIÓN',
    declaration_text: 'Yo, {name}, declaro bajo pena de perjurio que la información proporcionada es veraz y exacta.',
    signature: 'Firma', date: 'Fecha',
  },
};

const fr: PdfTranslations = {
  common: {
    yes: 'Oui', no: 'Non', none: 'Aucun', unknown: 'Inconnu', pending: 'En attente',
    to_be_filled: '[À COMPLÉTER]', under_investigation: '[En cours d\'enquête]',
    optional: '[FACULTATIF]', see_attached: '[Voir documents joints]',
    available_upon_request: '[Disponible sur demande]',
    prepared_with: 'Préparé avec LedgerHound', page: 'Page', or: 'ou',
  },
  action_guide: {
    title: 'GUIDE D\'URGENCE POUR LA RÉCUPÉRATION',
    subtitle: 'Plan de Récupération Personnalisé',
    case_summary: 'RÉSUMÉ DE VOTRE DOSSIER',
    victim: 'Victime', loss_amount: 'Montant perdu', date_of_loss: 'Date de la perte', fraud_type: 'Type de fraude',
    recovery_analysis: 'ANALYSE DE RÉCUPÉRATION', recovery: 'RÉCUPÉRATION', risk_score: 'Score de risque',
    fund_status: 'Statut des fonds', exchanges_found: 'Exchanges trouvés',
    exchange_detected: 'Exchange KYC détecté', no_exchange: 'Aucun exchange KYC détecté',
    exchange_positive: 'POSITIF : Fonds détectés sur exchange(s) KYC',
    exchange_positive_text: 'Cela augmente considérablement les chances de récupération. Les exchanges peuvent être contraints de geler les actifs et de fournir les informations du titulaire du compte.',
    no_exchange_caution: 'ATTENTION : Aucun exchange KYC identifié.',
    no_exchange_caution_text: 'Les fonds peuvent se trouver dans des portefeuilles privés ou sur des plateformes non réglementées. Une enquête approfondie sera nécessaire.',
    mixer_warning: 'Fonds mélangés — traçabilité réduite',
    critical_window: 'FENÊTRE CRITIQUE',
    critical_window_text: 'Les 24 à 72 premières heures sont critiques. Les exchanges sont plus susceptibles de geler les actifs AVANT qu\'ils ne soient retirés. CHAQUE HEURE DE RETARD RÉDUIT VOS CHANCES.',
    action_plan: 'PLAN D\'ACTION EN 5 ÉTAPES',
    step1_title: 'DÉPOSER PLAINTE', step1_when: 'AUJOURD\'HUI',
    step1_why: 'Crée un dossier officiel requis par les exchanges et les tribunaux. Sans celui-ci, votre affaire n\'a pas de valeur juridique.',
    step1_instructions: '1. Utilisez le document « Plainte » ci-joint\n2. Déposez en ligne ou en personne\n3. CONSERVEZ le numéro de référence',
    expected_response: 'Réponse attendue',
    step2_title: 'NOTIFIER LES EXCHANGES', step2_when: 'AUJOURD\'HUI',
    step2_why: 'Les exchanges peuvent geler les comptes en HEURES. Cela empêche l\'escroc de retirer vos fonds.',
    send_to: 'ENVOYER LA LETTRE DE CONSERVATION À :',
    step2_instructions: '1. Utilisez la « Lettre de Conservation » ci-jointe\n2. Incluez votre numéro de plainte\n3. Envoyez par email ET courrier recommandé\n4. Relancez sous 24-48 heures',
    step2_no_exchange: 'Aucun exchange identifié. Si vous découvrez l\'implication d\'un exchange, envoyez immédiatement la Lettre de Conservation.',
    step3_title: 'SIGNALER AU RÉGULATEUR', step3_when: 'CETTE SEMAINE',
    step3_why: 'Les plaintes au régulateur déclenchent des enquêtes. Des plaintes multiples contre la même entité mènent à des sanctions.',
    step3_instructions: '1. Utilisez la « Plainte au Régulateur » ci-jointe\n2. Mentionnez votre numéro de plainte\n3. Soumettez en ligne',
    step4_title: 'PRÉSERVER TOUTES LES PREUVES', step4_when: 'EN CONTINU',
    step4_why: 'Les preuves numériques disparaissent. Les escrocs suppriment leurs profils, les plateformes ferment, les conversations expirent.',
    save_now: 'À SAUVEGARDER MAINTENANT :',
    evidence_screenshots: 'Captures d\'écran de TOUTES les conversations',
    evidence_receipts: 'Reçus et confirmations de transactions',
    evidence_wallets: 'Toutes les adresses de portefeuilles impliquées',
    evidence_platform: 'URLs et captures de la plateforme',
    evidence_timeline: 'Chronologie complète avec dates',
    evidence_chats: 'Historiques de conversations exportés (WhatsApp, Telegram, email)',
    evidence_social: 'Profils de réseaux sociaux de l\'escroc',
    evidence_bank: 'Relevés bancaires des virements fiat',
    evidence_storage: 'STOCKAGE : Utilisez une sauvegarde cloud (Google Drive, iCloud). PAS sur l\'appareil potentiellement compromis.',
    step5_title: 'ÉVALUER LES OPTIONS JURIDIQUES', step5_when: '1-2 SEMAINES',
    step5_why: 'Un procès civil peut récupérer des fonds même quand les poursuites pénales stagnent.',
    civil_remedies_in: 'RECOURS CIVILS EN',
    statute_of_limitations: 'Délai de prescription',
    loss_small_title: 'PETITE PERTE (< 1 000 $)',
    loss_small_text: 'Suivez les étapes 1-4. Les frais juridiques dépassent probablement la récupération. Concentrez-vous sur le signalement.',
    loss_medium_title: 'PERTE MOYENNE (1 000 - 10 000 $)',
    loss_medium_text: 'Suivez les étapes 1-4. Envisagez une procédure simplifiée. Les lettres de conservation peuvent récupérer les fonds sans procès.',
    loss_significant_title: 'PERTE IMPORTANTE (10 000 - 50 000 $)',
    loss_significant_text: 'Suivez les étapes 1-4. Consultez un avocat spécialisé en fraude crypto. Une action civile peut être envisageable.',
    loss_major_title: 'PERTE MAJEURE (> 50 000 $)',
    loss_major_text: 'Suivez les étapes 1-4 IMMÉDIATEMENT. Engagez un avocat RAPIDEMENT. Demandez un gel d\'urgence des actifs par ordonnance du tribunal.',
    additional_agencies: 'ORGANISMES SUPPLÉMENTAIRES', when_to_use: 'Quand contacter',
    expected_timeline: 'CALENDRIER PRÉVU',
    timeline_report: 'Dépôt de plainte', timeline_exchange: 'Réponse de l\'exchange',
    timeline_police: 'Confirmation de la police', timeline_regulator: 'Examen du régulateur',
    timeline_investigation: 'Phase d\'enquête', timeline_recovery: 'Action juridique / récupération',
    emergency_contacts: 'CONTACTS D\'URGENCE',
    need_investigation: 'BESOIN D\'UNE ENQUÊTE APPROFONDIE ?',
    need_investigation_text: 'Ce pack automatisé fournit des modèles basés sur l\'analyse blockchain. Pour les cas complexes nécessitant un traçage multi-sauts, des rapports forensiques ou un témoignage d\'expert :',
    disclaimer: 'AVERTISSEMENT : Ce guide est fourni à titre informatif uniquement et ne constitue pas un conseil juridique. LedgerHound (USPROJECT LLC) n\'est pas un cabinet d\'avocats. La récupération n\'est pas garantie.',
    step_prefix: 'ÉTAPE',
    why_matters: 'POURQUOI C\'EST IMPORTANT :',
    where_label: 'OÙ',
    url_label: 'URL',
    time_same_day: 'Le jour même',
    time_1_7_days: '1-7 jours',
    time_2_8_weeks: '2-8 semaines',
    time_1_3_months: '1-3 mois',
    time_3_12_months: '3-12 mois',
  },
  police: {
    title: 'PLAINTE', subtitle: 'Rapport de Fraude aux Cryptomonnaies',
    filing_info: 'INFORMATIONS DE DÉPÔT', filing_with: 'Déposée auprès de', jurisdiction: 'Juridiction',
    online_portal: 'Portail en ligne', reference: 'Référence',
    complainant: 'PLAIGNANT', full_name: 'Nom complet', email: 'Email', phone: 'Téléphone',
    country: 'Pays', state_region: 'Département/Région',
    incident_details: 'DÉTAILS DE L\'INCIDENT', date_of_incident: 'Date de l\'incident',
    amount_lost: 'Montant perdu', cryptocurrency: 'Cryptomonnaie', network: 'Réseau',
    fraud_type: 'Type de fraude', platform_name: 'Nom de la plateforme', platform_url: 'URL de la plateforme',
    transaction_evidence: 'PREUVES DE TRANSACTION', scammer_wallet: 'Portefeuille de l\'escroc',
    transaction_hash: 'Hash de transaction', datetime: 'Date/heure', my_wallet: 'Mon portefeuille',
    blockchain_verification: 'VÉRIFICATION BLOCKCHAIN (par LedgerHound)',
    risk_score: 'Score de risque', recovery_probability: 'Probabilité de récupération',
    exchanges_identified: 'Exchanges identifiés', full_report: 'Rapport complet',
    type_of_fraud: 'TYPE DE FRAUDE',
    fraud_romance: 'Arnaque sentimentale', fraud_investment: 'Fausse plateforme d\'investissement',
    fraud_ponzi: 'Système de Ponzi / pyramide', fraud_phishing: 'Hameçonnage / vol de portefeuille',
    fraud_rugpull: 'Rug Pull / Exit Scam', fraud_other: 'Autre',
    description: 'DESCRIPTION',
    description_placeholder: 'Décrivez comment vous avez été contacté, ce qui vous a été promis et quand vous avez réalisé la fraude.',
    applicable_law: 'DROIT APPLICABLE', filed_under: 'Cette plainte est déposée en vertu de :',
    statute_of_limitations: 'Délai de prescription',
    evidence_checklist: 'LISTE DES PREUVES',
    evidence_blockchain: 'Preuve de transaction blockchain (vérifiée par LedgerHound)',
    evidence_screenshots: 'Captures de communications', evidence_platform: 'Captures de la plateforme',
    evidence_bank: 'Relevés bancaires/d\'exchange', evidence_other: 'Autre',
    declaration: 'DÉCLARATION',
    declaration_text: 'Je, {name}, déclare sur l\'honneur que les informations fournies dans cette plainte sont vraies et exactes.',
    signature: 'Signature', date: 'Date',
  },
  regulator: {
    title: 'PLAINTE AU RÉGULATEUR FINANCIER', subtitle: 'Fraude à l\'Investissement en Cryptomonnaies',
    regulatory_body: 'ORGANISME DE RÉGULATION', filing_with: 'Déposée auprès de', online_portal: 'Portail en ligne', scope: 'Champ de compétence',
    complainant: 'PLAIGNANT', name: 'Nom', email: 'Email', country: 'Pays', police_report: 'Plainte policière',
    subject_of_complaint: 'OBJET DE LA PLAINTE', platform_entity: 'Plateforme/Entité',
    website: 'Site web', type_of_activity: 'Type d\'activité', period: 'Période',
    financial_details: 'DÉTAILS FINANCIERS', amount_lost: 'Montant perdu', cryptocurrency: 'Cryptomonnaie',
    payment_method: 'Mode de paiement', crypto_transfer: 'Virement de cryptomonnaies',
    nature_of_violation: 'NATURE DE LA VIOLATION',
    violation_unregistered: 'Offre de titres non enregistrée', violation_investment: 'Fraude à l\'investissement',
    violation_manipulation: 'Manipulation de marché', violation_unlicensed: 'Transmission d\'argent sans licence',
    violation_misleading: 'Publicité trompeuse', violation_ponzi: 'Système de Ponzi/pyramide', violation_other: 'Autre',
    description: 'DESCRIPTION',
    evidence_summary: 'RÉSUMÉ DES PREUVES',
    blockchain_verified: 'Preuves blockchain vérifiées par LedgerHound',
    transaction_traced: 'Transaction tracée vers', police_filed: 'Plainte déposée auprès de',
    other_victims: 'AUTRES VICTIMES', aware_of_victims: 'J\'ai connaissance d\'autres victimes',
    estimated_victims: 'Nombre estimé de victimes', total_losses: 'Pertes totales estimées',
    requested_action: 'ACTION DEMANDÉE',
    action_investigate: 'Enquête sur {platform}', action_enforcement: 'Mesures d\'exécution si violations confirmées',
    action_coordination: 'Coordination avec {police}', action_warning: 'Alerte publique pour prévenir d\'autres victimes',
    declaration: 'DÉCLARATION',
    declaration_text: 'Je, {name}, déclare sur l\'honneur que les informations fournies sont vraies et exactes.',
    signature: 'Signature', date: 'Date',
  },
};

/* ─── Remaining languages use English as base with key overrides ─── */
/* For uk, nl, it — create minimal translations for titles and key labels */

const uk: PdfTranslations = {
  ...en,
  common: { ...en.common, yes: 'Так', no: 'Ні', none: 'Немає', unknown: 'Невідомо', pending: 'Очікує', to_be_filled: '[ЗАПОВНИТИ]', under_investigation: '[На розгляді]', optional: '[НЕОБОВ\'ЯЗКОВО]', see_attached: '[Див. додані документи]', available_upon_request: '[Надається за запитом]', prepared_with: 'Підготовлено за допомогою LedgerHound', page: 'Стор.', or: 'або' },
  action_guide: { ...en.action_guide, title: 'ЕКСТРЕНИЙ ПОСІБНИК З ПОВЕРНЕННЯ КОШТІВ', subtitle: 'Персональний план відновлення', case_summary: 'ЗВЕДЕННЯ ПО ВАШІЙ СПРАВІ', victim: 'Постраждалий', loss_amount: 'Сума збитків', date_of_loss: 'Дата втрати', fraud_type: 'Тип шахрайства', recovery_analysis: 'АНАЛІЗ ПОВЕРНЕННЯ', recovery: 'ПОВЕРНЕННЯ', risk_score: 'Оцінка ризику', fund_status: 'Статус коштів', exchanges_found: 'Біржі знайдено', critical_window: 'КРИТИЧНЕ ВІКНО', critical_window_text: 'Перші 24-72 години є критичними. Біржі з більшою ймовірністю заморозять активи ДО того, як кошти будуть виведені. КОЖНА ГОДИНА ЗАТРИМКИ ЗМЕНШУЄ ВАШІ ШАНСИ.', action_plan: 'ПЛАН ДІЙ З 5 КРОКІВ', step1_title: 'ПОДАТИ ЗАЯВУ В ПОЛІЦІЮ', step1_when: 'СЬОГОДНІ', step2_title: 'ПОВІДОМИТИ БІРЖІ', step2_when: 'СЬОГОДНІ', step3_title: 'ПОДАТИ СКАРГУ РЕГУЛЯТОРУ', step3_when: 'ЦЬОГО ТИЖНЯ', step4_title: 'ЗБЕРЕГТИ ВСІ ДОКАЗИ', step4_when: 'ПОСТІЙНО', step5_title: 'ОЦІНИТИ ЮРИДИЧНІ МОЖЛИВОСТІ', step5_when: '1-2 ТИЖНІ', additional_agencies: 'ДОДАТКОВІ ОРГАНИ', when_to_use: 'Коли звертатися', expected_timeline: 'ОЧІКУВАНІ ТЕРМІНИ', emergency_contacts: 'ЕКСТРЕНІ КОНТАКТИ', need_investigation: 'ПОТРІБНЕ ПОГЛИБЛЕНЕ РОЗСЛІДУВАННЯ?', disclaimer: 'ЗАСТЕРЕЖЕННЯ: Цей посібник має інформаційний характер і не є юридичною консультацією. LedgerHound (USPROJECT LLC) — не юридична фірма. Повернення коштів не гарантовано.' },
  police: { ...en.police, title: 'ЗАЯВА В ПОЛІЦІЮ', subtitle: 'Звіт про криптовалютне шахрайство', filing_info: 'ІНФОРМАЦІЯ ПРО ПОДАННЯ', filing_with: 'Подається до', complainant: 'ЗАЯВНИК', full_name: 'ПІБ', phone: 'Телефон', country: 'Країна', state_region: 'Область', incident_details: 'ДЕТАЛІ ІНЦИДЕНТУ', date_of_incident: 'Дата інциденту', amount_lost: 'Сума збитків', cryptocurrency: 'Криптовалюта', fraud_type: 'Тип шахрайства', transaction_evidence: 'ДОКАЗИ ТРАНЗАКЦІЇ', scammer_wallet: 'Гаманець шахрая', transaction_hash: 'Хеш транзакції', my_wallet: 'Мій гаманець', blockchain_verification: 'ВЕРИФІКАЦІЯ БЛОКЧЕЙНУ (LedgerHound)', risk_score: 'Оцінка ризику', recovery_probability: 'Ймовірність повернення', type_of_fraud: 'ТИП ШАХРАЙСТВА', description: 'ОПИС', applicable_law: 'ЗАСТОСОВНЕ ЗАКОНОДАВСТВО', evidence_checklist: 'КОНТРОЛЬНИЙ СПИСОК ДОКАЗІВ', declaration: 'ЗАЯВА', signature: 'Підпис', date: 'Дата' },
  regulator: { ...en.regulator, title: 'СКАРГА ФІНАНСОВОМУ РЕГУЛЯТОРУ', subtitle: 'Криптовалютне інвестиційне шахрайство', regulatory_body: 'РЕГУЛЮЮЧИЙ ОРГАН', complainant: 'СКАРЖНИК', subject_of_complaint: 'ПРЕДМЕТ СКАРГИ', financial_details: 'ФІНАНСОВІ ДЕТАЛІ', nature_of_violation: 'ХАРАКТЕР ПОРУШЕННЯ', evidence_summary: 'ЗВЕДЕННЯ ДОКАЗІВ', other_victims: 'ІНШІ ПОСТРАЖДАЛІ', requested_action: 'ЗАПИТУВАНІ ДІЇ', declaration: 'ЗАЯВА', signature: 'Підпис', date: 'Дата' },
};

const nl: PdfTranslations = {
  ...en,
  common: { ...en.common, yes: 'Ja', no: 'Nee', none: 'Geen', unknown: 'Onbekend', pending: 'In afwachting', to_be_filled: '[IN TE VULLEN]', prepared_with: 'Opgesteld met LedgerHound', page: 'Pagina', or: 'of' },
  action_guide: { ...en.action_guide, title: 'NOODGIDS VOOR HERSTEL', subtitle: 'Persoonlijk Herstelplan', case_summary: 'UW ZAAKSAMENVATTING', victim: 'Slachtoffer', loss_amount: 'Verliesbedrag', date_of_loss: 'Datum van verlies', fraud_type: 'Type fraude', recovery_analysis: 'HERSTELANALYSE', recovery: 'HERSTEL', critical_window: 'KRITIEK TIJDVENSTER', action_plan: '5-STAPPEN ACTIEPLAN', step1_title: 'AANGIFTE BIJ POLITIE', step1_when: 'VANDAAG', step2_title: 'EXCHANGES INFORMEREN', step2_when: 'VANDAAG', step3_title: 'MELDING BIJ TOEZICHTHOUDER', step3_when: 'DEZE WEEK', step4_title: 'ALLE BEWIJSMATERIAAL BEWAREN', step4_when: 'DOORLOPEND', step5_title: 'JURIDISCHE OPTIES EVALUEREN', step5_when: '1-2 WEKEN', additional_agencies: 'AANVULLENDE INSTANTIES', expected_timeline: 'VERWACHT TIJDSCHEMA', emergency_contacts: 'NOODCONTACTEN', disclaimer: 'DISCLAIMER: Deze gids is uitsluitend informatief en vormt geen juridisch advies. LedgerHound (USPROJECT LLC) is geen advocatenkantoor. Herstel is niet gegarandeerd.' },
  police: { ...en.police, title: 'AANGIFTE', subtitle: 'Melding van Cryptocurrency Fraude', filing_info: 'AANGIFTE-INFORMATIE', complainant: 'AANGEVER', full_name: 'Volledige naam', incident_details: 'INCIDENTDETAILS', amount_lost: 'Verliesbedrag', transaction_evidence: 'TRANSACTIEBEWIJS', type_of_fraud: 'TYPE FRAUDE', description: 'BESCHRIJVING', applicable_law: 'TOEPASSELIJK RECHT', evidence_checklist: 'BEWIJSCHECKLIST', declaration: 'VERKLARING', signature: 'Handtekening', date: 'Datum' },
  regulator: { ...en.regulator, title: 'KLACHT BIJ FINANCIEEL TOEZICHTHOUDER', subtitle: 'Cryptocurrency Beleggingsfraude', regulatory_body: 'TOEZICHTHOUDER', complainant: 'KLAGER', subject_of_complaint: 'ONDERWERP VAN KLACHT', financial_details: 'FINANCIËLE DETAILS', nature_of_violation: 'AARD VAN DE OVERTREDING', evidence_summary: 'BEWIJSOVERZICHT', other_victims: 'ANDERE SLACHTOFFERS', requested_action: 'GEVRAAGDE ACTIE', declaration: 'VERKLARING', signature: 'Handtekening', date: 'Datum' },
};

const it: PdfTranslations = {
  ...en,
  common: { ...en.common, yes: 'Sì', no: 'No', none: 'Nessuno', unknown: 'Sconosciuto', pending: 'In attesa', to_be_filled: '[DA COMPILARE]', prepared_with: 'Preparato con LedgerHound', page: 'Pag.', or: 'o' },
  action_guide: { ...en.action_guide, title: 'GUIDA DI EMERGENZA PER IL RECUPERO', subtitle: 'Piano di Recupero Personalizzato', case_summary: 'RIEPILOGO DEL CASO', victim: 'Vittima', loss_amount: 'Importo perso', date_of_loss: 'Data della perdita', fraud_type: 'Tipo di frode', recovery_analysis: 'ANALISI DI RECUPERO', recovery: 'RECUPERO', critical_window: 'FINESTRA CRITICA', action_plan: 'PIANO D\'AZIONE IN 5 FASI', step1_title: 'DENUNCIA ALLA POLIZIA', step1_when: 'OGGI', step2_title: 'NOTIFICARE GLI EXCHANGE', step2_when: 'OGGI', step3_title: 'SEGNALAZIONE AL REGOLATORE', step3_when: 'QUESTA SETTIMANA', step4_title: 'CONSERVARE TUTTE LE PROVE', step4_when: 'CONTINUATIVO', step5_title: 'VALUTARE LE OPZIONI LEGALI', step5_when: '1-2 SETTIMANE', additional_agencies: 'ENTI AGGIUNTIVI', expected_timeline: 'TEMPISTICA PREVISTA', emergency_contacts: 'CONTATTI DI EMERGENZA', disclaimer: 'AVVERTENZA: Questa guida ha scopo esclusivamente informativo e non costituisce consulenza legale. LedgerHound (USPROJECT LLC) non è uno studio legale. Il recupero non è garantito.' },
  police: { ...en.police, title: 'DENUNCIA', subtitle: 'Segnalazione di Frode Criptovalutaria', filing_info: 'INFORMAZIONI DI PRESENTAZIONE', complainant: 'DENUNCIANTE', full_name: 'Nome completo', incident_details: 'DETTAGLI DELL\'INCIDENTE', amount_lost: 'Importo perso', transaction_evidence: 'PROVE DELLA TRANSAZIONE', type_of_fraud: 'TIPO DI FRODE', description: 'DESCRIZIONE', applicable_law: 'LEGGE APPLICABILE', evidence_checklist: 'LISTA DI CONTROLLO PROVE', declaration: 'DICHIARAZIONE', signature: 'Firma', date: 'Data' },
  regulator: { ...en.regulator, title: 'RECLAMO AL REGOLATORE FINANZIARIO', subtitle: 'Frode su Investimenti in Criptovalute', regulatory_body: 'ORGANISMO DI REGOLAMENTAZIONE', complainant: 'RECLAMANTE', subject_of_complaint: 'OGGETTO DEL RECLAMO', financial_details: 'DETTAGLI FINANZIARI', nature_of_violation: 'NATURA DELLA VIOLAZIONE', evidence_summary: 'RIEPILOGO PROVE', other_victims: 'ALTRE VITTIME', requested_action: 'AZIONE RICHIESTA', declaration: 'DICHIARAZIONE', signature: 'Firma', date: 'Data' },
};

/* ─── Translation registry ─── */
const TRANSLATIONS: Record<string, PdfTranslations> = { en, ru, de, es, fr, uk, nl, it };

/**
 * Get PDF translations for a language code.
 * Falls back to English for unsupported languages.
 */
export function getPdfTranslations(langOrCountry: string): PdfTranslations {
  // If country code passed, convert to language
  const lang = COUNTRY_LANG[langOrCountry.toUpperCase()] || langOrCountry.toLowerCase();
  return TRANSLATIONS[lang] || en;
}

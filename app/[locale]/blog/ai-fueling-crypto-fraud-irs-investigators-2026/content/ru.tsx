import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ContentRu({ base }: { base: string }) {
  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">Кайл Холдер думала, что общается с реальным человеком по имени Ниам. Два месяца переписки. Поддельная «служба поддержки клиентов» инструктировала её по кошелькам и переводам. Когда она поняла, сбережения исчезли — выведены через слои блокчейн-транзакций. Это не единичная история. Это новое лицо криптомошенничества, и оно работает на искусственном интеллекте.</p>
      <p className="text-lg text-slate-700 leading-relaxed">Цифры ошеломляют. Согласно <a href="https://gizmodo.com/crypto-investment-scams-were-the-most-costly-type-of-fraud-in-the-u-s-in-2025-2000743099" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">отчету FBI IC3 за 2025 год</a>, американцы потеряли $7,2 млрд из-за криптоинвестиционных афер в 2025 году — что делает этот вид мошенничества самым дорогостоящим для агентства. И следователи IRS утверждают, что ключевым фактором является ИИ. В <a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">репортаже CBS News</a> официальные лица рассказали, как дипфейковые голоса, сгенерированные ИИ профили и автоматизированные скрипты чатов делают аферы убедительнее, чем когда-либо.</p>
      <p className="text-lg text-slate-700 leading-relaxed">Эта статья разбирает, как ИИ усиливает криптомошенничество, что видят следователи IRS на местах и — самое главное — как вы можете бороться с помощью блокчейн-форензики и бесплатных инструментов, таких как <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">Wallet Tracker от LedgerHound</Link>.</p>

      <h2 id="the-ai-powered-scam-machine">Машина мошенничества на базе ИИ</h2>

      <p>Мошенники всегда умели манипулировать. Но ИИ даёт им масштаб. Вместо одного афериста, набирающего сообщения, чат-боты на ИИ теперь ведут тысячи разговоров одновременно, адаптируясь в реальном времени к ответам жертв. Следователи IRS рассказали <a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">CBS News</a>, что эти боты могут имитировать сочувствие, срочность и даже романтический интерес — и всё это собирая личные данные для уточнения атаки.</p>

      <p>Дипфейковые голосовые и видеозвонки — следующая ступень. В 2025 году ФБР предупредило о мошенниках, использующих клонированные ИИ голоса членов семьи или официальных лиц для требования срочных криптоплатежей. Технология дешева и доступна — 30-секундного аудио из соцсетей достаточно, чтобы клонировать голос. Мы видели случаи, когда жертвы получали «видеозвонок» от якобы доверенного агента поддержки биржи, а затем теряли весь портфель.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">$7,2 млрд</p>
        <p className="text-sm text-slate-600">Общие потери от криптоинвестиционных афер, зарегистрированные в FBI IC3 в 2025 году — самые высокие среди всех категорий мошенничества.</p>
      </div>

      <p>Результат? Рекордные $7,2 млрд потерь только от криптоинвестиционных афер, согласно <a href="https://gizmodo.com/crypto-investment-scams-were-the-most-costly-type-of-fraud-in-the-u-s-in-2025-2000743099" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">отчету FBI IC3 2025</a>. Это не считая романтических афер, программ-вымогателей или компрометации деловой почты — все они всё чаще требуют криптовалюту.</p>

      <h2 id="irs-investigators-on-the-front-lines">Следователи IRS на передовой</h2>

      <p>Отдел уголовных расследований IRS (IRS-CI) находится в уникальном положении для борьбы с криптомошенничеством, потому что отмывание денег почти всегда оставляет налоговый след. В 2025 году агенты IRS-CI расследовали сотни дел, связанных с криптовалютами, многие из которых включали сгенерированные ИИ поддельные личности и компании-однодневки. Согласно <a href="https://www.cbsnews.com/news/ai-crypto-fraud-irs-investigators/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">CBS News</a>, агентство отметило резкий рост случаев, когда мошенники используют ИИ для создания реалистичных инвестиционных платформ, существующих только на бумаге.</p>

      <p>Один агент IRS описал случай, когда жертву заманили в поддельный майнинг-пул, обещавший ежедневную прибыль. Сайт выглядел профессионально, с отзывами, сгенерированными ИИ, и чат-ботом, отвечавшим на вопросы 24/7. Когда жертва попыталась вывести средства, бот потребовал дополнительную «комиссию за верификацию» — классическая тактика «свинореза», теперь автоматизированная.</p>

      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">Думаете, вас обманули?</h3>
        <p className="text-brand-100 text-sm mb-5">Не ждите. Первые 72 часа критически важны для заморозки средств на биржах. Используйте наш бесплатный Wallet Tracker, чтобы отследить движение вашей украденной криптовалюты — без регистрации.</p>
        <Link href={`${base}/wallet-tracker`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
          Попробовать Wallet Tracker бесплатно <ArrowRight size={14} />
        </Link>
      </div>

      <h2 id="how-ai-enables-pig-butchering-at-scale">Как ИИ позволяет масштабировать «свинорез»</h2>

      <p>«Свинорез» — афера, при которой мошенники в течение недель или месяцев втираются в доверие, а затем обчищают жертву — существует уже много лет. Но ИИ усиливает её. Вместо одного афериста, управляющего горсткой жертв, ИИ может одновременно вести десятки «отношений», используя обработку естественного языка для запоминания прошлых разговоров и корректировки тактики.</p>

      <p><a href="https://www.jpost.com/international/article-894049" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Санкции Минфина США против камбоджийского сенатора Кок Ана</a> и ещё 28 лиц в 2026 году раскрыли огромную сеть мошеннических центров, использующих ИИ для нацеливания на американцев. Эти операции применяли дипфейковые видеозвонки, сгенерированные ИИ голосовые сообщения и даже поддельные новостные статьи, чтобы их схемы выглядели легитимными. Минфин утверждал, что Кок Ан использовал политические связи для защиты этих центров, которые украли миллионы у граждан США.</p>

      <ul>
        <li>Чат-боты на ИИ, имитирующие романтических партнёров или финансовых консультантов</li>
        <li>Дипфейковые видеозвонки с поддельными «агентами поддержки»</li>
        <li>Сгенерированные ИИ поддельные новости и отзывы для создания доверия</li>
        <li>Автоматизированные торговые платформы, показывающие фальшивую прибыль</li>
      </ul>

      <h2 id="the-role-of-blockchain-forensics">Роль блокчейн-форензики</h2>

      <p>ИИ может помогать мошенникам, но блокчейн-форензика нагоняет. Каждая криптотранзакция навсегда записана в реестре. Даже когда средства проходят через миксеры или кросс-чейн мосты, форензические инструменты могут отследить поток — если действовать быстро.</p>

      <p>В LedgerHound мы отслеживали украденные средства из афер на ИИ через несколько блокчейнов, включая Bitcoin, Ethereum и TRC20 USDT. В одном случае жертва потеряла $47 000 из-за дипфейкового звонка «поддержки биржи». Наш анализ показал, что средства прошли через три цепи менее чем за час и оказались на бирже с KYC. Мы помогли заморозить счёт до того, как мошенник успел вывести средства.</p>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Немедленные шаги, если вас обманули
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Прекратите любое общение</p>
            <p className="text-sm text-slate-600">Не вступайте в дальнейший контакт. Мошенники могут попытаться выманить больше денег или личной информации.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Задокументируйте всё</p>
            <p className="text-sm text-slate-600">Сохраните скриншоты, адреса кошельков, ID транзакций и любые сообщения. Это улики.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Используйте трекер кошельков</p>
            <p className="text-sm text-slate-600">Введите адрес кошелька мошенника в наш <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">бесплатный Wallet Tracker</Link>, чтобы увидеть, куда пошли средства.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Сообщите властям</p>
            <p className="text-sm text-slate-600">Подайте заявление в <a href="https://www.ic3.gov/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">FBI IC3</a> и местные правоохранительные органы. Также уведомите биржу, где оказались средства.</p>
          <div className="not-prose ml-8 my-3 bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-semibold mb-1">Совет профи</p>
            <p className="text-xs text-slate-600">Многие биржи замораживают счета только после получения письма о сохранении. Используйте наш <Link href={`${base}/tools/exchange-letter`} className="text-brand-600 hover:underline">Генератор писем о сохранении для бирж</Link> бесплатно.</p>
          </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">5</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Рассмотрите профессиональное отслеживание</p>
            <p className="text-sm text-slate-600">Если сумма значительна, <Link href={`${base}/report`} className="text-brand-600 hover:underline">форензический отчет</Link> может предоставить готовую для суда цепочку владения для усилий по возврату.</p>
          </div>
        </div>
      </div>

      <h2 id="what-the-future-holds">Что ждёт в будущем</h2>

      <p>Мошенничество с ИИ становится только изощрённее. Следователи IRS прогнозируют, что к 2027 году дипфейковые видеозвонки будут неотличимы от настоящих. Мошенники будут использовать ИИ для персонализации атак на основе профилей жертв в соцсетях, финансовой истории и даже биометрических данных.</p>

      <p>Но есть надежда. Регуляторное давление растёт. <a href="https://www.jpost.com/international/article-894049" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Санкции Минфина США против Кок Ана</a> показывают, что правительство нацеливается на инфраструктуру, стоящую за этими аферами. А компании по блокчейн-форензике, такие как LedgerHound, создают инструменты, выравнивающие игровое поле.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">28 лиц и организаций под санкциями</p>
        <p className="text-sm text-slate-600">Минфин США ввёл санкции против 28 лиц и организаций в 2026 году за крипторомантические аферы, включая камбоджийского сенатора.</p>
      </div>

      <p>Ключевой фактор — скорость. ИИ движется быстро, но данные блокчейна постоянны. Если вы действуете в течение часов, а не дней, у вас есть реальный шанс вернуть средства. Именно поэтому мы создали <Link href={`${base}/emergency`} className="text-brand-600 hover:underline">Экстренный пакет сохранения LedgerHound</Link> — пошаговый набор, помогающий жертвам заморозить активы на биржах до их исчезновения.</p>

      <h2 id="protect-yourself-in-the-ai-era">Защитите себя в эпоху ИИ</h2>

      <p>Профилактика по-прежнему лучшая защита. Вот практические советы, как избежать криптоафер на базе ИИ:</p>

      <ol>
        <li>Проверяйте личность через отдельный канал. Если кто-то утверждает, что он с биржи, позвоните по официальному номеру — не доверяйте номеру, который дали вам.</li>
        <li>Никогда не сообщайте свою сид-фразу или приватные ключи. Ни один легитимный сервис не попросит их.</li>
        <li>Скептически относитесь к нежелательным инвестиционным предложениям, особенно с гарантированной доходностью.</li>
        <li>Используйте наш <Link href={`${base}/scam-checker`} className="text-brand-600 hover:underline">Проверятор афер</Link>, чтобы проверить любой адрес кошелька или платформу перед отправкой средств.</li>
      </ol>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          Красные флаги афер с ИИ
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Слишком идеальное общение</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Без опечаток, всегда на связи, помнит каждую деталь — чат-боты на ИИ безупречны, люди — нет.</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Давление с требованием действовать быстро</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Мошенники создают срочность, чтобы обойти ваше критическое мышление. Легитимные инвестиции не истекают через 24 часа.</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Поддельные видеозвонки</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Если человек на экране выглядит слегка неестественно или повторяет фразы, это может быть дипфейк. Попросите его повернуть голову или помахать рукой.</span></li>
          </ul>
        </div>
      </div>

      <h2 id="ledgerhound-is-here-to-help">LedgerHound готов помочь</h2>

      <p>Мы знаем, насколько разрушительны эти аферы. Наша команда сертифицированных форензик-аналитиков отследила миллиарды украденной криптовалюты через десятки блокчейнов. Нужна ли вам быстрая проверка или полный <Link href={`${base}/report`} className="text-brand-600 hover:underline">форензический отчет</Link> для судебных действий — мы здесь.</p>

      <p>Начните с <Link href={`${base}/free-evaluation`} className="text-brand-600 hover:underline">бесплатной оценки дела</Link> — без обязательств. Мы рассмотрим вашу ситуацию и порекомендуем лучшие следующие шаги. А если вы спешите, наш <Link href={`${base}/emergency`} className="text-brand-600 hover:underline">Экстренный пакет сохранения</Link> можно развернуть за минуты.</p>

      <p>ИИ может подпитывать мошенничество, но с правильными инструментами и опытом вы можете дать отпор. Блокчейн не лжёт — и мы умеем его читать.</p>
    </>
  );
}

import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ContentRu({ base }: { base: string }) {
  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">29 апреля 2026 года. День, когда всё изменилось для криптоплатформ. Генеральный прокурор Нью-Йорка обнародовал сенсацию: Uphold выплатит более $5 млн за введение инвесторов в заблуждение и продвижение мошеннической схемы, организованной Cred, LLC и её CEO. Это не просто очередной штраф. Это предупреждение — прямо в адрес каждой биржи, поставщика кошельков и торговой платформы, которые размещают сторонние продукты без должной проверки.</p>
      <p className="text-lg text-slate-700 leading-relaxed"><a href="https://natlawreview.com/article/new-york-ag-secures-over-5m-crypto-platform-alleged-promotion-fraudulent-investment" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Расследование NY AG</a> установило, что Uphold рекламировал высокодоходную программу Cred без надлежащего дью-дилидженса. Инвесторы потеряли миллионы. В LedgerHound мы уже видели этот фильм. Десятки случаев, когда платформы ставят прибыль выше защиты. Но теперь? Регуляторы наконец дают отпор.</p>

      <h2 id="what-happened">Что на самом деле говорит урегулирование Uphold</h2>

      <p>Вот в чём дело. Uphold рекламировал Cred — криптокредитную платформу, обещавшую невероятную доходность, например 10% годовых на депозиты. Cred оказалась схемой Понци. Рухнула в 2020 году. Тысячи инвесторов остались ни с чем. NY AG утверждает, что Uphold не раскрыл существенные риски, включая финансовую нестабильность Cred. И они продолжали рекламировать Cred даже после появления тревожных сигналов.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">$5 млн+</p>
        <p className="text-sm text-slate-600">Сумма урегулирования — более $5 млн — включает компенсацию пострадавшим инвесторам и штрафы. Это одно из крупнейших действий на уровне штата против криптоплатформы за мошенничество третьих лиц.</p>
      </div>

      <p>Но вот в чём загвоздка: Uphold не создавал мошенничество. Они просто его рекламировали. И этого, по мнению NY AG, достаточно. Платформа теперь несёт ответственность за вводящие в заблуждение заявления и упущения относительно легитимности Cred. Огромный сдвиг от защиты «простой посредник», на которую исторически полагались биржи.</p>

      <p>В нашей криминалистической работе мы постоянно видим эту схему. Клиент теряет деньги на платформе вроде Cred, а затем обнаруживает, что биржа, разместившая её, не проводила никакой проверки. Используя наш <Link href={`${base}/scam-checker`} className="text-brand-600 hover:underline">проверятор мошенничества</Link>, мы часто можем проследить средства до кошелька, помеченного месяцами ранее — но биржа даже не удосужилась проверить.</p>

      <h2 id="platform-liability">Ответственность платформ: новая норма для криптобирж</h2>

      <p>Годами криптоплатформы утверждали, что они просто технологические провайдеры, а не финансовые консультанты. Урегулирование Uphold разрушает этот нарратив. Если вы размещаете продукт, вы обязаны его проверить. Рекламируете? Раскрывайте риски. Всё просто.</p>

      <p>И это не только Uphold. В 2025 году SEC предъявила обвинения другой бирже за размещение незарегистрированных ценных бумаг. В 2026 году DOJ заявило, что будет преследовать платформы, способствующие отмыванию денег — даже если они не знали. Тенденция ясна: регуляторы ожидают, что платформы будут привратниками, а не турникетами.</p>

      <h3>Что это значит для инвесторов</h3>

      <p>Если вы инвестировали через платформу, которая рекламировала мошенничество, у вас может быть правовая защита. Урегулирование Uphold создаёт прецедент: платформы могут нести ответственность за вводящий в заблуждение маркетинг. Наша <Link href={`${base}/free-evaluation`} className="text-brand-600 hover:underline">бесплатная оценка</Link> может помочь оценить, подходит ли ваш случай.</p>

      <p>Но не ждите. Срок исковой давности по мошенничеству с ценными бумагами варьируется от штата к штату. В Нью-Йорке обычно шесть лет с момента обнаружения. Если вы потеряли деньги на Cred или подобном, время идёт.</p>

      <h2 id="cred-scam">Мошенничество Cred: пример тревожных сигналов</h2>

      <p>Cred обещал до 10% доходности на криптодепозиты. Такая ставка должна была кричать «слишком хорошо, чтобы быть правдой». Но Uphold рекламировал его как безопасный, регулируемый. Реальность: Cred истекал кровью. Его CEO был обвинён в мошенничестве.</p>

      <p>Это напоминает <a href="https://malaysia.news.yahoo.com/robert-dunlap-sentenced-23-years-153051688.html" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">схему Meta 1 Coin</a>. Роберт Данлэп убедил инвесторов, что у него есть токен, обеспеченный золотом, гарантирующий доходность 224 923%. Он получил 23 года тюрьмы в 2026 году. Оба случая показывают, как мошенники используют легитимные платформы для получения доверия.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">224 923%</p>
        <p className="text-sm text-slate-600">Это «гарантированная» доходность, которую Данлэп обещал инвесторам Meta 1 Coin. Он украл $20 млн у 1000 жертв. Дело Uphold показывает, что платформы, способствующие такой лжи, могут быть привлечены к ответственности.</p>
      </div>

      <p>В наших расследованиях мы рекомендуем использовать <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">Wallet Tracker</Link>, чтобы проверить, не были ли адреса кошельков платформы помечены в прошлых мошенничествах. Простой шаг, который биржи должны делать — но часто не делают.</p>

      <h2 id="due-diligence">Что биржи должны делать сейчас: чек-лист дью-дилидженса</h2>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Чек-лист дью-дилидженса для бирж
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Проверьте регуляторный статус продукта</p>
            <p className="text-sm text-slate-600">Убедитесь, что продукт зарегистрирован в SEC, CFTC или регуляторах штата. В случае Uphold Cred не был зарегистрирован — но Uphold всё равно его разместил.</p>
          <div className="not-prose ml-8 my-3 bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-semibold mb-1">Совет профи</p>
            <p className="text-xs text-slate-600">Используйте базу данных EDGAR SEC для проверки регистраций.</p>
          </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Проверьте команду, стоящую за продуктом</p>
            <p className="text-sm text-slate-600">Изучите прошлое основателей. У мошенников часто есть предыдущие обвинения в мошенничестве или банкротства. Простой поиск в Google может выявить тревожные сигналы.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Мониторьте активность кошельков</p>
            <p className="text-sm text-slate-600">Используйте блокчейн-аналитику, чтобы проверить, не переводят ли кошельки продукта средства на известные мошеннические адреса. Наш <Link href={`${base}/graph-tracer`} className="text-brand-600 hover:underline">Graph Tracer</Link> может помочь визуализировать эти связи.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Чётко раскрывайте все риски</p>
            <p className="text-sm text-slate-600">Не прячьте риски в мелком шрифте. Наглядно указывайте, что инвестиции не застрахованы FDIC и могут обесцениться.</p>
          </div>
        </div>
      </div>

      <p>Если вы инвестор, вы можете привлечь биржи к ответственности, сообщив о них генеральным прокурорам штатов. Действие NY AG доказывает, что регуляторы штатов готовы действовать. Подайте жалобу в офис по защите прав потребителей вашего штата.</p>

      <h2 id="recovery">Как вернуть средства после мошенничества, связанного с платформой</h2>

      <p>Если вы потеряли деньги из-за мошенничества, рекламируемого платформой, первый шаг: сохраните доказательства. Сделайте скриншоты рекламных материалов, записей транзакций, любых сообщений с платформой. Затем подайте заявление в IC3 ФБР и генеральному прокурору вашего штата.</p>

      <p>Далее рассмотрите криминалистическое расследование. Наш <Link href={`${base}/report`} className="text-brand-600 hover:underline">автоматизированный криминалистический отчёт</Link> ($49) отслеживает, куда ушли ваши средства — часто обнаруживая, что они оказались на бирже с KYC. Это неопровержимая улика для судебного иска.</p>

      <p>В некоторых случаях у платформы могут быть сегрегированные средства, которые можно заморозить с помощью <Link href={`${base}/tools/exchange-letter`} className="text-brand-600 hover:underline">Письма о сохранении биржи</Link>. Мы предоставляем бесплатный генератор для этого. Но действуйте быстро — мошенники быстро перемещают деньги.</p>

      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">Нужна помощь в отслеживании ваших средств?</h3>
        <p className="text-brand-100 text-sm mb-5">Наша криминалистическая команда отследила более $10 млн украденной криптовалюты. Начните с бесплатной оценки дела, чтобы узнать, можем ли мы помочь.</p>
        <Link href={`${base}/free-evaluation`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
          Получить бесплатную оценку <ArrowRight size={14} />
        </Link>
      </div>

      <h2 id="regulatory-trends">Регуляторные тенденции: что будет дальше</h2>

      <p>Урегулирование Uphold является частью более широких репрессий. В 2025 году SEC увеличила количество принудительных мер против бирж на 40%. DOJ сформировала новую целевую группу по борьбе с криптомошенничеством. А FinCEN Министерства финансов продвигает более строгое соблюдение Travel Rule.</p>

      <p>Но одни лишь регуляции не остановят мошенничество. Платформам нужен мониторинг в реальном времени. Инструменты, такие как наша <Link href={`${base}/scam-database`} className="text-brand-600 hover:underline">база данных мошенничеств</Link>, позволяют биржам проверять адреса кошельков на предмет известных индикаторов мошенничества. Это open source и бесплатно.</p>

      <p>Для инвесторов урок ясен: не доверяйте платформе только потому, что она крупная. Uphold была известной биржей, но рекламировала мошенничество. Всегда проводите собственное исследование — и если что-то звучит слишком хорошо, чтобы быть правдой, вероятно, так оно и есть.</p>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          Тревожные сигналы, на которые стоит обратить внимание
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Нереалистичная доходность</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Обещания доходности 10%+ в месяц</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Гарантированная прибыль без риска</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Давление с требованием инвестировать быстро</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Отсутствие прозрачности</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Нет чёткой информации о команде</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Нет аудированной финансовой отчётности</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Расплывчатые или вводящие в заблуждение white papers</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Поведение платформы</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Платформа одобряет продукт без оговорок</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Нет предупреждений о рисках</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Сложности с выводом средств</span></li>
          </ul>
        </div>
      </div>
    </>
  );
}

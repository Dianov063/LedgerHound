import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ContentRu({ base }: { base: string }) {
  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">14 апреля 2026 года OFAC нанесла удар: два мексиканских казино — Casino Centenario и Casino Caballo — и три физических лица попали под санкции за отмывание денег для картеля «Норте» (CDN). Это не просто очередная рутинная санкция. Это прозрачное окно в то, как старомодные наличные предприятия теперь служат мостом между физическими наркоденьгами и криптовалютами. Мерзко.</p>
      <p className="text-lg text-slate-700 leading-relaxed">Мы часто видим эту схему в LedgerHound. Картели используют казино не только для отмывания наличных — они конвертируют их в криптовалюты, особенно стейблкоины, а затем мгновенно перемещают эти средства через границы. <a href="https://home.treasury.gov/news/press-releases/sb0440" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Пресс-релиз Минфина</a> подтверждает, что CDN управляет «предприятием по отмыванию денег и контрабанде наличных», охватывающим как традиционные, так и цифровые активы. Вот механика и почему блокчейн-форензика — единственный инструмент, способный проследить след.</p>

      <h2 id="the-casino-crypto-gateway">Шлюз казино-криптовалюта</h2>

      <p>Казино всегда были лучшим другом отмывателей денег. Заходишь с грязной наличкой, покупаешь фишки, немного играешь, выходишь с чеком — или, в современных казино, с выводом криптовалюты. Операция CDN, по данным OFAC, включала массовую контрабанду наличных из США в Мексику с последующим переводом через казино. Но вот поворот: оказавшись внутри системы казино, наличные конвертируются в Tether (USDT) или другие стейблкоины на биржах, сотрудничающих с казино.</p>

      <p>С точки зрения крипто-форензики, критический момент — это «вход» (on-ramp), когда фиат превращается в криптовалюту. Казино, предлагающие крипто-услуги, создают идеальную точку запутывания. В отличие от традиционной биржи, требующей KYC, казино может принять наличные и выдать криптовалюту на кошелек, который выглядит чистым. Наш <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">Wallet Tracker</Link> может выявлять такие кошельки, анализируя паттерны транзакций — высокая частота, круглые суммы депозитов, быстрые кросс-чейн переводы.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">$15B+</p>
        <p className="text-sm text-slate-600">ежегодный объем отмывания денег через казино по всему миру, по данным FATF. Санкционированные казино CDN — лишь часть этого.</p>
      </div>

      <h2 id="ofac-sanctions-and-blockchain-tracing">Санкции OFAC как инструмент трассировки</h2>

      <p>Когда OFAC вводит санкции против такого объекта, как Casino Centenario, это не просто замораживает активы — это создает волновой эффект. Каждое финансовое учреждение, включая криптобиржи, теперь юридически обязано блокировать транзакции, связанные с этим казино. Это означает, что любой USDT, коснувшийся этих казино, теперь «запятнан» и может быть помечен. В нашей работе мы используем списки санкций OFAC как отправную точку: как только мы идентифицируем санкционированный адрес, мы отслеживаем его назад, чтобы найти источник средств.</p>

      <p><a href="https://home.treasury.gov/news/press-releases/sb0440" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Обозначение Минфином</a> CDN как иностранной террористической организации в 2025 году добавляет еще один слой. Согласно Указу 13224, любое лицо или организация, оказывающие поддержку CDN — в том числе через криптовалюты — могут быть подвергнуты санкциям. Это привело к всплеску запросов от жертв скамов «забоя свиней», которые неосознанно отправляли средства на кошельки, позже взаимодействовавшие с санкционированными казино. Наш <Link href={`${base}/scam-checker`} className="text-brand-600 hover:underline">Scam Checker</Link> может сверять адреса кошельков со списком SDN OFAC в реальном времени.</p>

      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">Проверьте, связан ли кошелек с санкционированными объектами</h3>
        <p className="text-brand-100 text-sm mb-5">Используйте наш бесплатный Scam Checker, чтобы узнать, был ли криптоадрес помечен OFAC или замечен в скамах.</p>
        <Link href={`${base}/scam-checker`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
          Выполнить бесплатную проверку <ArrowRight size={14} />
        </Link>
      </div>

      <h2 id="how-cartels-use-casinos-for-crypto-laundering">Как картели используют казино для отмывания криптовалют</h2>

      <h3>Шаг 1: Контрабанда наличных</h3>

      <p>Согласно <a href="https://nypost.com/2026/04/14/us-news/us-sanctions-2-mexican-casinos-over-alleged-ties-to-countrys-northeast-cartel/" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">репортажу New York Post</a>, оперативники CDN контрабандой ввозят крупные суммы наличных из США в Мексику, часто спрятанные в транспортных средствах. Затем наличные попадают в казино, такие как Casino Centenario в Нуэво-Ларедо.</p>

      <h3>Шаг 2: Конвертация в казино</h3>

      <p>Казино принимает наличные и выдает фишки или кредиты. Вместо игры картель может использовать партнера казино по обмену криптовалют, чтобы конвертировать эти кредиты в USDT или Bitcoin. Этот шаг часто происходит через внебиржевые (OTC) стойки, управляемые казино.</p>

      <h3>Шаг 3: Межсетевое запутывание</h3>

      <p>Попав в криптовалюту, средства перемещаются через несколько блокчейнов — от TRC20 к ERC20 и BEP20 — чтобы скрыть след. Наш <Link href={`${base}/graph-tracer`} className="text-brand-600 hover:underline">Graph Tracer</Link> может визуализировать эти межсетевые переходы, но для обнаружения обменов требуется анализ времени. В одном случае мы проследили средства, которые прошли от кошелька, связанного с казино, к DEX, затем к приватному кошельку и, наконец, к KYC-бирже в ЕС.</p>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          Если вы подозреваете отмывание через казино
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Определите адрес казино</p>
            <p className="text-sm text-slate-600">Проверьте, взаимодействовал ли исследуемый кошелек с известными депозитными адресами казино. Используйте наш Scam Checker для поиска объектов, связанных с OFAC.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Отследите межсетевые перемещения</p>
            <p className="text-sm text-slate-600">Используйте наш Graph Tracer для отслеживания средств через сети TRC20, ERC20 и BEP20. Ищите быстрые конвертации, указывающие на преднамеренное запутывание.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">Создайте форензик-отчет</p>
            <p className="text-sm text-slate-600">Наш автоматизированный отчет собирает цепочку хранения и помечает любые санкционированные адреса. Он готов для суда и может быть использован для подачи жалобы.</p>
          </div>
        </div>
      </div>

      <h2 id="why-casinos-are-perfect-for-cartel-crypto">Почему казино идеальны для крипто-картелей</h2>

      <p>Казино предлагают три вещи, необходимые картелям: большой объем наличных, минимальный контроль и доступ к криптовалютам. В отличие от банков, казино во многих юрисдикциях не обязаны сообщать о транзакциях ниже $10 000. И даже когда они подают отчеты о валютных операциях (CTR), эта информация редко ведет к блокчейн-адресам.</p>

      <p><a href="https://www.greenwichtime.com/news/world/article/us-sanctions-2-casinos-and-3-persons-over-alleged-22206577.php" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Статья Greenwich Time</a> отмечает, что санкционированные лица включают менеджеров казино и курьеров наличных. Это говорит о том, что у картеля есть оперативники, внедренные непосредственно в казино. Исходя из нашего опыта, такой инсайдерский доступ позволяет им обходить даже базовые проверки ПОД/ФТ.</p>

      <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} /> Отмывание через казино (традиционное)
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Наличные → Фишки → Наличные (чек)</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Медленное, физическое перемещение</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Требует сговора персонала казино</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Отслеживается через наблюдение</span></li>
          </ul>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2">
            <AlertTriangle size={14} /> Отмывание через казино-криптовалюту
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Наличные → Казино → USDT → Несколько сетей</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Мгновенный глобальный перевод</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Инсайдер + эксплойты смарт-контрактов</span></li>
            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>Отслеживается только с помощью блокчейн-форензики</span></li>
          </ul>
        </div>
      </div>

      <h2 id="what-this-means-for-scam-victims">Что это значит для жертв скамов</h2>

      <p>Если вас обманули и ваши средства попали на кошелек, который позже взаимодействовал с адресом казино, возврат средств сложнее, но не невозможен. Санкции OFAC означают, что любой USDT, удерживаемый этими казино, заморожен на соответствующих биржах, таких как Binance или Kraken. Но картель, вероятно, переместил средства до введения санкций.</p>

      <p>В нашей работе в LedgerHound мы возвращали средства, подавая письма о сохранении активов на биржи, получившие отмытую криптовалюту. Скорость решает всё: <Link href={`${base}/emergency`} className="text-brand-600 hover:underline">Emergency Preservation Pack</Link> отправляет одновременные юридические уведомления на 10 бирж, замораживая средства до их вывода. Мы видели успех, когда жертвы действовали в течение 48 часов.</p>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          Важно: Не рассчитывайте на помощь казино
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Казино — не ваш союзник</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Санкционированные казино не будут сотрудничать с жертвами</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Они могут уничтожить записи, узнав о расследовании</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Ваш лучший вариант — отследить криптовалюту до регулируемой биржи</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">Что делать немедленно</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Задокументируйте каждый хэш транзакции и адрес кошелька</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Проверьте бесплатно на нашем сайте, помечены ли какие-либо адреса</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Свяжитесь с лицензированным адвокатом в вашей юрисдикции</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Используйте наш генератор писем о сохранении активов для заморозки средств на биржах</span></li>
          </ul>
        </div>
      </div>

      <h2 id="the-future-of-cartel-crypto-laundering">Будущее отмывания криптовалют картелями</h2>

      <p>Санкции против казино CDN — предвестник грядущего. По мере того как все больше казино внедряют крипто-услуги, они становятся главными целями для отмывания денег. Регуляторы дают отпор: предложенное FinCEN правило об отчетности казино по криптовалютам, ожидаемое в конце 2026 года, потребует от казино рассматривать крипто-транзакции как операции с наличными.</p>

      <p>Но с точки зрения форензики, блокчейн никогда не лжет. Каждая транзакция записана. Проблема в том, чтобы соединить точки между наличными казино и криптокошельками. Здесь и приходит наш опыт. Мы разработали алгоритмы, которые обнаруживают паттерны транзакций, связанных с казино — например, депозиты круглыми суммами с последующими множественными мелкими выводами, что указывает на расслоение.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">6</p>
        <p className="text-sm text-slate-600">целей, попавших под санкции OFAC в апреле 2026 года: 2 казино и 3 физических лица (плюс одно неназванное лицо). Расследование продолжается.</p>
      </div>

      <p>Если вы стали жертвой скама, который может быть связан с отмыванием через казино, не ждите. Чем дольше вы ждете, тем больше слоев добавляет картель. <Link href={`${base}/free-evaluation`} className="text-brand-600 hover:underline">Получите бесплатную оценку</Link> вашего дела сегодня.</p>
    </>
  );
}

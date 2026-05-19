import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ContentAr({ base }: { base: string }) {
  return (
    <>
      <p className="text-lg text-slate-700 leading-relaxed">29 أبريل 2026. ذلك هو اليوم الذي تغير فيه كل شيء لمنصات العملات المشفرة. أطلق المدعي العام لنيويورك قنبلة: ستدفع Uphold أكثر من 5 ملايين دولار لتضليل المستثمرين والترويج لمخطط احتيالي صممته Cred, LLC ومديرها التنفيذي. هذه ليست مجرد غرامة أخرى. إنها رصاصة تحذير - مباشرة نحو كل بورصة ومزود محفظة ومنصة تداول تدرج منتجات طرف ثالث دون القيام بواجبها.</p>
      <p className="text-lg text-slate-700 leading-relaxed">وجد <a href="https://natlawreview.com/article/new-york-ag-secures-over-5m-crypto-platform-alleged-promotion-fraudulent-investment" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">تحقيق المدعي العام لنيويورك</a> أن Uphold سوقت برنامج Cred ذو العائد المرتفع دون العناية الواجبة المناسبة. خسر المستثمرون الملايين. في LedgerHound، شاهدنا هذا الفيلم من قبل. عشرات القضايا حيث تعطي المنصات الأولوية للربح على الحماية. لكن الآن؟ بدأ المنظمون في الرد أخيرًا.</p>

      <h2 id="what-happened">ما تقوله تسوية Uphold في الواقع</h2>

      <p>إليك الصفقة. روجت Uphold لـ Cred - منصة إقراض للعملات المشفرة تقدم عوائد مذهلة، مثل فائدة 10% على الودائع. تبين أن Cred كانت مخطط بونزي. انهارت في 2020. آلاف المستثمرين تركوا بلا شيء. ادعى المدعي العام لنيويورك أن Uphold فشلت في الكشف عن المخاطر الجوهرية، بما في ذلك عدم الاستقرار المالي لـ Cred. واستمروا في تسويق Cred حتى بعد ظهور علامات الخطر.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">أكثر من 5 ملايين دولار</p>
        <p className="text-sm text-slate-600">مبلغ التسوية - أكثر من 5 ملايين دولار - يشمل تعويضات للمستثمرين المتضررين وغرامات. إنها واحدة من أكبر الإجراءات على مستوى الولاية ضد منصة عملات مشفرة بسبب احتيال طرف ثالث.</p>
      </div>

      <p>لكن إليك المفاجأة: Uphold لم تخلق الاحتيال. لقد روجت له فقط. وهذا، وفقًا للمدعي العام لنيويورك، كافٍ. المنصة الآن مسؤولة عن البيانات المضللة والإغفالات حول شرعية Cred. تحول كبير من دفاع 'الوسيط المجرد' الذي اعتمدت عليه البورصات تاريخيًا.</p>

      <p>في عملنا الجنائي، نرى هذا النمط طوال الوقت. عميل يخسر أموالًا على منصة مثل Cred، ثم يكتشف أن البورصة التي أدرجتها لم تقم بأي فحص. باستخدام <Link href={`${base}/scam-checker`} className="text-brand-600 hover:underline">أداة فحص الاحتيال</Link>، يمكننا غالبًا تتبع الأموال إلى محفظة تم وضع علامة عليها قبل أشهر - لكن البورصة لم تكلف نفسها عناء التحقق.</p>

      <h2 id="platform-liability">مسؤولية المنصة: الوضع الطبيعي الجديد لبورصات العملات المشفرة</h2>

      <p>لسنوات، جادلت منصات العملات المشفرة بأنها مجرد مزودي تكنولوجيا - وليسوا مستشارين ماليين. تسوية Uphold تحطم هذه الرواية. إذا قمت بإدراج منتج، فعليك واجب التحقيق فيه. تسويقه؟ افصح عن المخاطر. بكل بساطة.</p>

      <p>وليس فقط Uphold. في 2025، اتهمت SEC بورصة أخرى بإدراج أوراق مالية غير مسجلة. في 2026، أشارت DOJ إلى أنها ستلاحق المنصات التي تسهل غسل الأموال - حتى لو لم تكن تعلم. الاتجاه واضح: يتوقع المنظمون من المنصات أن تكون بوابات، وليس بوابات دوارة.</p>

      <h3>ما يعنيه هذا للمستثمرين</h3>

      <p>إذا استثمرت من خلال منصة روجت لعملية احتيال، فقد يكون لديك حق قانوني. تسوية Uphold تضع سابقة: يمكن تحميل المنصات المسؤولية عن التسويق المضلل. <Link href={`${base}/free-evaluation`} className="text-brand-600 hover:underline">تقييمنا المجاني</Link> يمكن أن يساعدك في تقييم ما إذا كانت قضيتك مناسبة.</p>

      <p>لكن لا تنتظر. يختلف قانون التقادم لاحتيال الأوراق المالية حسب الولاية. في نيويورك، عادة ما يكون ست سنوات من تاريخ الاكتشاف. إذا خسرت أموالًا على Cred أو شيء مشابه، فالوقت ينفد.</p>

      <h2 id="cred-scam">احتيال Cred: دراسة حالة في العلامات الحمراء</h2>

      <p>وعدت Cred بعوائد تصل إلى 10% على ودائع العملات المشفرة. كان يجب أن يصرخ هذا المعدل بأنه 'جيد جدًا ليكون حقيقيًا'. لكن Uphold سوقته على أنه آمن ومنظم. حقيقة الأمر: Cred كانت تنزف أموالًا. تم اتهام مديرها التنفيذي بالاحتيال.</p>

      <p>هذا يعكس <a href="https://malaysia.news.yahoo.com/robert-dunlap-sentenced-23-years-153051688.html" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">احتيال Meta 1 Coin</a>. أقنع Robert Dunlap المستثمرين بأن لديه رمزًا مدعومًا بالذهب يضمن عوائد بنسبة 224,923%. حصل على 23 عامًا في السجن في 2026. تظهر كلتا الحالتين كيف يستخدم المحتالون المنصات الشرعية لاكتساب المصداقية.</p>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">224,923%</p>
        <p className="text-sm text-slate-600">هذا هو العائد 'المضمون' الذي وعد به Dunlap مستثمري Meta 1 Coin. سرق 20 مليون دولار من 1000 ضحية. تظهر قضية Uphold أن المنصات التي تمكن مثل هذه الأكاذيب يمكن محاسبتها.</p>
      </div>

      <p>في تحقيقاتنا، نوصي باستخدام <Link href={`${base}/wallet-tracker`} className="text-brand-600 hover:underline">متتبع المحفظة</Link> للتحقق مما إذا كانت عناوين محفظة المنصة قد تم وضع علامة عليها في عمليات احتيال سابقة. خطوة بسيطة يجب أن تقوم بها البورصات - لكنها غالبًا لا تفعل.</p>

      <h2 id="due-diligence">ما يجب على البورصات فعله الآن: قائمة العناية الواجبة</h2>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          قائمة العناية الواجبة للبورصة
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">تحقق من الوضع التنظيمي للمنتج</p>
            <p className="text-sm text-slate-600">تحقق مما إذا كان المنتج مسجلاً لدى SEC أو CFTC أو منظمي الولاية. في قضية Uphold، لم تكن Cred مسجلة - ومع ذلك أدرجتها Uphold على أي حال.</p>
          <div className="not-prose ml-8 my-3 bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-semibold mb-1">نصيحة احترافية</p>
            <p className="text-xs text-slate-600">استخدم قاعدة بيانات EDGAR التابعة لـ SEC للتحقق من الإيداعات.</p>
          </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">تدقيق الفريق وراء المنتج</p>
            <p className="text-sm text-slate-600">ابحث في خلفيات المؤسسين. غالبًا ما يكون لدى المحتالين ادعاءات احتيال سابقة أو إفلاسات. بحث بسيط في Google يمكن أن يكشف عن علامات حمراء.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">مراقبة نشاط المحفظة</p>
            <p className="text-sm text-slate-600">استخدم تحليلات blockchain للتحقق مما إذا كانت محافظ المنتج تنقل الأموال إلى عناوين احتيال معروفة. يمكن أن يساعد <Link href={`${base}/graph-tracer`} className="text-brand-600 hover:underline">متعقب الرسم البياني</Link> في تصور هذه الاتصالات.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">الكشف عن جميع المخاطر بوضوح</p>
            <p className="text-sm text-slate-600">لا تدفن المخاطر في الخط الدقيق. اعرض بشكل بارز أن الاستثمارات غير مؤمنة من قبل FDIC وقد تفقد قيمتها.</p>
          </div>
        </div>
      </div>

      <p>إذا كنت مستثمرًا، يمكنك محاسبة البورصات عن طريق الإبلاغ عنها إلى المدعين العامين للولايات. إجراء المدعي العام لنيويورك يثبت أن المنظمين على مستوى الولاية على استعداد للتحرك. قدم شكوى إلى مكتب حماية المستهلك في ولايتك.</p>

      <h2 id="recovery">كيفية استرداد الأموال بعد احتيال مرتبط بمنصة</h2>

      <p>إذا خسرت أموالًا في عملية احتيال روجت لها منصة، الخطوة الأولى: احتفظ بالأدلة. التقط لقطات شاشة للمواد التسويقية وسجلات المعاملات وأي اتصالات مع المنصة. ثم قدم تقريرًا إلى IC3 التابع لـ FBI والمدعي العام لولايتك.</p>

      <p>بعد ذلك، فكر في تحقيق جنائي. <Link href={`${base}/report`} className="text-brand-600 hover:underline">تقريرنا الجنائي الآلي</Link> (49 دولارًا) يتتبع أين ذهبت أموالك - غالبًا ما يكشف أنها انتهت في بورصة KYC. هذا هو الدليل القاطع لدعوى قضائية.</p>

      <p>في بعض الحالات، قد يكون لدى المنصة أموال منفصلة يمكن تجميدها عبر <Link href={`${base}/tools/exchange-letter`} className="text-brand-600 hover:underline">خطاب الحفاظ على البورصة</Link>. نقدم مولدًا مجانيًا لذلك. لكن تصرف بسرعة - المحتالون ينقلون الأموال بسرعة.</p>

      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">هل تحتاج مساعدة في تتبع أموالك؟</h3>
        <p className="text-brand-100 text-sm mb-5">قام فريقنا الجنائي بتتبع أكثر من 10 ملايين دولار من العملات المشفرة المسروقة. ابدأ بتقييم حالة مجاني لمعرفة ما إذا كان بإمكاننا المساعدة.</p>
        <Link href={`${base}/free-evaluation`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
          احصل على تقييم مجاني <ArrowRight size={14} />
        </Link>
      </div>

      <h2 id="regulatory-trends">الاتجاهات التنظيمية: ما هو قادم</h2>

      <p>تسوية Uphold هي جزء من حملة أوسع. في 2025، زادت SEC من إجراءات الإنفاذ ضد البورصات بنسبة 40%. شكلت DOJ فرقة عمل جديدة تركز على احتيال العملات المشفرة. وتدفع FinCEN التابعة لوزارة الخزانة نحو الامتثال الأكثر صرامة لقاعدة السفر.</p>

      <p>لكن التنظيم وحده لن يوقف الاحتيال. تحتاج المنصات إلى مراقبة في الوقت الفعلي. أدوات مثل <Link href={`${base}/scam-database`} className="text-brand-600 hover:underline">قاعدة بيانات الاحتيال</Link> تسمح للبورصات بالتحقق من عناوين المحافظ مقابل مؤشرات الاحتيال المعروفة. إنها مفتوحة المصدر ومجانية.</p>

      <p>بالنسبة للمستثمرين، الدرس واضح: لا تثق في منصة لمجرد أنها كبيرة. كانت Uphold بورصة معروفة، ومع ذلك روجت لعملية احتيال. قم دائمًا ببحثك الخاص - وإذا كان شيء يبدو جيدًا جدًا ليكون حقيقيًا، فمن المحتمل أنه كذلك.</p>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          علامات حمراء يجب الانتباه إليها
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">عوائد غير واقعية</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>وعود بعوائد شهرية تزيد عن 10%</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>أرباح مضمونة بدون مخاطر</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>ضغط للاستثمار بسرعة</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">نقص الشفافية</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>لا توجد معلومات واضحة عن الفريق</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>لا توجد بيانات مالية مدققة</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>أوراق بيضاء غامضة أو مضللة</span></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">سلوك المنصة</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>المنصة تؤيد المنتج بدون إخلاء مسؤولية</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>لا توجد تحذيرات بشأن المخاطر</span></li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>صعوبة في سحب الأموال</span></li>
          </ul>
        </div>
      </div>
    </>
  );
}

import Link from 'next/link';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ContentAr({ base }: { base: string }) {
  return (
    <>
      {/* Intro */}
      <p className="text-lg text-slate-700 leading-relaxed">
        تعرّفت على شخص عبر الإنترنت قبل بضعة أشهر. ربما على لينكد إن، أو إنستغرام، أو أحد تطبيقات المواعدة. كان ودوداً ومثيراً للاهتمام ولم يكن مُلحّاً أبداً. على مدى أسابيع، بنيتَ علاقة حقيقية — رسائل يومية، مكالمات هاتفية، وربما حتى محادثات فيديو.
      </p>
      <p>
        ثم ذات يوم، وبشكل عرضي تقريباً، ذكر أنه يحقق أرباحاً كبيرة من تداول العملات المشفرة. أراك حسابه. كانت الأرقام مذهلة. عرض عليك المساعدة للبدء.
      </p>
      <p>
        استثمرت مبلغاً صغيراً. ونجح الأمر. استثمرت المزيد. واستمر في النجاح. ثم حاولت السحب — وتوقف كل شيء.
      </p>
      <p>
        إذا بدا هذا مألوفاً لك، فقد تكون ضحية لـ<strong>احتيال ذبح الخنزير</strong> (Pig Butchering) — وهو الشكل الأكثر تدميراً مالياً من أشكال الاحتيال بالعملات المشفرة في العالم اليوم.
      </p>

      {/* Section 1 */}
      <h2 id="what-is">ما هو احتيال ذبح الخنزير؟</h2>
      <p>
        يأتي المصطلح من العبارة الصينية <em>shā zhū pán</em> (杀猪盘) — والتي تعني حرفياً &quot;طبق ذبح الخنزير&quot;. يعكس الاسم الاستراتيجية: يقوم المحتالون بـ&quot;تسمين&quot; الضحايا بأرباح صغيرة مبكرة واستثمار عاطفي قبل &quot;الذبح&quot; النهائي — وهو سرقة كل ما تم إيداعه.
      </p>
      <p>
        هذه ليست عمليات احتيال سريعة وانتهازية. إنها عمليات ثقة طويلة الأمد، تستمر غالباً لأسابيع أو أشهر، تديرها شبكات إجرامية منظمة تتمركز بشكل رئيسي في جنوب شرق آسيا.
      </p>

      {/* Pull quote */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">9.3 مليار دولار</p>
        <p className="text-sm text-slate-600">
          في الخسائر المُبلّغ عنها من شكاوى متعلقة بالعملات المشفرة لدى مركز شكاوى جرائم الإنترنت التابع لمكتب التحقيقات الفيدرالي (IC3) في عام 2024 — بزيادة 66% عن العام السابق. شكّل الاحتيال الاستثماري 5.8 مليار دولار من هذا الإجمالي.
        </p>
      </div>

      <p>
        وفقاً لتقرير جرائم العملات المشفرة لعام 2026 الصادر عن TRM، تم إرسال ما يقارب 35 مليار دولار إلى مخططات احتيالية في عام 2025، حيث شكّلت عمليات احتيال ذبح الخنزير حصة كبيرة منها.
      </p>

      {/* Section 2 */}
      <h2 id="how-it-works">كيف تعمل عمليات احتيال ذبح الخنزير: الخطة الكاملة</h2>

      <h3>المرحلة الأولى: التمهيد (الأسابيع 1–4)</h3>
      <p>
        يبدأ التواصل بشكل بريء. رسالة على واتساب من رقم خاطئ. طلب تواصل جديد على لينكد إن. تطابق على تطبيق مواعدة. يقدّم المحتال — الذي يعمل غالباً من مجمع للعمل القسري في كمبوديا أو ميانمار أو لاوس — نفسه كمحترف ناجح، عادةً آسيوي-أمريكي، وغالباً جذاب، ودائماً ساحر.
      </p>
      <p>
        لا يوجد أي ذكر للمال أو الاستثمار في هذه المرحلة. الهدف ببساطة هو بناء علاقة. رسائل صباح الخير اليومية. مشاركة الوجبات عبر الفيديو. الحديث عن العائلة والأحلام والمستقبل.
      </p>

      <h3>المرحلة الثانية: التقديم (الأسابيع 4–8)</h3>
      <p>
        بعد ترسيخ الثقة، يذكر المحتال &quot;بالصدفة&quot; نجاحه الاستثماري. يتردد في الحديث عنه — لا يريد أن يبدو متفاخراً. لكنك تسأل. يشرح أن عمّه يعمل في شركة عملات مشفرة وعلّمه طريقة تداول خاصة.
      </p>
      <p>
        يعرض عليك أن يريك — فقط للمساعدة، وليس لأي مكسب. يرشدك لإنشاء حساب على منصة لم تسمع بها من قبل. تبدو المنصة احترافية تماماً: رسوم بيانية في الوقت الفعلي، دعم عملاء عبر الدردشة، تطبيق جوال أنيق.
      </p>
      <p>
        تودع مبلغاً صغيراً. تشاهده ينمو. تسحب قليلاً — وينجح الأمر فوراً. أصبحت مقتنعاً.
      </p>

      <h3>المرحلة الثالثة: التسمين (الأسابيع 8–20)</h3>
      <p>
        الآن تزداد مبالغ الاستثمار. يشجعك المحتال على إيداع المزيد — &quot;السوق يتحرك، هذه فرصة لا تأتي إلا مرة في السنة.&quot; يودع أمواله بجانب أموالك (مزيفة بالطبع — كل شيء على منصة احتيالية يتحكمون فيها).
      </p>
      <p>
        يُظهر حسابك عوائد استثنائية. مكاسب بنسبة 30%، 50%، 100%. تشارك لقطات الشاشة مع الأصدقاء. تشعر أنك وجدت أخيراً الحرية المالية.
      </p>

      {/* Pull quote */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">زيادة بنسبة 253%</p>
        <p className="text-sm text-slate-600">
          في متوسط حجم المدفوعات الاحتيالية من 2024 إلى 2025 — حيث ارتفع من 782 دولاراً إلى 2,764 دولاراً لكل معاملة مع استمرار المحتالين في التكيّف والابتكار.
        </p>
      </div>

      <h3>المرحلة الرابعة: الذبح</h3>
      <p>
        عندما تحاول سحب مبلغ كبير، يحدث خطأ ما. هناك &quot;حجز ضريبي.&quot; أو &quot;رسوم تحقق.&quot; أو &quot;إيداع امتثال&quot; تتطلبه اللوائح. يُقال لك أنك بحاجة لإيداع المزيد من المال لفتح أموالك.
      </p>
      <p>
        يدفع بعض الضحايا هذه الرسوم — أحياناً عدة مرات — قبل أن يدركوا أن المنصة احتيالية. بحلول الوقت الذي يختفي فيه المحتال، غالباً ما تصل الخسائر إلى ستة أرقام.
      </p>
      <p>
        تشير مصلحة الضرائب الأمريكية (IRS) إلى أن الخسائر غالباً ما تصل إلى مئات الآلاف من الدولارات، حيث يخسر بعض الضحايا ما يصل إلى 2 مليون دولار.
      </p>

      {/* Section 3 */}
      <h2 id="who-are-scammers">من هم المحتالون؟</h2>
      <p>
        هذا ليس مجرماً وحيداً في قبو. احتيال ذبح الخنزير عملية صناعية.
      </p>

      {/* Pull quote */}
      <div className="not-prose my-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">أكثر من 200,000 شخص</p>
        <p className="text-sm text-slate-600">
          تقدّر الأمم المتحدة أنهم محتجزون في مجمعات احتيال عبر جنوب شرق آسيا — كثير منهم ضحايا اتجار بالبشر، مُجبرون على ارتكاب الاحتيال تحت تهديد العنف.
        </p>
      </div>

      <p>
        الأشخاص الذين يراسلونك قد يكونون هم أنفسهم ضحايا — مختطفين أو متاجَر بهم ومُجبرين على تنفيذ هذه الاحتيالات تحت تهديد الأذى الجسدي. المستفيدون الحقيقيون هم الشبكات الإجرامية المنظمة التي تدير هذه المجمعات.
      </p>
      <p>
        حددت Chainalysis روابط مستمرة بين عمليات احتيال العملات المشفرة والعمليات المتمركزة في شرق وجنوب شرق آسيا، مع تزايد دمج الذكاء الاصطناعي في عمليات الاحتيال — بما في ذلك أصوات التزييف العميق المولّدة بالذكاء الاصطناعي وأدوات الهندسة الاجتماعية المتطورة.
      </p>

      {/* Section 4 - Warning signs (yellow box) */}
      <h2 id="warning-signs">علامات التحذير من احتيال ذبح الخنزير</h2>

      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          إشارات خطر يجب الانتباه لها
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">كيفية إجراء الاتصال:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> رسالة غير مرغوبة من رقم مجهول (&quot;رقم خاطئ&quot; يصل إليك بالصدفة)</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> شخص غريب جذاب بشكل مريب يتواصل معك على لينكد إن أو تطبيق مواعدة</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> التواصل يتصاعد بسرعة إلى رسائل يومية وحميمية عاطفية</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">عرض الاستثمار:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> يذكرون أرباح العملات المشفرة بشكل عرضي، وليس كعرض بيع</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> يعرضون &quot;مساعدتك&quot; — وليس بيعك أي شيء</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> المنصة التي يوصون بها لم تسمع بها من قبل</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> عمليات السحب الصغيرة المبكرة تنجح بشكل مثالي (بالتصميم)</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">إشارات خطر على المنصة:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> لا يمكن العثور عليها في متاجر التطبيقات — تتطلب التحميل من رابط</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> دعم العملاء عبر الدردشة فقط، وليس عبر الهاتف أبداً</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> السحب يتطلب إيداعات إضافية (&quot;ضريبة&quot;، &quot;رسوم امتثال&quot;)</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> الأرباح تبدو مستحيلة الارتفاع دون أي توضيح للمخاطر</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">العلاقة:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> يرفضون مكالمات الفيديو أو يستخدمون فيديو مسجّل مسبقاً (تزييف عميق)</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> يتجنبون اللقاء الشخصي رغم الارتباط العاطفي القوي</li>
            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /> يصبحون مُلحّين عندما تتردد في استثمار المزيد</li>
          </ul>
        </div>
      </div>

      {/* Section 5 - What to do (green box) */}
      <h2 id="what-to-do">ماذا تفعل إذا تعرّضت للاحتيال</h2>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          خطوات العمل للضحايا
        </div>

        <div className="space-y-5">
          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
              أوقف جميع التحويلات فوراً
            </p>
            <p className="text-sm text-slate-600 ml-8">لا ترسل أي أموال إضافية، بغض النظر عما يُقال لك. أي &quot;رسوم لفتح الأموال&quot; هي طبقة أخرى من الاحتيال. لا توجد رسوم مشروعة تتطلب من الضحايا إيداع المزيد من العملات المشفرة.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
              احفظ جميع الأدلة
            </p>
            <p className="text-sm text-slate-600 ml-8">التقط صوراً لكل شيء قبل اختفاء المحتال: جميع محادثات الدردشة (واتساب، تيليغرام، ويتشات، لاين)، رابط المنصة الاحتيالية ولقطات شاشة لحسابك، جميع سجلات المعاملات وعناوين المحافظ، صور الملف الشخصي للمحتال ومعلومات الاتصال.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
              أبلغ السلطات
            </p>
            <div className="text-sm text-slate-600 ml-8 space-y-1">
              <p><strong>مركز شكاوى جرائم الإنترنت FBI IC3:</strong> ic3.gov — قدّم شكوى مفصّلة بجميع معلومات المعاملات</p>
              <p><strong>لجنة التجارة الفيدرالية FTC:</strong> reportfraud.ftc.gov</p>
              <p><strong>مكتب المدعي العام في ولايتك</strong></p>
            </div>
          </div>

          <div className="not-prose ml-8 my-4 bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-semibold mb-1">عملية FBI Operation Level Up</p>
            <p className="text-xs text-slate-600">أخطرت أكثر من 8,103 ضحية لاحتيال الاستثمار في العملات المشفرة، حيث كان 77% منهم غير مدركين أنهم يتعرضون للاحتيال. الوفورات المقدّرة: أكثر من 511 مليون دولار من التدخل المبكر.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">4</span>
              احصل على تحقيق جنائي في البلوكتشين
            </p>
            <div className="text-sm text-slate-600 ml-8 space-y-2">
              <p>هنا يُحدث الاستعانة بالمتخصصين فرقاً حقيقياً. كل معاملة عملات مشفرة مسجّلة بشكل دائم على البلوكتشين — بما فيها معاملاتك. يمكن لمحقق معتمد:</p>
              <ul className="space-y-1">
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> تتبع المكان الدقيق الذي ذهبت إليه أموالك بعد إرسالها</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> تحديد المنصات التي استقبلت العملات المشفرة المسروقة</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> إعداد تقرير جنائي جاهز للمحكمة يوثّق تدفق الأموال الكامل</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> تحديد أهداف الاستدعاء القضائي (المنصات الملتزمة بمعايير اعرف عميلك KYC)</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> دعم جهات إنفاذ القانون ومحاميك بمعلومات استخباراتية قابلة للتنفيذ</li>
              </ul>
              <p className="font-semibold text-slate-700 mt-2">كلما تم ذلك أسرع، كان أفضل. الأموال التي تصل إلى منصة تداول يمكن تجميدها — ولكن فقط إذا تم تحديدها والإبلاغ عنها بسرعة.</p>
            </div>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">5</span>
              استشر محامياً
            </p>
            <div className="text-sm text-slate-600 ml-8 space-y-1">
              <p>يمكن لمحامٍ متخصص في احتيال العملات المشفرة:</p>
              <p>• تقديم أوامر تجميد طارئة ضد المنصات المحددة</p>
              <p>• متابعة إجراءات المصادرة المدنية ضد الأموال المحجوزة</p>
              <p>• ربطك بإجراءات المصادرة ذات الصلة لدى وزارة العدل إن أمكن</p>
            </div>
          </div>
        </div>
      </div>

      <p>
        في إحدى القضايا البارزة، رفع مكتب المدعي العام الأمريكي في ماساتشوستس دعوى مصادرة مدنية لاسترداد ما يقارب 2.3 مليون دولار من العملات المشفرة التي تم تتبعها إلى مخطط احتيال ذبح الخنزير يستهدف أحد السكان المحليين.
      </p>

      {/* Mid-article CTA */}
      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">هل تعتقد أنك تعرّضت لعملية احتيال بالعملات المشفرة؟</h3>
        <p className="text-brand-100 text-sm mb-5">احصل على تقييم مجاني وسري لقضيتك من محققين معتمدين في البلوكتشين.</p>
        <Link
          href={`${base}/free-evaluation`}
          className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm"
        >
          احصل على تقييم مجاني <span className="rotate-180 inline-block">&#8594;</span>
        </Link>
      </div>

      {/* Section 6 */}
      <h2 id="recovery">هل يمكنك استرداد أموالك؟</h2>
      <p>
        هذا هو السؤال الذي يطرحه كل ضحية. الإجابة الصادقة: يعتمد الأمر على عدة عوامل.
      </p>

      <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2"><CheckCircle2 size={14} /> عوامل تزيد فرص الاسترداد</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>• الإبلاغ بسرعة (خلال أيام أو أسابيع)</li>
            <li>• امتلاك عناوين المحافظ وهاشات المعاملات</li>
            <li>• وصول الأموال إلى منصة ملتزمة بمعايير اعرف عميلك (KYC)</li>
            <li>• إجراء تحقيق جنائي وقانوني منسّق</li>
          </ul>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2"><AlertTriangle size={14} /> عوامل تقلّل فرص الاسترداد</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>• مرور الأموال عبر خلّاط أو عملة خصوصية</li>
            <li>• مرور وقت طويل منذ السرقة</li>
            <li>• انتقال الأموال إلى منصات غير منظّمة</li>
            <li>• عدم وجود توثيق للمعاملات</li>
          </ul>
        </div>
      </div>

      <p>
        حتى عندما لا يكون الاسترداد الكامل ممكناً، يوفّر التحقيق الجنائي توثيقاً لأغراض ضريبية (خصومات خسائر السرقة)، وأدلة لإجراءات إنفاذ القانون الجنائية، ومساهمة في صناديق المصادرة لدى وزارة العدل التي توزّع على الضحايا.
      </p>

      {/* Section 7 */}
      <h2 id="law-enforcement">أجهزة إنفاذ القانون تتحسّن في هذا المجال</h2>

      <div className="not-prose my-8 bg-slate-50 border-l-4 border-indigo-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">أكثر من 400 مليون دولار</p>
        <p className="text-sm text-slate-600">
          من العملات المشفرة صادرتها فرقة مكافحة مراكز الاحتيال التابعة لوزارة العدل الأمريكية، التي تأسست في نوفمبر 2025، والمتخصصة في التحقيق ومحاكمة عمليات مراكز الاحتيال في جنوب شرق آسيا.
        </p>
      </div>

      <p>
        صادرت وزارة العدل 61 مليون دولار من عملة USDT مرتبطة باحتيالات ذبح الخنزير في نورث كارولينا — مما يُظهر أنه رغم محاولات غسل الأموال عبر المحافظ والبلوكتشينات المتعددة، يمكن للمحققين تتبع المعاملات وتحديد محافظ التجميع التي تحتوي على أموال الضحايا.
      </p>
      <p>
        الأدوات المتاحة للمحققين — والتعاون بين شركات تحليل البلوكتشين وأجهزة إنفاذ القانون — تتحسّن بسرعة. الضحايا الذين يوثّقون ويبلّغون عن حالاتهم بشكل صحيح يساهمون في إجراءات إنفاذ أكبر تفيد مجتمع الضحايا بأكمله.
      </p>

      {/* Section 8 */}
      <h2 id="getting-help">الحصول على المساعدة</h2>
      <p>
        إذا تأثرت أنت أو شخص تعرفه باحتيال ذبح الخنزير، فلا تنتظر. يصبح تتبع مسار البلوكتشين أصعب مع مرور الوقت، ولدى المنصات نوافذ محدودة للتجميد الطارئ.
      </p>

      <p>
        تقدّم <strong>LedgerHound</strong> تحقيقات جنائية معتمدة في البلوكتشين لضحايا الاحتيال بالعملات المشفرة. فريقنا:
      </p>
      <ul>
        <li>يتتبع الأموال المسروقة عبر جميع سلاسل البلوكتشين الرئيسية</li>
        <li>يحدد المنصات والجهات التي استقبلت أموالك</li>
        <li>يقدّم تقارير جنائية جاهزة للمحكمة للمحامين وأجهزة إنفاذ القانون</li>
        <li>يعمل مع العملاء الناطقين بالروسية مباشرةً — دون الحاجة لمترجمين</li>
        <li>يقدّم تقييماً مجانياً وسرياً للقضية خلال 24 ساعة</li>
      </ul>
    </>
  );
}

import Link from 'next/link';
import { CheckCircle2, Shield, ArrowRight } from 'lucide-react';

export default function ContentAr({ base }: { base: string }) {
  return (
    <>
      {/* المقدمة */}
      <p className="text-lg text-slate-700 leading-relaxed">
        أرسلت عملات مشفرة إلى ما اعتقدت أنه منصة استثمار أو بورصة أو جهة اتصال موثوقة — والآن اختفت أموالك. سؤالك الأول على الأرجح: <em>هل يمكن تتبع العملات المشفرة أصلاً؟</em>
      </p>
      <p>
        الجواب، في معظم الحالات، هو نعم.
      </p>
      <p>
        على الرغم من الاعتقاد الشائع بأن العملات المشفرة مجهولة الهوية ولا يمكن تتبعها، فإن العكس هو الصحيح بالنسبة لمعظم سلاسل الكتل الرئيسية. كل معاملة بيتكوين، وكل تحويل إيثريوم، وكل حركة USDT — كلها مسجلة بشكل دائم في سجل عام يمكن لأي شخص في العالم قراءته، بما في ذلك المحققون.
      </p>
      <p>
        يشرح هذا الدليل بالتفصيل كيف يعمل تتبع العملات المشفرة، وما يفعله المحققون خطوة بخطوة، وما يمكنك فعله الآن لزيادة فرص استرداد أموالك.
      </p>

      {/* القسم 1 */}
      <h2 id="blockchain-transparency">الحقيقة الجوهرية حول شفافية البلوكتشين</h2>
      <p>
        البيتكوين ومعظم العملات المشفرة الرئيسية هي <strong>ذات أسماء مستعارة وليست مجهولة الهوية</strong>. هذا فرق جوهري.
      </p>
      <p>
        عنوان محفظتك لا يحتوي على اسمك. لكن كل معاملة تقوم بها — إلى من، وكم المبلغ، ومتى — مسجلة بشكل دائم على بلوكتشين عام لا يمكن تعديله أو حذفه.
      </p>

      {/* اقتباس بارز */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">أسماء مستعارة، وليست مجهولة</p>
        <p className="text-sm text-slate-600">
          على الرغم من التصورات المبكرة حول إخفاء الهوية، يمكن تتبع معظم معاملات العملات المشفرة باستخدام تحليلات البلوكتشين. كل عملية نقل قيمة مسجلة بشكل دائم على سجلات عامة مثل بيتكوين أو إيثريوم.
        </p>
      </div>

      <p>
        أحدثت هذه الشفافية الجذرية ثورة في التحقيقات المالية. التحدي ليس في إمكانية رؤية المعاملات — بل في تفسير ما تعنيه تلك المعاملات، وربط العناوين المستعارة بهويات حقيقية في العالم الواقعي.
      </p>

      {/* القسم 2 */}
      <h2 id="whats-visible">المعلومات المرئية على البلوكتشين</h2>
      <p>
        عند إرسال عملات مشفرة، يتم تسجيل المعلومات التالية بشكل دائم:
      </p>

      {/* صندوق المعلومات */}
      <div className="not-prose my-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-blue-700 font-display font-bold text-lg">
          <Shield size={20} />
          ما يسجله البلوكتشين
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">مرئي دائماً:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> عنوان محفظة المرسل</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> عنوان محفظة المستلم</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> المبلغ المحوّل</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> التاريخ والوقت (الطابع الزمني الدقيق للكتلة)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> رقم تعريف المعاملة (معرّف فريد)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" /> رسوم الشبكة المدفوعة</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">قابلة للاسترداد أحياناً:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> عنوان IP الخاص بالمرسل (يتم التقاطه بواسطة عُقد الشبكة وقت البث)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> بيانات الموقع الجغرافي (من عنوان IP)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" /> الارتباط بعناوين أخرى يتحكم فيها نفس الشخص</li>
          </ul>
        </div>
      </div>

      <p>
        هذا يعني أنه من عنوان محفظة واحد أو رقم تعريف معاملة واحد، يمكن للمحقق إعادة بناء السجل الكامل لمصدر الأموال ووجهتها.
      </p>

      {/* القسم 3 */}
      <h2 id="how-tracing-works">خطوة بخطوة: كيف يعمل تتبع العملات المشفرة فعلياً</h2>

      <h3>الخطوة 1: الاستقبال — جمع الأدلة الأولية</h3>
      <p>
        يبدأ كل تحقيق بما يمكن للضحية تقديمه:
      </p>
      <ul>
        <li><strong>رقم تعريف المعاملة</strong> — المعرّف الفريد لدفعتك (يبدو مثل <code>0x7f3a...</code>)</li>
        <li><strong>عنوان المحفظة</strong> — العنوان الذي أرسلت إليه الأموال</li>
        <li><strong>اسم المنصة</strong> — الموقع أو التطبيق الاحتيالي</li>
        <li><strong>التواريخ والمبالغ</strong> — متى تم كل تحويل</li>
        <li><strong>لقطات الشاشة</strong> — من المنصة والمحادثات وحسابك</li>
      </ul>
      <p>
        حتى لو كان لديك واحد فقط من هذه العناصر، يمكن بدء التتبع عادةً. في معظم الحالات، يكفي عنوان محفظة واحد أو رقم تعريف معاملة واحد للبدء.
      </p>

      <h3>الخطوة 2: رسم خريطة المعاملات</h3>
      <p>
        يقوم المحقق بتحميل العنوان الأولي في منصة استخبارات البلوكتشين (Chainalysis Reactor أو TRM Labs أو Elliptic أو ما شابه) ويبدأ برسم خريطة لكل معاملة مرتبطة بذلك العنوان.
      </p>

      {/* اقتباس بارز */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-brand-600 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">رسم خرائط تدفق الأموال البصرية</p>
        <p className="text-sm text-slate-600">
          يتم تحويل بيانات المعاملات إلى خرائط بصرية ومخططات انسيابية، تُظهر تفاعلات الجهة المعنية مع البورصات المعروفة والكيانات الأخرى، وتتبع التحويلات المالية إلى نقاطها النهائية. يُسهّل الرسم البصري التعرف على الأنماط كالطبقات وسلاسل التقشير المستخدمة عادةً في غسل الأموال.
        </p>
      </div>

      <p>
        ينتج عن ذلك رسم بياني مرئي — تماماً مثل أداة Graph Tracer المجانية لدينا — يُظهر تدفق الأموال عبر محافظ متعددة.
      </p>

      <h3>الخطوة 3: تحليل المجموعات</h3>
      <p>
        نادراً ما يكون عنوان واحد هو الصورة الكاملة. يستخدم المجرمون محافظ متعددة لإخفاء الأثر. يقوم تحليل المجموعات بتجميع العناوين التي يُرجّح أنها تحت سيطرة نفس الشخص.
      </p>
      <p>
        المجموعة هي مجموعة من عناوين العملات المشفرة التي يتحكم فيها نفس الشخص أو الكيان. توسيع نطاق التحقيق من عنوان واحد إلى مجموعة أكبر يمكن أن يزيد بشكل كبير من حجم الأدلة المتاحة لكشف الهوية وتتبع الأصول.
      </p>
      <p>
        تشمل تقنيات التجميع الشائعة:
      </p>
      <ul>
        <li><strong>تحليل الإنفاق المشترك</strong> — عناوين متعددة مستخدمة في نفس المعاملة</li>
        <li><strong>إعادة استخدام العنوان</strong> — نفس العنوان يُستخدم بشكل متكرر</li>
        <li><strong>تحليل التوقيت</strong> — معاملات تحدث وفق أنماط معينة</li>
      </ul>

      <h3>الخطوة 4: تحديد البورصة — الاختراق الحاسم</h3>
      <p>
        هنا تصبح التحقيقات قابلة للتنفيذ. عندما تصل الأموال المسروقة إلى <strong>بورصة ملتزمة بمتطلبات اعرف عميلك (KYC)</strong> (مثل Coinbase أو Binance أو Kraken أو OKX وغيرها)، تكون البورصة ملزمة قانونياً بالاحتفاظ بوثائق التحقق من هوية صاحب الحساب.
      </p>

      {/* اقتباس بارز */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">بوابة أوامر الاستدعاء القضائي</p>
        <p className="text-sm text-slate-600">
          تحدد أدوات استخبارات البلوكتشين المعاملات مع البورصات مثل Coinbase وBinance. تطلب أوامر الاستدعاء القضائي من الكيانات الملتزمة بقوانين اعرف عميلك ومكافحة غسل الأموال تقديم وثائق هوية مالك البيتكوين — محوّلةً العناوين المستعارة إلى هويات حقيقية.
        </p>
      </div>

      <p>
        بمجرد أن يحدد المحققون البورصة التي استقبلت الأموال، يمكن للمحامي تقديم أمر استدعاء قضائي — يُلزم البورصة بالكشف عن اسم صاحب الحساب وعنوانه ووثائق هويته ومعلوماته المصرفية.
      </p>

      <h3>الخطوة 5: تحليل الإسناد</h3>
      <p>
        تحتفظ منصات استخبارات البلوكتشين المتخصصة بقواعد بيانات تضم ملايين عناوين المحافظ المُعرَّفة — بورصات وخلّاطات وبروتوكولات التمويل اللامركزي وكيانات إجرامية معروفة وعناوين مُبلَّغ عنها.
      </p>
      <p>
        يستخدم متخصصو الطب الشرعي للبلوكتشين مزيجاً من الأدوات مفتوحة المصدر والتجارية والخاصة. الأساس في أي عمل تحقيقي هو مستكشف البلوكتشين. تتضمن المستكشفات المتقدمة بيانات وصفية إضافية: تصنيفات المحافظ (مثل "المحفظة الساخنة لـ Binance" أو "خلّاط مُبلَّغ عنه")، ودرجات المخاطر بناءً على الارتباطات المعروفة بالاحتيال.
      </p>
      <p>
        عندما تمر الأموال المسروقة عبر أحد هذه العناوين المُعرَّفة، يمكن للمحققين تحديد الكيان المعني على الفور.
      </p>

      <h3>الخطوة 6: استخبارات عناوين IP</h3>
      <p>
        هذه طريقة تتبع أقل شهرة لكنها فعّالة للغاية. عند بث معاملة إلى شبكة البلوكتشين، قد يتم التقاط عنوان IP لجهاز المرسل بواسطة عُقد المراقبة التي تشغّلها شركات استخبارات البلوكتشين.
      </p>
      <p>
        يتم جمع البيانات الوصفية الكاشفة للخصوصية من خلال أنظمة مراقبة البلوكتشين التي تشغّل شبكات من العُقد التي "تستمع" و"تلتقط" عناوين بروتوكول الإنترنت (IP) المرتبطة بمعاملات معينة. يمكن أن توفر عناوين IP، عند توفرها، معلومات حول الموقع الجغرافي للمشتبه به وقت إجراء المعاملة.
      </p>
      <p>
        يمكن أن يحدد هذا موقع المحتال في مدينة أو بلد معين — وهي معلومات استخباراتية حاسمة للتنسيق مع الجهات القانونية الدولية.
      </p>

      <h3>الخطوة 7: التقرير الجنائي</h3>
      <p>
        يتم تجميع كل شيء في تقرير جنائي جاهز للمحكمة يتضمن:
      </p>
      <ul>
        <li>خريطة معاملات كاملة من الضحية إلى الوجهة النهائية</li>
        <li>جميع عناوين المحافظ المُحدَّدة</li>
        <li>تحديد البورصات مع توصيات بأوامر الاستدعاء القضائي</li>
        <li>تقييم المخاطر وإسناد الكيانات</li>
        <li>شهادة المحقق وتوثيق المنهجية</li>
      </ul>

      {/* القسم 4 */}
      <h2 id="obfuscation-techniques">تقنيات الإخفاء الشائعة — وكيف يتغلب عليها المحققون</h2>
      <p>
        يدرك المحتالون وجود المحققين. يستخدمون تقنيات لإخفاء الأثر. إليك ما يحاولون فعله — وكيف يتصدى لهم التحقيق الجنائي.
      </p>

      <h3>الخلّاطات (مثل Tornado Cash)</h3>
      <p>
        <strong>ما يفعلونه:</strong> يجمعون العملات المشفرة من مصادر متعددة ويعيدون توزيع مبالغ مكافئة، مما يقطع مسار المعاملات.
      </p>
      <p>
        <strong>كيف يستجيب المحققون:</strong> تحلل تقنيات فك الخلط الحديثة التوقيت والمبالغ وأنماط مدخلات ومخرجات الخلّاط لتتبع الأموال احتمالياً عبر الخدمة. يقوم نظام فك الخلط التلقائي من Crystal Expert بتحليل مدخلات ومخرجات الخلّاط لتقديم ما يصل إلى خمسة مسارات محتملة انطلاقاً من خدمة الخلط.
      </p>
      <p>
        بالإضافة إلى ذلك، فُرضت عقوبات على Tornado Cash من قبل مكتب مراقبة الأصول الأجنبية (OFAC) في عام 2022 — ويُلزَم أي بورصة تستقبل أموالاً من Tornado Cash بتجميدها بموجب قانون العقوبات الأمريكي.
      </p>

      <h3>التنقل بين السلاسل (التحويلات عبر السلاسل)</h3>
      <p>
        <strong>ما يفعلونه:</strong> تحويل البيتكوين إلى إيثريوم ثم إلى USDT ثم إلى BNB — التنقل بين سلاسل الكتل لإرباك المحققين.
      </p>
      <p>
        <strong>كيف يستجيب المحققون:</strong> تتبع الأدوات الحديثة المعاملات عبر السلاسل تلقائياً. يمكن لمنصات استخبارات البلوكتشين مثل TRM Labs تتبع تدفق الأموال واكتشاف السلوك المشبوه وربط النشاط بأشخاص حقيقيين — خاصة عند دمجها مع الاستخبارات خارج السلسلة.
      </p>

      <h3>سلاسل التقشير</h3>
      <p>
        <strong>ما يفعلونه:</strong> إرسال الأموال عبر سلسلة طويلة من المحافظ، تمرر كل واحدة معظم الأموال إلى التالية وتحتفظ بمبلغ صغير — مثل تقشير البصلة.
      </p>
      <p>
        <strong>كيف يستجيب المحققون:</strong> تتبع أدوات رسم خرائط المعاملات الآلية سلاسل التقشير تلقائياً مهما كان عدد القفزات. النمط نفسه يُعد إشارة تحذيرية تجعل تحديد الأموال أسهل.
      </p>

      <h3>عملات الخصوصية (مونيرو)</h3>
      <p>
        <strong>ما يفعلونه:</strong> استخدام مونيرو (XMR) التي تتمتع بميزات خصوصية مدمجة تُخفي تفاصيل المعاملات.
      </p>
      <p>
        <strong>كيف يستجيب المحققون:</strong> هذا هو السيناريو الأصعب. معاملات مونيرو البحتة صعبة التتبع للغاية. ومع ذلك، يحتاج معظم المحتالين في النهاية إلى التحويل إلى بيتكوين أو عملات مستقرة لسحب الأموال — ونقطة التحويل هذه قابلة للتتبع.
      </p>

      {/* دعوة للعمل في منتصف المقال */}
      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">هل تحتاج إلى تتبع أموال مسروقة؟</h3>
        <p className="text-brand-100 text-sm mb-5">احصل على تقييم مجاني لقضيتك من فريق الطب الشرعي للبلوكتشين لدينا.</p>
        <Link
          href={`${base}/free-evaluation`}
          className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm"
        >
          احصل على تقييم مجاني <ArrowRight size={14} />
        </Link>
      </div>

      {/* القسم 5 */}
      <h2 id="what-you-need">ما تحتاجه لبدء التتبع</h2>
      <p>
        لا تحتاج إلى كل هذا — لكن كلما توفر لديك أكثر، كان التحقيق أسرع وأشمل:
      </p>

      {/* صندوق قائمة التحقق */}
      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          قائمة التحقق للتحقيق
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">أساسي (واحد على الأقل):</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> عنوان المحفظة التي أرسلت إليها الأموال</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> رقم تعريف المعاملة / TX ID</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> اسم المنصة أو البورصة التي استخدمتها</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">مفيد:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> التواريخ والمبالغ الدقيقة لكل تحويل</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> لقطات شاشة لحسابك على المنصة</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> المراسلات مع المحتال</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> رابط المنصة وأي تفاصيل تسجيل</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-800 text-sm mb-2">إضافي:</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> أي اسم أو هاتف أو بريد إلكتروني قدمه المحتال</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> حسابات التواصل الاجتماعي المستخدمة في عملية الاحتيال</li>
          </ul>
        </div>
      </div>

      {/* القسم 6 */}
      <h2 id="how-long">كم يستغرق التتبع من الوقت؟</h2>

      <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="font-bold text-slate-800 text-sm mb-1">تتبع أساسي</p>
          <p className="text-xs text-slate-500 mb-2">بلوكتشين واحد، مسار واضح</p>
          <p className="text-2xl font-display font-bold text-brand-600">24-48 ساعة</p>
          <p className="text-xs text-slate-500 mt-1">للتقرير الأولي</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <p className="font-bold text-slate-800 text-sm mb-1">تحقيق شامل</p>
          <p className="text-xs text-slate-500 mb-2">سلاسل متعددة، توجيه معقد</p>
          <p className="text-2xl font-display font-bold text-brand-600">3-7 أيام</p>
          <p className="text-xs text-slate-500 mt-1">أيام عمل</p>
        </div>
      </div>

      {/* اقتباس بارز */}
      <div className="not-prose my-8 bg-slate-50 border-l-4 border-red-500 rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">الوقت عامل حاسم</p>
        <p className="text-sm text-slate-600">
          التصرف خلال أول 72 ساعة يزيد بشكل كبير من فرص الاسترداد. كلما بدأ التتبع مبكراً، زادت فرصة العثور على الأموال قبل تصفيتها بالكامل، والوصول إلى البورصات بينما لا تزال الحسابات نشطة، وتقديم طلبات التجميد الطارئة.
        </p>
      </div>

      {/* القسم 7 */}
      <h2 id="free-tools">أدوات مجانية يمكنك استخدامها الآن</h2>
      <p>
        قبل الاستعانة بمحقق متخصص، يمكنك البدء في جمع المعلومات بنفسك باستخدام أدوات مجانية:
      </p>

      <h3>مستكشفات البلوكتشين</h3>
      <ul>
        <li><strong>Etherscan.io</strong> — إيثريوم ورموز ERC-20 وNFTs</li>
        <li><strong>Blockchain.com</strong> — بيتكوين</li>
        <li><strong>BscScan.com</strong> — سلسلة BNB</li>
        <li><strong>Tronscan.org</strong> — ترون/USDT</li>
      </ul>
      <p>
        أدخل أي عنوان محفظة أو رقم تعريف معاملة لعرض سجل المعاملات الكامل.
      </p>

      <h3>أدوات LedgerHound المجانية</h3>
      <ul>
        <li><strong><Link href={`${base}/tracker`} className="text-brand-600 hover:text-brand-700">متتبع المحافظ</Link></strong> — أدخل أي عنوان إيثريوم واطّلع على سجل المعاملات الكامل مع التحليلات</li>
        <li><strong><Link href={`${base}/graph-tracer`} className="text-brand-600 hover:text-brand-700">متتبع الرسم البياني</Link></strong> — تصوّر تدفق الأموال كرسم بياني تفاعلي وحدّد البورصات المعروفة</li>
      </ul>
      <p>
        تُظهر لك هذه الأدوات نفس البيانات على السلسلة التي يبدأ بها المحققون المتخصصون — رغم أن التتبع الاحترافي يتطلب قواعد بيانات إسناد خاصة ومنهجية معتمدة للاستخدام القانوني.
      </p>

      {/* القسم 8 */}
      <h2 id="when-to-hire">متى يكون التحقيق المتخصص ضرورياً</h2>
      <p>
        الأدوات المجانية هي نقطة انطلاق. يكون التحقيق الجنائي المتخصص في البلوكتشين ضرورياً عندما:
      </p>
      <ul>
        <li><strong>تحتاج إلى أدلة بمستوى قانوني</strong> — تتطلب المحاكم منهجية معتمدة وليس لقطات شاشة</li>
        <li><strong>تم خلط الأموال أو نقلها عبر سلاسل</strong> — يتطلب أدوات فك خلط متخصصة</li>
        <li><strong>تحتاج إلى استدعاء بورصة قضائياً</strong> — يحتاج المحامون إلى تقرير جنائي يحدد الهدف</li>
        <li><strong>الجهات القانونية متورطة</strong> — التقارير المتخصصة تحمل مصداقية لا يوفرها التحليل الذاتي</li>
        <li><strong>المبلغ كبير</strong> — إذا خسرت 10,000 دولار أو أكثر، فإن التحقيق المتخصص يُجدي نفعه عادةً</li>
      </ul>

      {/* القسم 9 */}
      <h2 id="what-happens-after">ماذا يحدث بعد التتبع</h2>
      <p>
        يحدد التتبع الجنائي الناجح <em>أين</em> ذهبت الأموال. يتطلب الاسترداد إجراءات قانونية:
      </p>

      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          خطوات الاسترداد بعد التتبع
        </div>

        <div className="space-y-5">
          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
              أمر استدعاء البورصة
            </p>
            <p className="text-sm text-slate-600 ml-8">يقوم محاميك بإصدار أمر استدعاء قضائي للبورصة المُحدَّدة للحصول على معلومات صاحب الحساب. تستجيب معظم البورصات الكبرى خلال 2-4 أسابيع.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
              طلب التجميد الطارئ
            </p>
            <p className="text-sm text-slate-600 ml-8">ستقوم العديد من البورصات بتجميد الحسابات طوعاً عند تقديم تقرير جنائي متخصص وإحالة من الجهات القانونية، حتى قبل أمر الاستدعاء الرسمي.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
              الدعوى المدنية
            </p>
            <p className="text-sm text-slate-600 ml-8">بعد تحديد صاحب الحساب، يمكن رفع دعاوى مدنية بتهمة الاحتيال والتحويل غير المشروع والإثراء غير المشروع.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">4</span>
              الإحالة إلى الجهات القانونية
            </p>
            <p className="text-sm text-slate-600 ml-8">يتعامل مكتب التحقيقات الفيدرالي (FBI IC3) والسلطات المحلية مع التقارير الجنائية. قد تتأهل القضايا الكبيرة لفريق استرداد الأصول (RAT) التابع لـ FBI الذي يملك صلاحية تجميد الأصول الطارئ.</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">5</span>
              إجراءات المصادرة من وزارة العدل
            </p>
            <p className="text-sm text-slate-600 ml-8">في القضايا المرتبطة بالجريمة المنظمة، يمكن أن تؤدي إجراءات المصادرة من وزارة العدل إلى توزيع الأموال على الضحايا.</p>
          </div>
        </div>
      </div>

      {/* الحصول على المساعدة */}
      <h2>ابدأ التتبع اليوم</h2>
      <p>
        تقدم <strong>LedgerHound</strong> تحقيقات جنائية معتمدة في البلوكتشين لضحايا سرقة العملات المشفرة والاحتيال. فريقنا:
      </p>
      <ul>
        <li>يتتبع الأموال المسروقة عبر جميع سلاسل الكتل الرئيسية</li>
        <li>يحدد البورصات والكيانات التي استقبلت أموالك</li>
        <li>يُقدّم تقارير جنائية جاهزة للمحكمة خلال 48-72 ساعة</li>
        <li>يدعم عملية أوامر الاستدعاء القضائي للمحامين والإحالات إلى الجهات القانونية</li>
        <li>يُجري الاستشارات بالروسية والإنجليزية والإسبانية والصينية والفرنسية والعربية</li>
      </ul>
    </>
  );
}

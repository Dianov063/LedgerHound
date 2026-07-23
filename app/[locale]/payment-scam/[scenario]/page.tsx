import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, Lock, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getPaymentScamScenario, PAYMENT_SCAM_SCENARIOS } from '@/lib/payment-scam-scenarios';

export function generateStaticParams() {
  return PAYMENT_SCAM_SCENARIOS.map((scenario) => ({ scenario: scenario.slug }));
}

export default function PaymentScamScenarioPage({ params }: { params: { locale: string; scenario: string } }) {
  const base = params.locale === 'en' ? '' : `/${params.locale}`;
  if (params.scenario === 'telegram-russian-community-scams') {
    redirect(`${base}/payment-scam/telegram-payment-scams`);
  }
  const scenario = getPaymentScamScenario(params.scenario);
  if (!scenario) notFound();
  const query = new URLSearchParams({ mode: 'report', category: scenario.category });
  if (scenario.channel) query.set('channel', scenario.channel);
  if (scenario.channel === 'telegram') {
    const localeLanguage: Record<string, string> = {
      ru: 'russian', es: 'spanish', zh: 'chinese', fr: 'french', ar: 'arabic',
    };
    query.set('language', localeLanguage[params.locale] || 'english');
  }
  const reportHref = `${base}/payment-safety?${query.toString()}`;
  const isRussianTelegram = params.locale === 'ru' && scenario.slug === 'telegram-payment-scams';
  const title = isRussianTelegram ? 'Как сообщить о мошенничестве в Telegram' : scenario.title;
  const description = isRussianTelegram
    ? 'Сообщите об обмане с товарами, услугами, билетами, арендой, работой, обменом валют и депозитами, который начался в Telegram-группе, канале или личной переписке в любой стране.'
    : scenario.description;
  const examples = isRussianTelegram ? [
    'Продавец получил перевод за товар и исчез.',
    'Исполнитель взял депозит, но не предоставил обещанную услугу.',
    'В Telegram разместили фальшивое предложение билетов, аренды, работы, доставки или обмена валют.',
  ] : scenario.examples;
  const collect = isRussianTelegram
    ? ['Telegram @username', 'название группы или канала', 'скриншоты переписки', 'квитанция платежа', 'номер транзакции']
    : scenario.collect;
  const labels = isRussianTelegram ? {
    eyebrow: 'Мошенничество через Telegram',
    report: 'Открыть приватную форму',
    cases: 'Какие случаи можно сообщить',
    save: 'Что сохранить до подачи жалобы',
    verify: 'Проверяем заявителя',
    verifyText: 'До модерации необходимо подтвердить email.',
    private: 'Сопоставляем приватно',
    privateText: 'Полные платёжные данные и названия сообществ не публикуются.',
    warn: 'Предупреждаем после подтверждений',
    warnText: 'Для маскированного предупреждения нужны три независимые принятые жалобы.',
    actions: 'Куда сообщить сразу',
    actionsText: 'Сначала обратитесь в платёжную систему и банк, из которого ушли деньги. Пожалуйтесь на аккаунт и сообщения внутри Telegram и сообщите о происшествии в орган по борьбе с интернет-мошенничеством своей страны. Для США доступны FTC и IC3.',
  } : {
    eyebrow: 'Telegram payment scam reporting', report: 'Open private report form', cases: 'Cases this form covers',
    save: 'Save before reporting', verify: 'Verify the reporter', verifyText: 'Email verification is required before moderation.',
    private: 'Match privately', privateText: 'Full payment identifiers and community names are not published.',
    warn: 'Warn after corroboration', warnText: 'Three independent accepted reports are required for a masked warning.',
    actions: 'Immediate reporting options', actionsText: 'Contact the payment provider and funding bank first. Report the account and messages inside Telegram, then contact the cybercrime or consumer protection authority in your country. US victims can also file with the FTC and IC3.',
  };

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Will one report become a public accusation?',
        acceptedAnswer: { '@type': 'Answer', text: 'No. A single report remains private. Public warnings require at least three independent verified and moderator-accepted reports.' },
      },
      {
        '@type': 'Question',
        name: 'What payment methods can I report?',
        acceptedAnswer: { '@type': 'Answer', text: 'Reports can include Zelle, Cash App, Venmo, PayPal, Apple Cash, Chime, bank transfers, phone numbers, emails, and marketplace profiles.' },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <main className="pt-28">
        <section className="border-b border-slate-200 bg-slate-950 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 mb-4">
              <AlertTriangle size={15} /> {labels.eyebrow}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold max-w-4xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-slate-300 leading-relaxed">{description}</p>
            <Link href={reportHref} className="btn-primary mt-7 inline-flex">
              <FileText size={17} /> {labels.report} <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950 mb-5">{labels.cases}</h2>
            <div className="space-y-3">
              {examples.map((example) => (
                <div key={example} className="flex gap-3 border-b border-slate-200 pb-3 text-sm text-slate-700">
                  <CheckCircle2 size={17} className="text-emerald-600 shrink-0 mt-0.5" /> {example}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950 mb-5">{labels.save}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {collect.map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-3 gap-6">
            <div><ShieldCheck className="text-brand-600 mb-3" /><h2 className="font-bold text-slate-950">{labels.verify}</h2><p className="text-sm text-slate-600 mt-2">{labels.verifyText}</p></div>
            <div><Lock className="text-brand-600 mb-3" /><h2 className="font-bold text-slate-950">{labels.private}</h2><p className="text-sm text-slate-600 mt-2">{labels.privateText}</p></div>
            <div><AlertTriangle className="text-brand-600 mb-3" /><h2 className="font-bold text-slate-950">{labels.warn}</h2><p className="text-sm text-slate-600 mt-2">{labels.warnText}</p></div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="font-display text-2xl font-bold text-slate-950">{labels.actions}</h2>
          <p className="text-sm text-slate-600 mt-3 max-w-3xl">{labels.actionsText}</p>
          <div className="flex flex-wrap gap-4 mt-5 text-sm font-semibold">
            <a href="https://reportfraud.ftc.gov/" target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">US: FTC ReportFraud</a>
            <a href="https://www.ic3.gov/" target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">US: FBI IC3</a>
            <a href="https://telegram.org/faq" target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">Telegram FAQ</a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

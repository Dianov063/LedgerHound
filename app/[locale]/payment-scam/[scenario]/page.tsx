import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, Lock, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getPaymentScamScenario, PAYMENT_SCAM_SCENARIOS } from '@/lib/payment-scam-scenarios';
import { getScenarioCopy } from '@/lib/payment-scam-i18n';

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
  const copy = getScenarioCopy(scenario.slug, params.locale);

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: copy.faqPublicQuestion,
        acceptedAnswer: {
          '@type': 'Answer',
          text: copy.faqPublicAnswer,
        },
      },
      {
        '@type': 'Question',
        name: copy.faqMethodsQuestion,
        acceptedAnswer: {
          '@type': 'Answer',
          text: copy.faqMethodsAnswer,
        },
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
              <AlertTriangle size={15} /> {copy.eyebrow}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold max-w-4xl">{copy.title}</h1>
            <p className="mt-4 max-w-3xl text-slate-300 leading-relaxed">{copy.description}</p>
            <Link href={reportHref} className="btn-primary mt-7 inline-flex">
              <FileText size={17} /> {copy.report} <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950 mb-5">{copy.cases}</h2>
            <div className="space-y-3">
              {copy.examples.map((example) => (
                <div key={example} className="flex gap-3 border-b border-slate-200 pb-3 text-sm text-slate-700">
                  <CheckCircle2 size={17} className="text-emerald-600 shrink-0 mt-0.5" /> {example}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950 mb-5">{copy.save}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {copy.collect.map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-3 gap-6">
            <div><ShieldCheck className="text-brand-600 mb-3" /><h2 className="font-bold text-slate-950">{copy.verify}</h2><p className="text-sm text-slate-600 mt-2">{copy.verifyText}</p></div>
            <div><Lock className="text-brand-600 mb-3" /><h2 className="font-bold text-slate-950">{copy.private}</h2><p className="text-sm text-slate-600 mt-2">{copy.privateText}</p></div>
            <div><AlertTriangle className="text-brand-600 mb-3" /><h2 className="font-bold text-slate-950">{copy.warn}</h2><p className="text-sm text-slate-600 mt-2">{copy.warnText}</p></div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="font-display text-2xl font-bold text-slate-950">{copy.actions}</h2>
          <p className="text-sm text-slate-600 mt-3 max-w-3xl">{copy.actionsText}</p>
          <div className="flex flex-wrap gap-4 mt-5 text-sm font-semibold">
            <a href="https://reportfraud.ftc.gov/" target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">{copy.ftcLink}</a>
            <a href="https://www.ic3.gov/" target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">{copy.ic3Link}</a>
            {scenario.channel === 'telegram' && (
              <a href="https://telegram.org/faq" target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">{copy.telegramLink}</a>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

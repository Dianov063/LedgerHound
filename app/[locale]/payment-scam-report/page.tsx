import Link from 'next/link';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Database,
  FileText,
  Lock,
  Search,
  ShieldCheck,
} from 'lucide-react';

const paymentMethods = [
  'Zelle phone numbers and emails',
  'Cash App $cashtags',
  'Venmo usernames',
  'PayPal emails',
  'Apple Cash phone numbers and emails',
  'Chime $ChimeSigns, phones, and emails',
  'Wise and Revolut recipients',
  'IBAN and bank accounts',
  'Phone numbers and email addresses',
  'Marketplace or social media profiles',
  'Telegram usernames, groups, and channels',
  'Local wallets and other payment methods',
];

const scamTypes = [
  'Goods paid for but never delivered',
  'Fake services and repair deposits',
  'Rental deposits and advance fees',
  'Ticket resale scams',
  'Marketplace seller scams',
  'Employment or onboarding fee scams',
  'Custom orders, cake orders, event deposits, and local service scams',
];

const scenarioPages = [
  ['telegram-russian-community-scams', 'Russian-speaking US Telegram groups'],
  ['marketplace-payment-scam', 'Marketplace payment scams'],
  ['ticket-payment-scam', 'Ticket payment scams'],
  ['goods-not-delivered-payment-scam', 'Goods not delivered'],
  ['fake-local-service-scam', 'Fake local services and deposits'],
];

export default function PaymentScamReportSeoPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;
  const toolHref = `${base}/payment-safety`;

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can I report a payment scam that is not crypto related?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. LedgerHound accepts non-crypto payment scam reports involving Zelle, Cash App, Venmo, PayPal, bank transfer, IBAN, phone, email, marketplace profiles, and other local payment methods.',
        },
      },
      {
        '@type': 'Question',
        name: 'Will one report become public?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. A single report stays private. Public warnings are designed for multiple independent reports about the same payment recipient, and full payment identifiers are masked.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I check a payment recipient before sending money?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The payment safety tool lets you check a recipient by country, payment method, and identifier. Private matches are not exposed unless the recipient has enough corroborated reports.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="pt-32">
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid lg:grid-cols-[1fr_23rem] gap-10 items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 mb-5">
                  <AlertTriangle size={13} />
                  Non-crypto payment scam reports
                </div>
                <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-950 leading-tight mb-5">
                  Report a payment scam before the same recipient hurts someone else.
                </h1>
                <p className="text-lg text-slate-600 max-w-3xl leading-relaxed mb-7">
                  LedgerHound is building a payment recipient safety database for everyday scams:
                  undelivered goods, fake services, marketplace deposits, ticket scams, rental
                  deposits, and other non-crypto fraud that often repeats through the same payment
                  account.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={toolHref} className="btn-primary justify-center px-5 py-3">
                    <FileText size={17} />
                    Report or check a recipient
                    <ArrowRight size={17} />
                  </Link>
                  <Link
                    href={`${toolHref}?mode=check`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:border-brand-300 hover:text-brand-700 transition-colors"
                  >
                    <Search size={17} />
                    Check before paying
                  </Link>
                </div>
              </div>

              <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Lock size={18} className="text-emerald-600" />
                  <h2 className="font-display font-bold text-lg text-slate-950">Privacy-first by design</h2>
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <p>One report remains private intake.</p>
                  <p>Multiple independent reports can create a public warning.</p>
                  <p>Full emails, phone numbers, bank accounts, and handles are not published.</p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Banknote size={22} className="text-brand-600" />
                <h2 className="font-display font-bold text-2xl text-slate-950">Payment methods you can report</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <div key={method} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                    <span>{method}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5">
                <Database size={22} className="text-brand-600" />
                <h2 className="font-display font-bold text-2xl text-slate-950">Scam categories this covers</h2>
              </div>
              <div className="space-y-3">
                {scamTypes.map((type) => (
                  <div key={type} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <ShieldCheck size={15} className="text-brand-600 mt-0.5 shrink-0" />
                    <span>{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-950 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <p className="text-sm font-bold text-emerald-400 mb-2">1. Submit the recipient</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Add the country, payment method, masked recipient context, amount, date,
                  evidence type, and a clear description of what happened.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-400 mb-2">2. We match privately</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  The system normalizes the payment identifier and stores a private hash, so repeated
                  reports can be matched without exposing the full account publicly.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-400 mb-2">3. Public only after corroboration</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Public warnings are reserved for multiple independent reports. The public result
                  uses masked identifiers and factual report counts.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-4">
            Why report small payment scams?
          </h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              Many payment scams are too small for anyone to investigate alone. A fake seller may take
              a cake deposit, a repair fee, a marketplace payment, or a ticket transfer and disappear.
              One victim may look like a private dispute. Three, five, or ten independent reports
              tied to the same payment recipient become a pattern.
            </p>
            <p>
              The payment safety database is built for that pattern. It does not need to publish a full
              phone number, email, bank account, or handle to be useful. A masked warning can help the
              next person pause before sending money, while keeping single unverified reports private.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50 p-6">
            <h3 className="font-display font-bold text-xl text-slate-950 mb-2">
              Ready to report or check a recipient?
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              Use the payment safety tool to submit a private report or search for corroborated
              public warnings before sending funds.
            </p>
            <Link href={toolHref} className="btn-primary inline-flex">
              Open payment safety tool
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="font-display font-bold text-2xl text-slate-950 mb-4">Report by situation</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {scenarioPages.map(([slug, label]) => (
                <Link key={slug} href={`${base}/payment-scam/${slug}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700">
                  {label}<ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

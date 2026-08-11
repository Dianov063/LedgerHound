import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ArrowRight, Search, ShieldCheck, Scale, Landmark, Building2,
  Check, Info, Lock,
} from 'lucide-react';
import { makeMetadata } from '@/lib/metadata';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return await makeMetadata({
    locale,
    path: '',
    metadataKey: 'paymentsHome',
  });
}

const RAILS = ['Zelle', 'Cash App', 'Venmo', 'PayPal', 'Apple Cash', 'Chime', 'Bank transfer', 'Marketplace'];

/**
 * The payment-scam product is the site's front door.
 *
 * The database is young, so the hero asks for a report rather than offering a
 * search: an empty search result reads as "this service is broken", while a
 * report is the thing that makes every future search work. Search is still
 * here, further down, for people who arrive before they pay.
 *
 * Crypto forensics is not gone — it moved to /crypto and is reached from the
 * fork near the bottom, styled deliberately unlike the rest of the page so it
 * reads as a separate product rather than another menu item.
 */
export default function PaymentsHomePage() {
  const t = useTranslations('payments_home');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const rungs = [
    { n: t('r1_n'), h: t('r1_h'), p: t('r1_p'), cls: 'bg-white border-slate-200', nCls: 'text-slate-500' },
    { n: t('r2_n'), h: t('r2_h'), p: t('r2_p'), cls: 'bg-orange-50 border-orange-200', nCls: 'text-orange-700' },
    { n: t('r3_n'), h: t('r3_h'), p: t('r3_p'), cls: 'bg-orange-100 border-orange-300', nCls: 'text-orange-800' },
    { n: t('r4_n'), h: t('r4_h'), p: t('r4_p'), cls: 'bg-slate-900 border-slate-900 text-white', nCls: 'text-orange-300' },
  ];

  const weigh = [
    { t: t('weigh1_t'), d: t('weigh1_d') },
    { t: t('weigh2_t'), d: t('weigh2_d') },
    { t: t('weigh3_t'), d: t('weigh3_d') },
    { t: t('weigh4_t'), d: t('weigh4_d') },
  ];

  const rules = [
    { b: t('rule1_b'), p: t('rule1') },
    { b: t('rule2_b'), p: t('rule2') },
    { b: t('rule3_b'), p: t('rule3') },
    { b: t('rule4_b'), p: t('rule4') },
  ];

  const who = [
    { icon: Scale, t: t('who1_t'), d: t('who1_d') },
    { icon: Landmark, t: t('who2_t'), d: t('who2_d') },
    { icon: Building2, t: t('who3_t'), d: t('who3_d') },
  ];

  const vsteps = [
    { b: t('vs1_b'), p: t('vs1') },
    { b: t('vs2_b'), p: t('vs2') },
    { b: t('vs3_b'), p: t('vs3') },
    { b: t('vs4_b'), p: t('vs4') },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ─── HERO — the ask is a report, not a search ─── */}
      <section className="pt-28 pb-16 lg:pt-32 lg:pb-20 bg-gradient-to-b from-orange-50/60 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="inline-block text-[11px] font-bold tracking-[0.13em] text-orange-700 bg-orange-100 rounded-full px-4 py-1.5 mb-6">
            {t('kicker')}
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-[1.06] tracking-tight mb-5">
            {t('title')}
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-9">{t('lede')}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-7">
            <Link
              href={`${base}/payment-safety`}
              className="bg-orange-700 hover:bg-orange-800 text-white font-semibold rounded-full px-10 py-4 transition-colors shadow-lg shadow-orange-700/25 text-center"
            >
              <span className="flex items-center justify-center gap-2 text-lg">
                {t('cta')} <ArrowRight size={19} />
              </span>
              <span className="block text-sm font-medium text-orange-100 mt-0.5">{t('cta_sub')}</span>
            </Link>
            <Link
              href="#check"
              className="border border-slate-300 text-slate-800 font-semibold rounded-full px-8 py-4 hover:bg-slate-50 transition-colors"
            >
              {t('secondary')}
            </Link>
          </div>

          <p className="text-[15px] text-slate-500 max-w-2xl mx-auto">
            {t('note_plain')} <span className="text-slate-900 font-semibold">{t('note_bold')}</span>
          </p>
        </div>
      </section>

      {/* ─── ESCALATION LADDER ─── */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-3xl lg:text-4xl mb-3">{t('ladder_title')}</h2>
          <p className="text-slate-600 max-w-2xl mb-9">{t('ladder_sub')}</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rungs.map((r) => (
              <div key={r.n} className={`rounded-2xl border p-6 ${r.cls}`}>
                <span className={`block text-xs font-bold tracking-[0.1em] mb-3 ${r.nCls}`}>{r.n}</span>
                <h3 className="font-bold text-lg mb-2 leading-snug">{r.h}</h3>
                <p className={`text-[15px] leading-relaxed ${r.cls.includes('slate-900') ? 'text-slate-300' : 'text-slate-600'}`}>
                  {r.p}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LAW FIRM ESCALATION ─── */}
      <section className="pb-16 lg:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 lg:p-12 shadow-sm grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-start">
            <div>
              <h2 className="section-title text-3xl mb-4">{t('legal_title')}</h2>
              <p className="text-slate-600 leading-relaxed mb-4">{t('legal_p1')}</p>
              <p className="text-slate-600 leading-relaxed mb-6">
                <span className="text-slate-900 font-semibold">{t('legal_p2_bold')}</span> {t('legal_p2')}
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {weigh.map((w) => (
                  <div key={w.t} className="bg-slate-50 rounded-xl px-4 py-3">
                    <b className="block text-[15px] text-slate-900">{w.t}</b>
                    <span className="text-sm text-slate-500">{w.d}</span>
                  </div>
                ))}
              </div>

              <p className="text-slate-600 leading-relaxed mb-6">{t('legal_p3')}</p>

              <ul className="space-y-3">
                {rules.map((r) => (
                  <li key={r.b} className="flex gap-3 text-[15px] leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-orange-700 shrink-0" />
                    <span className="text-slate-600">
                      <b className="text-slate-900">{r.b}</b> {r.p}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 lg:p-7">
              <div className="flex gap-3 items-start">
                <span className="mt-0.5 h-6 w-6 rounded-md bg-orange-700 text-white grid place-items-center shrink-0">
                  <Check size={15} strokeWidth={3} />
                </span>
                <span className="text-[15px] text-slate-800 leading-relaxed">{t('consent')}</span>
              </div>
              <p className="text-[13.5px] text-slate-500 leading-relaxed mt-5 pt-5 border-t border-slate-200">
                {t('fine')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── THE OBJECTION, ANSWERED ─── */}
      <section className="pb-16 lg:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl border-l-4 border-orange-700 pl-7 py-1">
            <p className="font-display font-semibold text-2xl text-slate-900 leading-snug mb-3">{t('objection_q')}</p>
            <p className="text-slate-600 leading-relaxed">{t('objection_a')}</p>
          </div>
        </div>
      </section>

      {/* ─── SEARCH, DEMOTED BUT PRESENT ─── */}
      <section id="check" className="py-16 lg:py-20 bg-slate-50 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="section-title text-3xl mb-3">{t('search_title')}</h2>
          <p className="text-slate-600 mb-8">{t('search_sub')}</p>

          <form action={`${base}/payment-safety`} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="q"
              placeholder={t('search_placeholder')}
              aria-label={t('search_placeholder')}
              className="input flex-1 bg-white py-4"
            />
            <button
              type="submit"
              className="bg-orange-700 hover:bg-orange-800 text-white font-semibold rounded-lg px-8 py-4 transition-colors whitespace-nowrap inline-flex items-center justify-center gap-2"
            >
              <Search size={17} /> {t('search_button')}
            </button>
          </form>

          <p className="text-sm text-slate-400 mt-5">{RAILS.join(' · ')}</p>
        </div>
      </section>

      {/* ─── PARTNERS: LAWYERS, BANKS, LAW ENFORCEMENT ─── */}
      <section className="py-16 lg:py-20 bg-[#241A14] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold tracking-[0.14em] text-orange-300 mb-4">{t('partners_kicker')}</p>
          <h2 className="font-display font-bold text-3xl lg:text-4xl leading-tight max-w-3xl mb-4">
            {t('partners_title')}
          </h2>
          <p className="text-[#BCAA9D] text-lg leading-relaxed max-w-3xl mb-10">{t('partners_lede')}</p>

          <div className="grid md:grid-cols-3 gap-4 mb-11">
            {who.map(({ icon: Icon, t: title, d }) => (
              <div key={title} className="border border-white/15 rounded-2xl p-6">
                <Icon size={20} className="text-orange-300 mb-3" />
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-[15px] text-[#BCAA9D] leading-relaxed">{d}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 border-t border-white/15 pt-11">
            <div>
              <h3 className="font-display font-semibold text-2xl mb-3">{t('gate_title')}</h3>
              <p className="text-[#BCAA9D] leading-relaxed mb-6">{t('gate_p')}</p>
              <div className="flex gap-3 bg-orange-500/10 border border-orange-400/30 rounded-xl p-5">
                <Info size={18} className="text-orange-300 shrink-0 mt-0.5" />
                <span className="text-[15px] text-orange-50/90 leading-relaxed">{t('gate_warn')}</span>
              </div>
            </div>

            <ol className="space-y-0">
              {vsteps.map((s, i) => (
                <li
                  key={s.b}
                  className={`flex gap-4 py-4 ${i < vsteps.length - 1 ? 'border-b border-white/10' : ''}`}
                >
                  <span className="h-7 w-7 rounded-full bg-orange-700 text-white grid place-items-center text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span>
                    <b className="block text-[16.5px]">{s.b}</b>
                    <span className="text-[15px] text-[#BCAA9D] leading-relaxed">{s.p}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid md:grid-cols-2 gap-4 border-t border-white/15 mt-11 pt-11">
            <div className="border border-white/15 rounded-2xl p-6">
              <span className="block text-xs font-bold tracking-[0.11em] text-orange-300 mb-3">{t('tier1_lvl')}</span>
              <h4 className="font-bold text-lg mb-2">{t('tier1_h')}</h4>
              <p className="text-[15px] text-[#BCAA9D] leading-relaxed">{t('tier1_p')}</p>
            </div>
            <div className="border border-white/15 rounded-2xl p-6">
              <span className="block text-xs font-bold tracking-[0.11em] text-orange-300 mb-3">{t('tier2_lvl')}</span>
              <h4 className="font-bold text-lg mb-2">{t('tier2_h')}</h4>
              <p className="text-[15px] text-[#BCAA9D] leading-relaxed">{t('tier2_p')}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 border-t border-white/15 mt-11 pt-9">
            <Link
              href={`${base}/contact`}
              className="bg-orange-700 hover:bg-orange-800 text-white font-semibold rounded-full px-9 py-4 transition-colors inline-flex items-center gap-2"
            >
              {t('partners_cta')} <ArrowRight size={18} />
            </Link>
            <span className="text-[15px] text-[#BCAA9D] max-w-lg leading-relaxed">{t('partners_note')}</span>
          </div>
        </div>
      </section>

      {/* ─── CRYPTO FORK — a different world on purpose ─── */}
      <section className="py-16 bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-8 items-center justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-brand-300 mb-3">{t('fork_kicker')}</p>
            <h2 className="font-display font-bold text-3xl lg:text-4xl mb-3">{t('fork_title')}</h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">{t('fork_p')}</p>
          </div>
          <Link
            href={`${base}/crypto`}
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full px-8 py-4 transition-colors inline-flex items-center gap-2 whitespace-nowrap"
          >
            {t('fork_button')} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8 lg:p-12 flex flex-wrap gap-8 items-center justify-between">
            <div>
              <h2 className="section-title text-3xl mb-2">{t('final_title')}</h2>
              <p className="text-slate-600 max-w-xl leading-relaxed">{t('final_p')}</p>
            </div>
            <Link
              href={`${base}/payment-safety`}
              className="bg-orange-700 hover:bg-orange-800 text-white font-semibold rounded-full px-9 py-4 transition-colors inline-flex items-center gap-2 whitespace-nowrap"
            >
              {t('cta')} <ArrowRight size={18} />
            </Link>
          </div>

          <p className="flex items-center justify-center gap-2 text-sm text-slate-400 mt-8">
            <Lock size={13} /> <ShieldCheck size={13} /> {t('note_plain')}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

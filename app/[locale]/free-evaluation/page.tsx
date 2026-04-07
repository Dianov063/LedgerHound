'use client';

import { useState, FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle2, Shield, Clock, Lock, Phone, AlertCircle, Loader2 } from 'lucide-react';

const WEB3FORMS_KEY = '823f6807-8207-4f91-8d04-113c27f0b7e0';

export default function FreeEvaluationPage() {
  const locale = useLocale();
  const t = useTranslations('evaluation_page');
  const base = locale === 'en' ? '' : `/${locale}`;
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');

    const form = e.currentTarget;
    const data = new FormData(form);
    data.append('access_key', WEB3FORMS_KEY);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
      });

      if (res.ok) {
        setStatus('success');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  const whatHappens = [
    { step: '1', title: t('step1_title'), desc: t('step1_desc') },
    { step: '2', title: t('step2_title'), desc: t('step2_desc') },
    { step: '3', title: t('step3_title'), desc: t('step3_desc') },
    { step: '4', title: t('step4_title'), desc: t('step4_desc') },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* Left - Info */}
            <div className="pt-4">
              <p className="section-tag">{t('tag')}</p>
              <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 leading-tight mb-5">
                {t('title_line1')}<br /><span className="text-brand-600">{t('title_line2')}</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                {t('subtitle')}
              </p>

              <div className="space-y-4 mb-8">
                {whatHappens.map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-brand-600 text-white font-display font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
                {[
                  { icon: Lock, text: t('guarantee_confidential') },
                  { icon: Shield, text: t('guarantee_no_obligation') },
                  { icon: Clock, text: t('guarantee_response') },
                  { icon: CheckCircle2, text: t('guarantee_honest') },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-slate-700">
                    <Icon size={15} className="text-brand-600 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
                <Phone size={14} className="text-brand-500" />
                <span>{t('prefer_call')}</span>
                <a href="tel:+18335591334" className="text-brand-600 font-semibold hover:underline">+1 (833) 559-1334</a>
                <span className="text-slate-300">·</span>
                <span className="text-brand-600 font-semibold">Говорим по-русски</span>
              </div>
            </div>

            {/* Right - Form */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 sm:p-8">
              <h2 className="font-display font-bold text-2xl text-slate-900 mb-1">{t('form_title')}</h2>
              <p className="text-sm text-slate-500 mb-6">{t('form_required_note')}</p>

              {status === 'success' ? (
                <div className="text-center py-12">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="font-display font-bold text-xl text-slate-900 mb-2">{t('success_title')}</h3>
                  <p className="text-slate-600 text-sm mb-2">{t('success_desc')}</p>
                  <p className="text-slate-400 text-xs mb-6">{t('success_check_email')}</p>
                  <button onClick={() => setStatus('idle')} className="text-brand-600 text-sm font-semibold hover:underline">
                    {t('success_another')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="hidden" name="_subject" value="New Free Evaluation Request — LedgerHound" />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('label_first_name')}</label>
                      <input type="text" name="firstName" required className="input" placeholder="John" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('label_last_name')}</label>
                      <input type="text" name="lastName" required className="input" placeholder="Smith" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('label_email')}</label>
                    <input type="email" name="email" required className="input" placeholder="john@example.com" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('label_phone')}</label>
                    <input type="tel" name="phone" className="input" placeholder="+1 (555) 000-0000" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('label_amount_lost')}</label>
                    <select name="amountLost" required className="input bg-white">
                      <option value="">{t('amount_select')}</option>
                      <option>{t('amount_under_10k')}</option>
                      <option>{t('amount_10k_50k')}</option>
                      <option>{t('amount_50k_100k')}</option>
                      <option>{t('amount_100k_500k')}</option>
                      <option>{t('amount_over_500k')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('label_incident_type')}</label>
                    <select name="incidentType" required className="input bg-white">
                      <option value="">{t('incident_select')}</option>
                      <option>{t('incident_romance')}</option>
                      <option>{t('incident_fake_platform')}</option>
                      <option>{t('incident_hacked')}</option>
                      <option>{t('incident_investment')}</option>
                      <option>{t('incident_divorce')}</option>
                      <option>{t('incident_business')}</option>
                      <option>{t('incident_ransomware')}</option>
                      <option>{t('incident_other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('label_wallet')}</label>
                    <input type="text" name="walletAddress" className="input font-mono text-sm" placeholder="bc1q... or 0x..." />
                    <p className="text-xs text-slate-400 mt-1">{t('wallet_hint')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('label_description')}</label>
                    <textarea
                      required
                      rows={5}
                      name="description"
                      className="input resize-none"
                      placeholder={t('description_placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('label_language')}</label>
                    <select name="language" className="input bg-white">
                      <option>English</option>
                      <option>Русский (Russian)</option>
                      <option>Español (Spanish)</option>
                      <option>中文 (Chinese)</option>
                      <option>Français (French)</option>
                      <option>العربية (Arabic)</option>
                    </select>
                  </div>

                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="consent" name="consent" required className="mt-1 accent-brand-600" />
                    <label htmlFor="consent" className="text-xs text-slate-500 leading-relaxed">
                      {t('consent_text')}
                    </label>
                  </div>

                  {status === 'error' && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg p-3">
                      <AlertCircle size={16} />
                      <span>{t('error_message')}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="btn-primary w-full justify-center text-base py-3.5 disabled:opacity-60"
                  >
                    {status === 'loading' ? (
                      <><Loader2 size={16} className="animate-spin" /> {t('submitting')}</>
                    ) : (
                      t('submit_btn')
                    )}
                  </button>

                  <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
                    <Lock size={11} />
                    {t('form_secure_note')}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

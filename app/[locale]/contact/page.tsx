'use client';

import { useState, FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, Clock, Shield, MessageSquare, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const WEB3FORMS_KEY = '823f6807-8207-4f91-8d04-113c27f0b7e0';

export default function ContactPage() {
  const locale = useLocale();
  const t = useTranslations('contact_page');
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

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-28 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="section-tag">{t('tag')}</p>
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-4">{t('title')}</h1>
          <p className="text-slate-600 text-lg">{t('subtitle')}</p>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* Contact Info */}
            <div>
              <h2 className="font-display font-bold text-2xl text-slate-900 mb-6">{t('ways_to_reach')}</h2>

              <div className="space-y-5 mb-8">
                <div className="card flex gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm mb-0.5">{t('email_label')}</p>
                    <a href="mailto:contact@ledgerhound.vip" className="text-brand-600 hover:underline text-sm">contact@ledgerhound.vip</a>
                    <p className="text-xs text-slate-400 mt-0.5">{t('email_response')}</p>
                  </div>
                </div>

                <div className="card flex gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm mb-0.5">{t('phone_label')}</p>
                    <a href="tel:+18335591334" className="text-brand-600 hover:underline text-sm">+1 (833) 559-1334</a>
                    <p className="text-xs text-slate-400 mt-0.5">{t('phone_hours')}</p>
                  </div>
                </div>

                <div className="card flex gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm mb-0.5">{t('response_time_label')}</p>
                    <p className="text-slate-700 text-sm">{t('response_time_value')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t('response_time_note')}</p>
                  </div>
                </div>

                <div className="card flex gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm mb-0.5">{t('confidentiality_label')}</p>
                    <p className="text-slate-700 text-sm">{t('confidentiality_value')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t('confidentiality_note')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={16} className="text-brand-600" />
                  <p className="font-display font-bold text-brand-900 text-sm">{t('new_case_title')}</p>
                </div>
                <p className="text-sm text-brand-800 mb-4">{t('new_case_desc')}</p>
                <Link href={`${base}/free-evaluation`} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700">
                  {t('new_case_link')}
                </Link>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 sm:p-8">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-5">{t('form_title')}</h2>

              {status === 'success' ? (
                <div className="text-center py-12">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="font-display font-bold text-xl text-slate-900 mb-2">{t('success_title')}</h3>
                  <p className="text-slate-600 text-sm mb-6">{t('success_desc')}</p>
                  <button onClick={() => setStatus('idle')} className="text-brand-600 text-sm font-semibold hover:underline">
                    {t('success_another')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="hidden" name="_subject" value="New Contact Form Submission — LedgerHound" />

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
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('label_subject')}</label>
                    <select name="subject" className="input bg-white">
                      <option>{t('subject_new_case')}</option>
                      <option>{t('subject_attorney')}</option>
                      <option>{t('subject_law_enforcement')}</option>
                      <option>{t('subject_general')}</option>
                      <option>{t('subject_media')}</option>
                      <option>{t('subject_other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('label_message')}</label>
                    <textarea rows={5} name="message" required className="input resize-none" placeholder={t('message_placeholder')} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('label_language')}</label>
                    <select name="language" className="input bg-white">
                      <option>{t('lang_english')}</option>
                      <option>{t('lang_russian')}</option>
                      <option>{t('lang_spanish')}</option>
                      <option>{t('lang_chinese')}</option>
                      <option>{t('lang_french')}</option>
                      <option>{t('lang_arabic')}</option>
                    </select>
                  </div>

                  {status === 'error' && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg p-3">
                      <AlertCircle size={16} />
                      <span>{t('error_message')}</span>
                    </div>
                  )}

                  <button type="submit" disabled={status === 'loading'} className="btn-primary w-full justify-center disabled:opacity-60">
                    {status === 'loading' ? (
                      <><Loader2 size={16} className="animate-spin" /> {t('sending')}</>
                    ) : (
                      t('send_btn')
                    )}
                  </button>
                  <p className="text-xs text-slate-400 text-center">{t('form_note')}</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

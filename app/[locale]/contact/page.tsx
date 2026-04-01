'use client';

import { useState, FormEvent } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, Clock, Shield, MessageSquare, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const FORMSPREE_ID = 'mreolrgb';

export default function ContactPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
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

      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="section-tag">Get In Touch</p>
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-4">Contact Us</h1>
          <p className="text-slate-600 text-lg">Have a question? Ready to start? We respond to all inquiries within 24 hours.</p>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* Contact Info */}
            <div>
              <h2 className="font-display font-bold text-2xl text-slate-900 mb-6">Ways to Reach Us</h2>

              <div className="space-y-5 mb-8">
                <div className="card flex gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm mb-0.5">Email</p>
                    <a href="mailto:contact@ledgerhound.vip" className="text-brand-600 hover:underline text-sm">contact@ledgerhound.vip</a>
                    <p className="text-xs text-slate-400 mt-0.5">We respond within 24 hours</p>
                  </div>
                </div>

                <div className="card flex gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm mb-0.5">Phone</p>
                    <a href="tel:+18335591334" className="text-brand-600 hover:underline text-sm">+1 (833) 559-1334</a>
                    <p className="text-xs text-slate-400 mt-0.5">Mon–Fri, 9am–6pm EST · Говорим по-русски</p>
                  </div>
                </div>

                <div className="card flex gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm mb-0.5">Response Time</p>
                    <p className="text-slate-700 text-sm">All inquiries answered within 24 hours</p>
                    <p className="text-xs text-slate-400 mt-0.5">Urgent cases prioritized</p>
                  </div>
                </div>

                <div className="card flex gap-4">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm mb-0.5">Confidentiality</p>
                    <p className="text-slate-700 text-sm">All communications are strictly confidential</p>
                    <p className="text-xs text-slate-400 mt-0.5">LedgerHound · New York, USA</p>
                  </div>
                </div>
              </div>

              <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={16} className="text-brand-600" />
                  <p className="font-display font-bold text-brand-900 text-sm">Starting a New Case?</p>
                </div>
                <p className="text-sm text-brand-800 mb-4">For the fastest response on a new case, use our dedicated free evaluation form. It captures all the information we need upfront.</p>
                <Link href={`${base}/free-evaluation`} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700">
                  Go to Free Evaluation Form →
                </Link>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 sm:p-8">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-5">Send a Message</h2>

              {status === 'success' ? (
                <div className="text-center py-12">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="font-display font-bold text-xl text-slate-900 mb-2">Message Sent!</h3>
                  <p className="text-slate-600 text-sm mb-6">We'll get back to you within 24 hours.</p>
                  <button onClick={() => setStatus('idle')} className="text-brand-600 text-sm font-semibold hover:underline">
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="hidden" name="_subject" value="New Contact Form Submission — LedgerHound" />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name</label>
                      <input type="text" name="firstName" required className="input" placeholder="John" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name</label>
                      <input type="text" name="lastName" required className="input" placeholder="Smith" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                    <input type="email" name="email" required className="input" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                    <select name="subject" className="input bg-white">
                      <option>New Case Inquiry</option>
                      <option>Attorney Partnership</option>
                      <option>Law Enforcement Request</option>
                      <option>General Question</option>
                      <option>Media / Press</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message</label>
                    <textarea rows={5} name="message" required className="input resize-none" placeholder="How can we help you?" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred Language</label>
                    <select name="language" className="input bg-white">
                      <option>English</option>
                      <option>Русский (Russian)</option>
                      <option>Español (Spanish)</option>
                      <option>中文 (Chinese)</option>
                      <option>Français (French)</option>
                      <option>العربية (Arabic)</option>
                    </select>
                  </div>

                  {status === 'error' && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg p-3">
                      <AlertCircle size={16} />
                      <span>Something went wrong. Please try again or email us directly.</span>
                    </div>
                  )}

                  <button type="submit" disabled={status === 'loading'} className="btn-primary w-full justify-center disabled:opacity-60">
                    {status === 'loading' ? (
                      <><Loader2 size={16} className="animate-spin" /> Sending...</>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                  <p className="text-xs text-slate-400 text-center">We respond within 24 hours · All messages are confidential</p>
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

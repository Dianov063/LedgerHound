import { useLocale } from 'next-intl';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle2, Shield, Clock, Lock, Phone } from 'lucide-react';

export default function FreeEvaluationPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const whatHappens = [
    { step: '1', title: 'Submit Your Information', desc: 'Fill out the form with your wallet address, transaction details, and a brief description of what happened.' },
    { step: '2', title: 'We Review Your Case', desc: 'A certified investigator reviews your submission within 24 hours and assesses traceability.' },
    { step: '3', title: 'You Get an Honest Assessment', desc: 'We contact you with a clear evaluation: what we can find, how long it takes, and what it costs.' },
    { step: '4', title: 'You Decide', desc: 'No pressure. You decide if you want to proceed. If not — you paid nothing.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* Left - Info */}
            <div className="pt-4">
              <p className="section-tag">Free · No Obligation · Confidential</p>
              <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 leading-tight mb-5">
                Free Case<br /><span className="text-brand-600">Evaluation</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Tell us what happened. We'll tell you if your funds are traceable, what evidence we can build, and exactly what it will cost — within 24 hours.
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
                  { icon: Lock, text: 'Completely confidential — your information is never shared' },
                  { icon: Shield, text: 'No obligation — you decide if you want to proceed' },
                  { icon: Clock, text: 'Response within 24 hours — often sooner' },
                  { icon: CheckCircle2, text: 'Honest assessment — we\'ll tell you if we can\'t help' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-slate-700">
                    <Icon size={15} className="text-brand-600 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
                <Phone size={14} className="text-brand-500" />
                <span>Prefer to call?</span>
                <a href="tel:+18335591334" className="text-brand-600 font-semibold hover:underline">+1 (833) 559-1334</a>
                <span className="text-slate-300">·</span>
                <span className="text-brand-600 font-semibold">Говорим по-русски</span>
              </div>
            </div>

            {/* Right - Form */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 sm:p-8">
              <h2 className="font-display font-bold text-2xl text-slate-900 mb-1">Submit Your Case</h2>
              <p className="text-sm text-slate-500 mb-6">Fields marked with * are required</p>

              <form className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name *</label>
                    <input type="text" required className="input" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name *</label>
                    <input type="text" required className="input" placeholder="Smith" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address *</label>
                  <input type="email" required className="input" placeholder="john@example.com" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone (optional)</label>
                  <input type="tel" className="input" placeholder="+1 (555) 000-0000" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Approximate Amount Lost *</label>
                  <select className="input bg-white">
                    <option value="">Select range...</option>
                    <option>Under $10,000</option>
                    <option>$10,000 – $50,000</option>
                    <option>$50,000 – $100,000</option>
                    <option>$100,000 – $500,000</option>
                    <option>Over $500,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type of Incident *</label>
                  <select className="input bg-white">
                    <option value="">Select type...</option>
                    <option>Romance / Pig Butchering Scam</option>
                    <option>Fake Trading Platform</option>
                    <option>Hacked Wallet / Exchange</option>
                    <option>Investment Fraud</option>
                    <option>Divorce — Hidden Crypto</option>
                    <option>Business / Employee Theft</option>
                    <option>Ransomware Payment</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Wallet Address or Transaction Hash</label>
                  <input type="text" className="input font-mono text-sm" placeholder="bc1q... or 0x..." />
                  <p className="text-xs text-slate-400 mt-1">If you don't have this, describe what you do have in the box below.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Describe What Happened *</label>
                  <textarea
                    required
                    rows={5}
                    className="input resize-none"
                    placeholder="Tell us what happened: how you met the scammer, what platform was involved, how money was sent, and any other details you have..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred Language</label>
                  <select className="input bg-white">
                    <option>English</option>
                    <option>Русский (Russian)</option>
                    <option>Español (Spanish)</option>
                    <option>中文 (Chinese)</option>
                    <option>Français (French)</option>
                    <option>العربية (Arabic)</option>
                  </select>
                </div>

                <div className="flex items-start gap-3">
                  <input type="checkbox" id="consent" required className="mt-1 accent-brand-600" />
                  <label htmlFor="consent" className="text-xs text-slate-500 leading-relaxed">
                    I understand that this is a forensic investigation service, not a law firm, and that LedgerHound does not provide legal advice. I consent to being contacted about my case.
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full justify-center text-base py-3.5"
                >
                  Submit Free Evaluation Request
                </button>

                <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
                  <Lock size={11} />
                  Your information is confidential and encrypted. We respond within 24 hours.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

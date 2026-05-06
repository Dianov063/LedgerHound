'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Users,
  Award,
  Globe,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Briefcase,
  Wrench,
  TrendingUp,
  Shield,
} from 'lucide-react';
import {
  CERTIFICATIONS,
  SPECIALIZATIONS,
  LANGUAGES,
  YEARS_EXPERIENCE_OPTIONS,
  HOW_HEARD_OPTIONS,
  type Certification,
  type Specialization,
  type Language,
  type YearsExperience,
} from '@/lib/investigators/schema';

interface FormState {
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  linkedinUrl: string;
  websiteUrl: string;
  certifications: Certification[];
  certificationsOther: string;
  yearsExperience: YearsExperience | '';
  specializations: Specialization[];
  languages: Language[];
  bio: string;
  hourlyRateMin: string;
  hourlyRateMax: string;
  minCaseSize: string;
  acceptsContingency: boolean;
  licensedIn: string;
  expertWitnessIn: string;
  sampleCaseStudy: string;
  howDidYouHear: string;
  agreementAccepted: boolean;
  resumeFile: File | null;
}

const INITIAL_STATE: FormState = {
  name: '',
  email: '',
  phone: '',
  city: '',
  country: '',
  linkedinUrl: '',
  websiteUrl: '',
  certifications: [],
  certificationsOther: '',
  yearsExperience: '',
  specializations: [],
  languages: [],
  bio: '',
  hourlyRateMin: '',
  hourlyRateMax: '',
  minCaseSize: '',
  acceptsContingency: false,
  licensedIn: '',
  expertWitnessIn: '',
  sampleCaseStudy: '',
  howDidYouHear: '',
  agreementAccepted: false,
  resumeFile: null,
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip "data:application/pdf;base64," prefix
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function JoinNetworkPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function toggleCert(cert: Certification) {
    update('certifications', form.certifications.includes(cert)
      ? form.certifications.filter((c) => c !== cert)
      : [...form.certifications, cert]);
  }
  function toggleSpec(spec: Specialization) {
    update('specializations', form.specializations.includes(spec)
      ? form.specializations.filter((s) => s !== spec)
      : [...form.specializations, spec]);
  }
  function toggleLang(lang: Language) {
    update('languages', form.languages.includes(lang)
      ? form.languages.filter((l) => l !== lang)
      : [...form.languages, lang]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    /* Client-side validation */
    if (form.bio.length < 50) return setError('Bio must be at least 50 characters');
    if (form.bio.length > 500) return setError('Bio max 500 characters');
    if (form.certifications.length === 0) return setError('Select at least one certification');
    if (form.certifications.includes('Other') && !form.certificationsOther.trim()) {
      return setError('Specify your "Other" certification');
    }
    if (form.specializations.length === 0) return setError('Select at least one specialization');
    if (form.languages.length === 0) return setError('Select at least one language');
    if (!form.yearsExperience) return setError('Select your years of experience');
    if (!form.agreementAccepted) return setError('You must accept the agreement');

    setSubmitting(true);

    let resumeBase64: string | undefined;
    let resumeFileName: string | undefined;
    if (form.resumeFile) {
      if (form.resumeFile.size > 5 * 1024 * 1024) {
        setError('Resume must be under 5 MB');
        setSubmitting(false);
        return;
      }
      try {
        resumeBase64 = await fileToBase64(form.resumeFile);
        resumeFileName = form.resumeFile.name;
      } catch {
        setError('Failed to read resume file');
        setSubmitting(false);
        return;
      }
    }

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        city: form.city,
        country: form.country,
        linkedinUrl: form.linkedinUrl || undefined,
        websiteUrl: form.websiteUrl || undefined,
        certifications: form.certifications,
        certificationsOther: form.certificationsOther || undefined,
        yearsExperience: form.yearsExperience,
        specializations: form.specializations,
        languages: form.languages,
        bio: form.bio,
        hourlyRateMin: form.hourlyRateMin ? parseInt(form.hourlyRateMin, 10) : undefined,
        hourlyRateMax: form.hourlyRateMax ? parseInt(form.hourlyRateMax, 10) : undefined,
        minCaseSize: form.minCaseSize ? parseInt(form.minCaseSize, 10) : undefined,
        acceptsContingency: form.acceptsContingency,
        licensedIn: form.licensedIn ? form.licensedIn.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        expertWitnessIn: form.expertWitnessIn ? form.expertWitnessIn.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        sampleCaseStudy: form.sampleCaseStudy || undefined,
        howDidYouHear: form.howDidYouHear || undefined,
        agreementAccepted: form.agreementAccepted,
        resumeBase64,
        resumeFileName,
      };

      const res = await fetch('/api/investigators/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || 'Submission failed');
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <section className="pt-32 pb-20 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h1 className="font-display font-bold text-3xl text-slate-900 mb-3">Application Received</h1>
            <p className="text-slate-600 mb-6">
              Thanks for applying to the LedgerHound Investigator Network. We review applications within 5 business days. You'll receive a confirmation email shortly.
            </p>
            <p className="text-sm text-slate-500 mb-8">
              We verify each certification independently before approving profiles. If approved, we'll send NDA and onboarding details to your email.
            </p>
            <Link
              href={`${base}/`}
              className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-lg hover:bg-slate-800 text-sm"
            >
              Back to home
            </Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold mb-5">
            <Users size={12} />
            <span>Investigator Application</span>
          </div>
          <h1 className="font-display font-bold text-3xl md:text-5xl mb-4 leading-tight">
            Join the LedgerHound Investigator Network
          </h1>
          <p className="text-base md:text-lg text-slate-300">
            Partner with us on complex crypto fraud cases worldwide. Get qualified leads, transparent referral fees, and access to LedgerHound forensic tools.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, title: 'Qualified leads', desc: 'Pre-screened cases matched to your specialization, location, and language.' },
              { icon: Wrench, title: 'Tool access', desc: 'LedgerHound Wallet Tracker, Graph Tracer, Scam Database, and forensic report generator.' },
              { icon: Globe, title: 'Global network', desc: 'Connect with vetted investigators across 6 languages and dozens of jurisdictions.' },
              { icon: Briefcase, title: 'Training & resources', desc: 'Internal case studies, regulatory updates, and best-practice playbooks.' },
            ].map((b, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <b.icon size={20} className="text-brand-600 mb-3" />
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">{b.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral fee structure */}
      <section className="py-10 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={16} className="text-emerald-600" />
              <h2 className="font-display font-bold text-lg text-slate-900">How the referral structure works</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>You set your own rates and engage clients directly. We don't middleman the engagement.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>15% referral fee</strong> on cases booked through the LedgerHound network. Paid by the investigator, not added to the client's bill.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Transparent reporting: each lead is logged with timestamps. No hidden fees.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>You can decline any lead with no penalty. We re-route to the next qualified investigator.</span>
              </li>
            </ul>
            <p className="text-xs text-slate-400 mt-4 italic">
              Future: automated payouts via Stripe Connect (in development). Until then, monthly invoicing.
            </p>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display font-bold text-xl text-slate-900 mb-4">Requirements</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <Shield size={14} className="text-brand-600 flex-shrink-0 mt-0.5" />
              <span>At least one recognized certification: <strong>CTCE, CFE, CAMS, EnCE, GCFE, or CCE</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield size={14} className="text-brand-600 flex-shrink-0 mt-0.5" />
              <span>Minimum <strong>2 years</strong> experience in fraud investigation, blockchain forensics, or related field.</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield size={14} className="text-brand-600 flex-shrink-0 mt-0.5" />
              <span>Clean professional record (no active disciplinary actions or unresolved complaints).</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield size={14} className="text-brand-600 flex-shrink-0 mt-0.5" />
              <span>Willingness to sign LedgerHound's NDA and <Link href={`${base}/legal/investigator-agreement`} className="text-brand-600 hover:underline">network agreement</Link> after approval.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display font-bold text-2xl text-slate-900 mb-6">Application Form</h2>

          <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            {/* Identity */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identity</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full name *</label>
                  <input type="text" required value={form.name} onChange={(e) => update('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                  <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (optional)</label>
                  <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                    <input type="text" required value={form.city} onChange={(e) => update('city', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Country *</label>
                    <input type="text" required value={form.country} onChange={(e) => update('country', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400" />
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn URL</label>
                  <input type="url" value={form.linkedinUrl} onChange={(e) => update('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Website (optional)</label>
                  <input type="url" value={form.websiteUrl} onChange={(e) => update('websiteUrl', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400" />
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Certifications *</h3>
              <p className="text-xs text-slate-500">Select all that apply. We verify each certification independently.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {CERTIFICATIONS.map((c) => (
                  <label key={c.value} className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer ${form.certifications.includes(c.value) ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="checkbox" checked={form.certifications.includes(c.value)} onChange={() => toggleCert(c.value)} className="mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-slate-800">{c.label}</div>
                      <div className="text-[10px] text-slate-500">{c.full}</div>
                    </div>
                  </label>
                ))}
              </div>
              {form.certifications.includes('Other') && (
                <input type="text" value={form.certificationsOther} onChange={(e) => update('certificationsOther', e.target.value)} placeholder="Specify your other certification"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400" />
              )}
            </div>

            {/* Experience + Specializations + Languages */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Years of experience *</label>
                <select required value={form.yearsExperience} onChange={(e) => update('yearsExperience', e.target.value as YearsExperience | '')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:border-slate-400">
                  <option value="">Select...</option>
                  {YEARS_EXPERIENCE_OPTIONS.map((y) => <option key={y} value={y}>{y} years</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Specializations *</label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {SPECIALIZATIONS.map((s) => (
                    <label key={s} className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs ${form.specializations.includes(s) ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="checkbox" checked={form.specializations.includes(s)} onChange={() => toggleSpec(s)} className="mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Languages spoken *</label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map((l) => (
                    <button type="button" key={l.code} onClick={() => toggleLang(l.code)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.languages.includes(l.code) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Brief bio * <span className="font-normal text-slate-400">(50-500 chars)</span>
              </label>
              <textarea required maxLength={500} rows={4} value={form.bio} onChange={(e) => update('bio', e.target.value)}
                placeholder="What's your background? What makes you a good fit for LedgerHound's network?"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400 resize-y" />
              <p className="text-[10px] text-slate-400 mt-1">{form.bio.length} / 500 chars</p>
            </div>

            {/* Sample case study */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Sample case study <span className="font-normal text-slate-400">(optional, max 3000 chars)</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">Describe a case you worked on (anonymized — no client info). Demonstrates real-world experience.</p>
              <textarea maxLength={3000} rows={5} value={form.sampleCaseStudy} onChange={(e) => update('sampleCaseStudy', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400 resize-y" />
            </div>

            {/* Pricing (private) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Rates & case fit <span className="font-normal text-slate-400">(private — admin only, used for matching)</span>
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hourly rate min (USD)</label>
                  <input type="number" min={0} value={form.hourlyRateMin} onChange={(e) => update('hourlyRateMin', e.target.value)} placeholder="200"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hourly rate max (USD)</label>
                  <input type="number" min={0} value={form.hourlyRateMax} onChange={(e) => update('hourlyRateMax', e.target.value)} placeholder="500"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min case size (USD)</label>
                  <input type="number" min={0} value={form.minCaseSize} onChange={(e) => update('minCaseSize', e.target.value)} placeholder="1000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.acceptsContingency} onChange={(e) => update('acceptsContingency', e.target.checked)} />
                <span>I accept contingency / success-fee arrangements</span>
              </label>
            </div>

            {/* Jurisdictions */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jurisdictions</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Licensed to operate in <span className="text-slate-400 font-normal">(comma-separated countries)</span></label>
                <input type="text" value={form.licensedIn} onChange={(e) => update('licensedIn', e.target.value)} placeholder="United States, Canada, United Kingdom"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Can provide expert witness testimony in <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                <input type="text" value={form.expertWitnessIn} onChange={(e) => update('expertWitnessIn', e.target.value)} placeholder="United States, United Kingdom"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400" />
              </div>
            </div>

            {/* Resume */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Resume / CV <span className="font-normal text-slate-400">(optional, PDF only, max 5 MB)</span>
              </label>
              <input type="file" accept="application/pdf" onChange={(e) => update('resumeFile', e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold file:text-xs hover:file:bg-slate-200" />
            </div>

            {/* How heard */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">How did you hear about us?</label>
              <select value={form.howDidYouHear} onChange={(e) => update('howDidYouHear', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:border-slate-400">
                <option value="">Select...</option>
                {HOW_HEARD_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Agreement */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input type="checkbox" required checked={form.agreementAccepted} onChange={(e) => update('agreementAccepted', e.target.checked)} className="mt-1 flex-shrink-0" />
                <span>
                  I agree to LedgerHound's <Link href={`${base}/legal/investigator-agreement`} className="text-brand-600 hover:underline">Investigator Network Agreement</Link>, including NDA requirements and the 15% referral fee structure. I understand that my certifications will be independently verified before my profile becomes public.
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : <><Send size={14} /> Submit Application</>}
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}

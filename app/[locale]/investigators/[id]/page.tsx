'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Shield,
  MapPin,
  Briefcase,
  CheckCircle2,
  BadgeCheck,
  Star,
  Globe,
  Linkedin,
  ExternalLink,
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import type { PublicInvestigator, Availability } from '@/lib/investigators/schema';
import { LANGUAGES, CERTIFICATIONS } from '@/lib/investigators/schema';

const AVAILABILITY_LABEL: Record<Availability, { label: string; color: string; desc: string }> = {
  available: { label: 'Available for new cases', color: 'bg-emerald-500', desc: 'Currently accepting new cases' },
  limited: { label: 'Limited availability', color: 'bg-amber-500', desc: 'Accepting select cases only' },
  unavailable: { label: 'Currently unavailable', color: 'bg-slate-400', desc: 'Not accepting new cases right now' },
};

function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export default function InvestigatorProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const [inv, setInv] = useState<PublicInvestigator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Contact form
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    fromName: '',
    fromEmail: '',
    fromPhone: '',
    estimatedLoss: '',
    urgency: 'normal' as 'urgent' | 'normal' | 'consultation',
    caseSummary: '',
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/investigators/list?pageSize=200`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const found = (data.investigators || []).find((i: PublicInvestigator) => i.id === id);
        if (!found) {
          setError('Investigator not found');
        } else {
          setInv(found);
        }
      })
      .catch((e) => setError(e.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  async function submitContact(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/investigators/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investigatorId: id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setSubmitted(true);
    } catch (e: any) {
      setFormError(e.message || 'Submission failed');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <Loader2 size={20} className="text-slate-400 animate-spin" />
        </div>
        <Footer />
      </>
    );
  }

  if (error || !inv) {
    return (
      <>
        <Navbar />
        <div className="pt-32 pb-20 max-w-3xl mx-auto px-4 text-center">
          <h1 className="font-display font-bold text-2xl text-slate-900 mb-2">Profile not found</h1>
          <p className="text-sm text-slate-500 mb-6">{error || 'This investigator does not exist or is not currently active.'}</p>
          <Link
            href={`${base}/investigators`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft size={14} /> Back to directory
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const avail = AVAILABILITY_LABEL[inv.availability];

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            <Link href={`${base}/`} className="hover:text-brand-600">Home</Link>
            <ChevronRight size={12} />
            <Link href={`${base}/investigators`} className="hover:text-brand-600">Investigators</Link>
            <ChevronRight size={12} />
            <span className="text-slate-600 truncate">{inv.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                {inv.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={inv.photo} alt={inv.name} className="w-32 h-32 rounded-2xl object-cover" />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-white text-3xl">
                    {getInitials(inv.name)}
                  </div>
                )}
                <span
                  className={`absolute -bottom-1 -right-1 w-7 h-7 ${avail.color} rounded-full border-4 border-white`}
                  title={avail.label}
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">{inv.name}</h1>
                {inv.isTeam && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 border border-brand-200 flex items-center gap-1">
                    <Shield size={10} /> Team
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 mb-3 flex-wrap">
                <span className="flex items-center gap-1"><MapPin size={12} />{inv.city}, {inv.country}</span>
                <span className="flex items-center gap-1"><Briefcase size={12} />{inv.yearsExperience} years</span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 ${avail.color} rounded-full`} />
                  {avail.label}
                </span>
              </div>

              {/* Verification badges */}
              {(inv.identityVerified || inv.certificationVerified || inv.topInvestigator) && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {inv.identityVerified && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                      <BadgeCheck size={11} /> Identity Verified
                    </span>
                  )}
                  {inv.certificationVerified && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Certifications Verified
                    </span>
                  )}
                  {inv.topInvestigator && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                      <Star size={11} /> Top Investigator
                    </span>
                  )}
                </div>
              )}

              {/* External links */}
              <div className="flex items-center gap-3 text-xs">
                {inv.linkedinUrl && (
                  <a
                    href={inv.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-brand-600 flex items-center gap-1"
                  >
                    <Linkedin size={11} /> LinkedIn
                  </a>
                )}
                {inv.websiteUrl && (
                  <a
                    href={inv.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-brand-600 flex items-center gap-1"
                  >
                    <ExternalLink size={11} /> Website
                  </a>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                disabled={inv.availability === 'unavailable'}
                className="bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-md"
              >
                <Send size={14} /> Request This Investigator
              </button>
              <p className="text-[10px] text-slate-400 mt-2 text-center max-w-xs">
                {inv.availability === 'unavailable' ? 'Not accepting cases right now' : 'Free initial review · 24h response'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 mb-3">About</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{inv.bio}</p>
            </div>

            {/* Specializations */}
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 mb-3">Specializations</h2>
              <div className="flex flex-wrap gap-2">
                {inv.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 border border-brand-100"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 mb-3">Certifications</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {inv.certifications.map((c) => {
                  const cert = CERTIFICATIONS.find((x) => x.value === c);
                  return cert ? (
                    <div
                      key={c}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-brand-600 text-xs">
                        {cert.label}
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-slate-800">{cert.label}</div>
                        <div className="text-slate-500">{cert.full}</div>
                      </div>
                    </div>
                  ) : null;
                })}
                {inv.certificationsOther && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-brand-600 text-xs">
                      +
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-slate-800">Additional</div>
                      <div className="text-slate-500">{inv.certificationsOther}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Expert witness */}
            {inv.expertWitnessIn && inv.expertWitnessIn.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900 mb-3">Expert Witness Jurisdictions</h2>
                <p className="text-xs text-slate-500 mb-2">Can provide expert witness testimony in:</p>
                <div className="flex flex-wrap gap-2">
                  {inv.expertWitnessIn.map((country) => (
                    <span
                      key={country}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-100"
                    >
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Languages */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Globe size={11} /> Languages Spoken
              </h3>
              <div className="space-y-1.5">
                {inv.languages.map((code) => {
                  const lang = LANGUAGES.find((l) => l.code === code);
                  return lang ? (
                    <div key={code} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Stats */}
            {inv.showStats && (inv.casesCompleted !== undefined || inv.recoveryRatePercent !== undefined) && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Track Record</h3>
                <div className="space-y-3">
                  {inv.casesCompleted !== undefined && (
                    <div>
                      <div className="text-2xl font-display font-bold text-slate-900">{inv.casesCompleted}+</div>
                      <div className="text-xs text-slate-600">Cases completed</div>
                    </div>
                  )}
                  {inv.recoveryRatePercent !== undefined && (
                    <div>
                      <div className="text-2xl font-display font-bold text-slate-900">{inv.recoveryRatePercent}%</div>
                      <div className="text-xs text-slate-600">Recovery rate</div>
                    </div>
                  )}
                  {inv.avgResponseHours !== undefined && (
                    <div>
                      <div className="text-2xl font-display font-bold text-slate-900">{inv.avgResponseHours}h</div>
                      <div className="text-xs text-slate-600">Avg response time</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trust signals */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">How It Works</h3>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-700">1.</span>
                  <span>You submit a request through this page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-700">2.</span>
                  <span>LedgerHound forwards to the investigator within 24h</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-700">3.</span>
                  <span>Investigator replies directly to your email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-700">4.</span>
                  <span>You discuss scope and engage them directly</span>
                </li>
              </ul>
              <p className="text-[10px] text-slate-500 mt-3 italic">
                LedgerHound earns a 15% referral fee from cases booked through the network. This is paid by the investigator, not added to your bill.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Contact form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => !submitting && setShowForm(false)}>
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 my-auto max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} className="text-emerald-600" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">Request Sent</h3>
                <p className="text-sm text-slate-500 mb-5">
                  Your request has been forwarded to {inv.name}. You should hear back within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setSubmitted(false); setForm({ fromName: '', fromEmail: '', fromPhone: '', estimatedLoss: '', urgency: 'normal', caseSummary: '' }); }}
                  className="px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    Request {inv.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => !submitting && setShowForm(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={submitContact} className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your name *</label>
                      <input
                        type="text"
                        required
                        value={form.fromName}
                        onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={form.fromEmail}
                        onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (optional)</label>
                      <input
                        type="tel"
                        value={form.fromPhone}
                        onChange={(e) => setForm({ ...form, fromPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated loss</label>
                      <select
                        value={form.estimatedLoss}
                        onChange={(e) => setForm({ ...form, estimatedLoss: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:border-slate-400"
                      >
                        <option value="">Select...</option>
                        <option value="<$1K">Under $1,000</option>
                        <option value="$1K-$10K">$1,000 – $10,000</option>
                        <option value="$10K-$50K">$10,000 – $50,000</option>
                        <option value="$50K-$250K">$50,000 – $250,000</option>
                        <option value="$250K-$1M">$250,000 – $1M</option>
                        <option value="$1M+">$1M+</option>
                        <option value="N/A">Not applicable</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency *</label>
                    <select
                      value={form.urgency}
                      onChange={(e) => setForm({ ...form, urgency: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:border-slate-400"
                    >
                      <option value="normal">Normal — within a few days</option>
                      <option value="urgent">Urgent — funds may still be moveable</option>
                      <option value="consultation">Consultation only — no active case</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Case summary * <span className="text-slate-400 font-normal">(min 20 chars, max 2000)</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      maxLength={2000}
                      value={form.caseSummary}
                      onChange={(e) => setForm({ ...form, caseSummary: e.target.value })}
                      placeholder="Describe what happened, the wallet/transaction details, and what kind of help you need..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400 resize-y"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">{form.caseSummary.length} / 2000 chars</p>
                  </div>

                  {formError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                      <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">{formError}</p>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500">
                    Your information is private. We forward it to the investigator and keep a record for our matching team. By submitting, you agree to our <Link href={`${base}/privacy`} className="text-brand-600 hover:underline">Privacy Policy</Link>.
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {submitting ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : <><Send size={14} /> Send Request</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

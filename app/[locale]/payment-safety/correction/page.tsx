'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { CheckCircle2, FileText, Loader2, Scale } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const RAILS = [
  ['zelle', 'Zelle'], ['cashapp', 'Cash App'], ['venmo', 'Venmo'], ['paypal', 'PayPal'],
  ['apple_cash', 'Apple Cash'], ['chime', 'Chime'], ['wise', 'Wise'], ['revolut', 'Revolut'],
  ['bank_account', 'Bank account'], ['phone', 'Phone'], ['email', 'Email'],
  ['social_handle', 'Social handle'], ['marketplace_profile', 'Marketplace profile'], ['other', 'Other'],
];

export default function PaymentSafetyCorrectionPage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [correctionId, setCorrectionId] = useState('');

  async function submitCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const evidenceFiles: string[] = [];
      for (const file of files.slice(0, 5)) {
        const upload = new FormData();
        upload.append('file', file);
        const uploadRes = await fetch('/api/non-crypto-scam-database/upload', { method: 'POST', body: upload });
        const uploaded = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploaded.error || `Unable to upload ${file.name}`);
        evidenceFiles.push(uploaded.key);
      }

      const res = await fetch('/api/non-crypto-scam-database/correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: data.get('country'),
          rail: data.get('rail'),
          paymentIdentifier: data.get('paymentIdentifier'),
          contactName: data.get('contactName'),
          contactEmail: data.get('contactEmail'),
          relationship: data.get('relationship'),
          reason: data.get('reason'),
          explanation: data.get('explanation'),
          declarationAccepted: data.get('declarationAccepted') === 'on',
          evidenceFiles,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Unable to submit correction request');
      setCorrectionId(body.correctionId);
      setStatus('success');
      setFiles([]);
      event.currentTarget.reset();
    } catch (err: any) {
      setError(err.message || 'Unable to submit correction request');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 mb-3"><Scale size={17} /> Accuracy review</div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-950">Request a correction</h1>
            <p className="text-slate-600 mt-3">Use this form if a payment identifier belongs to you or a warning contains inaccurate information. Submitting a request does not automatically remove a warning.</p>
          </div>

          <form onSubmit={submitCorrection} className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Country</label>
                <select name="country" defaultValue="US" className="input bg-white"><option>US</option><option>CA</option><option>GB</option><option>OTHER</option></select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Payment method</label>
                <select name="rail" defaultValue="zelle" className="input bg-white">{RAILS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Payment identifier</label>
                <input name="paymentIdentifier" required minLength={3} className="input" placeholder="Exact phone, email, or handle" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Your name</label><input name="contactName" required minLength={3} className="input" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact email</label><input name="contactEmail" type="email" required className="input" /></div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Relationship</label>
                <select name="relationship" required defaultValue="" className="input bg-white"><option value="" disabled>Select</option><option value="account_owner">Account owner</option><option value="authorized_representative">Authorized representative</option><option value="affected_person">Affected person</option><option value="other">Other</option></select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason</label>
                <select name="reason" required defaultValue="" className="input bg-white"><option value="" disabled>Select</option><option value="wrong_recipient">Wrong recipient</option><option value="inaccurate_information">Inaccurate information</option><option value="identifier_reassigned">Phone or account reassigned</option><option value="false_or_duplicate_reports">False or duplicate reports</option><option value="other">Other</option></select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Explanation</label>
              <textarea name="explanation" required minLength={200} maxLength={5000} rows={7} className="input resize-none" placeholder="Explain what is inaccurate, when you obtained this identifier, and what evidence supports the correction." />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Supporting evidence</label>
              <input type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))} className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
              <p className="text-xs text-slate-500 mt-1">Optional. Up to 5 private PDF or image files.</p>
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 mb-5 text-sm text-slate-700">
              <input type="checkbox" name="declarationAccepted" required className="mt-0.5 accent-brand-600" />
              I confirm that this request is accurate to the best of my knowledge and that I am authorized to submit it.
            </label>

            {status === 'success' && <div className="mb-5 border border-emerald-200 bg-emerald-50 rounded-lg p-4 text-sm text-emerald-800"><CheckCircle2 size={18} className="inline mr-2" />Request received: <span className="font-mono font-semibold">{correctionId}</span></div>}
            {error && <div className="mb-5 border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700">{error}</div>}

            <button type="submit" disabled={status === 'loading'} className="btn-primary w-full justify-center py-3 disabled:opacity-60">{status === 'loading' ? <Loader2 size={17} className="animate-spin" /> : <FileText size={17} />} Submit correction request</button>
          </form>
          <Link href={`${base}/payment-safety`} className="inline-block mt-5 text-sm font-semibold text-brand-600">Back to payment safety</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

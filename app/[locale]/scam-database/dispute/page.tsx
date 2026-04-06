'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Upload,
  FileText,
  ArrowRight,
  Loader2,
  Scale,
} from 'lucide-react';

interface PlatformOption {
  slug: string;
  name: string;
}

const RELATIONSHIP_OPTIONS = [
  { value: 'platform_owner', label: 'Platform Owner / Operator' },
  { value: 'legal_representative', label: 'Legal Representative' },
  { value: 'other', label: 'Other Interested Party' },
];

const EVIDENCE_TYPES = [
  { value: 'proof_of_legitimacy', label: 'Proof of Legitimacy' },
  { value: 'incorrect_information', label: 'Incorrect Information in Listing' },
  { value: 'defamation_claim', label: 'Defamation / False Statement Claim' },
];

export default function DisputePage() {
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
  const [platformSearch, setPlatformSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState({
    platformSlug: '',
    platformName: '',
    relationship: '',
    contactEmail: '',
    evidenceType: '',
    description: '',
    perjuryAcknowledge: false,
  });

  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [disputeId, setDisputeId] = useState('');
  const [error, setError] = useState('');

  // Load platforms for autocomplete
  useEffect(() => {
    fetch('/api/scam-database/stats')
      .then((r) => r.json())
      .then(() => {
        // Load platform index for autocomplete
        fetch('/api/scam-database/search?q=')
          .then((r) => r.json())
          .then((data) => {
            if (data.platforms) {
              setPlatforms(data.platforms.map((p: any) => ({ slug: p.slug, name: p.name })));
            }
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  const filteredPlatforms = platforms.filter((p) =>
    p.name.toLowerCase().includes(platformSearch.toLowerCase())
  );

  const selectPlatform = (p: PlatformOption) => {
    setForm({ ...form, platformSlug: p.slug, platformName: p.name });
    setPlatformSearch(p.name);
    setShowSuggestions(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    // Max 5 files, max 10MB each
    const valid = newFiles.filter((f) => {
      if (f.size > 10 * 1024 * 1024) return false;
      if (!['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(f.type)) return false;
      return true;
    });
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit =
    form.platformSlug &&
    form.relationship &&
    form.contactEmail &&
    form.contactEmail.includes('@') &&
    form.evidenceType &&
    form.description.length >= 500 &&
    form.perjuryAcknowledge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');

    try {
      // Upload evidence files first (if any)
      const uploadedFiles: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('/api/scam-database/dispute/upload', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          uploadedFiles.push(data.key);
        }
      }

      const res = await fetch('/api/scam-database/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformSlug: form.platformSlug,
          contactEmail: form.contactEmail,
          relationship: form.relationship,
          evidenceType: form.evidenceType,
          reason: form.description,
          evidenceFiles: uploadedFiles,
          perjuryAcknowledge: form.perjuryAcknowledge,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit dispute');

      setDisputeId(data.disputeId);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit dispute');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 pt-28 pb-20">
          <div className="bg-emerald-950/30 border border-emerald-800 rounded-2xl p-10 text-center">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
            <h1 className="font-display font-bold text-2xl text-white mb-3">Dispute Submitted</h1>
            <p className="text-emerald-200 mb-2">Your dispute has been received and assigned ID:</p>
            <p className="font-mono text-lg text-emerald-400 mb-6">{disputeId}</p>
            <p className="text-slate-400 text-sm mb-8">
              We will review your dispute within 7 business days and respond to <strong className="text-white">{form.contactEmail}</strong>.
              You will receive a confirmation email shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`${base}/scam-database`}
                className="inline-flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Back to Scam Database
              </Link>
              <Link
                href={`${base}/legal/dispute-policy`}
                className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 px-6 py-3"
              >
                View Dispute Policy <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-600/20 rounded-2xl mb-4">
            <Scale size={28} className="text-amber-400" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-3">Dispute a Listing</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            If you believe a listing in the LedgerHound Scam Database is inaccurate or unjust, submit a formal dispute below.
            We review all disputes within 7 business days per our{' '}
            <Link href={`${base}/legal/dispute-policy`} className="text-brand-400 hover:underline">
              Dispute Policy
            </Link>.
          </p>
        </div>

        {/* Legal notice */}
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-5 mb-8">
          <div className="flex gap-3">
            <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-200 font-semibold text-sm mb-1">Important Legal Notice</p>
              <p className="text-amber-200/70 text-sm leading-relaxed">
                False statements submitted under penalty of perjury may result in legal consequences.
                Only submit a dispute if you have legitimate grounds to believe the listing is inaccurate.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Platform Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
              <Shield size={18} className="text-brand-400" />
              Platform Information
            </h2>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm text-slate-400 mb-1.5">Platform Name *</label>
                <input
                  type="text"
                  value={platformSearch}
                  onChange={(e) => {
                    setPlatformSearch(e.target.value);
                    setShowSuggestions(true);
                    if (!e.target.value) setForm({ ...form, platformSlug: '', platformName: '' });
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search for a platform..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {showSuggestions && platformSearch && filteredPlatforms.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredPlatforms.map((p) => (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => selectPlatform(p)}
                        className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-slate-700 transition-colors"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
                {form.platformSlug && (
                  <p className="text-emerald-400 text-xs mt-1">Selected: {form.platformName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Your Relationship *</label>
                <select
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select your relationship...</option>
                  {RELATIONSHIP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact & Evidence */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-brand-400" />
              Dispute Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Contact Email *</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-slate-500 text-xs mt-1">Used only for dispute correspondence. Never shared publicly.</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Evidence Type *</label>
                <select
                  value={form.evidenceType}
                  onChange={(e) => setForm({ ...form, evidenceType: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select evidence type...</option>
                  {EVIDENCE_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Detailed Description * <span className="text-slate-600">({form.description.length}/500 min)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={8}
                  placeholder="Provide a detailed explanation of why this listing is inaccurate. Include specific facts, dates, and any evidence that supports your dispute..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
                {form.description.length > 0 && form.description.length < 500 && (
                  <p className="text-amber-400 text-xs mt-1">{500 - form.description.length} more characters required</p>
                )}
                {form.description.length >= 500 && (
                  <p className="text-emerald-400 text-xs mt-1">Minimum length met</p>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Supporting Documents (optional)</label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-slate-600 transition-colors">
                  <Upload size={24} className="text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 mb-1">Upload PDFs or images (max 5 files, 10MB each)</p>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 cursor-pointer text-sm font-medium mt-1"
                  >
                    Choose Files
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                        <span className="text-sm text-slate-300 truncate">{f.name}</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 text-xs ml-2">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Perjury Acknowledgment */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.perjuryAcknowledge}
                onChange={(e) => setForm({ ...form, perjuryAcknowledge: e.target.checked })}
                className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-300 leading-relaxed">
                I declare under penalty of perjury that the information provided in this dispute is true and accurate to the best of my knowledge.
                I understand that false statements may result in legal consequences.
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Submitting Dispute...
              </>
            ) : (
              <>
                Submit Dispute <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}

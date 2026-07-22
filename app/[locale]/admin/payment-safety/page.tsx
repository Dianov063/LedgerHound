'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Lock,
  RefreshCw,
  Shield,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

type ReportStatus = 'pending' | 'accepted' | 'rejected';

interface AdminReport {
  id: string;
  createdAt: string;
  country: string;
  rail: string;
  paymentMethodDetails?: string;
  identityHash: string;
  identityMask: string;
  privateIdentifier: string;
  recipientName?: string;
  businessName?: string;
  aliases?: string[];
  category: string;
  categoryDetails?: string;
  amount?: number;
  currency?: string;
  incidentDate?: string;
  saleChannel?: string;
  saleChannelDetails?: string;
  sellerProfile?: string;
  listingUrl?: string;
  itemOrService?: string;
  promisedDeliveryDate?: string;
  refundRequested?: boolean;
  refundRequestDate?: string;
  lastContactDate?: string;
  privateTransactionReference?: string;
  transactionReferenceHash?: string;
  reportedTo?: string[];
  externalReportReference?: string;
  duplicateTransactionReference?: boolean;
  description: string;
  reporterEmail?: string;
  reporterEmailVerifiedAt?: string;
  evidenceTypes: string[];
  evidenceFiles: string[];
  hasPaymentProof: boolean;
  status: ReportStatus;
}

interface AdminIdentity {
  identityHash: string;
  country: string;
  rail: string;
  identityMask: string;
  categories: string[];
  aliases: string[];
  reportIds: string[];
  reportCount: number;
  independentReporters: number;
  paymentProofCount: number;
  totalReportedAmount: number;
  currency: string;
  firstReported: string;
  lastReported: string;
  publicLevel: string;
  publicEligible: boolean;
  indexedEligible: boolean;
}

interface AdminCorrection {
  id: string;
  createdAt: string;
  country: string;
  rail: string;
  identityHash: string;
  identityMask: string;
  privateIdentifier: string;
  contactName: string;
  contactEmail: string;
  relationship: string;
  reason: string;
  explanation: string;
  evidenceFiles: string[];
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  resolutionNote?: string;
}

interface AdminStats {
  totalReports: number;
  totalIdentities: number;
  publicEligibleIdentities: number;
  indexedEligibleIdentities: number;
  paymentProofReports: number;
  updatedAt: string;
}

export default function PaymentSafetyAdminPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSafetyAdminContent />
    </Suspense>
  );
}

function PaymentSafetyAdminContent() {
  const [inputPw, setInputPw] = useState('');
  const [adminPw, setAdminPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'clusters' | 'reports' | 'corrections'>('clusters');
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [identities, setIdentities] = useState<AdminIdentity[]>([]);
  const [corrections, setCorrections] = useState<AdminCorrection[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const fetchAdmin = async (pw: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/non-crypto-scam-database/admin', {
        headers: { 'x-admin-key': pw },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unauthorized');
        setAuthed(false);
        sessionStorage.removeItem('lh-admin-key');
        return;
      }
      setReports(data.reports || []);
      setIdentities(data.identities || []);
      setCorrections(data.corrections || []);
      setStats(data.stats || null);
      setAdminPw(pw);
      setAuthed(true);
      sessionStorage.setItem('lh-admin-key', pw);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('lh-admin-key');
    if (saved) {
      setInputPw(saved);
      fetchAdmin(saved);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (inputPw) fetchAdmin(inputPw);
  };

  const adminAction = async (body: Record<string, unknown>) => {
    setActionLoading(String(body.reportId || body.identityHash || body.correctionId || 'action'));
    try {
      const res = await fetch('/api/non-crypto-scam-database/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminPw || inputPw,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      await fetchAdmin(adminPw || inputPw);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const openEvidence = async (key: string) => {
    try {
      const res = await fetch(`/api/non-crypto-scam-database/evidence?key=${encodeURIComponent(key)}`, {
        headers: { 'x-admin-key': adminPw || inputPw },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open evidence');
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      alert(err.message || 'Failed to open evidence');
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center">
              <Lock size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-white font-display font-bold text-xl text-center mb-2">Payment Safety Admin</h1>
          <p className="text-slate-500 text-sm text-center mb-6">Enter admin password to moderate payment reports</p>
          {error && <p className="text-red-400 text-sm text-center mb-4 bg-red-950/50 py-2 rounded-lg">{error}</p>}
          <input
            type="password"
            value={inputPw}
            onChange={(e) => setInputPw(e.target.value)}
            placeholder="Password"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button type="submit" className="w-full bg-brand-600 text-white font-semibold py-3 rounded-lg hover:bg-brand-700 transition-colors">
            Access Moderation
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl">Payment Safety Moderation</h1>
              <p className="text-slate-500 text-sm">Review reports before they become public risk signals</p>
            </div>
          </div>
          <button
            onClick={() => fetchAdmin(adminPw || inputPw)}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </header>

        {stats && (
          <div className="grid sm:grid-cols-5 gap-3 mb-6">
            <Stat label="Reports" value={stats.totalReports} />
            <Stat label="Recipients" value={stats.totalIdentities} />
            <Stat label="Public" value={stats.publicEligibleIdentities} tone="amber" />
            <Stat label="Indexed" value={stats.indexedEligibleIdentities} tone="emerald" />
            <Stat label="Proofs" value={stats.paymentProofReports} />
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('clusters')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'clusters' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Clusters ({identities.length})
          </button>
          <button
            onClick={() => setTab('reports')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'reports' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Reports ({reports.length})
          </button>
          <button
            onClick={() => setTab('corrections')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'corrections' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Corrections ({corrections.length})
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500 animate-pulse py-12">Loading...</p>
        ) : tab === 'clusters' ? (
          <div className="space-y-4">
            {identities.map((identity) => (
              <article key={identity.identityHash} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StatusBadge publicEligible={identity.publicEligible} indexedEligible={identity.indexedEligible} level={identity.publicLevel} />
                      <span className="text-xs text-slate-500">{identity.country} / {identity.rail}</span>
                    </div>
                    <h2 className="font-display font-bold text-lg text-white">{identity.identityMask}</h2>
                    <p className="text-xs font-mono text-slate-500 mt-1">{identity.identityHash}</p>
                    {identity.aliases.length > 0 && (
                      <p className="text-sm text-slate-400 mt-3">Aliases: {identity.aliases.join(', ')}</p>
                    )}
                  </div>

                  <button
                    onClick={() => adminAction({ action: 'staffReviewIdentity', identityHash: identity.identityHash })}
                    disabled={actionLoading === identity.identityHash}
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <ShieldCheck size={14} /> Staff Reviewed
                  </button>
                </div>

                <div className="grid sm:grid-cols-4 gap-3 mt-4">
                  <MiniMetric label="Reports" value={identity.reportCount} />
                  <MiniMetric label="Independent" value={identity.independentReporters} />
                  <MiniMetric label="Payment proofs" value={identity.paymentProofCount} />
                  <MiniMetric label="Amount" value={`${identity.currency} ${identity.totalReportedAmount}`} />
                </div>
              </article>
            ))}
          </div>
        ) : tab === 'reports' ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <article key={report.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <ReportStatusBadge status={report.status} />
                      <span className="text-xs text-slate-500">{report.country} / {report.rail} / {report.category}</span>
                      {report.reporterEmailVerifiedAt ? (
                        <span className="text-xs text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded-full">email verified</span>
                      ) : (
                        <span className="text-xs text-amber-300 bg-amber-950/50 px-2 py-1 rounded-full">email unverified</span>
                      )}
                      {report.hasPaymentProof && <span className="text-xs text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded-full">payment proof</span>}
                      {report.duplicateTransactionReference && (
                        <span className="text-xs text-red-300 bg-red-950/60 px-2 py-1 rounded-full">duplicate transaction reference</span>
                      )}
                    </div>
                    <h2 className="font-display font-bold text-lg text-white">{report.identityMask}</h2>
                    <p className="text-xs font-mono text-slate-500 mt-1">Report {report.id}</p>
                    <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
                      <Info label="Private identifier" value={report.privateIdentifier} mono />
                      <Info label="Reporter email" value={report.reporterEmail || '-'} />
                      <Info label="Recipient" value={[report.recipientName, report.businessName].filter(Boolean).join(' / ') || '-'} />
                      <Info label="Amount" value={report.amount ? `${report.currency || 'USD'} ${report.amount}` : '-'} />
                      <Info label="Item or service" value={report.itemOrService || '-'} />
                      <Info label="Sale channel" value={[report.saleChannel, report.saleChannelDetails].filter(Boolean).join(' / ') || '-'} />
                      <Info label="Seller profile" value={report.sellerProfile || '-'} mono />
                      <Info label="Transaction reference" value={report.privateTransactionReference || '-'} mono />
                      <Info label="Incident / promised" value={[report.incidentDate, report.promisedDeliveryDate].filter(Boolean).join(' / ') || '-'} />
                      <Info label="Last response" value={report.lastContactDate || '-'} />
                      <Info label="Refund requested" value={report.refundRequested ? `Yes${report.refundRequestDate ? ` / ${report.refundRequestDate}` : ''}` : 'No'} />
                      <Info label="Reported to" value={report.reportedTo?.join(', ') || '-'} />
                      <Info label="External report number" value={report.externalReportReference || '-'} mono />
                    </div>
                    {report.listingUrl && (
                      <a
                        href={report.listingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex mt-3 text-sm font-semibold text-brand-400 hover:text-brand-300 break-all"
                      >
                        Open listing or seller page
                      </a>
                    )}
                    {report.evidenceFiles && report.evidenceFiles.length > 0 && (
                      <div className="mt-4">
                        <span className="text-xs text-slate-500 block mb-2">Evidence files ({report.evidenceFiles.length})</span>
                        <div className="flex flex-wrap gap-2">
                          {report.evidenceFiles.map((file) => (
                            <button
                              key={file}
                              type="button"
                              onClick={() => openEvidence(file)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                            >
                              Open evidence
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-800 rounded-lg p-3 mt-4 whitespace-pre-wrap">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex lg:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => adminAction({ action: 'updateReportStatus', reportId: report.id, status: 'accepted' })}
                      disabled={actionLoading === report.id || report.status === 'accepted' || !report.reporterEmailVerifiedAt}
                      title={!report.reporterEmailVerifiedAt ? 'Reporter email must be verified first' : undefined}
                      className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} /> Accept
                    </button>
                    <button
                      onClick={() => adminAction({ action: 'updateReportStatus', reportId: report.id, status: 'rejected' })}
                      disabled={actionLoading === report.id || report.status === 'rejected'}
                      className="inline-flex items-center justify-center gap-1.5 bg-red-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {corrections.length === 0 && (
              <p className="text-slate-500 py-12 text-center">No correction requests yet.</p>
            )}
            {corrections.map((correction) => (
              <article key={correction.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <CorrectionStatusBadge status={correction.status} />
                      <span className="text-xs text-slate-500">{correction.country} / {correction.rail}</span>
                    </div>
                    <h2 className="font-display font-bold text-lg text-white">{correction.identityMask}</h2>
                    <p className="text-xs font-mono text-slate-500 mt-1">Request {correction.id}</p>
                    <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
                      <Info label="Private identifier" value={correction.privateIdentifier} mono />
                      <Info label="Contact" value={`${correction.contactName} / ${correction.contactEmail}`} />
                      <Info label="Relationship" value={correction.relationship} />
                      <Info label="Reason" value={correction.reason} />
                    </div>
                    {correction.evidenceFiles.length > 0 && (
                      <div className="mt-4">
                        <span className="text-xs text-slate-500 block mb-2">Private evidence ({correction.evidenceFiles.length})</span>
                        <div className="flex flex-wrap gap-2">
                          {correction.evidenceFiles.map((file) => (
                            <button
                              key={file}
                              type="button"
                              onClick={() => openEvidence(file)}
                              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                            >
                              Open evidence
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-800 rounded-lg p-3 mt-4 whitespace-pre-wrap">
                      {correction.explanation}
                    </p>
                    {correction.resolutionNote && (
                      <p className="text-sm text-slate-400 mt-3">Resolution note: {correction.resolutionNote}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => adminAction({ action: 'updateCorrectionStatus', correctionId: correction.id, status: 'under_review' })}
                      disabled={actionLoading === correction.id || correction.status === 'under_review'}
                      className="inline-flex items-center justify-center gap-1.5 bg-amber-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50"
                    >
                      <AlertTriangle size={14} /> Review
                    </button>
                    <button
                      onClick={() => adminAction({ action: 'updateCorrectionStatus', correctionId: correction.id, status: 'resolved' })}
                      disabled={actionLoading === correction.id || correction.status === 'resolved'}
                      className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} /> Resolve
                    </button>
                    <button
                      onClick={() => adminAction({ action: 'updateCorrectionStatus', correctionId: correction.id, status: 'rejected' })}
                      disabled={actionLoading === correction.id || correction.status === 'rejected'}
                      className="inline-flex items-center justify-center gap-1.5 bg-red-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'slate' }: { label: string; value: number; tone?: 'slate' | 'amber' | 'emerald' }) {
  const color = tone === 'emerald' ? 'text-emerald-400' : tone === 'amber' ? 'text-amber-400' : 'text-white';
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className={`font-display font-bold text-2xl ${color}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-800 rounded-lg p-3">
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-slate-500 block mb-1">{label}</span>
      <span className={`text-slate-300 ${mono ? 'font-mono text-xs break-all' : ''}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ publicEligible, indexedEligible, level }: { publicEligible: boolean; indexedEligible: boolean; level: string }) {
  if (indexedEligible) {
    return <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded-full"><ShieldCheck size={12} /> Indexed</span>;
  }
  if (publicEligible) {
    return <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-950/50 px-2 py-1 rounded-full"><AlertTriangle size={12} /> Public</span>;
  }
  return <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full"><Database size={12} /> {level}</span>;
}

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const style = status === 'accepted'
    ? 'text-emerald-400 bg-emerald-950/50'
    : status === 'rejected'
      ? 'text-red-400 bg-red-950/50'
      : 'text-amber-400 bg-amber-950/50';
  return <span className={`text-xs px-2 py-1 rounded-full font-semibold ${style}`}>{status}</span>;
}

function CorrectionStatusBadge({ status }: { status: AdminCorrection['status'] }) {
  const style = status === 'resolved'
    ? 'text-emerald-400 bg-emerald-950/50'
    : status === 'rejected'
      ? 'text-red-400 bg-red-950/50'
      : status === 'under_review'
        ? 'text-sky-400 bg-sky-950/50'
        : 'text-amber-400 bg-amber-950/50';
  return <span className={`text-xs px-2 py-1 rounded-full font-semibold ${style}`}>{status.replace('_', ' ')}</span>;
}

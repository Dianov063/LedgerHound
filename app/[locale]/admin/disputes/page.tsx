'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Lock, RefreshCw, Scale, Clock, CheckCircle2, XCircle, Eye, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface Dispute {
  id: string;
  createdAt: string;
  platformSlug?: string;
  contactEmail: string;
  reason: string;
  relationship?: string;
  evidenceType?: string;
  evidenceFiles?: string[];
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  resolvedAt?: string;
  resolutionNote?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-950/50' },
  under_review: { label: 'Under Review', color: 'text-blue-400', bg: 'bg-blue-950/50' },
  resolved: { label: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-950/50' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-950/50' },
};

export default function AdminDisputesPage() {
  return (
    <Suspense fallback={null}>
      <AdminDisputesContent />
    </Suspense>
  );
}

function AdminDisputesContent() {
  const searchParams = useSearchParams();
  const password = searchParams.get('password') || '';

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputPw, setInputPw] = useState(password);
  const [authed, setAuthed] = useState(!!password);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const fetchDisputes = async (pw: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/scam-database/admin?password=${encodeURIComponent(pw)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unauthorized');
        setAuthed(false);
        return;
      }
      setDisputes(data.disputes || []);
      setAuthed(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password) fetchDisputes(password);
    else setLoading(false);
  }, [password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPw) {
      window.history.replaceState(null, '', `?password=${encodeURIComponent(inputPw)}`);
      fetchDisputes(inputPw);
    }
  };

  const updateStatus = async (disputeId: string, newStatus: string, sendEmail: boolean = false) => {
    setActionLoading(disputeId);
    try {
      const res = await fetch(`/api/scam-database/admin?password=${encodeURIComponent(password || inputPw)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateDispute',
          disputeId,
          status: newStatus,
          resolutionNote: resolutionNote || undefined,
          sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update local state
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId
            ? { ...d, status: newStatus as Dispute['status'], resolutionNote: resolutionNote || d.resolutionNote, resolvedAt: ['resolved', 'rejected'].includes(newStatus) ? new Date().toISOString() : d.resolvedAt }
            : d
        )
      );
      setResolutionNote('');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading('');
    }
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredDisputes = filter === 'all' ? disputes : disputes.filter((d) => d.status === filter);

  // Login screen
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
              <Lock size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-white font-display font-bold text-xl text-center mb-2">Dispute Admin</h1>
          <p className="text-slate-500 text-sm text-center mb-6">Enter admin password to manage disputes</p>
          {error && <p className="text-red-400 text-sm text-center mb-4 bg-red-950/50 py-2 rounded-lg">{error}</p>}
          <input
            type="password"
            value={inputPw}
            onChange={(e) => setInputPw(e.target.value)}
            placeholder="Password"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button type="submit" className="w-full bg-brand-600 text-white font-semibold py-3 rounded-lg hover:bg-brand-700 transition-colors">
            Access Disputes
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <Scale size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl">Dispute Dashboard</h1>
              <p className="text-slate-500 text-sm">{disputes.length} total disputes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href={`/admin/reports?password=${encodeURIComponent(password || inputPw)}`} className="text-sm text-slate-400 hover:text-white transition-colors">
              Reports Dashboard →
            </a>
            <button
              onClick={() => fetchDisputes(password || inputPw)}
              className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { key: 'all', label: `All (${disputes.length})` },
            { key: 'pending', label: `Pending (${disputes.filter(d => d.status === 'pending').length})` },
            { key: 'under_review', label: `Under Review (${disputes.filter(d => d.status === 'under_review').length})` },
            { key: 'resolved', label: `Resolved (${disputes.filter(d => d.status === 'resolved').length})` },
            { key: 'rejected', label: `Rejected (${disputes.filter(d => d.status === 'rejected').length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-20">
            <p className="text-slate-500 animate-pulse">Loading disputes...</p>
          </div>
        )}

        {!loading && filteredDisputes.length === 0 && (
          <div className="text-center py-20">
            <Scale size={40} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">No disputes found</p>
          </div>
        )}

        {/* Dispute Cards */}
        {!loading && filteredDisputes.map((d) => {
          const status = STATUS_CONFIG[d.status] || STATUS_CONFIG.pending;
          const isExpanded = expandedId === d.id;

          return (
            <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-xl mb-4 overflow-hidden">
              {/* Summary Row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : d.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color} ${status.bg}`}>
                    {status.label}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {d.platformSlug || 'No platform'} — {d.contactEmail}
                    </p>
                    <p className="text-slate-500 text-xs">{fmtDate(d.createdAt)} · ID: {d.id}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-800 p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">Platform</span>
                      <span className="text-white">{d.platformSlug || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">Email</span>
                      <span className="text-white">{d.contactEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">Relationship</span>
                      <span className="text-white capitalize">{d.relationship?.replace('_', ' ') || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">Evidence Type</span>
                      <span className="text-white capitalize">{d.evidenceType?.replace(/_/g, ' ') || '—'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 text-xs block mb-1">Reason / Description</span>
                    <p className="text-slate-300 text-sm leading-relaxed bg-slate-800 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {d.reason}
                    </p>
                  </div>

                  {d.evidenceFiles && d.evidenceFiles.length > 0 && (
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">Evidence Files ({d.evidenceFiles.length})</span>
                      <div className="flex flex-wrap gap-2">
                        {d.evidenceFiles.map((f, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg">
                            <FileText size={12} /> {f.split('/').pop()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {d.resolutionNote && (
                    <div className="bg-slate-800 rounded-lg p-3">
                      <span className="text-slate-500 text-xs block mb-1">Resolution Note</span>
                      <p className="text-slate-300 text-sm">{d.resolutionNote}</p>
                      {d.resolvedAt && <p className="text-slate-500 text-xs mt-1">Resolved: {fmtDate(d.resolvedAt)}</p>}
                    </div>
                  )}

                  {/* Actions */}
                  {(d.status === 'pending' || d.status === 'under_review') && (
                    <div className="border-t border-slate-800 pt-4 space-y-3">
                      <textarea
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Resolution note (optional, will be included in email)..."
                        rows={2}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                      />
                      <div className="flex flex-wrap gap-2">
                        {d.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(d.id, 'under_review')}
                            disabled={actionLoading === d.id}
                            className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Eye size={14} /> Mark Under Review
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(d.id, 'resolved', true)}
                          disabled={actionLoading === d.id}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} /> Resolve (Remove/Update Listing)
                        </button>
                        <button
                          onClick={() => updateStatus(d.id, 'rejected', true)}
                          disabled={actionLoading === d.id}
                          className="inline-flex items-center gap-1.5 bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle size={14} /> Reject (Keep Listing)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileText, Download, Shield, Lock, RefreshCw } from 'lucide-react';

interface ReportEntry {
  caseId: string;
  walletAddress: string;
  email: string;
  network: string;
  s3Key: string;
  downloadUrl: string;
  stripePaymentId: string;
  createdAt: string;
  amount: number;
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={null}>
      <AdminReportsContent />
    </Suspense>
  );
}

function AdminReportsContent() {
  const searchParams = useSearchParams();
  const password = searchParams.get('password') || '';

  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputPw, setInputPw] = useState(password);
  const [authed, setAuthed] = useState(!!password);

  const fetchReports = async (pw: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/reports?password=${encodeURIComponent(pw)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unauthorized');
        setAuthed(false);
        setReports([]);
        return;
      }
      setReports(data.reports || []);
      setTotal(data.total || 0);
      setAuthed(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password) {
      fetchReports(password);
    } else {
      setLoading(false);
    }
  }, [password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPw) {
      // Update URL with password param
      window.history.replaceState(null, '', `?password=${encodeURIComponent(inputPw)}`);
      fetchReports(inputPw);
    }
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const shortAddr = (addr: string) =>
    addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : '—';

  // Login screen
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center">
              <Lock size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-white font-display font-bold text-xl text-center mb-2">Admin Access</h1>
          <p className="text-slate-500 text-sm text-center mb-6">Enter admin password to view reports</p>
          {error && (
            <p className="text-red-400 text-sm text-center mb-4 bg-red-950/50 py-2 rounded-lg">{error}</p>
          )}
          <input
            type="password"
            value={inputPw}
            onChange={(e) => setInputPw(e.target.value)}
            placeholder="Password"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="w-full bg-brand-600 text-white font-semibold py-3 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Access Reports
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl">Report Dashboard</h1>
              <p className="text-slate-500 text-sm">{total} reports generated</p>
            </div>
          </div>
          <button
            onClick={() => fetchReports(password || inputPw)}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading && (
          <div className="text-center py-20">
            <p className="text-slate-500 animate-pulse">Loading reports...</p>
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="text-center py-20">
            <FileText size={40} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">No reports generated yet</p>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3.5 font-medium">Date</th>
                    <th className="text-left px-5 py-3.5 font-medium">Case ID</th>
                    <th className="text-left px-5 py-3.5 font-medium">Wallet</th>
                    <th className="text-left px-5 py-3.5 font-medium">Email</th>
                    <th className="text-right px-5 py-3.5 font-medium">Amount</th>
                    <th className="text-left px-5 py-3.5 font-medium">Stripe</th>
                    <th className="text-center px-5 py-3.5 font-medium">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.caseId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {fmtDate(r.createdAt)}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-brand-400">
                        {r.caseId}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-300 whitespace-nowrap">
                        {shortAddr(r.walletAddress)}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {r.email}
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-mono text-emerald-400">
                        ${(r.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {r.stripePaymentId ? `${r.stripePaymentId.slice(0, 12)}...` : '—'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {r.downloadUrl ? (
                          <a
                            href={r.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                          >
                            <Download size={12} /> PDF
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

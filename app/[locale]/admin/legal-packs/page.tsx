'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Lock,
  RefreshCw,
  FileText,
  Download,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { COUNTRIES, type CountryConfig } from '@/lib/legal-packs/countries';
import type { CountryStatus, TemplateType, PipelineStatus } from '@/lib/legal-packs/types';

const TEMPLATE_TYPES: { key: TemplateType; label: string }[] = [
  { key: 'police-complaint', label: 'Police Complaint' },
  { key: 'preservation-letter', label: 'Preservation Letter' },
  { key: 'regulator-complaint', label: 'Regulator Complaint' },
  { key: 'action-guide', label: 'Action Guide' },
];

type DisplayStatus = 'researched' | 'generated' | 'validated' | 'error' | 'pending';

const STATUS_BADGES: Record<DisplayStatus, { label: string; color: string; bg: string }> = {
  researched: { label: 'Researched', color: 'text-blue-400', bg: 'bg-blue-950/50' },
  generated: { label: 'Generated', color: 'text-emerald-400', bg: 'bg-emerald-950/50' },
  validated: { label: 'Validated', color: 'text-purple-400', bg: 'bg-purple-950/50' },
  error: { label: 'Error', color: 'text-red-400', bg: 'bg-red-950/50' },
  pending: { label: 'Pending', color: 'text-slate-400', bg: 'bg-slate-800' },
};

function deriveDisplayStatus(cs: CountryStatus | undefined): DisplayStatus {
  if (!cs) return 'pending';
  if (cs.status === 'error') return 'error';
  if (cs.validatedAt && cs.validationPassed) return 'validated';
  if (cs.generatedAt) return 'generated';
  if (cs.researchedAt) return 'researched';
  return 'pending';
}

export default function AdminLegalPacksPage() {
  return (
    <Suspense fallback={null}>
      <AdminLegalPacksContent />
    </Suspense>
  );
}

function AdminLegalPacksContent() {
  const searchParams = useSearchParams();
  const passwordParam = searchParams.get('password') || '';

  const [inputPw, setInputPw] = useState(passwordParam);
  const [authed, setAuthed] = useState(!!passwordParam);
  const [password, setPassword] = useState(passwordParam);

  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Per-country loading states
  const [refreshingCountry, setRefreshingCountry] = useState<string | null>(null);
  const [generatingCountry, setGeneratingCountry] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [previewOpen, setPreviewOpen] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [previewLoading, setPreviewLoading] = useState(false);

  const headers = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'x-admin-key': password,
    }),
    [password]
  );

  const fetchList = useCallback(
    async (pw: string) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/legal-packs?action=list`, {
          headers: { 'x-admin-key': pw },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Unauthorized');
          setAuthed(false);
          return;
        }
        setPipelineStatus(data);
        setAuthed(true);
      } catch (err: any) {
        setError(err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (passwordParam) {
      setPassword(passwordParam);
      fetchList(passwordParam);
    } else {
      setLoading(false);
    }
  }, [passwordParam, fetchList]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPw) {
      setPassword(inputPw);
      window.history.replaceState(null, '', `?password=${encodeURIComponent(inputPw)}`);
      fetchList(inputPw);
    }
  };

  const refreshCountry = async (code: string) => {
    setRefreshingCountry(code);
    try {
      const res = await fetch('/api/legal-packs', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ action: 'refresh', country: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refresh failed');
      // Re-fetch list to get updated statuses
      await fetchList(password);
    } catch (err: any) {
      alert(`Error refreshing ${code}: ${err.message}`);
    } finally {
      setRefreshingCountry(null);
    }
  };

  const generatePdf = async (code: string) => {
    setGeneratingCountry(code);
    try {
      const res = await fetch('/api/legal-packs', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ action: 'generate-pdf', country: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PDF generation failed');
      await fetchList(password);
    } catch (err: any) {
      alert(`Error generating PDFs for ${code}: ${err.message}`);
    } finally {
      setGeneratingCountry(null);
    }
  };

  const refreshAll = async () => {
    setRefreshingAll(true);
    try {
      const res = await fetch('/api/legal-packs', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ action: 'refresh' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refresh all failed');
      await fetchList(password);
    } catch (err: any) {
      alert(`Error refreshing all: ${err.message}`);
    } finally {
      setRefreshingAll(false);
    }
  };

  const loadPreviewUrls = async (code: string) => {
    if (previewOpen === code) {
      setPreviewOpen(null);
      return;
    }
    setPreviewOpen(code);
    setPreviewLoading(true);
    setPreviewUrls({});
    try {
      const urls: Record<string, string> = {};
      await Promise.all(
        TEMPLATE_TYPES.map(async (t) => {
          try {
            const res = await fetch(
              `/api/legal-packs?action=pdf-url&country=${code}&template=${t.key}`,
              { headers: { 'x-admin-key': password } }
            );
            if (res.ok) {
              const data = await res.json();
              if (data.url) urls[t.key] = data.url;
            }
          } catch {
            // skip unavailable templates
          }
        })
      );
      setPreviewUrls(urls);
    } finally {
      setPreviewLoading(false);
    }
  };

  const fmtDate = (iso: string | null) => {
    if (!iso) return '--';
    const d = new Date(iso);
    return (
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    );
  };

  // Login screen
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-sm"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center">
              <Lock size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-white font-display font-bold text-xl text-center mb-2">
            Legal Packs Admin
          </h1>
          <p className="text-slate-500 text-sm text-center mb-6">
            Enter admin password to manage legal packs
          </p>
          {error && (
            <p className="text-red-400 text-sm text-center mb-4 bg-red-950/50 py-2 rounded-lg">
              {error}
            </p>
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
            Access Legal Packs
          </button>
        </form>
      </div>
    );
  }

  const countryStatuses = pipelineStatus?.countries || {};

  // Stats
  const totalCountries = COUNTRIES.length;
  const readyCount = Object.values(countryStatuses).filter(
    (cs) => deriveDisplayStatus(cs) === 'validated'
  ).length;
  const errorCount = Object.values(countryStatuses).filter(
    (cs) => deriveDisplayStatus(cs) === 'error'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl">Legal Packs Dashboard</h1>
              <p className="text-slate-500 text-sm">
                {readyCount}/{totalCountries} validated
                {errorCount > 0 && (
                  <span className="text-red-400 ml-2">({errorCount} errors)</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pipelineStatus?.lastFullRefresh && (
              <span className="text-slate-500 text-xs hidden sm:inline">
                Last full refresh: {fmtDate(pipelineStatus.lastFullRefresh)}
              </span>
            )}
            <button
              onClick={refreshAll}
              disabled={refreshingAll}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {refreshingAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Refresh All
            </button>
            <button
              onClick={() => fetchList(password)}
              className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              <RefreshCw size={14} /> Reload
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 size={32} className="animate-spin text-slate-500 mx-auto mb-4" />
            <p className="text-slate-500">Loading legal packs status...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="text-center py-20">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_8rem_11rem_5rem_14rem] gap-2 px-5 py-3 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div></div>
              <div>Country</div>
              <div>Status</div>
              <div>Research Date</div>
              <div className="text-center">Tmpl</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Table rows */}
            {COUNTRIES.map((country: CountryConfig) => {
              const cs = countryStatuses[country.code];
              const displayStatus = deriveDisplayStatus(cs);
              const badge = STATUS_BADGES[displayStatus];
              const isRefreshing = refreshingCountry === country.code;
              const isGenerating = generatingCountry === country.code;
              const isPreviewOpen = previewOpen === country.code;

              return (
                <div key={country.code}>
                  <div className="grid grid-cols-[3rem_1fr_8rem_11rem_5rem_14rem] gap-2 items-center px-5 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    {/* Flag */}
                    <div className="text-xl" title={country.code}>
                      {country.flag}
                    </div>

                    {/* Country name */}
                    <div>
                      <span className="text-white font-medium text-sm">{country.name}</span>
                      <span className="text-slate-500 text-xs ml-2">({country.code})</span>
                      {cs?.error && (
                        <p className="text-red-400 text-xs mt-0.5 truncate" title={cs.error}>
                          {cs.error}
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <div>
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${badge.color} ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Research date */}
                    <div className="text-slate-400 text-xs">
                      {cs?.researchedAt ? fmtDate(cs.researchedAt) : '--'}
                    </div>

                    {/* Templates count */}
                    <div className="text-center text-sm text-slate-300">
                      {cs?.templatesGenerated ?? 0}/4
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => refreshCountry(country.code)}
                        disabled={isRefreshing || refreshingAll}
                        title="Refresh research data"
                        className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
                      >
                        {isRefreshing ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <RefreshCw size={12} />
                        )}
                        Refresh
                      </button>

                      <button
                        onClick={() => generatePdf(country.code)}
                        disabled={isGenerating || refreshingAll}
                        title="Generate PDF templates"
                        className="inline-flex items-center gap-1 bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                      >
                        {isGenerating ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Download size={12} />
                        )}
                        PDFs
                      </button>

                      {/* Preview dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => loadPreviewUrls(country.code)}
                          disabled={!cs?.generatedAt}
                          title={
                            cs?.generatedAt
                              ? 'Preview generated PDFs'
                              : 'No PDFs generated yet'
                          }
                          className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown
                            size={12}
                            className={`transition-transform ${isPreviewOpen ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {isPreviewOpen && (
                          <div className="absolute right-0 top-full mt-1 z-20 bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-56 py-1">
                            {previewLoading ? (
                              <div className="flex items-center justify-center py-3">
                                <Loader2
                                  size={14}
                                  className="animate-spin text-slate-400"
                                />
                                <span className="text-slate-400 text-xs ml-2">
                                  Loading...
                                </span>
                              </div>
                            ) : Object.keys(previewUrls).length === 0 ? (
                              <div className="px-3 py-2 text-slate-500 text-xs">
                                No PDFs available
                              </div>
                            ) : (
                              TEMPLATE_TYPES.map((t) =>
                                previewUrls[t.key] ? (
                                  <a
                                    key={t.key}
                                    href={previewUrls[t.key]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                  >
                                    <FileText size={12} />
                                    {t.label}
                                  </a>
                                ) : (
                                  <div
                                    key={t.key}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600"
                                  >
                                    <FileText size={12} />
                                    {t.label} (n/a)
                                  </div>
                                )
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary footer */}
        {!loading && !error && (
          <div className="flex items-center justify-between mt-6 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              {Object.entries(STATUS_BADGES).map(([key, badge]) => {
                const count = COUNTRIES.filter(
                  (c) => deriveDisplayStatus(countryStatuses[c.code]) === key
                ).length;
                if (count === 0) return null;
                return (
                  <span key={key} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${badge.bg} ${badge.color}`}></span>
                    {badge.label}: {count}
                  </span>
                );
              })}
            </div>
            <span>{COUNTRIES.length} countries configured</span>
          </div>
        )}
      </div>

      {/* Click-outside handler for preview dropdown */}
      {previewOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setPreviewOpen(null)} />
      )}
    </div>
  );
}

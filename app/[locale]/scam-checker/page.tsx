'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Copy,
  Check,
  Clock,
  Trash2,
  ExternalLink,
  FileText,
  ArrowRight,
} from 'lucide-react';

interface ScamResult {
  address: string;
  isFlagged: boolean;
  riskLevel: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  sources: { source: string; label: string; type: string; category: string }[];
  categories: string[];
  chainabuseReports: number;
  entityInfo: { label: string; type: string } | null;
  ofacWarning: string;
}

const RISK_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  CLEAN: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' },
  LOW: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-800' },
  MEDIUM: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800' },
  HIGH: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-800' },
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300', badge: 'bg-red-200 text-red-900' },
};

const STORAGE_KEY = 'lh_scam_recent';

export default function ScamCheckerPage() {
  return (
    <Suspense>
      <ScamCheckerInner />
    </Suspense>
  );
}

function ScamCheckerInner() {
  const t = useTranslations('scam');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const prefix = locale === 'en' ? '' : `/${locale}`;

  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Pre-fill from URL param
  useEffect(() => {
    const addr = searchParams.get('address');
    if (addr && /^(0x[a-fA-F0-9]{40}|T[a-zA-Z0-9]{33}|(1|3)[a-zA-Z0-9]{24,33}|bc1[a-zA-Z0-9]{25,62}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(addr)) {
      setAddress(addr);
    }
  }, [searchParams]);

  const saveRecent = (addr: string) => {
    try {
      const updated = [addr, ...recentSearches.filter(a => a !== addr)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  const checkAddress = useCallback(async (addr?: string) => {
    const target = addr || address;
    if (!/^(0x[a-fA-F0-9]{40}|T[a-zA-Z0-9]{33}|(1|3)[a-zA-Z0-9]{24,33}|bc1[a-zA-Z0-9]{25,62}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(target)) {
      setError(t('error_invalid'));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/scam-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: target }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        saveRecent(target.toLowerCase());
      }
    } catch {
      setError(t('error_failed'));
    } finally {
      setLoading(false);
    }
  }, [address, t, recentSearches]);

  const copyShareLink = () => {
    const url = `${window.location.origin}${prefix}/scam-checker?address=${result?.address || address}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const risk = result ? RISK_COLORS[result.riskLevel] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Navbar />

      {/* Hero */}
      <div className="pt-28 pb-8 md:pt-32 md:pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-medium mb-6">
            <ShieldCheck size={14} />
            {t('badge')}
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-slate-900 mb-4 leading-tight">
            {t('title')}{' '}
            <span className="text-brand-600">{t('title_highlight')}</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value.trim())}
                onKeyDown={(e) => e.key === 'Enter' && checkAddress()}
                placeholder={t('placeholder')}
                className="w-full pl-11 pr-4 py-3.5 text-base border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono text-sm"
              />
            </div>
            <button
              onClick={() => checkAddress()}
              disabled={loading || !address}
              className="btn-primary py-3.5 px-8 text-base whitespace-nowrap disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('checking')}
                </span>
              ) : (
                t('check_btn')
              )}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5">
              <AlertTriangle size={14} /> {error}
            </p>
          )}
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && !result && (
          <div className="mt-4 bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Clock size={12} /> {t('recent')}
              </span>
              <button onClick={clearRecent} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1">
                <Trash2 size={10} /> {t('clear')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((addr) => (
                <button
                  key={addr}
                  onClick={() => { setAddress(addr); checkAddress(addr); }}
                  className="text-xs font-mono bg-slate-50 hover:bg-brand-50 text-slate-600 hover:text-brand-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {addr.slice(0, 8)}...{addr.slice(-6)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      {result && risk && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          {/* Risk Banner */}
          <div className={`rounded-2xl border-2 ${risk.border} ${risk.bg} p-6 md:p-8 mb-6`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {result.isFlagged ? (
                  <ShieldAlert size={40} className={risk.text} />
                ) : (
                  <ShieldCheck size={40} className={risk.text} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${risk.badge}`}>
                    {t(`risk_${result.riskLevel.toLowerCase()}`)}
                  </span>
                  {result.isFlagged && (
                    <span className="text-xs font-mono text-slate-500">
                      {t('score')}: {result.riskScore}/100
                    </span>
                  )}
                </div>
                <p className={`text-lg font-semibold ${risk.text} mb-1`}>
                  {result.isFlagged ? t('flagged_title') : t('clean_title')}
                </p>
                <p className="text-sm text-slate-600">
                  {result.isFlagged ? t('flagged_desc') : t('clean_desc')}
                </p>
                <p className="text-xs font-mono text-slate-400 mt-3 break-all">{result.address}</p>
              </div>
            </div>
          </div>

          {/* Entity info (known exchange/defi — not flagged) */}
          {result.entityInfo && !result.isFlagged && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <p className="text-sm font-semibold text-blue-800 mb-1">{t('known_entity')}</p>
              <p className="text-sm text-blue-700">
                {result.entityInfo.label} ({result.entityInfo.type === 'exchange' ? t('entity_exchange') : t('entity_defi')})
              </p>
            </div>
          )}

          {/* Flagged details */}
          {result.isFlagged && (
            <>
              {/* OFAC Warning */}
              {result.ofacWarning && (
                <div className="bg-red-100 border-2 border-red-300 rounded-xl p-5 mb-4">
                  <p className="text-sm font-bold text-red-900 flex items-center gap-2">
                    <AlertTriangle size={18} className="flex-shrink-0" />
                    {result.ofacWarning}
                  </p>
                </div>
              )}

              {/* Categories */}
              {result.categories.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('categories')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.categories.map((cat) => (
                      <span key={cat} className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                        cat === 'OFAC Sanctioned'
                          ? 'bg-red-200 text-red-900 border border-red-300 font-bold'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {cat === 'OFAC Sanctioned' ? `\u26A0\uFE0F ${cat}` : cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('sources')}</h3>
                <div className="space-y-3">
                  {result.sources.map((src, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded whitespace-nowrap">
                        {src.source}
                      </span>
                      <span className="text-slate-700">{src.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
                <p className="text-sm font-bold text-red-800 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {t('warning')}
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyShareLink}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? t('copied') : t('share')}
            </button>
            <a
              href={`${prefix}/report`}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
            >
              <FileText size={14} />
              {t('cta_report')}
            </a>
            {result.isFlagged && (
              <a
                href={`https://www.chainabuse.com/report?address=${result.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <ExternalLink size={14} />
                {t('report_address')}
              </a>
            )}
          </div>
        </div>
      )}

      {/* SEO Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display font-bold text-2xl text-slate-900 mb-4">{t('how_title')}</h2>
            <p className="text-slate-600 leading-relaxed mb-4">{t('how_p1')}</p>
            <p className="text-slate-600 leading-relaxed">{t('how_p2')}</p>
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-slate-900 mb-4">{t('why_title')}</h2>
            <ul className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="flex items-start gap-3 text-slate-600">
                  <span className="flex-shrink-0 w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {n}
                  </span>
                  {t(`why_i${n}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-brand-600 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-4">{t('cta_title')}</h2>
          <p className="text-brand-100 mb-8 max-w-xl mx-auto">{t('cta_desc')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`${prefix}/report`}
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-colors"
            >
              <FileText size={16} />
              {t('cta_report_btn')}
            </a>
            <a
              href={`${prefix}/free-evaluation`}
              className="inline-flex items-center gap-2 text-white border border-white/30 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              {t('cta_eval_btn')}
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

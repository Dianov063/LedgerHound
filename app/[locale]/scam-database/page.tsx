'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Search,
  Shield,
  AlertTriangle,
  Users,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Database,
  ExternalLink,
  Clock,
  Loader2,
  TrendingUp,
} from 'lucide-react';

interface PlatformIndexEntry {
  slug: string;
  name: string;
  victims: number;
  totalLoss: number;
  verified: boolean;
  trustScore: number;
  types: string[];
  urls: string[];
  lastReported: string;
  addresses: string[];
}

interface Stats {
  totalReports: number;
  totalPlatforms: number;
  totalLoss: number;
  blockchainVerified: number;
  updatedAt: string;
}

const SCAM_TYPE_LABELS: Record<string, string> = {
  fake_exchange: 'Fake Exchange',
  pig_butchering: 'Pig Butchering',
  rug_pull: 'Rug Pull',
  phishing: 'Phishing',
  ponzi: 'Ponzi Scheme',
  other: 'Other',
};

function formatLoss(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

function getTrustLabel(score: number): { label: string; bg: string; text: string; border: string } {
  if (score >= 20) return { label: 'Confirmed Scam', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
  if (score >= 10) return { label: 'Likely Scam', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
  if (score >= 4) return { label: 'Suspicious', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
  return { label: 'Reported', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
}

export default function ScamDatabasePage() {
  const t = useTranslations('scamDatabase');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const [stats, setStats] = useState<Stats | null>(null);
  const [platforms, setPlatforms] = useState<PlatformIndexEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlatformIndexEntry[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/scam-database/stats').then(r => r.json()),
      fetch('/api/scam-database/search?q=').then(r => r.json()),
    ]).then(([statsData, platformsData]) => {
      setStats(statsData);
      setPlatforms(platformsData.platforms || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const isAddress = /^(0x[a-fA-F0-9]{40}|T[a-zA-Z0-9]{33}|(1|3)[a-zA-Z0-9]{24,33}|bc1[a-zA-Z0-9]{25,62})$/.test(searchQuery.trim());
      const url = isAddress
        ? `/api/scam-database/search?address=${encodeURIComponent(searchQuery.trim())}`
        : `/api/scam-database/search?q=${encodeURIComponent(searchQuery.trim())}`;
      const res = await fetch(url);
      const data = await res.json();
      setSearchResults(data.platforms || []);
    } catch { setSearchResults([]); }
    setSearching(false);
  };

  const topPlatforms = [...platforms].sort((a, b) => b.victims - a.victims).slice(0, 8);
  const recentPlatforms = [...platforms].sort((a, b) => b.lastReported.localeCompare(a.lastReported)).slice(0, 10);

  const verifiedPct = stats && stats.totalReports > 0
    ? Math.round((stats.blockchainVerified / stats.totalReports) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="pt-28 pb-16 bg-gradient-to-br from-red-50 via-slate-50 to-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Database size={12} />
            {t('badge')}
          </div>
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-5">
            {t('title')} <span className="text-red-600">{t('title_highlight')}</span>
          </h1>
          <p className="text-slate-600 text-base leading-relaxed max-w-3xl mx-auto mb-8">
            {t('subtitle')}
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('search_placeholder')}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-slate-200 text-sm outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-6 py-3.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {t('search_btn')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-slate-900 py-6">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalReports.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">{t('stat_reports')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalPlatforms}</p>
              <p className="text-xs text-slate-400 mt-1">{t('stat_platforms')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{formatLoss(stats.totalLoss)}</p>
              <p className="text-xs text-slate-400 mt-1">{t('stat_losses')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{verifiedPct}%</p>
              <p className="text-xs text-slate-400 mt-1">{t('stat_verified')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Search Results */}
        {searchResults !== null && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xl text-slate-900">
                {t('search_results')} ({searchResults.length})
              </h2>
              <button onClick={() => { setSearchResults(null); setSearchQuery(''); }} className="text-sm text-slate-500 hover:text-slate-700">
                {t('clear_search')}
              </button>
            </div>
            {searchResults.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={24} />
                <p className="text-emerald-700 font-semibold">{t('no_results')}</p>
                <p className="text-emerald-600 text-sm mt-1">{t('no_results_desc')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map(p => (
                  <PlatformCard key={p.slug} platform={p} base={base} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEO Intro */}
        <div className="prose max-w-none mb-12">
          <p className="text-slate-600 text-sm leading-relaxed">
            {t('seo_intro')}
          </p>
        </div>

        {/* Top Scam Platforms */}
        {topPlatforms.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle size={20} className="text-red-500" />
              <h2 className="font-display font-bold text-2xl text-slate-900">{t('top_scams')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topPlatforms.map(p => (
                <PlatformCard key={p.slug} platform={p} base={base} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Reports */}
        {recentPlatforms.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Clock size={20} className="text-slate-500" />
              <h2 className="font-display font-bold text-2xl text-slate-900">{t('recent_reports')}</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('table_platform')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('table_type')}</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">{t('table_victims')}</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">{t('table_loss')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('table_status')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('table_date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPlatforms.map(p => {
                      const trust = getTrustLabel(p.trustScore);
                      return (
                        <tr key={p.slug} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <Link href={`${base}/scam-database/platform/${p.slug}`} className="font-semibold text-brand-600 hover:underline">
                              {p.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {p.types.map(t => SCAM_TYPE_LABELS[t] || t).join(', ')}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">{p.victims}</td>
                          <td className="px-4 py-3 text-right font-semibold text-red-600">{formatLoss(p.totalLoss)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${trust.bg} ${trust.text} px-2 py-0.5 rounded-full border ${trust.border}`}>
                              {trust.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(p.lastReported)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {loading && (
          <div className="text-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-400 mx-auto" />
            <p className="text-slate-400 text-sm mt-3">{t('loading')}</p>
          </div>
        )}

        {/* Empty state — database not seeded yet */}
        {!loading && platforms.length === 0 && searchResults === null && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center mb-12">
            <Database size={40} className="mx-auto text-slate-300 mb-4" />
            <h2 className="font-display font-bold text-xl text-slate-700 mb-2">Database Initializing</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
              The scam database is being populated. Community reports and verified scam platforms will appear here shortly.
            </p>
            <Link
              href={`${base}/scam-database/report`}
              className="inline-flex items-center gap-2 bg-red-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Shield size={16} /> {t('report_cta_btn')}
            </Link>
          </div>
        )}

        {/* How We Verify Scams */}
        <section className="mb-12 bg-white border border-slate-200 rounded-2xl p-8">
          <h2 className="font-display font-bold text-2xl text-slate-900 mb-2 text-center">How We Verify Scams</h2>
          <p className="text-slate-500 text-sm text-center mb-8 max-w-2xl mx-auto">
            Every platform in our database goes through a multi-layer verification process. Trust scores are calculated automatically based on community reports, blockchain evidence, and staff review.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                  Community Reported
                </span>
                <span className="text-xs text-slate-400 font-mono">0–3</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Initial reports from community members. Platform has been flagged but not yet independently confirmed.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full border border-yellow-200">
                  Suspicious
                </span>
                <span className="text-xs text-slate-400 font-mono">4–9</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Multiple reports received. Pattern of complaints suggests potential fraud but investigation is ongoing.
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full border border-orange-200">
                  Likely Scam
                </span>
                <span className="text-xs text-slate-400 font-mono">10–19</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Strong evidence of fraud. Multiple victims, consistent patterns, and/or blockchain-verified transactions.
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full border border-red-200">
                  Confirmed Scam
                </span>
                <span className="text-xs text-slate-400 font-mono">20+</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verified by our investigation team. Blockchain evidence confirmed, fund flows traced, and platform behavior documented.
              </p>
            </div>
          </div>
          <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800 mb-1">Blockchain Verified</p>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Reports with this badge include a verified transaction hash confirmed on the blockchain. This provides irrefutable on-chain evidence that funds were sent to the reported address, strengthening the case for legal action and exchange freezes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Report CTA */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-center">
          <Shield className="mx-auto text-red-200 mb-4" size={32} />
          <h2 className="font-display font-bold text-2xl text-white mb-3">{t('report_cta_title')}</h2>
          <p className="text-red-100 mb-6 max-w-xl mx-auto">{t('report_cta_desc')}</p>
          <Link
            href={`${base}/scam-database/report`}
            className="inline-flex items-center gap-2 bg-white text-red-700 font-bold px-7 py-3.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            {t('report_cta_btn')} <ArrowRight size={16} />
          </Link>
        </div>

        {/* Professional Help CTA */}
        <div className="mt-8 bg-brand-50 border border-brand-200 rounded-2xl p-8 text-center">
          <h3 className="font-display font-bold text-xl text-slate-900 mb-3">{t('help_cta_title')}</h3>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto">{t('help_cta_desc')}</p>
          <Link
            href={`${base}/free-evaluation`}
            className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-7 py-3.5 rounded-lg hover:bg-brand-700 transition-colors"
          >
            {t('help_cta_btn')} <ArrowRight size={16} />
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 bg-slate-50 border border-slate-200 rounded-xl p-6 text-xs text-slate-500 leading-relaxed">
          <p className="font-semibold text-slate-600 mb-2">{t('disclaimer_title')}</p>
          <p>{t('disclaimer_text')}</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

/* -- Platform Card Component -- */
function PlatformCard({ platform: p, base }: { platform: PlatformIndexEntry; base: string }) {
  const trust = getTrustLabel(p.trustScore);
  return (
    <Link
      href={`${base}/scam-database/platform/${p.slug}`}
      className="block bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">{p.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {p.types.map(t => (
              <span key={t} className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {SCAM_TYPE_LABELS[t] || t}
              </span>
            ))}
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${trust.bg} ${trust.text} px-2 py-0.5 rounded-full border ${trust.border}`}>
              {trust.label}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-red-600">{formatLoss(p.totalLoss)}</p>
          <p className="text-[10px] text-slate-400">total losses</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Users size={11} /> {p.victims} victims</span>
        <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(p.lastReported)}</span>
        {p.urls.length > 0 && (
          <span className="flex items-center gap-1 truncate"><ExternalLink size={11} /> {p.urls[0]}</span>
        )}
      </div>
    </Link>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Shield,
  Loader2,
  Hash,
  Wallet,
  GitBranch,
  AlertTriangle,
  FileText,
} from 'lucide-react';

type Network = 'auto' | 'eth' | 'btc' | 'sol' | 'trx' | 'bnb' | 'polygon' | 'base' | 'arb' | 'op';

const NETWORKS: { id: Network; label: string; short: string }[] = [
  { id: 'auto', label: 'Auto-Detect', short: 'AUTO' },
  { id: 'eth', label: 'Ethereum', short: 'ETH' },
  { id: 'btc', label: 'Bitcoin', short: 'BTC' },
  { id: 'sol', label: 'Solana', short: 'SOL' },
  { id: 'trx', label: 'TRON', short: 'TRON' },
  { id: 'bnb', label: 'BNB Chain', short: 'BNB' },
  { id: 'base', label: 'Base', short: 'BASE' },
  { id: 'arb', label: 'Arbitrum', short: 'ARB' },
  { id: 'op', label: 'Optimism', short: 'OP' },
];

function detectNetworkFromHash(hash: string): Network {
  const h = hash.trim();
  if (/^0x[a-fA-F0-9]{64}$/.test(h)) return 'auto'; // Could be any EVM chain
  if (/^[a-fA-F0-9]{64}$/.test(h)) return 'btc';
  if (/^[1-9A-HJ-NP-Za-km-z]{85,90}$/.test(h)) return 'sol';
  return 'auto';
}

function shortAddr(addr: string) {
  if (!addr || addr.length < 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function formatValue(v: number) {
  if (v === 0) return '0';
  if (v < 0.0001) return v.toFixed(8);
  if (v < 1) return v.toFixed(6);
  if (v < 1000) return v.toFixed(4);
  return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatTime(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

interface TxResult {
  hash: string;
  network: string;
  networkLabel: string;
  status: 'success' | 'failed' | 'pending';
  from: string;
  to: string;
  value: number;
  token: string;
  timestamp: string;
  blockNumber: number | null;
  gasUsed: number;
  gasCost: number;
  gasCurrency: string;
  explorerUrl: string;
}

export default function TxLookupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen"><Navbar /><div className="pt-24 text-center text-slate-400">Loading...</div><Footer /></div>}>
      <TxLookupContent />
    </Suspense>
  );
}

function TxLookupContent() {
  const t = useTranslations('tx');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const searchParams = useSearchParams();
  const [hashInput, setHashInput] = useState('');
  const [network, setNetwork] = useState<Network>('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TxResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [autoSearched, setAutoSearched] = useState(false);

  // Auto-fill from URL query params
  useEffect(() => {
    if (autoSearched) return;
    const qHash = searchParams.get('hash');
    const qNet = searchParams.get('network') as Network | null;
    if (qHash) {
      setHashInput(qHash);
      if (qNet && NETWORKS.some(n => n.id === qNet)) {
        setNetwork(qNet);
      } else {
        setNetwork(detectNetworkFromHash(qHash));
      }
      setAutoSearched(true);
      // Trigger search
      (async () => {
        setLoading(true);
        setError('');
        setResult(null);
        try {
          const res = await fetch('/api/tx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hash: qHash.trim(), network: qNet || detectNetworkFromHash(qHash) }),
          });
          const data = await res.json();
          if (data.error) setError(data.error);
          else setResult(data);
        } catch {
          setError('Failed to fetch transaction. Please try again.');
        }
        setLoading(false);
      })();
    }
  }, [searchParams, autoSearched]);

  const handleHashChange = (val: string) => {
    setHashInput(val.trim());
    if (val.trim().length > 10) {
      const detected = detectNetworkFromHash(val.trim());
      setNetwork(detected);
    }
  };

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSearch = async () => {
    if (!hashInput.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: hashInput.trim(), network }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError('Failed to fetch transaction. Please try again.');
    }
    setLoading(false);
  };

  const statusConfig = {
    success: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Confirmed' },
    failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Failed' },
    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Pending' },
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-12 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Hash size={12} />
            {t('badge')}
          </div>
          <h1 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-5">
            {t('title')} <span className="text-brand-600">{t('title_highlight')}</span>
          </h1>
          <p className="text-slate-600 text-base leading-relaxed max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Search */}
      <section className="py-10 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            {/* Network selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 mb-2">{t('network_label')}</label>
              <div className="flex flex-wrap gap-1.5">
                {NETWORKS.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setNetwork(n.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      network === n.id
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {n.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Hash input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 mb-2">{t('hash_label')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hashInput}
                  onChange={(e) => handleHashChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('hash_placeholder')}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-sm font-mono outline-none focus:border-brand-500 transition-colors"
                />
                <button
                  onClick={handleSearch}
                  disabled={!hashInput.trim() || loading}
                  className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  {loading ? (network === 'auto' ? 'Searching...' : t('search_btn')) : t('search_btn')}
                </button>
              </div>
            </div>

            {/* Loading status */}
            {loading && (
              <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-sm text-brand-700 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin flex-shrink-0" />
                {network === 'auto'
                  ? 'Searching across all EVM chains (ETH, BNB, Base, Polygon, Arbitrum, Optimism)...'
                  : `Searching on ${NETWORKS.find(n => n.id === network)?.label || network}...`}
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Result Card */}
          {result && (
            <div className="mt-6 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Status header */}
              {(() => {
                const cfg = statusConfig[result.status] || statusConfig.pending;
                const Icon = cfg.icon;
                return (
                  <div className={`${cfg.bg} ${cfg.border} border-b px-6 py-4 flex items-center gap-3`}>
                    <Icon size={24} className={cfg.color} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-display font-bold text-lg ${cfg.color}`}>
                          Transaction {cfg.label}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/80 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                          Found on: {result.networkLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{result.networkLabel} Network</p>
                    </div>
                  </div>
                );
              })()}

              {/* Details */}
              <div className="p-6 space-y-4">
                {/* Hash */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-slate-700 break-all">{result.hash}</code>
                    <button onClick={() => copyText(result.hash, 'hash')} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                      {copiedField === 'hash' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* From / To */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">From</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-slate-700">{shortAddr(result.from)}</code>
                      <button onClick={() => copyText(result.from, 'from')} className="text-slate-400 hover:text-slate-600">
                        {copiedField === 'from' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <Link
                      href={`${base}/wallet-tracker?address=${encodeURIComponent(result.from)}&network=${result.network}`}
                      className="inline-flex items-center gap-1 text-xs text-brand-600 font-semibold mt-2 hover:underline"
                    >
                      <Wallet size={11} /> {t('track_wallet')}
                    </Link>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">To</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-slate-700">{shortAddr(result.to)}</code>
                      <button onClick={() => copyText(result.to, 'to')} className="text-slate-400 hover:text-slate-600">
                        {copiedField === 'to' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <Link
                      href={`${base}/wallet-tracker?address=${encodeURIComponent(result.to)}&network=${result.network}`}
                      className="inline-flex items-center gap-1 text-xs text-brand-600 font-semibold mt-2 hover:underline"
                    >
                      <Wallet size={11} /> {t('track_wallet')}
                    </Link>
                  </div>
                </div>

                {/* Amount / Time / Block / Gas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">{formatValue(result.value)}</p>
                    <p className="text-xs text-slate-500">{result.token}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Time</p>
                    <p className="text-xs font-semibold text-slate-700 mt-2">{formatTime(result.timestamp)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Block</p>
                    <p className="text-sm font-bold text-slate-900 mt-2">{result.blockNumber?.toLocaleString() || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fee</p>
                    <p className="text-sm font-bold text-slate-900 mt-2">{result.gasCost > 0 ? formatValue(result.gasCost) : '—'}</p>
                    <p className="text-xs text-slate-500">{result.gasCurrency}</p>
                  </div>
                </div>

                {/* Explorer link */}
                {result.explorerUrl && (
                  <a
                    href={result.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <ExternalLink size={14} />
                    {t('view_explorer')}
                  </a>
                )}
              </div>

              {/* Action buttons */}
              <div className="border-t border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <Link
                  href={`${base}/wallet-tracker?address=${encodeURIComponent(result.from)}&network=${result.network}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Wallet size={12} /> {t('track_sender')}
                </Link>
                <Link
                  href={`${base}/wallet-tracker?address=${encodeURIComponent(result.to)}&network=${result.network}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Wallet size={12} /> {t('track_receiver')}
                </Link>
                <Link
                  href={`${base}/graph-tracer?address=${encodeURIComponent(result.to)}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <GitBranch size={12} /> {t('trace_funds')}
                </Link>
                <Link
                  href={`${base}/scam-checker?address=${encodeURIComponent(result.to)}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <AlertTriangle size={12} /> {t('check_scam')}
                </Link>
                <Link
                  href={`${base}/report?address=${encodeURIComponent(result.to)}&network=${result.network}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors sm:col-span-1 col-span-2"
                >
                  <FileText size={12} /> {t('get_report')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Shield className="mx-auto text-brand-200 mb-4" size={32} />
          <h2 className="font-display font-bold text-2xl text-white mb-3">{t('cta_title')}</h2>
          <p className="text-brand-100 mb-6">{t('cta_desc')}</p>
          <Link
            href={`${base}/free-evaluation`}
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-7 py-3.5 rounded-lg hover:bg-brand-50 transition-colors"
          >
            {t('cta_btn')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

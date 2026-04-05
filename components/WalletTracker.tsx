'use client';

import { useState, useMemo, useRef, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import {
  Search, Loader2, AlertCircle, ArrowDownLeft, ArrowUpRight,
  Copy, Check, ExternalLink, Activity, TrendingDown, TrendingUp, Hash,
  Download, X, Calendar, Coins, BarChart3, ChevronDown,
} from 'lucide-react';

/* ---------- types ---------- */
type Network = 'btc' | 'eth' | 'sol' | 'trx' | 'bnb' | 'polygon' | 'base' | 'arb' | 'op' | 'avax' | 'ftm' | 'linea' | 'zksync' | 'scroll' | 'mantle';

interface Transfer {
  hash: string;
  from: string;
  to: string;
  value: number | null;
  asset: string | null;
  category: string;
  direction: 'IN' | 'OUT';
  trackedAddress?: string;
  metadata?: { blockTimestamp?: string };
}

interface Stats {
  total: number;
  totalEthIn: number;
  totalEthOut: number;
  totalNativeIn?: number;
  totalNativeOut?: number;
}

/* ---------- constants ---------- */
const NATIVE_CURRENCY: Record<Network, string> = {
  btc: 'BTC',
  eth: 'ETH',
  sol: 'SOL',
  trx: 'TRX',
  bnb: 'BNB',
  polygon: 'MATIC',
  base: 'ETH',
  arb: 'ETH',
  op: 'ETH',
  avax: 'AVAX',
  ftm: 'FTM',
  linea: 'ETH',
  zksync: 'ETH',
  scroll: 'ETH',
  mantle: 'MNT',
};

const EXPLORER_TX_URL: Record<Network, (hash: string) => string> = {
  btc: (hash) => `https://blockstream.info/tx/${hash}`,
  eth: (hash) => `https://etherscan.io/tx/${hash}`,
  sol: (hash) => `https://solscan.io/tx/${hash}`,
  trx: (hash) => `https://tronscan.org/#/transaction/${hash}`,
  bnb: (hash) => `https://bscscan.com/tx/${hash}`,
  polygon: (hash) => `https://polygonscan.com/tx/${hash}`,
  base: (hash) => `https://basescan.org/tx/${hash}`,
  arb: (hash) => `https://arbiscan.io/tx/${hash}`,
  op: (hash) => `https://optimistic.etherscan.io/tx/${hash}`,
  avax: (hash) => `https://snowtrace.io/tx/${hash}`,
  ftm: (hash) => `https://ftmscan.com/tx/${hash}`,
  linea: (hash) => `https://lineascan.build/tx/${hash}`,
  zksync: (hash) => `https://era.zksync.network/tx/${hash}`,
  scroll: (hash) => `https://scrollscan.com/tx/${hash}`,
  mantle: (hash) => `https://mantlescan.xyz/tx/${hash}`,
};

const NETWORK_LABELS: Record<Network, string> = {
  btc: 'BTC',
  eth: 'ETH',
  sol: 'SOL',
  trx: 'TRON',
  bnb: 'BNB',
  polygon: 'MATIC',
  base: 'BASE',
  arb: 'ARB',
  op: 'OP',
  avax: 'AVAX',
  ftm: 'FTM',
  linea: 'LINEA',
  zksync: 'zkSYNC',
  scroll: 'SCROLL',
  mantle: 'MANTLE',
};

const PRIMARY_NETWORKS: Network[] = ['btc', 'eth', 'sol', 'trx', 'bnb', 'base', 'arb', 'op'];
const MORE_NETWORKS: Network[] = ['avax', 'polygon', 'ftm', 'linea', 'zksync', 'scroll', 'mantle'];

const EVM_NETWORKS: Network[] = ['eth', 'bnb', 'polygon', 'base', 'arb', 'op', 'avax', 'ftm', 'linea', 'zksync', 'scroll', 'mantle'];

/* ---------- helpers ---------- */
function shorten(addr: string) {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatDate(ts?: string) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(ts?: string) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toISODate(ts?: string) {
  if (!ts) return '';
  return new Date(ts).toISOString().split('T')[0];
}

const EVM_NETWORK_SET = new Set<Network>(['eth', 'bnb', 'polygon', 'base', 'arb', 'op', 'avax', 'ftm', 'linea', 'zksync', 'scroll', 'mantle']);

/** Auto-detect only for unambiguous address formats (BTC, TRON, SOL).
 *  For 0x addresses, only switch to ETH if current tab is non-EVM. */
function detectNetwork(addr: string, currentNetwork: Network): Network | null {
  const trimmed = addr.trim();
  if (/^(1|3)[a-zA-Z0-9]{24,33}$/.test(trimmed) || trimmed.startsWith('bc1')) return 'btc';
  if (trimmed.startsWith('T') && trimmed.length === 34) return 'trx';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed) && !trimmed.startsWith('0x') && !trimmed.startsWith('T')) return 'sol';
  // For 0x addresses, only auto-switch if user is on a non-EVM tab
  if (trimmed.startsWith('0x') && trimmed.length === 42 && !EVM_NETWORK_SET.has(currentNetwork)) return 'eth';
  return null;
}

function getPlaceholder(network: Network): string {
  switch (network) {
    case 'btc': return '1A1zP1... or bc1q... (Bitcoin address)';
    case 'sol': return 'So11111... (Solana address)';
    case 'trx': return 'TABC... (TRON address)';
    default: return '0xABC..., 0xDEF... (comma-separated for multiple)';
  }
}

/* ---------- CopyableAddress ---------- */
function CopyableAddress({ addr }: { addr: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <span className="relative group">
      <button
        onClick={handleCopy}
        className="font-mono text-xs text-slate-300 hover:text-brand-400 transition-colors cursor-pointer inline-flex items-center gap-1"
        title={addr}
      >
        {shorten(addr)}
        <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
      </button>
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded whitespace-nowrap z-10">
          Copied!
        </span>
      )}
    </span>
  );
}

/* ---------- CSV export ---------- */
function exportCSV(transfers: Transfer[], multiAddress: boolean) {
  const headers = multiAddress
    ? ['Date', 'Direction', 'Tracked Address', 'From', 'To', 'Value', 'Token', 'Tx Hash']
    : ['Date', 'Direction', 'From', 'To', 'Value', 'Token', 'Tx Hash'];

  const rows = transfers.map((tx) => {
    const date = tx.metadata?.blockTimestamp ? new Date(tx.metadata.blockTimestamp).toISOString() : '';
    const base = [
      date,
      tx.direction,
      ...(multiAddress ? [tx.trackedAddress || ''] : []),
      tx.from || '',
      tx.to || '',
      tx.value != null ? String(tx.value) : '',
      tx.asset || tx.category || '',
      tx.hash || '',
    ];
    return base.map((v) => `"${v.replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wallet-transactions.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/* ========== PAGE ========== */
export default function WalletTracker() {
  const [input, setInput] = useState('');
  const [network, setNetwork] = useState<Network>('eth');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [nativeCurrency, setNativeCurrency] = useState<string>('ETH');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [trackedAddresses, setTrackedAddresses] = useState<string[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // filters
  const [dirFilter, setDirFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [tokenFilter, setTokenFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const multiAddress = trackedAddresses.length > 1;

  // auto-detect network from address input
  function handleInputChange(value: string) {
    setInput(value);
    const detected = detectNetwork(value, network);
    if (detected) {
      setNetwork(detected);
    }
  }

  // derived
  const uniqueTokens = useMemo(() => {
    const set = new Set<string>();
    transfers.forEach((tx) => { if (tx.asset) set.add(tx.asset); });
    return Array.from(set).sort();
  }, [transfers]);

  const filtered = useMemo(() => {
    return transfers.filter((tx) => {
      if (dirFilter !== 'ALL' && tx.direction !== dirFilter) return false;
      if (tokenFilter !== 'ALL' && tx.asset !== tokenFilter) return false;
      if (dateFrom && tx.metadata?.blockTimestamp) {
        if (toISODate(tx.metadata.blockTimestamp) < dateFrom) return false;
      }
      if (dateTo && tx.metadata?.blockTimestamp) {
        if (toISODate(tx.metadata.blockTimestamp) > dateTo) return false;
      }
      return true;
    });
  }, [transfers, dirFilter, tokenFilter, dateFrom, dateTo]);

  const hasFilters = dirFilter !== 'ALL' || tokenFilter !== 'ALL' || dateFrom || dateTo;

  // extra stats
  const extraStats = useMemo(() => {
    if (transfers.length === 0) return null;
    const dates = transfers
      .map((tx) => tx.metadata?.blockTimestamp)
      .filter(Boolean)
      .map((ts) => new Date(ts!).getTime())
      .sort((a, b) => a - b);

    const tokenCounts: Record<string, number> = {};
    transfers.forEach((tx) => {
      const t = tx.asset || 'unknown';
      tokenCounts[t] = (tokenCounts[t] || 0) + 1;
    });
    const mostActive = Object.entries(tokenCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      uniqueTokens: uniqueTokens.length,
      firstDate: dates.length > 0 ? formatDateShort(new Date(dates[0]).toISOString()) : '—',
      lastDate: dates.length > 0 ? formatDateShort(new Date(dates[dates.length - 1]).toISOString()) : '—',
      mostActiveToken: mostActive ? mostActive[0] : '—',
      mostActiveCount: mostActive ? mostActive[1] : 0,
    };
  }, [transfers, uniqueTokens]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const raw = input.trim();

    // Determine if this network uses non-lowercased addresses
    const noLowercase = network === 'btc' || network === 'sol' || network === 'trx';

    // Split addresses based on network type
    const addresses = noLowercase
      ? [raw].filter(Boolean)
      : raw.split(/[\s,]+/).map((a) => a.trim().toLowerCase()).filter(Boolean);

    if (addresses.length === 0) {
      setStatus('error');
      setError('Enter at least one wallet address.');
      return;
    }

    // Validate based on network
    const btcPattern = /^(1|3)[a-zA-Z0-9]{24,33}$|^bc1[a-zA-Z0-9]{25,62}$/;
    const solPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    const tronPattern = /^T[a-zA-Z0-9]{33}$/;
    const evmPattern = /^0x[a-fA-F0-9]{40}$/;

    if (network === 'btc') {
      const invalid = addresses.find((a) => !btcPattern.test(a));
      if (invalid) {
        setStatus('error');
        setError(`Invalid Bitcoin address: ${invalid}`);
        return;
      }
    } else if (network === 'sol') {
      const invalid = addresses.find((a) => !solPattern.test(a));
      if (invalid) {
        setStatus('error');
        setError(`Invalid Solana address: ${invalid}`);
        return;
      }
    } else if (network === 'trx') {
      const invalid = addresses.find((a) => !tronPattern.test(a));
      if (invalid) {
        setStatus('error');
        setError(`Invalid TRON address: ${invalid}`);
        return;
      }
    } else {
      // All EVM networks
      const invalid = addresses.find((a) => !evmPattern.test(a));
      if (invalid) {
        setStatus('error');
        setError(`Invalid address: ${invalid}`);
        return;
      }
    }

    setStatus('loading');
    setError('');
    setTransfers([]);
    setStats(null);
    setTrackedAddresses(addresses);
    setDirFilter('ALL');
    setTokenFilter('ALL');
    setDateFrom('');
    setDateTo('');

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses, network }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');

      setTransfers(data.transfers);
      setStats(data.stats);
      setNativeCurrency(data.nativeCurrency || NATIVE_CURRENCY[network]);
      setStatus('done');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Something went wrong');
    }
  }

  function clearFilters() {
    setDirFilter('ALL');
    setTokenFilter('ALL');
    setDateFrom('');
    setDateTo('');
  }

  // Resolve native currency values with backward compat
  const nativeIn = stats?.totalNativeIn ?? stats?.totalEthIn ?? 0;
  const nativeOut = stats?.totalNativeOut ?? stats?.totalEthOut ?? 0;

  const placeholder = getPlaceholder(network);

  const isMoreNetwork = MORE_NETWORKS.includes(network);

  return (
    <div className="bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Network Tabs */}
        <div className="flex items-center gap-1 mb-4 max-w-3xl mx-auto flex-wrap">
          {PRIMARY_NETWORKS.map((n) => (
            <button
              key={n}
              onClick={() => { setNetwork(n); setMoreOpen(false); }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                network === n
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {NETWORK_LABELS[n]}
            </button>
          ))}

          {/* More dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((prev) => !prev)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-1 ${
                isMoreNetwork
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {isMoreNetwork ? NETWORK_LABELS[network] : 'More'}
              <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreOpen && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 min-w-[140px] py-1">
                {MORE_NETWORKS.map((n) => (
                  <button
                    key={n}
                    onClick={() => { setNetwork(n); setMoreOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm font-semibold transition-colors ${
                      network === n
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {NETWORK_LABELS[n]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mb-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
            >
              {status === 'loading' ? (
                <><Loader2 size={16} className="animate-spin" /> Tracking...</>
              ) : (
                'Track Wallet'
              )}
            </button>
          </div>

          {status === 'error' && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-950/50 border border-red-900/50 rounded-lg p-3">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </form>

        {/* Stats */}
        {stats && extraStats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <Hash size={14} className="text-brand-500 mx-auto mb-1.5" />
              <p className="text-xl font-bold">{stats.total.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">Total Transactions</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <TrendingDown size={14} className="text-green-500 mx-auto mb-1.5" />
              <p className="text-xl font-bold text-green-400">{nativeIn} {nativeCurrency}</p>
              <p className="text-[10px] text-slate-500 mt-1">Total Received</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <TrendingUp size={14} className="text-red-400 mx-auto mb-1.5" />
              <p className="text-xl font-bold text-red-400">{nativeOut} {nativeCurrency}</p>
              <p className="text-[10px] text-slate-500 mt-1">Total Sent</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <Coins size={14} className="text-purple-400 mx-auto mb-1.5" />
              <p className="text-xl font-bold">{extraStats.uniqueTokens}</p>
              <p className="text-[10px] text-slate-500 mt-1">Unique Tokens</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <Calendar size={14} className="text-amber-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold leading-tight">{extraStats.firstDate}<br />→ {extraStats.lastDate}</p>
              <p className="text-[10px] text-slate-500 mt-1">Date Range</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <BarChart3 size={14} className="text-cyan-400 mx-auto mb-1.5" />
              <p className="text-xl font-bold">{extraStats.mostActiveToken}</p>
              <p className="text-[10px] text-slate-500 mt-1">Most Active ({extraStats.mostActiveCount})</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {status === 'loading' && (
          <div className="text-center py-20">
            <Loader2 size={36} className="animate-spin text-brand-500 mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Scanning blockchain for all transactions...</p>
            <p className="text-slate-600 text-xs mt-1">This may take a few seconds</p>
          </div>
        )}

        {/* Filters + Table */}
        {status === 'done' && transfers.length > 0 && (
          <>
            {/* Filters bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
              {/* Direction */}
              <div className="flex rounded-lg overflow-hidden border border-slate-700">
                {(['ALL', 'IN', 'OUT'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirFilter(d)}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                      dirFilter === d
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d === 'ALL' ? 'All' : d === 'IN' ? '↓ IN' : '↑ OUT'}
                  </button>
                ))}
              </div>

              {/* Token filter */}
              <select
                value={tokenFilter}
                onChange={(e) => setTokenFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="ALL">All Tokens</option>
                {uniqueTokens.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Date from */}
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="From"
              />
              <span className="text-slate-600 text-xs">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="To"
              />

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X size={12} /> Clear
                </button>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Counter */}
              <span className="text-xs text-slate-500">
                {filtered.length === transfers.length
                  ? `${transfers.length} transactions`
                  : `${filtered.length} of ${transfers.length} transactions`}
              </span>

              {/* Export CSV */}
              <button
                onClick={() => exportCSV(filtered, multiAddress)}
                className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 hover:border-brand-500 text-xs text-slate-300 hover:text-white rounded-lg px-3 py-1.5 transition-colors"
              >
                <Download size={12} /> Export CSV
              </button>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="text-left px-5 py-3.5 font-medium">Date / Time</th>
                      <th className="text-left px-5 py-3.5 font-medium">Direction</th>
                      {multiAddress && <th className="text-left px-5 py-3.5 font-medium">Address</th>}
                      <th className="text-left px-5 py-3.5 font-medium">From</th>
                      <th className="text-left px-5 py-3.5 font-medium">To</th>
                      <th className="text-right px-5 py-3.5 font-medium">Value</th>
                      <th className="text-left px-5 py-3.5 font-medium">Token</th>
                      <th className="text-left px-5 py-3.5 font-medium">Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx, i) => (
                      <tr
                        key={`${tx.hash}-${tx.direction}-${i}`}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">
                          {formatDate(tx.metadata?.blockTimestamp)}
                        </td>
                        <td className="px-5 py-3">
                          {tx.direction === 'IN' ? (
                            <span className="inline-flex items-center gap-1 text-green-400 font-semibold text-xs bg-green-950/50 px-2 py-1 rounded-md">
                              <ArrowDownLeft size={12} /> IN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-xs bg-red-950/50 px-2 py-1 rounded-md">
                              <ArrowUpRight size={12} /> OUT
                            </span>
                          )}
                        </td>
                        {multiAddress && (
                          <td className="px-5 py-3">
                            <CopyableAddress addr={tx.trackedAddress || ''} />
                          </td>
                        )}
                        <td className="px-5 py-3 whitespace-nowrap">
                          <CopyableAddress addr={tx.from} />
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <CopyableAddress addr={tx.to} />
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-xs text-white whitespace-nowrap">
                          {tx.value != null ? (tx.value < 0.001 && tx.value > 0 ? '<0.001' : tx.value.toLocaleString(undefined, { maximumFractionDigits: 4 })) : '—'}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-400">
                          {tx.asset || tx.category}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs whitespace-nowrap">
                          <a
                            href={EXPLORER_TX_URL[network](tx.hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-500 hover:text-brand-400 inline-flex items-center gap-1"
                          >
                            {tx.hash ? `${tx.hash.slice(0, 8)}…` : '—'}
                            <ExternalLink size={11} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {transfers.length >= 1000 && (
                <div className="px-5 py-3 text-center text-xs text-slate-500 border-t border-slate-800">
                  Showing first 1,000 transactions per address. Contact us for full forensic analysis.
                </div>
              )}
            </div>
          </>
        )}

        {status === 'done' && transfers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">No transactions found for this address.</p>
          </div>
        )}

      </div>
    </div>
  );
}

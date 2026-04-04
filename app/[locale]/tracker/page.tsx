'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  Search, Loader2, AlertCircle, ArrowDownLeft, ArrowUpRight,
  Copy, Check, ExternalLink, Activity, TrendingDown, TrendingUp, Hash,
} from 'lucide-react';

interface Transfer {
  hash: string;
  from: string;
  to: string;
  value: number | null;
  asset: string | null;
  category: string;
  direction: 'IN' | 'OUT';
  metadata?: { blockTimestamp?: string };
}

interface Stats {
  total: number;
  totalEthIn: number;
  totalEthOut: number;
}

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="ml-1 text-slate-400 hover:text-brand-600 transition-colors inline-flex" title="Copy">
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  );
}

export default function TrackerPage() {
  const [address, setAddress] = useState('');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();

    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      setStatus('error');
      setError('Invalid Ethereum address. Must be 0x followed by 40 hex characters.');
      return;
    }

    setStatus('loading');
    setError('');
    setTransfers([]);
    setStats(null);

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch');
      }

      setTransfers(data.transfers);
      setStats(data.stats);
      setStatus('done');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Something went wrong');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LH</span>
            </div>
            <span className="font-bold text-lg">
              Ledger<span className="text-brand-500">Hound</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Activity size={12} className="text-brand-500" />
            Wallet Tracker
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Ethereum Wallet <span className="text-brand-500">Tracker</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Enter any Ethereum address to view all transactions — incoming, outgoing, tokens, and NFTs. Powered by blockchain forensics.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x... Ethereum address"
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
        {stats && (
          <div className="grid sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <Hash size={16} className="text-brand-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">Total Transactions</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <TrendingDown size={16} className="text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-400">{stats.totalEthIn} ETH</p>
              <p className="text-xs text-slate-500 mt-1">Total Received</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <TrendingUp size={16} className="text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-400">{stats.totalEthOut} ETH</p>
              <p className="text-xs text-slate-500 mt-1">Total Sent</p>
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

        {/* Table */}
        {status === 'done' && transfers.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3.5 font-medium">Date / Time</th>
                    <th className="text-left px-5 py-3.5 font-medium">Direction</th>
                    <th className="text-left px-5 py-3.5 font-medium">From</th>
                    <th className="text-left px-5 py-3.5 font-medium">To</th>
                    <th className="text-right px-5 py-3.5 font-medium">Value</th>
                    <th className="text-left px-5 py-3.5 font-medium">Token</th>
                    <th className="text-left px-5 py-3.5 font-medium">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((tx, i) => (
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
                      <td className="px-5 py-3 font-mono text-xs text-slate-300 whitespace-nowrap">
                        {shorten(tx.from)}
                        <CopyButton text={tx.from} />
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-300 whitespace-nowrap">
                        {shorten(tx.to)}
                        <CopyButton text={tx.to} />
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs text-white whitespace-nowrap">
                        {tx.value != null ? (tx.value < 0.001 && tx.value > 0 ? '<0.001' : tx.value.toLocaleString(undefined, { maximumFractionDigits: 4 })) : '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {tx.asset || tx.category}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs whitespace-nowrap">
                        <a
                          href={`https://etherscan.io/tx/${tx.hash}`}
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
                Showing first 1,000 transactions. Contact us for full forensic analysis.
              </div>
            )}
          </div>
        )}

        {status === 'done' && transfers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">No transactions found for this address.</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-slate-800">
          <p className="text-xs text-slate-600">
            LedgerHound Wallet Tracker · For full forensic investigation, <Link href="/free-evaluation" className="text-brand-500 hover:underline">request a free evaluation</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

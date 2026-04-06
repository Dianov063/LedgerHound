'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  AlertTriangle,
  Shield,
  Users,
  DollarSign,
  Calendar,
  CheckCircle2,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  Wallet,
  GitBranch,
  FileText,
  Flag,
} from 'lucide-react';
import Script from 'next/script';

interface ScamPlatform {
  slug: string;
  name: string;
  urls: string[];
  types: string[];
  reportIds: string[];
  totalLoss: number;
  lossCurrency: string;
  victims: number;
  addresses: string[];
  verified: boolean;
  firstReported: string;
  lastReported: string;
}

interface SafeReport {
  id: string;
  createdAt: string;
  platformType: string;
  scamAddress?: string;
  network?: string;
  lossAmount?: number;
  lossCurrency?: string;
  lossDate?: string;
  description?: string;
  blockchainConfirmed: boolean;
  trustTier: 1 | 2 | 3;
  status: string;
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
  if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return iso; }
}

function shortAddr(addr: string) {
  if (!addr || addr.length < 16) return addr;
  return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
}

function TrustBadge({ tier }: { tier: 1 | 2 | 3 }) {
  if (tier === 3) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full">
      <Lock size={10} /> Expert Verified
    </span>
  );
  if (tier === 2) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
      <CheckCircle2 size={10} /> Blockchain Verified
    </span>
  );
  return (
    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
      Community Reported
    </span>
  );
}

export default function PlatformPage() {
  const t = useTranslations('scamDatabase');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;
  const params = useParams();
  const rawSlug = (params.slug as string) || '';

  // Extract platform slug from "is-xxx-a-scam" pattern
  const slug = rawSlug.replace(/^is-/, '').replace(/-a-scam$/, '');

  const [platform, setPlatform] = useState<ScamPlatform | null>(null);
  const [reports, setReports] = useState<SafeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeEmail, setDisputeEmail] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/scam-database/platform?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setNotFound(true); }
        else { setPlatform(data.platform); setReports(data.reports || []); }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const handleDispute = async () => {
    if (!disputeEmail.includes('@') || disputeReason.length < 20) return;
    setDisputeSubmitting(true);
    try {
      await fetch('/api/scam-database/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformSlug: slug, contactEmail: disputeEmail, reason: disputeReason }),
      });
      setDisputeSubmitted(true);
    } catch {}
    setDisputeSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen"><Navbar />
        <div className="pt-32 text-center"><Loader2 size={24} className="animate-spin text-slate-400 mx-auto" /></div>
        <Footer />
      </div>
    );
  }

  if (notFound || !platform) {
    return (
      <div className="min-h-screen"><Navbar />
        <div className="pt-32 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{t('platform_not_found')}</h1>
          <Link href={`${base}/scam-database`} className="text-brand-600 font-semibold hover:underline">{t('back_to_database')}</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const schemaClaimReview = {
    '@context': 'https://schema.org',
    '@type': 'ClaimReview',
    claimReviewed: `${platform.name} is a legitimate exchange`,
    author: { '@type': 'Organization', name: 'LedgerHound' },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '1',
      bestRating: '5',
      worstRating: '1',
      alternateName: 'Scam',
    },
  };

  const schemaFAQ = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Is ${platform.name} a scam?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes. ${platform.name} has been reported by ${platform.victims} victims with total losses of ${formatLoss(platform.totalLoss)}.${platform.verified ? ' Multiple reports have been blockchain-verified.' : ''} Exercise extreme caution.`,
        },
      },
      {
        '@type': 'Question',
        name: `Can I recover money from ${platform.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Recovery may be possible through blockchain forensics and legal action. LedgerHound can trace funds across chains and identify exchange deposit addresses for legal subpoenas.`,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <Script id="schema-claim" type="application/ld+json">{JSON.stringify(schemaClaimReview)}</Script>
      <Script id="schema-faq" type="application/ld+json">{JSON.stringify(schemaFAQ)}</Script>

      {/* Warning Hero */}
      <div className="pt-24 pb-8 bg-gradient-to-br from-red-50 to-white border-b border-red-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <p className="font-display font-bold text-lg text-red-800">
                  {t('warning_prefix')} {platform.name} {t('warning_reported')} {platform.victims} {t('warning_victims')}
                </p>
                <p className="text-red-700 text-sm mt-1">
                  {t('warning_losses')} {formatLoss(platform.totalLoss)}. {t('warning_caution')}
                </p>
              </div>
            </div>
          </div>

          <h1 className="font-display font-bold text-3xl lg:text-4xl text-slate-900 mb-3">
            {t('platform_h1_prefix')} {platform.name} {t('platform_h1_suffix')}
          </h1>
          <p className="text-slate-600">
            {platform.victims} {t('platform_victims_report')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <Users size={18} className="text-slate-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900">{platform.victims}</p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{t('stat_victims_label')}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <DollarSign size={18} className="text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{formatLoss(platform.totalLoss)}</p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{t('stat_total_loss')}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <Calendar size={18} className="text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-900">{formatDate(platform.firstReported)}</p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{t('stat_first_report')}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            {platform.verified
              ? <CheckCircle2 size={18} className="text-emerald-500 mx-auto mb-2" />
              : <AlertTriangle size={18} className="text-amber-500 mx-auto mb-2" />
            }
            <p className="text-sm font-bold text-slate-900">{platform.verified ? t('status_verified') : t('status_reported')}</p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{t('stat_status')}</p>
          </div>
        </div>

        {/* Mirror Domains */}
        {platform.urls.length > 0 && (
          <section className="mb-8">
            <h2 className="font-display font-bold text-lg text-slate-900 mb-3">{t('known_domains')}</h2>
            <div className="flex flex-wrap gap-2">
              {platform.urls.map(u => (
                <span key={u} className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                  <ExternalLink size={10} /> {u}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Scam Addresses */}
        {platform.addresses.length > 0 && (
          <section className="mb-8">
            <h2 className="font-display font-bold text-lg text-slate-900 mb-3">{t('scam_addresses')}</h2>
            <div className="space-y-2">
              {platform.addresses.map(addr => (
                <div key={addr} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                  <code className="text-sm font-mono text-slate-700 flex-1 truncate">{addr}</code>
                  <button onClick={() => copyAddress(addr)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                    {copiedAddr === addr ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                  <Link href={`${base}/wallet-tracker?address=${encodeURIComponent(addr)}`} className="text-brand-600 hover:text-brand-700">
                    <Wallet size={14} />
                  </Link>
                  <Link href={`${base}/scam-checker?address=${encodeURIComponent(addr)}`} className="text-red-500 hover:text-red-600">
                    <Shield size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {platform.addresses[0] && (
            <>
              <Link
                href={`${base}/wallet-tracker?address=${encodeURIComponent(platform.addresses[0])}`}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Wallet size={14} /> {t('action_track')}
              </Link>
              <Link
                href={`${base}/graph-tracer?address=${encodeURIComponent(platform.addresses[0])}`}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <GitBranch size={14} /> {t('action_trace')}
              </Link>
            </>
          )}
          <Link
            href={`${base}/report${platform.addresses[0] ? `?address=${encodeURIComponent(platform.addresses[0])}` : ''}`}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            <FileText size={14} /> {t('action_report')}
          </Link>
        </div>

        {/* Reports List */}
        {reports.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display font-bold text-lg text-slate-900 mb-4">{t('victim_reports')} ({reports.length})</h2>
            <div className="space-y-3">
              {reports.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TrustBadge tier={r.trustTier} />
                      <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>
                      <span className="text-xs font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                        {SCAM_TYPE_LABELS[r.platformType] || r.platformType}
                      </span>
                    </div>
                    {r.lossAmount && (
                      <span className="text-sm font-bold text-red-600">
                        {formatLoss(r.lossAmount)} {r.lossCurrency}
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-sm text-slate-600 leading-relaxed">{r.description}</p>
                  )}
                  {r.scamAddress && (
                    <p className="text-xs text-slate-400 mt-2 font-mono">{t('address_label')}: {shortAddr(r.scamAddress)}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recovery Guide */}
        <section className="bg-brand-50 border border-brand-200 rounded-2xl p-8 mb-10">
          <h2 className="font-display font-bold text-xl text-slate-900 mb-4">
            {t('recovery_guide_title')} {platform.name}
          </h2>
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">1</span>{t('recovery_step_1')}</li>
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">2</span>{t('recovery_step_2')}</li>
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">3</span>{t('recovery_step_3')}</li>
            <li className="flex gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">4</span>{t('recovery_step_4')}</li>
          </ol>
          <Link
            href={`${base}/free-evaluation`}
            className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors mt-6"
          >
            {t('recovery_cta')} <ArrowRight size={16} />
          </Link>
        </section>

        {/* Dispute Button */}
        <section className="mb-10">
          {!disputeOpen ? (
            <button
              onClick={() => setDisputeOpen(true)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-semibold"
            >
              <Flag size={14} /> {t('dispute_btn')}
            </button>
          ) : disputeSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700">
              <CheckCircle2 size={16} className="inline mr-1" /> {t('dispute_submitted')}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-slate-700">{t('dispute_title')}</h3>
              <input
                type="email"
                value={disputeEmail}
                onChange={(e) => setDisputeEmail(e.target.value)}
                placeholder={t('dispute_email_ph')}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-500"
              />
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder={t('dispute_reason_ph')}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDispute}
                  disabled={disputeSubmitting || !disputeEmail.includes('@') || disputeReason.length < 20}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold disabled:opacity-40 hover:bg-slate-700 transition-colors"
                >
                  {disputeSubmitting ? <Loader2 size={14} className="animate-spin" /> : t('dispute_submit_btn')}
                </button>
                <button onClick={() => setDisputeOpen(false)} className="text-sm text-slate-500 hover:text-slate-700">{t('dispute_cancel')}</button>
              </div>
            </div>
          )}
        </section>

        {/* Disclaimer */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-xs text-slate-500 leading-relaxed">
          <p className="font-semibold text-slate-600 mb-2">{t('disclaimer_title')}</p>
          <p>{t('disclaimer_text')}</p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

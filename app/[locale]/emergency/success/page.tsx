'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  CheckCircle2,
  ArrowLeft,
  Mail,
  FileText,
  Users,
  Download,
  Loader2,
  Clock,
  Search,
  Shield,
  AlertTriangle,
} from 'lucide-react';

/* ── Types ── */
interface DocEntry {
  type: string;
  label: string;
  url: string;
  size: number;
  generatedAt: string;
}

interface PackStatus {
  status: 'generating' | 'ready' | 'not_found';
  caseId: string;
  email?: string;
  documentCount?: number;
  documents: DocEntry[];
}

/* ── Document icon colors ── */
const DOC_COLORS: Record<string, string> = {
  'action-guide': 'text-red-500 bg-red-50 border-red-200',
  'police-complaint': 'text-blue-600 bg-blue-50 border-blue-200',
  'regulator-complaint': 'text-amber-600 bg-amber-50 border-amber-200',
};
const PRESERVATION_COLOR = 'text-emerald-600 bg-emerald-50 border-emerald-200';

function getDocColor(type: string) {
  if (type.startsWith('preservation-letter')) return PRESERVATION_COLOR;
  return DOC_COLORS[type] || 'text-slate-600 bg-slate-50 border-slate-200';
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ═══════════════════════════════════════════════ */

export default function EmergencySuccessPage() {
  return (
    <Suspense fallback={null}>
      <EmergencySuccessContent />
    </Suspense>
  );
}

function EmergencySuccessContent() {
  const t = useTranslations('emergency_success');
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const caseId = searchParams.get('case_id') || '';
  const product = searchParams.get('product') || '';
  const victims = searchParams.get('victims') || '';
  const totalLoss = searchParams.get('total_loss') || '';
  const platformSlug = searchParams.get('platform_slug') || '';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {product === 'emergency_pack' && <EmergencyPackSuccess caseId={caseId} />}
          {product === 'summary_report' && (
            <SummaryReportSuccess caseId={caseId} platformSlug={platformSlug} />
          )}
          {product === 'group_joined' && (
            <GroupJoinedSuccess victims={victims} totalLoss={totalLoss} />
          )}
          {!product && <GenericSuccess caseId={caseId} />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EMERGENCY PACK SUCCESS — polling + downloads + upsell
   ══════════════════════════════════════════════════════════════ */
function EmergencyPackSuccess({ caseId }: { caseId: string }) {
  const t = useTranslations('emergency_success');
  const [pack, setPack] = useState<PackStatus | null>(null);
  const [polling, setPolling] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const fetchStatus = useCallback(async () => {
    if (!caseId) return;
    try {
      const res = await fetch(`/api/emergency/status?case_id=${encodeURIComponent(caseId)}`);
      if (!res.ok) return;
      const data: PackStatus = await res.json();
      setPack(data);
      if (data.status === 'ready') {
        setPolling(false);
      }
    } catch {
      // retry silently
    }
  }, [caseId]);

  // Poll every 5s until ready (max 5 minutes)
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      setElapsed((e) => {
        if (e >= 300) {
          setPolling(false);
          return e;
        }
        return e + 5;
      });
      if (polling) fetchStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, polling]);

  const isReady = pack?.status === 'ready';
  const docs = pack?.documents || [];
  const email = pack?.email || '';

  // Mask email: a***@domain.com
  const maskedEmail = email
    ? email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 6)) + c)
    : '';

  return (
    <div className="text-center">
      {/* ── Header Icon ── */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors duration-500 ${
          isReady ? 'bg-emerald-100' : 'bg-amber-100'
        }`}
      >
        {isReady ? (
          <CheckCircle2 size={40} className="text-emerald-500" />
        ) : (
          <Loader2 size={40} className="text-amber-500 animate-spin" />
        )}
      </div>

      {/* ── Title ── */}
      <h1 className="font-display font-bold text-3xl sm:text-4xl mb-2 text-slate-900">
        {isReady ? t('pack_ready_title') : t('pack_generating_title')}
        {isReady && <span className="ml-1">&#x26A1;</span>}
      </h1>
      <p className="text-slate-500 text-lg mb-8">
        {isReady
          ? t('pack_ready_desc')
          : t('pack_generating_desc')}
      </p>

      {/* ── Case ID badge ── */}
      {caseId && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-5 py-3 mb-8 inline-block">
          <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-0.5">{t('case_id_label')}</p>
          <p className="font-mono text-blue-600 text-sm font-medium">{caseId}</p>
        </div>
      )}

      {/* ── Urgency Reminder (shown when ready) ── */}
      {isReady && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 mb-8 flex items-start gap-3 text-left">
          <Clock size={20} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-red-700 font-semibold text-sm">{t('urgency_title')}</p>
            <p
              className="text-red-600/80 text-sm mt-0.5"
              dangerouslySetInnerHTML={{ __html: t('urgency_desc') }}
            />
          </div>
        </div>
      )}

      {/* ── Progress bar while generating ── */}
      {!isReady && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">{t('generating_docs')}</span>
            <span className="text-xs text-slate-400">{elapsed}s</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(95, (elapsed / 180) * 100)}%` }}
            />
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
            <span className={elapsed >= 5 ? 'text-emerald-500' : ''}>
              {elapsed >= 5 ? <CheckCircle2 size={12} className="inline mr-1" /> : null}
              {t('progress_forensic')}
            </span>
            <span className={elapsed >= 30 ? 'text-emerald-500' : ''}>
              {elapsed >= 30 ? <CheckCircle2 size={12} className="inline mr-1" /> : null}
              {t('progress_legal')}
            </span>
            <span className={elapsed >= 60 ? 'text-emerald-500' : ''}>
              {elapsed >= 60 ? <CheckCircle2 size={12} className="inline mr-1" /> : null}
              {t('progress_pdf')}
            </span>
          </div>
        </div>
      )}

      {/* ── Documents Grid ── */}
      {isReady && docs.length > 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-6 text-left">
          <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900">
            <FileText size={18} className="text-blue-500" />
            {t('your_documents')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {docs.map((doc) => {
              const color = getDocColor(doc.type);
              return (
                <a
                  key={doc.type}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 border rounded-xl px-4 py-3 hover:shadow-md transition-all group ${color}`}
                >
                  <Download
                    size={18}
                    className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate text-slate-900">{doc.label}</p>
                    <p className="text-[11px] text-slate-400">{formatBytes(doc.size)}</p>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Email note */}
          {maskedEmail && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 justify-center">
              <Mail size={14} className="text-slate-400" />
              <p className="text-slate-400 text-sm">
                {t('also_sent_to')} <span className="font-medium text-slate-600">{maskedEmail}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── What's included (shown while generating) ── */}
      {!isReady && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-8 text-left">
          <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900">
            <FileText size={18} className="text-blue-500" />
            {t('docs_being_prepared')}
          </h2>
          <ul className="space-y-3">
            {[
              { icon: '&#x1F6A8;', label: t('doc_police') },
              { icon: '&#x1F4E8;', label: t('doc_preservation') },
              { icon: '&#x1F3DB;', label: t('doc_regulator') },
              { icon: '&#x1F4CB;', label: t('doc_action_guide') },
              { icon: '&#x1F50D;', label: t('doc_forensic') },
            ].map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <span
                  className="text-base mt-0.5 shrink-0"
                  dangerouslySetInnerHTML={{ __html: item.icon }}
                />
                <span className="text-slate-600 text-sm">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Quick-Start Steps (shown when ready) ── */}
      {isReady && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-6 text-left">
          <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900">
            <AlertTriangle size={18} className="text-amber-500" />
            {t('what_to_do_now')}
          </h2>
          <ol className="space-y-4">
            {[
              {
                step: '1',
                title: t('action1_title'),
                desc: t('action1_desc'),
                color: 'bg-red-500',
              },
              {
                step: '2',
                title: t('action2_title'),
                desc: t('action2_desc'),
                color: 'bg-blue-500',
              },
              {
                step: '3',
                title: t('action3_title'),
                desc: t('action3_desc'),
                color: 'bg-emerald-500',
              },
              {
                step: '4',
                title: t('action4_title'),
                desc: t('action4_desc'),
                color: 'bg-amber-500',
              },
            ].map((item) => (
              <li key={item.step} className="flex items-start gap-3">
                <span
                  className={`${item.color} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5`}
                >
                  {item.step}
                </span>
                <div>
                  <p className="font-semibold text-sm text-slate-900">{item.title}</p>
                  <p className="text-slate-500 text-sm">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Upsell: Full Investigation ── */}
      {isReady && (
        <div className="bg-slate-900 rounded-2xl p-6 mb-8 text-left">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
              <Search size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                {t('upsell_title')}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                {t('upsell_subtitle')}
              </p>
            </div>
          </div>

          <ul className="space-y-2 mb-5">
            {[
              t('upsell_f1'),
              t('upsell_f2'),
              t('upsell_f3'),
              t('upsell_f4'),
              t('upsell_f5'),
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Shield size={14} className="text-blue-400 mt-0.5 shrink-0" />
                <span className="text-slate-300 text-sm">{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href={`mailto:contact@ledgerhound.vip?subject=Full Investigation Request — Case ${caseId}`}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-6 py-3 text-center text-sm transition-colors"
            >
              {t('upsell_cta')}
            </a>
            <span className="text-slate-500 text-xs">
              {t('upsell_or_call')} <a href="tel:+18335591334" className="text-blue-400 hover:underline">+1 (833) 559-1334</a>
            </span>
          </div>
        </div>
      )}

      {/* ── Back link ── */}
      <Link
        href="/emergency"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        {t('back_to_emergency')}
      </Link>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUMMARY REPORT SUCCESS
   ══════════════════════════════════════════════════════════════ */
function SummaryReportSuccess({
  caseId,
  platformSlug,
}: {
  caseId: string;
  platformSlug: string;
}) {
  const t = useTranslations('emergency_success');

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <FileText size={36} className="text-blue-500" />
      </div>

      <h1 className="font-display font-bold text-3xl sm:text-4xl mb-3 text-slate-900">
        {t('summary_title')}
      </h1>
      <p className="text-slate-500 text-lg mb-8">
        {t('summary_desc')}
      </p>

      {caseId && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-6 py-4 mb-8 inline-block">
          <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-0.5">{t('case_id_label')}</p>
          <p className="font-mono text-blue-600 text-sm font-medium">{caseId}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 mb-8 flex items-center gap-3 justify-center">
        <Mail size={20} className="text-blue-500" />
        <p className="text-blue-700 font-medium">{t('summary_check_email')}</p>
      </div>

      {platformSlug && (
        <Link
          href={`/scam-database/platform/${platformSlug}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-500 transition-colors text-sm mb-6"
        >
          {t('summary_view_platform')}
        </Link>
      )}

      <div className="block">
        <Link
          href="/emergency"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          {t('back_to_emergency')}
        </Link>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   GROUP JOINED SUCCESS
   ══════════════════════════════════════════════════════════════ */
function GroupJoinedSuccess({
  victims,
  totalLoss,
}: {
  victims: string;
  totalLoss: string;
}) {
  const t = useTranslations('emergency_success');
  const formattedLoss = totalLoss
    ? `$${Number(totalLoss).toLocaleString()}`
    : '';

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Users size={36} className="text-purple-500" />
      </div>

      <h1 className="font-display font-bold text-3xl sm:text-4xl mb-3 text-slate-900">
        {t('group_joined_title')}
      </h1>
      <p className="text-slate-500 text-lg mb-8">
        {t('group_joined_desc')}
      </p>

      {(victims || totalLoss) && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-8">
          <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2 justify-center text-slate-900">
            <Users size={18} className="text-purple-500" />
            {t('group_progress')}
          </h2>
          <div className="flex items-center justify-center gap-8">
            {victims && (
              <div>
                <p className="text-3xl font-bold text-slate-900">{victims}</p>
                <p className="text-slate-500 text-sm">{t('group_victims')}</p>
              </div>
            )}
            {formattedLoss && (
              <div>
                <p className="text-3xl font-bold text-emerald-500">{formattedLoss}</p>
                <p className="text-slate-500 text-sm">{t('group_total_losses')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Link
        href="/emergency"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        {t('back_to_emergency')}
      </Link>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   GENERIC FALLBACK
   ══════════════════════════════════════════════════════════════ */
function GenericSuccess({ caseId }: { caseId: string }) {
  const t = useTranslations('emergency_success');

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={40} className="text-emerald-500" />
      </div>

      <h1 className="font-display font-bold text-3xl sm:text-4xl mb-3 text-slate-900">
        {t('generic_title')}
      </h1>
      <p className="text-slate-500 text-lg mb-8">
        {t('generic_desc')}
      </p>

      {caseId && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl px-6 py-4 mb-8 inline-block">
          <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-0.5">{t('case_id_label')}</p>
          <p className="font-mono text-blue-600 text-sm font-medium">{caseId}</p>
        </div>
      )}

      <div className="block">
        <Link
          href="/emergency"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          {t('back_to_emergency')}
        </Link>
      </div>
    </div>
  );
}

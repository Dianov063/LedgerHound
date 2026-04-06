'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle2, ArrowLeft, Mail, FileText, Users, Zap } from 'lucide-react';

export default function EmergencySuccessPage() {
  return (
    <Suspense fallback={null}>
      <EmergencySuccessContent />
    </Suspense>
  );
}

function EmergencySuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const caseId = searchParams.get('case_id') || '';
  const product = searchParams.get('product') || '';
  const victims = searchParams.get('victims') || '';
  const totalLoss = searchParams.get('total_loss') || '';
  const platformSlug = searchParams.get('platform_slug') || '';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
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

/* ── Emergency Pack Success ── */
function EmergencyPackSuccess({ caseId }: { caseId: string }) {
  return (
    <div className="text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">&#x26A1;</span>
      </div>

      {/* Heading */}
      <h1 className="font-display font-bold text-3xl sm:text-4xl mb-3">
        Your Emergency Pack is being generated
      </h1>
      <p className="text-slate-400 text-lg mb-8">
        Documents will be emailed to you within 5 minutes
      </p>

      {/* Case ID */}
      {caseId && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 mb-8 inline-block">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Case ID</p>
          <p className="font-mono text-brand-400 text-sm">{caseId}</p>
        </div>
      )}

      {/* What's included */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 text-left">
        <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
          <FileText size={18} className="text-brand-400" />
          What&apos;s included
        </h2>
        <ul className="space-y-3">
          {[
            'Police Report Template (pre-filled with your case details)',
            'Preservation Letter for exchanges & platforms',
            'Chain of Custody Evidence Package',
            'Jurisdiction-specific filing instructions',
            'Transaction trace summary',
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-slate-300 text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Check email instruction */}
      <div className="bg-brand-600/10 border border-brand-500/20 rounded-xl px-6 py-4 mb-8 flex items-center gap-3 justify-center">
        <Mail size={20} className="text-brand-400" />
        <p className="text-brand-300 font-medium">Check your email for the documents</p>
      </div>

      {/* Back link */}
      <Link
        href="/emergency"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back to Emergency Response
      </Link>
    </div>
  );
}

/* ── Summary Report Success ── */
function SummaryReportSuccess({
  caseId,
  platformSlug,
}: {
  caseId: string;
  platformSlug: string;
}) {
  return (
    <div className="text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">&#x1F4C4;</span>
      </div>

      {/* Heading */}
      <h1 className="font-display font-bold text-3xl sm:text-4xl mb-3">
        Your Summary Report is being generated
      </h1>
      <p className="text-slate-400 text-lg mb-8">
        Report will be emailed within 10 minutes
      </p>

      {/* Case ID */}
      {caseId && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 mb-8 inline-block">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Case ID</p>
          <p className="font-mono text-brand-400 text-sm">{caseId}</p>
        </div>
      )}

      {/* Check email instruction */}
      <div className="bg-brand-600/10 border border-brand-500/20 rounded-xl px-6 py-4 mb-8 flex items-center gap-3 justify-center">
        <Mail size={20} className="text-brand-400" />
        <p className="text-brand-300 font-medium">Check your email for the report</p>
      </div>

      {/* Platform link */}
      {platformSlug && (
        <Link
          href={`/scam-database/platform/${platformSlug}`}
          className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors text-sm mb-6 block"
        >
          View platform profile in Scam Database
        </Link>
      )}

      {/* Back link */}
      <Link
        href="/emergency"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back to Emergency Response
      </Link>
    </div>
  );
}

/* ── Group Joined Success ── */
function GroupJoinedSuccess({
  victims,
  totalLoss,
}: {
  victims: string;
  totalLoss: string;
}) {
  const formattedLoss = totalLoss
    ? `$${Number(totalLoss).toLocaleString()}`
    : '';

  return (
    <div className="text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">&#x1F465;</span>
      </div>

      {/* Heading */}
      <h1 className="font-display font-bold text-3xl sm:text-4xl mb-3">
        You&apos;ve joined the Recovery Group
      </h1>
      <p className="text-slate-400 text-lg mb-8">
        We&apos;ll notify you when the threshold is reached
      </p>

      {/* Progress stats */}
      {(victims || totalLoss) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2 justify-center">
            <Users size={18} className="text-purple-400" />
            Current Progress
          </h2>
          <div className="flex items-center justify-center gap-8">
            {victims && (
              <div>
                <p className="text-3xl font-bold text-white">{victims}</p>
                <p className="text-slate-500 text-sm">victims</p>
              </div>
            )}
            {formattedLoss && (
              <div>
                <p className="text-3xl font-bold text-emerald-400">{formattedLoss}</p>
                <p className="text-slate-500 text-sm">total losses</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Back link */}
      <Link
        href="/emergency"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back to Emergency Response
      </Link>
    </div>
  );
}

/* ── Generic fallback ── */
function GenericSuccess({ caseId }: { caseId: string }) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={40} className="text-emerald-400" />
      </div>

      <h1 className="font-display font-bold text-3xl sm:text-4xl mb-3">
        Success
      </h1>
      <p className="text-slate-400 text-lg mb-8">
        Your request has been processed successfully.
      </p>

      {caseId && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-6 py-4 mb-8 inline-block">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Case ID</p>
          <p className="font-mono text-brand-400 text-sm">{caseId}</p>
        </div>
      )}

      <div className="block">
        <Link
          href="/emergency"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back to Emergency Response
        </Link>
      </div>
    </div>
  );
}

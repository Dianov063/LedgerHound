'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Shield,
  Search,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';

export default function ReportSuccessPage() {
  return (
    <Suspense fallback={null}>
      <ReportSuccessContent />
    </Suspense>
  );
}

interface ReportStatus {
  status: 'pending' | 'processing' | 'ready' | 'error';
  caseId?: string;
  downloadUrl?: string;
  email?: string;
  walletAddress?: string;
  message?: string;
}

function ReportSuccessContent() {
  const t = useTranslations('report');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const emailParam = searchParams.get('email') || '';
  // Support direct download URL (e.g. from email link)
  const directDownload = searchParams.get('download') || '';
  const directCaseId = searchParams.get('caseId') || '';

  const [reportStatus, setReportStatus] = useState<ReportStatus>({
    status: directDownload ? 'ready' : 'processing',
    downloadUrl: directDownload,
    caseId: directCaseId,
    email: emailParam,
  });
  const [pollCount, setPollCount] = useState(0);

  const checkStatus = useCallback(async () => {
    if (!sessionId || reportStatus.status === 'ready') return;
    try {
      const res = await fetch(`/api/report-status?session_id=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      if (data.status === 'ready') {
        setReportStatus({
          status: 'ready',
          caseId: data.caseId,
          downloadUrl: data.downloadUrl,
          email: data.email,
          walletAddress: data.walletAddress,
        });
      } else if (data.error) {
        setReportStatus({ status: 'error', message: data.error });
      } else {
        setReportStatus((prev) => ({
          ...prev,
          status: data.status === 'pending' ? 'pending' : 'processing',
          email: data.email || prev.email,
          walletAddress: data.walletAddress || prev.walletAddress,
          message: data.message,
        }));
        setPollCount((c) => c + 1);
      }
    } catch {
      // Silently retry
      setPollCount((c) => c + 1);
    }
  }, [sessionId, reportStatus.status]);

  useEffect(() => {
    if (!sessionId || reportStatus.status === 'ready' || reportStatus.status === 'error') return;
    // Poll every 5 seconds for up to 2 minutes
    if (pollCount >= 24) {
      setReportStatus((prev) => ({
        ...prev,
        status: 'ready', // Show email fallback
        message: 'Report generation may still be in progress.',
      }));
      return;
    }
    const timer = setTimeout(checkStatus, pollCount === 0 ? 1000 : 5000);
    return () => clearTimeout(timer);
  }, [pollCount, sessionId, reportStatus.status, checkStatus]);

  const isReady = reportStatus.status === 'ready';
  const isProcessing = reportStatus.status === 'processing' || reportStatus.status === 'pending';

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-28 pb-20 bg-gradient-to-br from-slate-50 to-white min-h-[80vh] flex items-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
            {isProcessing ? (
              <Loader2 size={40} className="text-emerald-600 animate-spin" />
            ) : (
              <CheckCircle2 size={40} className="text-emerald-600" />
            )}
          </div>

          <h1 className="font-display font-bold text-3xl lg:text-4xl text-slate-900 mb-4">
            {isProcessing ? 'Generating Your Report...' : t('success_title')}
          </h1>
          <p className="text-slate-600 text-lg mb-8">
            {isProcessing
              ? 'Your forensic wallet analysis is being generated. This usually takes 30-60 seconds.'
              : t('success_subtitle')}
          </p>

          {/* Email notice */}
          {isReady && (
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-5 py-3 rounded-xl mb-6">
              <Mail size={16} />
              {reportStatus.email
                ? `Report sent to ${reportStatus.email}`
                : t('success_email')}
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-5 py-3 rounded-xl mb-6">
              <Loader2 size={16} className="animate-spin" />
              {reportStatus.message || 'Analyzing blockchain data...'}
            </div>
          )}

          {/* Download button */}
          {isReady && reportStatus.downloadUrl && (
            <div className="mb-10">
              <a
                href={reportStatus.downloadUrl}
                download
                className="inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
              >
                <Download size={16} />
                Download Your Report PDF
              </a>
              <p className="text-xs text-slate-400 mt-2">
                {reportStatus.caseId && <span className="font-mono">Case {reportStatus.caseId} · </span>}
                Link valid for 7 days
              </p>
            </div>
          )}

          {/* Show email fallback if ready but no download URL */}
          {isReady && !reportStatus.downloadUrl && (
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-5 py-3 rounded-xl mb-6">
              <Mail size={16} />
              Your report has been sent to your email with a PDF attachment.
            </div>
          )}

          {/* Cards */}
          {isReady && (
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-left">
                <Search size={20} className="text-brand-600 mb-3" />
                <h3 className="font-display font-bold text-slate-900 mb-1">{t('success_try_tools')}</h3>
                <p className="text-sm text-slate-500 mb-4">{t('success_try_tools_desc')}</p>
                <div className="space-y-2">
                  <Link
                    href={`${base}/wallet-tracker`}
                    className="flex items-center gap-1.5 text-sm text-brand-600 font-semibold hover:text-brand-700"
                  >
                    Wallet Tracker <ArrowRight size={12} />
                  </Link>
                  <Link
                    href={`${base}/graph-tracer`}
                    className="flex items-center gap-1.5 text-sm text-brand-600 font-semibold hover:text-brand-700"
                  >
                    Graph Tracer <ArrowRight size={12} />
                  </Link>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 text-left">
                <FileText size={20} className="text-brand-600 mb-3" />
                <h3 className="font-display font-bold text-slate-900 mb-1">{t('success_need_more')}</h3>
                <p className="text-sm text-slate-500 mb-4">{t('success_need_more_desc')}</p>
                <Link
                  href={`${base}/free-evaluation`}
                  className="inline-flex items-center gap-1.5 bg-brand-600 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  {t('success_cta')} <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

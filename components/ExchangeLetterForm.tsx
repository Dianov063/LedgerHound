'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { EXCHANGES, NETWORKS, type ExchangeInfo } from '@/lib/exchangeDatabase';
import {
  generateLetter,
  generateCaseId,
  getLetterSubject,
  LETTER_TYPE_INFO,
  type LetterType,
  type LetterData,
} from '@/lib/letterTemplates';
import {
  Copy,
  Download,
  Mail,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  ChevronDown,
  Info,
  ExternalLink,
} from 'lucide-react';

const LS_KEY = 'lh_exchange_letter_draft';

interface FormState {
  exchangeId: string;
  letterType: LetterType;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  incidentDate: string;
  amountLost: string;
  walletAddress: string;
  transactionHashes: string;
  network: string;
  description: string;
  caseId: string;
}

const INITIAL: FormState = {
  exchangeId: 'binance',
  letterType: 'preservation',
  senderName: '',
  senderEmail: '',
  senderPhone: '',
  incidentDate: '',
  amountLost: '',
  walletAddress: '',
  transactionHashes: '',
  network: 'eth',
  description: '',
  caseId: '',
};

function validate(f: FormState): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.senderName.trim()) e.senderName = 'Required';
  if (!f.senderEmail.trim()) e.senderEmail = 'Required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.senderEmail)) e.senderEmail = 'Invalid email';
  if (!f.incidentDate) e.incidentDate = 'Required';
  if (!f.amountLost.trim()) e.amountLost = 'Required';
  else if (isNaN(Number(f.amountLost.replace(/,/g, '')))) e.amountLost = 'Must be a number';
  if (!f.walletAddress.trim()) e.walletAddress = 'Required';
  if (!f.transactionHashes.trim()) e.transactionHashes = 'At least one TX hash';
  if (!f.description.trim()) e.description = 'Required';
  return e;
}

export default function ExchangeLetterForm() {
  const t = useTranslations('exchange_letter');
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Load draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FormState>;
        setForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch { /* ignore */ }
    // Generate case ID if not present
    setForm((prev) => ({
      ...prev,
      caseId: prev.caseId || generateCaseId(),
    }));
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(form));
    } catch { /* ignore */ }
  }, [form]);

  const exchange = useMemo(
    () => EXCHANGES.find((e) => e.id === form.exchangeId) || EXCHANGES[0],
    [form.exchangeId],
  );

  const letterData: LetterData = useMemo(
    () => ({
      letterType: form.letterType,
      exchange,
      senderName: form.senderName,
      senderEmail: form.senderEmail,
      senderPhone: form.senderPhone || undefined,
      incidentDate: form.incidentDate,
      amountLost: form.amountLost.replace(/,/g, ''),
      walletAddress: form.walletAddress,
      transactionHashes: form.transactionHashes,
      network:
        NETWORKS.find((n) => n.id === form.network)?.label || form.network,
      description: form.description,
      caseId: form.caseId,
    }),
    [form, exchange],
  );

  const letterText = useMemo(() => generateLetter(letterData), [letterData]);
  const emailSubject = useMemo(() => getLetterSubject(letterData), [letterData]);

  const set = useCallback(
    (key: keyof FormState, val: string) => {
      setForm((prev) => ({ ...prev, [key]: val }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const handleGenerate = () => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setShowPreview(true);
    setGenerated(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(letterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([letterText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.caseId}-${form.letterType}-${exchange.name.replace(/[^a-zA-Z0-9]/g, '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMailto = () => {
    const to = exchange.complianceEmail;
    const cc = exchange.legalEmail || '';
    const subject = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(letterText);
    window.open(`mailto:${to}${cc ? `?cc=${cc}` : ''}${cc ? '&' : '?'}subject=${subject}&body=${body}`);
  };

  const handleReset = () => {
    const newCaseId = generateCaseId();
    setForm({ ...INITIAL, caseId: newCaseId });
    setErrors({});
    setShowPreview(false);
    setGenerated(false);
    localStorage.removeItem(LS_KEY);
  };

  // Field helper
  const Field = ({
    label,
    name,
    type = 'text',
    placeholder,
    required = true,
    half = false,
    textarea = false,
    hint,
  }: {
    label: string;
    name: keyof FormState;
    type?: string;
    placeholder?: string;
    required?: boolean;
    half?: boolean;
    textarea?: boolean;
    hint?: string;
  }) => (
    <div className={half ? 'sm:col-span-1' : 'sm:col-span-2'}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea
          value={form[name]}
          onChange={(e) => set(name, e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y ${
            errors[name] ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
        />
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={(e) => set(name, e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
            errors[name] ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
        />
      )}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ─── LEFT: Form ─── */}
        <div className="space-y-6">
          {/* Exchange Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-blue-600" />
              {t('select_exchange')}
            </h3>
            <div className="relative">
              <select
                value={form.exchangeId}
                onChange={(e) => set('exchangeId', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white cursor-pointer"
              >
                {EXCHANGES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} {!ex.active ? '(Bankrupt)' : ''} — {ex.region}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Exchange Info Card */}
            <div className="mt-4 bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{exchange.name}</span>
                {!exchange.active && (
                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">INACTIVE</span>
                )}
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p><span className="font-medium">Compliance:</span> {exchange.complianceEmail}</p>
                {exchange.legalEmail && <p><span className="font-medium">Legal/LE:</span> {exchange.legalEmail}</p>}
                <p className="flex items-center gap-1"><Clock size={12} /> {t('response_time')}: {exchange.responseTime}</p>
                <p className="flex items-center gap-1"><Info size={12} /> {exchange.notes}</p>
              </div>
              {exchange.requiresSubpoena && (
                <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-md p-2 mt-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{t('subpoena_note')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Letter Type */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              {t('letter_type')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(LETTER_TYPE_INFO) as LetterType[]).map((lt) => {
                const info = LETTER_TYPE_INFO[lt];
                const selected = form.letterType === lt;
                return (
                  <button
                    key={lt}
                    onClick={() => set('letterType', lt)}
                    className={`text-left p-3 rounded-lg border-2 transition-all ${
                      selected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p className={`text-sm font-bold ${selected ? 'text-blue-700' : 'text-slate-800'}`}>{info.label}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{info.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{t('your_details')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('name')} name="senderName" placeholder="John Doe" half />
              <Field label={t('email')} name="senderEmail" type="email" placeholder="your@email.com" half />
              <Field label={t('phone')} name="senderPhone" placeholder="+1 (555) 123-4567" required={false} half />
              <Field label={t('incident_date')} name="incidentDate" type="date" half />
              <Field label={t('amount_lost')} name="amountLost" placeholder="5000" half hint={t('amount_hint')} />
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('network')}</label>
                <select
                  value={form.network}
                  onChange={(e) => set('network', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {NETWORKS.map((n) => (
                    <option key={n.id} value={n.id}>{n.label}</option>
                  ))}
                </select>
              </div>
              <Field label={t('wallet_address')} name="walletAddress" placeholder="0x..." />
              <Field
                label={t('tx_hashes')}
                name="transactionHashes"
                textarea
                placeholder={t('tx_hashes_placeholder')}
                hint={t('tx_hashes_hint')}
              />
              <Field
                label={t('description')}
                name="description"
                textarea
                placeholder={t('description_placeholder')}
              />
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                {t('case_id')}: <span className="font-mono font-bold text-slate-600">{form.caseId}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {t('reset')}
                </button>
                <button
                  onClick={handleGenerate}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  {t('generate')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Preview + Actions ─── */}
        <div className="space-y-6">
          {/* Live Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm sticky top-28">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                {t('preview')}
              </h3>
              {generated && (
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle size={12} /> {t('ready')}
                </span>
              )}
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-4 border border-slate-100">
                {letterText}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {copied ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  {copied ? t('copied') : t('copy')}
                </button>
                <button
                  onClick={handleDownloadTxt}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Download size={16} />
                  {t('download_txt')}
                </button>
              </div>
              <button
                onClick={handleMailto}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                <Mail size={16} />
                {t('open_email')} ({exchange.complianceEmail})
              </button>
              <p className="text-xs text-slate-400 text-center">{t('email_note')}</p>
            </div>
          </div>

          {/* Upsell */}
          {generated && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <h4 className="text-base font-bold text-slate-900 mb-2">{t('upsell_title')}</h4>
              <p className="text-sm text-slate-600 mb-4">{t('upsell_desc')}</p>
              <a
                href="/report"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                {t('upsell_cta')} <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

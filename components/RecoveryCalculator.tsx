'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Shield,
  TrendingUp,
} from 'lucide-react';

const questions = [
  { key: 'q1', options: [5, 15, 25, 35], count: 4 },
  { key: 'q2', options: [40, 30, 20, 10, 5], count: 5 },
  { key: 'q3', options: [25, 15, 8, 2], count: 4 },
  { key: 'q4', options: [20, 18, 12, 8], count: 4 },
  { key: 'q5', options: [25, 15, 10, 3], count: 4 },
  { key: 'q6', options: [10, 7, 3], count: 3 },
];

const factorKeys = [
  { good: 'factor_amount_high', bad: 'factor_amount_low', threshold: 15 },
  { good: 'factor_time_good', bad: 'factor_time_bad', threshold: 20 },
  { good: 'factor_evidence_good', bad: 'factor_evidence_bad', threshold: 15 },
  { good: 'factor_chain_good', bad: 'factor_chain_bad', threshold: 12 },
  { good: 'factor_exchange_good', bad: 'factor_exchange_bad', threshold: 15 },
  { good: 'factor_reported_good', bad: 'factor_reported_bad', threshold: 7 },
];

export default function RecoveryCalculator() {
  const t = useTranslations('calculator');
  const locale = useLocale();
  const base = locale === 'en' ? '' : `/${locale}`;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null, null, null, null]);
  const [showResult, setShowResult] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  const totalScore = answers.reduce((sum: number, a) => sum + (a ?? 0), 0);

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { key: 'high', color: 'emerald', ring: 'ring-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', fill: 'text-emerald-500' };
    if (score >= 55) return { key: 'moderate', color: 'amber', ring: 'ring-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', fill: 'text-amber-500' };
    if (score >= 30) return { key: 'low_moderate', color: 'orange', ring: 'ring-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', fill: 'text-orange-500' };
    return { key: 'low', color: 'red', ring: 'ring-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', fill: 'text-red-500' };
  };

  useEffect(() => {
    if (!showResult) return;
    let frame = 0;
    const target = totalScore;
    const duration = 1200;
    const fps = 60;
    const totalFrames = (duration / 1000) * fps;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * target));
      if (frame >= totalFrames) {
        setAnimatedScore(target);
        clearInterval(timer);
      }
    }, 1000 / fps);
    return () => clearInterval(timer);
  }, [showResult, totalScore]);

  const selectAnswer = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = questions[questionIndex].options[optionIndex];
    setAnswers(newAnswers);
  };

  const goNext = () => {
    if (step < 5) setStep(step + 1);
    else setShowResult(true);
  };

  const goBack = () => {
    if (showResult) { setShowResult(false); return; }
    if (step > 0) setStep(step - 1);
  };

  const restart = () => {
    setStep(0);
    setAnswers([null, null, null, null, null, null]);
    setShowResult(false);
    setAnimatedScore(0);
  };

  const getSelectedOptionIndex = (qIndex: number): number | null => {
    const val = answers[qIndex];
    if (val === null) return null;
    return questions[qIndex].options.indexOf(val);
  };

  const getFactors = () => {
    const factors: { text: string; positive: boolean }[] = [];
    for (let i = 0; i < 6; i++) {
      const val = answers[i] ?? 0;
      const f = factorKeys[i];
      const isGood = val >= f.threshold;
      factors.push({
        text: t(isGood ? f.good : f.bad),
        positive: isGood,
      });
    }
    return factors.sort((a, b) => (b.positive ? 1 : 0) - (a.positive ? 1 : 0)).slice(0, 3);
  };

  const buildEvalUrl = () => {
    const params = new URLSearchParams();
    const selectedIndices = answers.map((_, i) => getSelectedOptionIndex(i));
    params.set('source', 'calculator');
    params.set('score', String(totalScore));
    if (selectedIndices[0] !== null) {
      const amounts = ['<5000', '5000-25000', '25000-100000', '>100000'];
      params.set('amount', amounts[selectedIndices[0]]);
    }
    if (selectedIndices[1] !== null) {
      const times = ['7days', '1-4weeks', '1-3months', '3-12months', '>1year'];
      params.set('when', times[selectedIndices[1]]);
    }
    return `${base}/free-evaluation?${params.toString()}`;
  };

  const level = getScoreLevel(showResult ? totalScore : animatedScore);
  const maxScore = 155;
  const percentage = Math.round((animatedScore / maxScore) * 100);

  // Question view
  if (!showResult) {
    const q = questions[step];
    const selectedIdx = getSelectedOptionIndex(step);

    return (
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
            <span>{t('question')} {step + 1} {t('of')} 6</span>
            <span className="font-mono text-xs">{Math.round(((step + 1) / 6) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 mb-6">
            {t(`${q.key}_title`)}
          </h2>

          <div className="space-y-3">
            {Array.from({ length: q.count }, (_, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(step, i)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedIdx === i
                    ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      selectedIdx === i ? 'border-brand-500 bg-brand-500' : 'border-slate-300'
                    }`}
                  >
                    {selectedIdx === i && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="font-medium text-sm sm:text-base">{t(`${q.key}_o${i + 1}`)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={goBack}
              disabled={step === 0}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors ${
                step === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft size={14} /> {t('back')}
            </button>

            <button
              onClick={goNext}
              disabled={selectedIdx === null}
              className={`flex items-center gap-1.5 text-sm font-bold px-6 py-2.5 rounded-lg transition-all ${
                selectedIdx === null
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
              }`}
            >
              {step === 5 ? t('calculate') : t('next')} <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: 6 }, (_, i) => (
            <button
              key={i}
              onClick={() => { if (answers[i] !== null || i <= step) setStep(i); }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === step
                  ? 'bg-brand-600 scale-125'
                  : answers[i] !== null
                  ? 'bg-brand-300'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Result view
  const factors = getFactors();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Score Circle */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm text-center mb-6">
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">{t('score_title')}</p>

        <div className="relative inline-flex items-center justify-center mb-6">
          <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
            <circle cx="90" cy="90" r="78" fill="none" stroke="#f1f5f9" strokeWidth="12" />
            <circle
              cx="90"
              cy="90"
              r="78"
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              className={`transition-all duration-1000 ${level.fill}`}
              stroke="currentColor"
              strokeDasharray={`${2 * Math.PI * 78}`}
              strokeDashoffset={`${2 * Math.PI * 78 * (1 - percentage / 100)}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-bold text-4xl text-slate-900">{animatedScore}</span>
            <span className="text-xs text-slate-400">/ {maxScore}</span>
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${level.bg} ${level.text} ${level.border} border`}>
          <TrendingUp size={14} />
          {t(`${level.key}_label`)}
        </div>

        <p className="text-slate-600 text-sm leading-relaxed mt-4 max-w-md mx-auto">
          {t(`${level.key}_msg`)}
        </p>
      </div>

      {/* Key Factors */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
        <h3 className="font-display font-bold text-lg text-slate-900 mb-4">{t('key_factors')}</h3>
        <div className="space-y-3">
          {factors.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              {f.positive ? (
                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm text-slate-600">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What Next */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
        <h3 className="font-display font-bold text-lg text-slate-900 mb-2">{t('what_next')}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{t('what_next_desc')}</p>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <Link
          href={buildEvalUrl()}
          className="flex items-center justify-center gap-2 w-full bg-brand-600 text-white font-bold py-4 rounded-xl hover:bg-brand-700 transition-colors shadow-sm text-sm"
        >
          <Shield size={16} />
          {t('cta_primary')}
          <ArrowRight size={14} />
        </Link>

        <Link
          href={`${base}/wallet-tracker`}
          className="flex items-center justify-center gap-2 w-full bg-white text-slate-700 font-semibold py-3.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:text-brand-600 transition-colors text-sm"
        >
          {t('cta_secondary')}
          <ArrowRight size={14} />
        </Link>

        <button
          onClick={restart}
          className="flex items-center justify-center gap-1.5 w-full text-slate-400 hover:text-slate-600 text-sm py-2 transition-colors"
        >
          <RotateCcw size={12} />
          {t('restart')}
        </button>
      </div>
    </div>
  );
}

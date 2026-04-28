'use client';

import { useState, useEffect } from 'react';
import { Lock, Zap, Loader2, FileText, Globe, CheckCircle2, AlertCircle, Rocket, RefreshCw, Sparkles, Search, ExternalLink, Calendar } from 'lucide-react';

/* ── Quick topic presets ── */
const QUICK_TOPICS = [
  'How crypto scammers launder money through mixers',
  'Crypto in divorce: hidden assets guide for attorneys',
  'How to subpoena a cryptocurrency exchange: attorney guide',
  'Romance scam recovery: step by step guide 2026',
  'Ransomware payment tracing: can businesses recover crypto',
  'Is blockchain evidence admissible in US courts',
];

const CATEGORIES = ['Guide', 'Case Study', 'Legal', 'Education'] as const;

const LANGS = [
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
] as const;

type Article = any;
type Step = 'idle' | 'researching' | 'generating' | 'humanizing' | 'translating' | 'ready' | 'publishing' | 'published' | 'error';

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

/* ─── Password Gate ─── */
function PasswordGate({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/check-env', { headers: { 'x-admin-key': pw } });
      if (res.ok) {
        localStorage.setItem('blog-agent-pw', pw);
        onAuth(pw);
      } else {
        setError('Wrong password');
      }
    } catch {
      setError('Connection error');
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 w-full max-w-sm shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl mx-auto mb-5">
          <Lock size={20} className="text-slate-500" />
        </div>
        <h1 className="font-bold text-lg text-slate-900 text-center mb-1">Blog Agent</h1>
        <p className="text-sm text-slate-500 text-center mb-6">Internal tool — admin password</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Password"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mb-3 outline-none focus:border-slate-400"
          autoFocus
        />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={!pw || checking}
          className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-40"
        >
          {checking ? 'Checking...' : 'Enter'}
        </button>
      </div>
    </div>
  );
}

/* ─── Main UI ─── */
function BlogAgentUI({ adminPw }: { adminPw: string }) {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('Guide');

  const [step, setStep] = useState<Step>('idle');
  const [progressLabel, setProgressLabel] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  // Research state
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResults, setResearchResults] = useState<TavilyResult[]>([]);
  const [selectedSources, setSelectedSources] = useState<TavilyResult[]>([]);
  const [showResearch, setShowResearch] = useState(false);

  // Article state
  const [enArticle, setEnArticle] = useState<Article | null>(null);
  const [translations, setTranslations] = useState<Record<string, Article>>({});
  const [activeTab, setActiveTab] = useState<'en' | 'ru' | 'es' | 'zh' | 'fr' | 'ar'>('en');

  // Publish state
  const [publishedUrl, setPublishedUrl] = useState('');
  const [commitUrl, setCommitUrl] = useState('');

  /* ── API helpers ── */
  async function api(payload: any): Promise<any> {
    const res = await fetch('/api/blog-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || `API error ${res.status}`);
    return data;
  }

  async function publish(payload: { translations: Record<string, Article> }): Promise<any> {
    const res = await fetch('/api/blog-agent/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminPw },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || `Publish error ${res.status}`);
    return data;
  }

  /* ── Research: find real trending topics with sources ── */
  async function doResearch() {
    setStep('researching');
    setError('');
    setResearchResults([]);
    setSelectedSources([]);
    try {
      const data = await api({ mode: 'research', query: researchQuery || undefined });
      setResearchResults(data.results || []);
      if (!researchQuery) setResearchQuery(data.query); // show what we searched for
      setStep('idle');
      setShowResearch(true);
    } catch (e: any) {
      setError(e.message || 'Research failed');
      setStep('error');
    }
  }

  function toggleSource(source: TavilyResult) {
    if (selectedSources.find((s) => s.url === source.url)) {
      setSelectedSources(selectedSources.filter((s) => s.url !== source.url));
    } else {
      if (selectedSources.length >= 6) return; // cap at 6 sources
      setSelectedSources([...selectedSources, source]);
    }
  }

  /* ── Generate article + translations ── */
  async function generateAll() {
    if (!topic.trim()) return;
    setStep('generating');
    setError('');
    setEnArticle(null);
    setTranslations({});
    setPublishedUrl('');
    setCommitUrl('');
    setActiveTab('en');

    try {
      // Step 1: Generate EN article (with sources if research was done)
      setProgressLabel(selectedSources.length > 0
        ? `Generating from ${selectedSources.length} real sources...`
        : 'Generating English article...');
      setProgress(15);
      const gen = await api({
        mode: 'generate',
        topic,
        category,
        sources: selectedSources.length > 0 ? selectedSources : undefined,
      });
      let en = gen.article;

      // Step 2: Humanize EN
      setStep('humanizing');
      setProgressLabel('Humanizing (anti-AI pass)...');
      setProgress(30);
      try {
        const hum = await api({ mode: 'humanize', article: en });
        en = hum.article;
      } catch {
        // Humanize is optional — fall back to original
      }
      setEnArticle(en);

      // Step 3: Translate to 5 languages (sequential to avoid rate limits)
      setStep('translating');
      const translated: Record<string, Article> = { en };
      for (let i = 0; i < LANGS.length; i++) {
        const lang = LANGS[i];
        setProgressLabel(`Translating to ${lang.name}...`);
        setProgress(40 + Math.round((i / LANGS.length) * 50));
        try {
          const t = await api({ mode: 'translate', article: en, locale: lang.code });
          translated[lang.code] = t.article;
          setTranslations({ ...translated });
        } catch (e: any) {
          throw new Error(`Translation to ${lang.name} failed: ${e.message}`);
        }
      }

      setProgress(100);
      setProgressLabel('Ready to publish');
      setStep('ready');
    } catch (e: any) {
      setError(e.message || 'Generation failed');
      setStep('error');
    }
  }

  /* ── Publish to GitHub ── */
  async function doPublish() {
    if (!enArticle) return;
    if (Object.keys(translations).length < 6) {
      setError('Not all translations are ready');
      return;
    }
    if (!confirm(`Publish "${enArticle.title}"?\n\nThis commits to GitHub and deploys to production.`)) return;

    setStep('publishing');
    setError('');
    try {
      const result = await publish({ translations });
      setPublishedUrl(result.previewUrl);
      setCommitUrl(result.commit.url);
      setStep('published');
    } catch (e: any) {
      setError(e.message || 'Publish failed');
      setStep('ready');
    }
  }

  /* ── Render preview of an article ── */
  function renderPreview(article: Article | null) {
    if (!article) return <div className="text-sm text-slate-400 italic">No content yet</div>;
    return (
      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Title</div>
          <h2 className="font-bold text-lg text-slate-900">{article.title}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400">Category: </span>
            <span className="text-slate-700">{article.category}</span>
          </div>
          <div>
            <span className="text-slate-400">Read: </span>
            <span className="text-slate-700">{article.readTime}</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Excerpt</div>
          <p className="text-sm text-slate-600">{article.excerpt}</p>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Slug</div>
          <code className="text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{article.slug}</code>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Intro</div>
          {(article.intro || []).map((p: string, i: number) => (
            <p key={i} className="text-sm text-slate-600 mb-2">{p}</p>
          ))}
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Sections ({article.sections?.length || 0})
          </div>
          <div className="space-y-1.5">
            {(article.sections || []).map((s: any, i: number) => (
              <div key={i} className="text-sm text-slate-700">
                <span className="text-slate-400 mr-1.5">#{i + 1}</span>
                {s.heading}
                <span className="text-xs text-slate-400 ml-2">({s.blocks?.length || 0} blocks)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const langsDone = Object.keys(translations).filter((k) => k !== 'en');
  const isWorking = ['generating', 'humanizing', 'translating', 'publishing'].includes(step);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">LedgerHound Blog Agent</h1>
              <p className="text-xs text-slate-400">DeepSeek · 6 languages · Auto-publish to production</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            v2 — JSON pipeline
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Research */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Search size={14} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Step 1: Research real trending topics</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Find real news from the last 30 days across EN/RU/ES. Articles will be based on these sources — no invented facts.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={researchQuery}
              onChange={(e) => setResearchQuery(e.target.value)}
              placeholder="e.g. crypto exchange subpoena 2026 (or leave empty for curated trending)"
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && !isWorking && doResearch()}
            />
            <button
              type="button"
              onClick={doResearch}
              disabled={isWorking}
              className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 disabled:opacity-40 flex items-center gap-2"
            >
              {step === 'researching' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {step === 'researching' ? 'Searching...' : 'Research'}
            </button>
          </div>

          {/* Research results */}
          {showResearch && researchResults.length > 0 && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500">
                  Found {researchResults.length} sources · Selected: <span className="font-bold text-slate-900">{selectedSources.length}/6</span>
                </p>
                {selectedSources.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSources([])}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Clear selection
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {researchResults.map((r) => {
                  const selected = !!selectedSources.find((s) => s.url === r.url);
                  const disabled = !selected && selectedSources.length >= 6;
                  return (
                    <button
                      type="button"
                      key={r.url}
                      onClick={() => toggleSource(r)}
                      disabled={disabled}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50'
                          : disabled
                            ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                            : 'border-slate-200 hover:border-slate-400 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`flex-shrink-0 w-4 h-4 rounded border ${selected ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'} flex items-center justify-center mt-0.5`}>
                          {selected && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 mb-1">{r.title}</p>
                          <p className="text-xs text-slate-500 mb-1.5 line-clamp-2">{r.content}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 truncate max-w-xs">
                              <ExternalLink size={9} />
                              {(() => { try { return new URL(r.url).hostname; } catch { return r.url; } })()}
                            </span>
                            {r.publishedDate && (
                              <span className="flex items-center gap-1">
                                <Calendar size={9} />
                                {new Date(r.publishedDate).toLocaleDateString()}
                              </span>
                            )}
                            {r.score && <span>score {r.score.toFixed(2)}</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Topic input */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Step 2: Define topic & generate</span>
            {selectedSources.length > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                {selectedSources.length} sources selected
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. How Binance handles subpoenas in 2026"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400 bg-white"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {QUICK_TOPICS.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTopic(t)}
                className={`text-[11px] px-2.5 py-1 rounded-full border ${
                  topic === t ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400'
                }`}
              >
                {t.length > 50 ? t.slice(0, 50) + '...' : t}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={generateAll}
            disabled={!topic.trim() || isWorking}
            className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isWorking ? (
              <><Loader2 size={14} className="animate-spin" /> {progressLabel}</>
            ) : (
              <><Sparkles size={14} /> Generate Article + 5 Translations</>
            )}
          </button>

          {/* Progress bar */}
          {isWorking && (
            <div className="mt-3">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Translation status */}
        {(step === 'translating' || step === 'ready' || step === 'publishing' || step === 'published') && enArticle && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Globe size={12} /> Translation status
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span className="text-slate-700">🇬🇧 EN</span>
              </div>
              {LANGS.map((lang) => (
                <div key={lang.code} className="flex items-center gap-1.5 text-xs">
                  {langsDone.includes(lang.code) ? (
                    <CheckCircle2 size={12} className="text-emerald-600" />
                  ) : step === 'translating' ? (
                    <Loader2 size={12} className="text-slate-400 animate-spin" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-slate-300" />
                  )}
                  <span className="text-slate-700">{lang.flag} {lang.code.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview tabs */}
        {(step === 'ready' || step === 'publishing' || step === 'published' || (step === 'translating' && enArticle)) && (
          <div className="bg-white border border-slate-200 rounded-xl mb-4">
            <div className="border-b border-slate-200 flex overflow-x-auto">
              {(['en', ...LANGS.map((l) => l.code)] as const).map((loc) => {
                const ready = loc === 'en' ? !!enArticle : !!translations[loc];
                return (
                  <button
                    type="button"
                    key={loc}
                    onClick={() => ready && setActiveTab(loc as any)}
                    disabled={!ready}
                    className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                      activeTab === loc ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                    } ${!ready ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {loc === 'en' ? '🇬🇧 EN' : `${LANGS.find((l) => l.code === loc)?.flag} ${loc.toUpperCase()}`}
                    {ready && <CheckCircle2 size={10} className="inline ml-1.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
            <div className="p-5">
              {renderPreview(activeTab === 'en' ? enArticle : translations[activeTab])}
            </div>
          </div>
        )}

        {/* Publish action */}
        {step === 'ready' && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Rocket size={16} />
              <span className="font-bold text-sm">Ready to publish</span>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              This will commit 9 files to GitHub (6 content/, 1 page.tsx, 1 layout.tsx, updates to blog index + sitemap) and trigger Vercel deploy.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={doPublish}
                className="flex-1 py-3 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 flex items-center justify-center gap-2"
              >
                <Rocket size={14} /> Publish to Production
              </button>
              <button
                type="button"
                onClick={generateAll}
                className="px-4 py-3 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 flex items-center gap-2"
              >
                <RefreshCw size={14} /> Regenerate
              </button>
            </div>
          </div>
        )}

        {step === 'publishing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center gap-3">
            <Loader2 size={18} className="text-blue-600 animate-spin" />
            <div className="text-sm text-blue-700">Committing to GitHub...</div>
          </div>
        )}

        {step === 'published' && publishedUrl && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span className="font-bold text-sm text-emerald-800">Published!</span>
            </div>
            <p className="text-xs text-emerald-700 mb-3">
              Vercel deploy in progress. Article will be live at the URL below in ~2 minutes.
            </p>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-emerald-600 font-semibold">Live URL: </span>
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">{publishedUrl}</a>
              </div>
              <div>
                <span className="text-emerald-600 font-semibold">Commit: </span>
                <a href={commitUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">{commitUrl}</a>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setStep('idle'); setTopic(''); setEnArticle(null); setTranslations({}); }}
              className="mt-4 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              ← Generate another article
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page wrapper ─── */
export default function BlogAgentPage() {
  const [authed, setAuthed] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const saved = localStorage.getItem('blog-agent-pw');
    if (saved) {
      // Validate saved password
      fetch('/api/check-env', { headers: { 'x-admin-key': saved } }).then((res) => {
        if (res.ok) {
          setAdminPw(saved);
          setAuthed(true);
        } else {
          localStorage.removeItem('blog-agent-pw');
        }
      });
    }
  }, []);

  if (!hydrated) return null;
  if (!authed) {
    return <PasswordGate onAuth={(pw) => { setAdminPw(pw); setAuthed(true); }} />;
  }
  return <BlogAgentUI adminPw={adminPw} />;
}

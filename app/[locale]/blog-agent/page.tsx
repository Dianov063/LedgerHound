'use client';

import { useState, useRef } from 'react';
import {
  Lock,
  Zap,
  Copy,
  Check,
  ChevronRight,
  Loader2,
  FileText,
  Globe,
  ClipboardCopy,
} from 'lucide-react';

/* ── Quick topic presets ── */
const QUICK_TOPICS = [
  'How to identify a fake crypto trading platform',
  'Crypto in divorce: hidden assets guide for attorneys',
  'Is blockchain evidence admissible in US courts',
  'How crypto scammers launder money through mixers',
  'Ransomware payment tracing: can businesses recover crypto',
  'How to subpoena a cryptocurrency exchange: attorney guide',
  'Romance scam recovery: step by step guide 2026',
  'USDT TRC20 scam recovery guide 2026',
];

const CATEGORIES = ['Guide', 'Case Study', 'Legal', 'Education'];

const LANGS = [
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

/* ── Password Gate ── */
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/check-env', {
        headers: { 'x-admin-key': pw },
      });
      if (res.ok) {
        localStorage.setItem('blog-agent-pw', pw);
        onAuth();
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
        <p className="text-sm text-slate-500 text-center mb-6">Internal tool — enter admin password</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Password"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm mb-3 outline-none focus:border-slate-400 transition-colors"
          autoFocus
        />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button
          onClick={submit}
          disabled={!pw || checking}
          className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-40 transition-all"
        >
          {checking ? 'Checking...' : 'Enter'}
        </button>
      </div>
    </div>
  );
}

/* ── Main Blog Agent UI ── */
function BlogAgentUI() {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Guide');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  /* Results */
  const [articleEN, setArticleEN] = useState('');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [langsDone, setLangsDone] = useState<string[]>([]);
  const [slug, setSlug] = useState('');
  const [wordCount, setWordCount] = useState(0);

  /* Tabs */
  const [activeTab, setActiveTab] = useState<'preview' | 'langs' | 'prompt'>('preview');
  const [copiedBtn, setCopiedBtn] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  async function callAPI(prompt: string, maxTokens: number = 4000) {
    const resp = await fetch('/api/blog-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, maxTokens }),
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error);
    return data.content;
  }

  async function generate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setError('');
    setArticleEN('');
    setTranslations({});
    setLangsDone([]);
    setActiveTab('preview');

    const currentSlug = slugify(topic);
    setSlug(currentSlug);

    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    try {
      /* Step 1: Topic */
      setStep(1);
      setProgress(10);
      setProgressLabel('Analyzing topic...');

      /* Step 2: Write EN article */
      setStep(2);
      setProgress(25);
      setProgressLabel('Writing English article...');

      const article = await callAPI(
        `You are an SEO expert writing for LedgerHound.vip — a blockchain forensics and crypto fraud investigation firm (USPROJECT LLC, New York).

Write a comprehensive 1,800-2,000 word blog article about: "${topic}"

Requirements:
- Category: ${category}
- Date: ${date}
- Target audience: crypto fraud victims, attorneys, investigators
- Include real statistics from 2025-2026 if relevant
- Mention LedgerHound services naturally (not pushy)
- End with CTA linking to /free-evaluation
- Use H1, H2, H3 headers with markdown
- Include practical actionable advice
- SEO optimized: use keyword variations naturally
- Tone: authoritative, empathetic, professional

Structure:
# [Title]
**Published: ${date} | Category: ${category} | Reading time: X min**
[intro hook]
## [section 1]
## [section 2]
## [section 3]
## [section 4]
## [section 5]
## Getting Help (with LedgerHound CTA)
*[source line]*

Write the full article now:`,
        4000,
      );

      setArticleEN(article);
      const wc = article.split(/\s+/).length;
      setWordCount(wc);

      /* Step 3: Translations */
      setStep(3);
      setProgress(55);
      setProgressLabel('Translating to 5 languages...');

      const allTranslations: Record<string, string> = { en: article };
      const done: string[] = [];

      for (let i = 0; i < LANGS.length; i++) {
        const lang = LANGS[i];
        setProgress(55 + i * 8);
        setProgressLabel(`Translating to ${lang.name}...`);

        const translated = await callAPI(
          `Translate this crypto forensics blog article to ${lang.name}.
Keep all markdown formatting, headers, and structure exactly the same.
Keep technical terms (blockchain, Bitcoin, USDT, etc.) in English.
Keep URLs and links unchanged (/free-evaluation, etc).
${lang.code === 'ar' ? 'Note: Arabic reads right to left.' : ''}

Article to translate:
${article.slice(0, 3000)}`,
          4000,
        );

        allTranslations[lang.code] = translated;
        done.push(lang.code);
        setLangsDone([...done]);
        setTranslations({ ...allTranslations });
      }

      /* Step 4: Done */
      setStep(4);
      setProgress(100);
      setProgressLabel('Done!');
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    }

    setGenerating(false);
  }

  function getClaudePrompt() {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const readTime = Math.round(wordCount / 200);

    return `Create blog post page at /blog/${slug}

Same format as /blog/pig-butchering-scam-recovery:
- Date: ${date}
- Category: ${category}
- Reading time: ${readTime} min read
- Author: LedgerHound Investigations Team
- Sticky TOC, pull quotes, share buttons, related articles, breadcrumb
- Update /blog page to show new article
- Add hreflang tags for all 6 locales
- Add to sitemap.ts

ENGLISH CONTENT:
${articleEN.slice(0, 2000)}...

Create pages for all 6 locales:
/blog/${slug}
/ru/blog/${slug}
/es/blog/${slug}
/zh/blog/${slug}
/fr/blog/${slug}
/ar/blog/${slug} (RTL layout)`;
  }

  function copyToClipboard(text: string, btnId: string) {
    navigator.clipboard.writeText(text);
    setCopiedBtn(btnId);
    setTimeout(() => setCopiedBtn(null), 2000);
  }

  /* Render markdown-ish preview */
  function renderPreview(md: string) {
    return md
      .split('\n')
      .slice(0, 60)
      .map((line, i) => {
        if (line.startsWith('### '))
          return `<h4 key="${i}" style="font-size:14px;font-weight:600;margin:16px 0 6px;color:#1e293b;">${line.slice(4)}</h4>`;
        if (line.startsWith('## '))
          return `<h3 key="${i}" style="font-size:15px;font-weight:600;margin:20px 0 8px;color:#1e293b;">${line.slice(3)}</h3>`;
        if (line.startsWith('# '))
          return `<h2 key="${i}" style="font-size:18px;font-weight:700;margin:0 0 10px;color:#0f172a;">${line.slice(2)}</h2>`;
        if (line.startsWith('**') && line.endsWith('**'))
          return `<p key="${i}" style="font-size:13px;color:#64748b;font-weight:600;margin-bottom:6px;">${line.slice(2, -2)}</p>`;
        if (line.startsWith('- '))
          return `<p key="${i}" style="font-size:13px;color:#64748b;margin-bottom:4px;padding-left:16px;">• ${line.slice(2)}</p>`;
        if (line.trim())
          return `<p key="${i}" style="font-size:13px;line-height:1.7;color:#64748b;margin-bottom:8px;">${line}</p>`;
        return '';
      })
      .join('');
  }

  const showResults = articleEN.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">LedgerHound Blog Agent</h1>
              <p className="text-xs text-slate-400">DeepSeek · 6 languages · SEO optimized</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            Internal
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Topic + Category */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. How crypto scammers launder money"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick topics */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {QUICK_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  topic === t
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700'
                }`}
              >
                {t.length > 40 ? t.slice(0, 40) + '...' : t}
              </button>
            ))}
          </div>

          {/* Generate */}
          <button
            onClick={generate}
            disabled={!topic.trim() || generating}
            className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={14} />
                Generate Article
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Progress */}
        {generating && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
            {/* Steps */}
            <div className="flex items-center gap-2 mb-4">
              {['Topic', 'Article EN', 'Translations', 'Done'].map((label, i) => {
                const n = i + 1;
                const isDone = step > n;
                const isActive = step === n;
                return (
                  <div key={n} className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isDone ? <Check size={12} /> : n}
                    </div>
                    <span className={`text-xs ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                      {label}
                    </span>
                    {i < 3 && <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Bar */}
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{progressLabel}</p>

            {/* Language progress */}
            {step >= 3 && (
              <div className="grid grid-cols-6 gap-2 mt-4">
                <div className="text-center p-2 rounded-lg border border-emerald-200 bg-emerald-50">
                  <div className="text-sm">🇺🇸</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">EN ✓</div>
                </div>
                {LANGS.map((l) => {
                  const done = langsDone.includes(l.code);
                  return (
                    <div
                      key={l.code}
                      className={`text-center p-2 rounded-lg border ${
                        done
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="text-sm">{l.flag}</div>
                      <div
                        className={`text-[10px] font-semibold ${
                          done ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {l.code.toUpperCase()} {done ? '✓' : '...'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {showResults && !generating && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Words', value: wordCount.toLocaleString() },
                { label: 'Category', value: category },
                { label: 'Languages', value: `${Object.keys(translations).length} / 6` },
                { label: 'Read time', value: `${Math.round(wordCount / 200)} min` },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{s.label}</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Slug */}
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
              <span className="text-xs text-slate-400 flex-shrink-0">Slug:</span>
              <code className="text-xs text-slate-700 font-mono flex-1 truncate">/blog/{slug}</code>
              <button
                onClick={() => copyToClipboard(slug, 'slug')}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {copiedBtn === 'slug' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
              <div className="flex border-b border-slate-200">
                {[
                  { id: 'preview' as const, label: 'Preview EN', icon: FileText },
                  { id: 'langs' as const, label: 'Translations', icon: Globe },
                  { id: 'prompt' as const, label: 'Claude Code Prompt', icon: ClipboardCopy },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${
                      activeTab === tab.id
                        ? 'text-slate-900 bg-white border-b-2 border-slate-900'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon size={13} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {/* Preview */}
                {activeTab === 'preview' && (
                  <div>
                    <div
                      className="max-h-96 overflow-y-auto pr-2"
                      dangerouslySetInnerHTML={{ __html: renderPreview(articleEN) }}
                    />
                    <p className="text-xs text-slate-400 mt-3">
                      {wordCount} words · {Math.round(wordCount / 200)} min read
                    </p>
                  </div>
                )}

                {/* Translations */}
                {activeTab === 'langs' && (
                  <div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-3 text-center">
                        <div className="text-lg mb-1">🇺🇸</div>
                        <div className="text-xs font-semibold text-emerald-600">English ✓</div>
                        <div className="text-[10px] text-emerald-500">{wordCount} words</div>
                      </div>
                      {LANGS.map((l) => {
                        const done = !!translations[l.code];
                        const wc = done ? translations[l.code].split(/\s+/).length : 0;
                        return (
                          <div
                            key={l.code}
                            className={`border rounded-xl p-3 text-center ${
                              done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <div className="text-lg mb-1">{l.flag}</div>
                            <div className={`text-xs font-semibold ${done ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {l.name} {done ? '✓' : '—'}
                            </div>
                            {done && <div className="text-[10px] text-emerald-500">{wc} words</div>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Individual translation preview */}
                    {Object.entries(translations)
                      .filter(([k]) => k !== 'en')
                      .map(([code, text]) => (
                        <div key={code} className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-500 uppercase">{code}</span>
                            <button
                              onClick={() => copyToClipboard(text, `lang-${code}`)}
                              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                            >
                              {copiedBtn === `lang-${code}` ? (
                                <><Check size={11} className="text-emerald-500" /> Copied</>
                              ) : (
                                <><Copy size={11} /> Copy</>
                              )}
                            </button>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                            <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                              {text.slice(0, 500)}...
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Claude Code Prompt */}
                {activeTab === 'prompt' && (
                  <div>
                    <div className="bg-slate-900 text-slate-300 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {getClaudePrompt()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => copyToClipboard(articleEN, 'article')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {copiedBtn === 'article' ? (
                  <><Check size={14} className="text-emerald-500" /> Copied!</>
                ) : (
                  <><Copy size={14} /> Copy Article</>
                )}
              </button>
              <button
                onClick={() => copyToClipboard(getClaudePrompt(), 'prompt')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {copiedBtn === 'prompt' ? (
                  <><Check size={14} className="text-emerald-500" /> Copied!</>
                ) : (
                  <><ClipboardCopy size={14} /> Copy Prompt</>
                )}
              </button>
              <button
                onClick={() => {
                  const all = JSON.stringify({ en: articleEN, ...translations }, null, 2);
                  copyToClipboard(all, 'all');
                }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                {copiedBtn === 'all' ? (
                  <><Check size={14} /> Copied!</>
                ) : (
                  <><Globe size={14} /> Copy All Langs</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function BlogAgentPage() {
  const [authed, setAuthed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('blog-agent-pw');
  });

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;
  return <BlogAgentUI />;
}

const SYSTEM_PROMPT = `You are the content team at LedgerHound — a blockchain forensics & crypto asset tracing company (ledgerhound.vip). You write expert-level blog articles that rank on Google, build trust with scam victims, and convert readers into clients.

=== SEO LANDSCAPE — APRIL 2026 ===
The search ecosystem has shifted. Your content must perform across multiple surfaces:

1. GOOGLE AI OVERVIEWS (SGE — Search Generative Experience):
- Google now answers many queries directly with AI summaries pulled from indexed pages
- To be CITED by AI Overviews, content must be:
  * Quotable: declarative statements with concrete facts, not vague generalities
  * Structured: clear question→answer patterns, FAQ-style sections
  * Cited: link to primary sources (FBI IC3, DOJ, Chainalysis, OFAC SDN list)
  * Recent: include 2025-2026 dates and statistics
- Aim for "information gain" — facts NOT already in top-10 ranking pages

2. YMYL (YOUR MONEY OR YOUR LIFE) — STRICTEST QUALITY BAR:
- Crypto fraud content is YMYL. Google holds it to the highest E-E-A-T standard.
- Every claim about legal procedures, recovery rates, or financial advice MUST cite a source
- Disclose limitations: "consult a licensed attorney in your jurisdiction"
- Never claim guaranteed recovery or specific success rates without data

3. E-E-A-T (Experience, Expertise, Authoritativeness, Trust):
- EXPERIENCE: First-hand language is mandatory. "We traced...", "In our case files...", "When we investigated..."
- EXPERTISE: Cite specific statutes, case law, agency procedures (18 U.S.C. § 1956, FinCEN 31 CFR 1010.410, etc.)
- AUTHORITATIVENESS: Reference USPROJECT LLC credentials, certifications (CTCE, CFE), tools used (Chainalysis Reactor, TRM Labs)
- TRUST: Date the article. Acknowledge what you DON'T know. Avoid superlatives.

4. POST-MARCH 2024 CORE UPDATE + 2025 SPAM UPDATES:
- Mass AI content without unique value is now actively deindexed (March 2024 update)
- Google's 2025 Spam Updates targeted "scaled content abuse" — sites publishing 10+ AI articles/day got nuked
- Site-level quality matters: a few great articles > many mediocre ones
- "Parasite SEO" (using authority sites for spam) has been targeted
- Author bylines without real authors = penalty risk

5. ENTITY-BASED SEO (Knowledge Graph):
- Mention real entities Google recognizes: specific agencies (FBI IC3, FinCEN, OFAC, SEC, CFTC), specific exchanges (Binance, Coinbase, Kraken), specific blockchain protocols (Tornado Cash, Wasabi Wallet, Railgun)
- This signals topical authority within the crypto-forensics entity cluster

6. SEARCHGPT / PERPLEXITY / BING COPILOT:
- Articles are increasingly cited by AI search engines beyond Google
- Optimize for "snippetable" answers: short paragraphs (40-80 words) that fully answer a question
- Include structured data (the renderer adds JSON-LD automatically — your job is to make the content quotable)

7. YANDEX (RU MARKET — IMPORTANT FOR LEDGERHOUND):
- Yandex YATI still favors behavioral signals: time on page, scroll depth
- Use H2-H3 hierarchy aggressively (Yandex parses it for navigation)
- Russian content needs natural СНГ-context, not translated US examples



=== BRAND CONTEXT ===
- Company: LedgerHound (USPROJECT LLC)
- Services: Automated forensic reports ($49), Emergency Preservation Pack ($79), Victim Summary Report ($19), free case evaluation
- Tools on site: Wallet Tracker (free), Graph Tracer (free), Scam Checker (free), Exchange Preservation Letter Generator (free)
- Contact: contact@ledgerhound.vip, +1 (833) 559-1334
- Languages: EN, RU, ES, ZH, FR, AR
- Expertise: blockchain forensics, crypto tracing, court-ready reports, cross-chain analysis, exchange compliance

=== VOICE & STYLE ===
- Write as a crypto forensics practitioner, not a generic AI or journalist
- Use first person occasionally: "In our investigations, we've seen...", "Our analysts traced..."
- Include specific, REAL numbers from cited sources (FBI IC3 reports, Chainalysis, CipherTrace). If exact data is unavailable, use "based on our case data" or "industry estimates suggest" — NEVER invent statistics
- State opinions where appropriate: "This is why we recommend filing IC3 first", "In our experience, the first 72 hours are critical"
- Tone: authoritative but empathetic — readers are often scam victims in distress

=== STRUCTURE ===
- NEVER start with generic intros like "In today's digital world...", "Cryptocurrency has revolutionized...", "As technology evolves..."
- Open with a hook: a surprising stat, a question, or a brief scenario ("Last month, a client transferred $47K to what looked like a Binance sub-account...")
- Use varied paragraph lengths — some single sentences for impact, some 3-5 sentences for depth
- Subheadings must be specific and actionable, not generic ("How BNB Chain Scammers Exploit Approval Transactions" not "Understanding the Problem")
- Break up walls of text with: callout boxes, numbered steps, comparison tables, pull quotes

=== CONTENT REQUIREMENTS ===
- Reference LedgerHound tools naturally (not forced): "Using our Wallet Tracker, you can see the full transaction history before paying anything"
- Use anonymized but realistic case scenarios: "A client came to us after losing $12K on a platform posing as a Binance subsidiary. Our trace revealed funds moved through 3 chains before landing at a KYC exchange."
- Every article MUST include actionable steps — readers should be able to DO something after reading
- Cite real sources: FBI IC3 Annual Report, Chainalysis Crypto Crime Report, OFAC SDN list, FinCEN advisories, DOJ press releases
- Reference real exchanges by name (Binance, Coinbase, Kraken, OKX, etc.)
- Include dates and timelines for credibility
- Mention relevant regulations: OFAC sanctions, FinCEN Travel Rule, EU MiCA, specific country laws

=== INTERNAL LINKING (critical for SEO) ===
- Link to at least 2-3 other blog posts using descriptive anchor text
- Link to at least 2 tool/service pages:
  * /scam-checker — free scam check
  * /report — forensic report purchase
  * /emergency — emergency preservation pack
  * /free-evaluation — free case evaluation
  * /tools/exchange-letter — exchange preservation letter generator
  * /scam-database — community scam database
- Use descriptive anchor text ("run a free scam check on the wallet" not "click here")

=== CTA STRATEGY ===
Include 2-3 natural calls-to-action woven into the article:
1. Early CTA (after establishing the problem): link to free tool (scam checker, wallet tracker)
2. Mid-article CTA (after showing complexity): "If this sounds overwhelming, our automated forensic report does this analysis in minutes"
3. End CTA: free evaluation or emergency pack for urgent cases
CTAs should feel like helpful suggestions, not sales pitches.

=== ANTI-AI-DETECTION (CRITICAL FOR GOOGLE INDEXING) ===
Google's Helpful Content algorithm penalizes AI-pattern content. Your output MUST pass as written by a human practitioner:

BURSTINESS (sentence length variation):
- Mix sentence lengths AGGRESSIVELY: a 4-word punchy sentence next to a 35-word sentence with multiple clauses
- AI writes uniform 15-20 word sentences — break this pattern
- Use sentence fragments occasionally for impact: "Not always. Sometimes never."
- Single-word paragraphs are allowed for emphasis: "Nope."

PERPLEXITY (unexpected word choices):
- Use professional slang: "rug pull", "exit scam", "paper trail", "honeypot", "sweep wallet", "flash drained"
- Use unexpected verbs: "the funds got siphoned" not "the funds were transferred"
- Throw in idioms: "follow the money", "smoking gun", "needle in a haystack"
- Don't always pick the most obvious word — synonyms keep it fresh

FORBIDDEN AI PATTERNS:
- NEVER write: "In conclusion", "To summarize", "In this article", "It's important to note", "It's worth noting", "It's essential to", "Delve into", "In today's digital landscape", "Navigating the complexities", "In the ever-evolving world of"
- NEVER use perfect parallel structures in every list item
- NEVER overuse transitions ("Furthermore", "Moreover", "Additionally") — once per article max
- Vary sentence starters — count the first words; if 3+ start with "The" in a row, rewrite

HUMAN IMPERFECTIONS (use sparingly, 2-3x per article):
- Start a sentence with "And", "But", "So", or "Yet" — humans do this, AI avoids it
- Use parenthetical asides: "(we've seen this hundreds of times)"
- Include rhetorical questions: "Was the trace easy? No. Did we find the funds? Eventually."
- Add hedging language: "in our experience", "from what we've seen", "more often than not"

OPINIONS & HOT TAKES:
- Take a stance — AI avoids opinions, humans don't
- "Filing IC3 first is overrated. File with your state AG instead — they actually act on it."
- "Most 'recovery experts' on Telegram are second scams. Period."
- "Tether's compliance team is faster than people think — but only if you provide a court order."

E-E-A-T SIGNALS (Experience, Expertise, Authoritativeness, Trust):
- Mention specific dates: "On March 14, 2026, the DOJ announced..."
- Reference real case docket numbers if known, or use realistic placeholders: "Case No. 1:25-cv-04827"
- Quote specific statutes: "18 U.S.C. § 1956 (money laundering)", "FinCEN Travel Rule (31 CFR 1010.410(f))"
- Name specific judges, prosecutors, or agencies when relevant
- Include processing timelines from real experience: "Binance compliance typically responds within 5-7 business days to subpoenas"

EM DASH RULE:
- Use em dash (—) MAX 2 times per article. AI overuses them. Humans use commas, parentheses, or new sentences instead.

WORD COUNT TARGETS:
- Article length: 1,800-2,400 words (long enough to rank, not bloated)
- Paragraphs: 60% should be 2-4 sentences. 25% can be 1 sentence. 15% can be 5-7 sentences.
- Section headers: 4-7 words ideally, never generic ("Understanding the Problem" → "Why TRC20 Scams Drain Wallets in Seconds")

=== MULTILINGUAL NOTES ===
When writing for non-English locales:
- RU: пиши как эксперт, знакомый с СНГ-реалиями. Упоминай релевантные юрисдикции (РФ, Казахстан, Украина). Используй "мы" от лица компании.
- ES: enfoque en jurisdicciones latinoamericanas y españolas. Tono profesional pero accesible.
- ZH: 使用专业但通俗的语言。提及中国大陆、台湾、香港相关法规。
- FR: focus juridictions européennes francophones. Ton expert mais accessible.
- AR: استخدم لغة مهنية. اذكر الأنظمة القانونية في دول الخليج ومصر.

=== OUTPUT FORMAT ===
Output MUST be a single valid JSON object matching the BlogArticle schema below.
Do NOT wrap in markdown code fences. Do NOT add explanations before or after.
Output ONLY the raw JSON object — starts with { and ends with }.

INLINE LINKS:
- Inside paragraph text and list items, use markdown link syntax: [text](url)
- Internal links: use root-relative paths like [free evaluation](/free-evaluation), [our wallet tracker](/wallet-tracker)
- External links: use full URLs like [FBI IC3](https://www.ic3.gov/)
- The renderer converts these to <Link> or <a> automatically

SCHEMA (TypeScript types):
\`\`\`typescript
interface BlogArticle {
  slug: string;              // kebab-case, e.g. "how-binance-handles-subpoenas-2026"
  category: 'Guide' | 'Case Study' | 'Legal' | 'Education';
  date: string;              // "April 28, 2026"
  readTime: string;          // "8 min read"
  title: string;             // <h1>, max 70 chars
  excerpt: string;           // for blog index card, 150-200 chars
  metaTitle: string;         // <title> tag, max 60 chars
  metaDescription: string;   // meta description, 140-160 chars
  keywords: string[];        // 5-8 SEO keywords
  intro: string[];           // 2-3 lead paragraphs, plain text with [text](url) links allowed
  sections: Array<{
    id: string;              // anchor id, e.g. "what-is" — kebab-case
    heading: string;         // h2 text, 4-7 words ideally
    blocks: Array<
      | { type: 'paragraph'; text: string }
      | { type: 'h3'; text: string }
      | { type: 'list'; ordered?: boolean; items: string[] }
      | { type: 'pullQuote'; stat: string; text: string; color?: 'brand'|'amber'|'red'|'indigo'|'emerald' }
      | { type: 'warningBox'; title: string; subsections: Array<{ title: string; items: string[] }> }
      | { type: 'actionSteps'; title: string; steps: Array<{ title: string; text: string; note?: { title: string; text: string } }> }
      | { type: 'comparison'; leftTitle: string; leftItems: string[]; rightTitle: string; rightItems: string[] }
      | { type: 'midCta'; title: string; desc: string; cta: string; href: string }
    >;
  }>;
  sources: string;           // single paragraph: "Sources: FBI IC3 2025 Report; DOJ Press Release..."
  relatedSlugs?: string[];   // 0-3 slugs of related existing posts (optional)
}
\`\`\`

EXISTING BLOG SLUGS (for relatedSlugs):
- usdt-trc20-scam-recovery-guide-2026
- how-to-identify-fake-crypto-trading-platform
- how-to-trace-stolen-bitcoin
- pig-butchering-scam-recovery

CONTENT REQUIREMENTS:
- 5-7 sections minimum
- 1-2 pullQuote blocks (with real stats)
- 1 warningBox or actionSteps block per article minimum
- 1 midCta block in middle of article (after section 2 or 3)
- 6-10 paragraph blocks total
- At least 3 inline internal links to other tools/services/blog posts
- At least 2 external links to authoritative sources (FBI IC3, DOJ, Chainalysis, etc.)
`;

import { researchTopics, CURATED_SEEDS, type TavilyResult } from '@/lib/research/tavily';

export const maxDuration = 90;

const LOCALE_NAMES: Record<string, string> = {
  ru: 'Russian', es: 'Spanish', zh: 'Chinese (Simplified)', fr: 'French', ar: 'Arabic',
};

/**
 * Strip markdown code fences if model wraps JSON in them despite instructions.
 */
function stripCodeFence(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
}

/**
 * Robustly parse JSON from LLM output. Handles:
 * - Markdown code fences (```json ... ```)
 * - Preamble text before the JSON ("Here is the JSON: ...")
 * - Trailing text after the JSON ("...That's the result.")
 * - Extracts the outermost JSON object/array by finding matching braces.
 *
 * @param text Raw LLM output
 * @param expect 'object' or 'array'
 */
function extractJson(text: string, expect: 'object' | 'array' = 'object'): unknown {
  let cleaned = stripCodeFence(text);

  // Try direct parse first (cheapest path)
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall through to extraction
  }

  const open = expect === 'array' ? '[' : '{';
  const close = expect === 'array' ? ']' : '}';

  const start = cleaned.indexOf(open);
  if (start === -1) throw new Error(`No ${open} found in output`);

  // Walk forward tracking depth, respecting strings/escapes
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        const candidate = cleaned.slice(start, i + 1);
        return JSON.parse(candidate);
      }
    }
  }
  throw new Error(`Unmatched ${open} in output`);
}

async function callDeepSeek(systemPrompt: string, userPrompt: string, maxTokens = 8000, temperature = 0.7, jsonMode = false): Promise<string> {
  const body: any = {
    model: 'deepseek-chat',
    max_tokens: maxTokens,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };
  // DeepSeek supports OpenAI-compatible json_object response format
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'DeepSeek API error');
  return data.choices?.[0]?.message?.content || '';
}

export async function POST(request: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: 'DEEPSEEK_API_KEY not configured' }, { status: 500 });
  }

  const body = await request.json();
  const mode = body.mode || 'legacy';

  try {
    /* ── Mode: 'research' — find real trending topics with sources ── */
    if (mode === 'research') {
      const { query } = body;
      if (!process.env.TAVILY_API_KEY) {
        return Response.json({ error: 'TAVILY_API_KEY not configured. Add it to Vercel env vars (free tier at tavily.com).' }, { status: 500 });
      }

      // Use provided query or pick a random curated seed
      let seedQuery: string = query;
      if (!seedQuery) {
        seedQuery = CURATED_SEEDS[Math.floor(Math.random() * CURATED_SEEDS.length)];
      }

      try {
        const results = await researchTopics(seedQuery, { perLanguage: 5 });
        if (results.length === 0) {
          return Response.json({
            error: `No results found for "${seedQuery}". Try a broader query like "cryptocurrency news" or "crypto scam recovery". Tavily may also be having issues with very recent or niche queries.`,
          }, { status: 404 });
        }
        return Response.json({ query: seedQuery, results });
      } catch (err: any) {
        const msg = err.message || 'Research failed';
        // Surface Tavily-specific errors clearly
        if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
          return Response.json({ error: 'Tavily API key is invalid. Check TAVILY_API_KEY env var on Vercel.' }, { status: 401 });
        }
        if (msg.includes('429')) {
          return Response.json({ error: 'Tavily rate limit hit (free tier = 1000/mo). Wait or upgrade.' }, { status: 429 });
        }
        return Response.json({ error: msg }, { status: 502 });
      }
    }

    /* ── Mode: 'suggest-topics' — propose 3-5 article angles from selected sources ── */
    if (mode === 'suggest-topics') {
      const { sources } = body;
      if (!Array.isArray(sources) || sources.length === 0) {
        return Response.json({ error: 'Missing sources array' }, { status: 400 });
      }

      const sourcesContext = (sources as TavilyResult[])
        .map((s, i) => `[${i + 1}] ${s.title}\n${s.content.slice(0, 300)}`)
        .join('\n\n');

      const prompt = `You are a content strategist for LedgerHound (crypto-forensics company).

Given these REAL news sources, propose exactly 5 distinct article angles that LedgerHound could write a blog post about. Each angle should:
- Be specific and SEO-friendly (target a real search query)
- Have a clear narrative angle (not just a topic — a story or argument)
- Be 8-12 words long
- Reference the actual events/entities from the sources
- Be different from each other (different sub-topics, different perspectives)

SOURCES:
${sourcesContext}

Return ONLY a JSON object with this exact shape — no markdown, no preamble:
{
  "suggestions": [
    { "title": "...", "category": "Guide", "rationale": "Why this angle works for LedgerHound's audience (1 sentence)" }
  ]
}

Category MUST be one of: "Guide", "Case Study", "Legal", "Education"
The suggestions array MUST contain exactly 5 items.`;

      const raw = await callDeepSeek(
        'You are a senior content strategist. You always return valid JSON objects.',
        prompt,
        2000,
        0.7,
        true, // jsonMode
      );
      try {
        const parsed = extractJson(raw, 'object') as { suggestions?: unknown[] };
        const suggestions = parsed.suggestions;
        if (!Array.isArray(suggestions)) throw new Error('Missing or invalid "suggestions" array in response');
        return Response.json({ suggestions });
      } catch (parseErr: any) {
        console.error('[blog-agent] Suggest topics parse failed:', parseErr.message, '\nRaw:', raw.slice(0, 500));
        return Response.json({ error: 'Topic suggestions not valid JSON', detail: parseErr.message, raw: raw.slice(0, 500) }, { status: 502 });
      }
    }

    /* ── Mode: 'generate' — produces a full BlogArticle JSON in EN ── */
    if (mode === 'generate') {
      const { topic, category = 'Guide', sources } = body;
      if (!topic) return Response.json({ error: 'Missing topic' }, { status: 400 });

      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      // If sources are provided (from research mode), include them in the prompt
      const sourcesBlock = Array.isArray(sources) && sources.length > 0
        ? `\n\nREAL SOURCES (you MUST base the article on these, cite them with [text](url) inline links):
${(sources as TavilyResult[]).map((s, i) => `[${i + 1}] ${s.title}
URL: ${s.url}
Snippet: ${s.content.slice(0, 400)}
${s.publishedDate ? `Published: ${s.publishedDate}` : ''}`).join('\n\n')}

CRITICAL: At least 3 paragraphs in the article must reference these sources by linking to them via [anchor text](url). Do NOT invent statistics — use only numbers from these sources. The "sources" field at the end of the article must list ALL of these URLs.`
        : '';

      const userPrompt = `Topic: "${topic}"
Category: ${category}
Date (use this exact date): ${today}
Locale: English${sourcesBlock}

Generate a BlogArticle JSON object per the schema in your instructions.
Aim for 1,800-2,400 words across all blocks.
The article must have unique value — do not regurgitate generic SEO advice.
${sourcesBlock ? 'Base ALL factual claims on the provided sources.' : 'Include real 2025-2026 statistics and real-world examples.'}

Return ONLY the JSON object. No markdown, no explanations.`;

      const raw = await callDeepSeek(SYSTEM_PROMPT, userPrompt, 8000, 0.75, true);
      try {
        const parsed = extractJson(raw, 'object');
        return Response.json({ article: parsed });
      } catch (parseErr: any) {
        console.error('[blog-agent] Generate parse failed:', parseErr.message, '\nRaw:', raw.slice(0, 500));
        return Response.json({ error: 'Model output was not valid JSON', detail: parseErr.message, raw: raw.slice(0, 500) }, { status: 502 });
      }
    }

    /* ── Mode: 'translate' — translates a BlogArticle to a target locale ── */
    if (mode === 'translate') {
      const { article, locale } = body;
      if (!article) return Response.json({ error: 'Missing article' }, { status: 400 });
      if (!locale || !LOCALE_NAMES[locale]) return Response.json({ error: 'Invalid locale' }, { status: 400 });

      const langName = LOCALE_NAMES[locale];
      const localeCtx = locale === 'ru'
        ? 'Адаптируй для СНГ-аудитории. Упоминай релевантные юрисдикции (РФ, Казахстан, Украина) где уместно.'
        : '';

      const translatePrompt = `Translate the following BlogArticle JSON to ${langName}.

CRITICAL RULES:
1. Output ONLY valid JSON — same structure as input, no markdown wrapper
2. Translate ALL user-facing strings: title, excerpt, metaTitle, metaDescription, intro, sections.heading, blocks (text, items, titles, etc.), sources
3. PRESERVE: slug, category, date, readTime, keywords (translate keywords too), all "id" fields, all "type" fields, all "color" fields, all "href" values, all "ordered" flags
4. PRESERVE markdown link syntax [text](url) — translate the text but keep the URL exactly
5. PRESERVE the same number of sections, blocks, items, steps — do not add or remove
6. Keep technical terms in English where standard: "blockchain", "Bitcoin", "USDT", "TRC20", "OFAC", exchange names like "Binance"
${localeCtx ? '\n' + localeCtx : ''}
${locale === 'ar' ? '\nNote: Arabic is RTL but the JSON structure stays identical.' : ''}

Input article:
${JSON.stringify(article)}

Return ONLY the translated JSON object.`;

      const raw = await callDeepSeek(
        `You are a professional translator specializing in crypto-forensics content. You preserve JSON structure exactly while translating user-facing text.`,
        translatePrompt,
        8000,
        0.3,
        true,
      );
      try {
        const parsed = extractJson(raw, 'object');
        return Response.json({ article: parsed });
      } catch (parseErr: any) {
        console.error('[blog-agent] Translate parse failed:', parseErr.message);
        return Response.json({ error: 'Translation output was not valid JSON', detail: parseErr.message, raw: raw.slice(0, 500) }, { status: 502 });
      }
    }

    /* ── Mode: 'humanize' — final pass to remove AI patterns ── */
    if (mode === 'humanize') {
      const { article } = body;
      if (!article) return Response.json({ error: 'Missing article' }, { status: 400 });

      const humanizePrompt = `Take this BlogArticle JSON and rewrite the user-facing prose to feel MORE human-written.

Rules:
1. Output ONLY the same JSON structure — no markdown, no explanations
2. Preserve: slug, category, date, readTime, all ids, types, hrefs, structure
3. ONLY rewrite: intro paragraphs, paragraph block text, list items, h3 headings, section headings
4. Apply burstiness: vary sentence length aggressively
5. Add 2-3 sentence fragments, 1-2 sentences starting with "And"/"But"/"So"
6. Replace generic AI phrasings with practitioner language
7. Add 1-2 hot takes / opinions
8. Keep all factual claims unchanged

Input:
${JSON.stringify(article)}

Return the humanized JSON.`;

      const raw = await callDeepSeek(SYSTEM_PROMPT, humanizePrompt, 8000, 0.85, true);
      try {
        const parsed = extractJson(raw, 'object');
        return Response.json({ article: parsed });
      } catch (parseErr: any) {
        console.error('[blog-agent] Humanize parse failed:', parseErr.message);
        return Response.json({ error: 'Humanize output was not valid JSON', detail: parseErr.message, raw: raw.slice(0, 500) }, { status: 502 });
      }
    }

    /* ── Legacy mode (kept for backward compat with old frontend) ── */
    const { prompt, maxTokens, locale } = body;
    const localeHint = locale && locale !== 'en'
      ? `\n\nWrite this content in ${LOCALE_NAMES[locale] || 'English'}.`
      : '';
    const content = await callDeepSeek(SYSTEM_PROMPT, (prompt || '') + localeHint, maxTokens || 6000, 0.7);
    return Response.json({ content });
  } catch (err: any) {
    console.error('[blog-agent] Error:', err);
    return Response.json({ error: err.message || 'Failed to call DeepSeek' }, { status: 500 });
  }
}

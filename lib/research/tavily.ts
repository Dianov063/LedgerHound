/**
 * Tavily Search API integration.
 * Used to find real, current news/articles before generating blog content.
 *
 * Required env: TAVILY_API_KEY (get free 1000/mo at tavily.com)
 *
 * Docs: https://docs.tavily.com/docs/rest-api/api-reference
 */

const API = 'https://api.tavily.com';

export interface TavilyResult {
  title: string;
  url: string;
  content: string;          // snippet
  score: number;
  publishedDate?: string;
}

interface TavilySearchOpts {
  query: string;
  topic?: 'news' | 'general';
  search_depth?: 'basic' | 'advanced';
  max_results?: number;
  days?: number;             // for news topic only: how recent
  country?: string;
  include_domains?: string[];
  exclude_domains?: string[];
}

async function tavilySearch(opts: TavilySearchOpts): Promise<TavilyResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error('TAVILY_API_KEY not configured');

  // Build payload — only include params Tavily accepts (omit undefined)
  const payload: Record<string, unknown> = {
    query: opts.query,
    topic: opts.topic || 'general',
    search_depth: opts.search_depth || 'basic',
    max_results: opts.max_results || 8,
  };
  // `days` is only valid when topic === 'news'
  if (payload.topic === 'news' && opts.days) {
    payload.days = opts.days;
  }
  if (opts.country) payload.country = opts.country;
  if (opts.include_domains) payload.include_domains = opts.include_domains;
  if (opts.exclude_domains) payload.exclude_domains = opts.exclude_domains;

  const res = await fetch(`${API}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tavily ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.results || []) as TavilyResult[];
}

/**
 * Try a query with progressively relaxed filters until we get results.
 * Order: news+30d → news+90d → general (no time filter).
 */
async function tryWithFallback(query: string, maxResults: number): Promise<TavilyResult[]> {
  const attempts: TavilySearchOpts[] = [
    { query, topic: 'news', days: 30, max_results: maxResults },
    { query, topic: 'news', days: 90, max_results: maxResults },
    { query, topic: 'general', max_results: maxResults },
  ];

  for (const opts of attempts) {
    try {
      const r = await tavilySearch(opts);
      if (r.length > 0) return r;
    } catch (err) {
      console.error(`[research] Attempt failed for "${query}" (topic=${opts.topic}, days=${opts.days}):`, (err as Error).message);
      // Continue to next fallback
    }
  }
  return [];
}

/**
 * Research a topic across multiple languages.
 * Aggregates results from EN/RU/ES queries with progressive fallbacks.
 */
export async function researchTopics(
  seedQuery: string,
  options: { perLanguage?: number; days?: number } = {},
): Promise<TavilyResult[]> {
  const perLang = options.perLanguage || 5;

  // Build query variants — primary EN first, then localized
  const queries: string[] = [seedQuery];
  if (!/crypto|blockchain|wallet/i.test(seedQuery)) {
    queries.push(`${seedQuery} cryptocurrency`);
  }
  if (/scam|fraud|recover|crypto|blockchain|exchange/i.test(seedQuery)) {
    queries.push(`${seedQuery} мошенничество криптовалюта`);
    queries.push(`${seedQuery} estafa cripto`);
  }

  const results: TavilyResult[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    const r = await tryWithFallback(q, perLang);
    for (const item of r) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      results.push(item);
    }
    // If we already have 15+ results, stop early
    if (results.length >= 15) break;
  }

  // Sort by score desc, then by recency (if available)
  results.sort((a, b) => {
    const scoreDiff = (b.score || 0) - (a.score || 0);
    if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
    const da = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
    const db = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
    return db - da;
  });

  return results.slice(0, 15);
}

/**
 * Curated seed queries for crypto-forensics/recovery topics.
 * Used when user wants "give me trending topics" without specifying.
 */
export const CURATED_SEEDS = [
  'crypto exchange subpoena',
  'cryptocurrency scam recovery',
  'pig butchering scam DOJ seizure',
  'crypto fraud SEC enforcement',
  'blockchain forensics court case',
  'USDT TRC20 scam',
  'Tornado Cash sanctions',
  'crypto laundering charges',
  'cryptocurrency theft FBI',
  'romance scam crypto recovery',
];

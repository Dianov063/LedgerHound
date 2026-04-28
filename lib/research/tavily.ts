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

export interface ResearchedTopic {
  /** Suggested article angle/topic */
  angle: string;
  /** Why this is worth writing about now */
  hook: string;
  /** Real sources to base the article on */
  sources: TavilyResult[];
  /** Detected language of dominant sources */
  primaryLang: 'en' | 'ru' | 'es' | 'zh' | 'fr' | 'ar';
}

interface TavilySearchOpts {
  query: string;
  topic?: 'news' | 'general';
  search_depth?: 'basic' | 'advanced';
  max_results?: number;
  days?: number;             // for news: how recent (1-30)
  country?: string;          // 'us', 'ru', 'es', 'cn', 'fr', 'ae'
  include_domains?: string[];
  exclude_domains?: string[];
}

async function tavilySearch(opts: TavilySearchOpts): Promise<TavilyResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error('TAVILY_API_KEY not configured');

  const res = await fetch(`${API}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      query: opts.query,
      topic: opts.topic || 'news',
      search_depth: opts.search_depth || 'basic',
      max_results: opts.max_results || 8,
      days: opts.days || 30,
      country: opts.country,
      include_domains: opts.include_domains,
      exclude_domains: opts.exclude_domains || ['twitter.com', 'x.com', 'reddit.com'],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tavily search failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  return (data.results || []) as TavilyResult[];
}

/**
 * Research a topic across multiple languages and aggregate trending angles.
 * Returns a list of suggested article topics, each backed by real sources.
 */
export async function researchTopics(
  seedQuery: string,
  options: { perLanguage?: number; days?: number } = {},
): Promise<TavilyResult[]> {
  const perLang = options.perLanguage || 3;
  const days = options.days || 30;

  // Multi-language news queries — each yields different angles
  const queries: { query: string; country?: string }[] = [
    { query: seedQuery, country: 'us' },                            // EN-US
    { query: `${seedQuery} crypto forensics`, country: 'us' },       // EN-US specific
  ];

  // Add localized queries for diversity
  if (/scam|fraud|recover|crypto/i.test(seedQuery)) {
    queries.push({ query: `${seedQuery} мошенничество криптовалюта`, country: 'ru' });
    queries.push({ query: `${seedQuery} estafa cripto`, country: 'es' });
  }

  const results: TavilyResult[] = [];
  const seen = new Set<string>();
  for (const { query, country } of queries) {
    try {
      const r = await tavilySearch({ query, max_results: perLang, days, country });
      for (const item of r) {
        if (seen.has(item.url)) continue;
        seen.add(item.url);
        results.push(item);
      }
    } catch (err) {
      // log but continue with other queries
      console.error('[research] Query failed:', query, err);
    }
  }

  // Sort by score desc
  results.sort((a, b) => (b.score || 0) - (a.score || 0));
  return results.slice(0, 15);
}

/**
 * Curated seed queries for crypto-forensics/recovery topics.
 * Used when user wants "give me trending topics" without specifying.
 */
export const CURATED_SEEDS = [
  'crypto exchange subpoena 2026',
  'cryptocurrency scam recovery',
  'pig butchering scam DOJ seizure',
  'crypto fraud regulation 2026',
  'blockchain forensics court case',
  'USDT TRC20 scam latest',
  'Tornado Cash sanctions update',
  'crypto laundering charges 2026',
];

/**
 * Single source of truth for which internal paths the Blog Agent
 * is allowed to link to. The system prompt embeds this list, and the
 * server-side validator strips any links to paths NOT on this list.
 *
 * Why: DeepSeek (or any LLM) hallucinates plausible-sounding paths
 * like /blog/crypto-divorce-hidden-assets or /tools/wallet-finder
 * that don't exist. This produces 404s in GSC. Without a hard
 * whitelist, the problem recurs every time we publish.
 *
 * Maintenance: when adding a new tool/service/page, add its path here.
 * Blog posts are derived dynamically from BLOG_POSTS — no manual update needed.
 */

import { BLOG_POSTS } from './posts';

/** Static (non-blog) internal paths the agent may link to in articles. */
const STATIC_PATHS = [
  '/',
  '/about',
  '/pricing',
  '/cases',
  '/contact',
  '/blog',
  '/free-evaluation',
  // Tools
  '/wallet-tracker',
  '/graph-tracer',
  '/recovery-calculator',
  '/scam-checker',
  '/tx-lookup',
  '/tools/exchange-letter',
  // Database
  '/scam-database',
  '/scam-database/report',
  // Premium
  '/report',
  '/emergency',
  // Network
  '/investigators',
  '/join-network',
  // Services
  '/services',
  '/services/crypto-tracing',
  '/services/romance-scams',
  '/services/divorce-crypto',
  '/services/litigation',
  '/services/corporate-fraud',
  // Legal
  '/legal/investigator-agreement',
  '/privacy',
  '/terms',
  '/disclaimer',
];

/**
 * Build the full whitelist of valid internal paths at request time.
 * Includes all static paths + every existing blog post slug.
 */
export function getValidInternalPaths(): Set<string> {
  const set = new Set<string>(STATIC_PATHS);
  for (const post of BLOG_POSTS) {
    set.add(`/blog/${post.slug}`);
  }
  return set;
}

/**
 * Same paths formatted as a Markdown bullet list — for embedding in
 * the LLM system prompt.
 */
export function getValidPathsForPrompt(): string {
  const valid = Array.from(getValidInternalPaths()).sort();
  return valid.map((p) => `  - ${p}`).join('\n');
}

/**
 * The list of valid blog slugs only — for the relatedSlugs field.
 */
export function getValidBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}

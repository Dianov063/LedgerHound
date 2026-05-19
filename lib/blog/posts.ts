/**
 * Single source of truth for blog post metadata.
 * Used by:
 *   - app/[locale]/blog/page.tsx (blog index listing)
 *   - lib/blog/get-related-posts.ts (related articles on individual posts)
 *   - app/sitemap.ts (sitemap entries for blog posts)
 *
 * When adding a new post:
 *   1. Create app/[locale]/blog/<slug>/page.tsx + content/{en,ru,...}.tsx
 *   2. Add an entry here at the TOP of the array (newest first)
 *   3. Sitemap and related-posts pick it up automatically
 *
 * FIELD CONVENTIONS:
 *   - date:         ISO date string (YYYY-MM-DD). Localized at render time
 *                   via Intl.DateTimeFormat. Never store human-formatted dates.
 *   - readMinutes:  integer minutes. Localized at render time as
 *                   t('blog.min_read', {count: readMinutes}).
 *   - category:     One of 4 fixed values. Localized via t('blog.category_*').
 */

export interface BlogPostMeta {
  slug: string;
  category: 'Guide' | 'Case Study' | 'Legal' | 'Education';
  title: string;
  excerpt: string;
  date: string;          // ISO YYYY-MM-DD, e.g. "2026-05-05"
  readMinutes: number;   // integer minutes, e.g. 9
  featured?: boolean;
}

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: 'new-york-ag-uphold-settlement-crypto-platform-liability-2026',
    category: 'Legal',
    title: 'How New York AG\'s $5M Uphold Settlement Exposes Crypto Platform Liability',
    excerpt: 'The New York Attorney General\'s $5 million settlement with Uphold over a Cred-linked fraud scheme sets a precedent for platform liability. Learn how exchanges must vet investments or face consequences.',
    date: '2026-05-19',
    readMinutes: 10,
    featured: true,
  },
  {
    slug: 'northeast-cartel-casinos-crypto-forensics-2026',
    category: 'Education',
    title: 'Why the Northeast Cartel Uses Casinos: A Crypto-Forensics Perspective',
    excerpt: 'The U.S. Treasury sanctioned two Mexican casinos for laundering cash for the Northeast Cartel (CDN). We analyze how casinos serve as crypto-to-fiat gateways, the role of OFAC sanctions, and what this means for blockchain tracing.',
    date: '2026-05-05',
    readMinutes: 9,
    featured: true,
  },
  {
    slug: 'ai-fueling-crypto-fraud-irs-investigators-2026',
    category: 'Education',
    title: 'How AI Is Fueling a Surge in Crypto Fraud: What IRS Investigators Reveal',
    excerpt: 'AI-powered scams are driving a record $7.2 billion in crypto investment losses. IRS investigators share how deepfakes and automation are changing fraud—and what you can do to protect your assets.',
    date: '2026-04-30',
    readMinutes: 10,
    featured: true,
  },
  {
    slug: 'usdt-trc20-scam-recovery-guide-2026',
    category: 'Guide',
    title: 'USDT TRC20 Scam Recovery Guide 2026: A Forensic Roadmap',
    excerpt: '34% increase in TRC20 fraud cases in 2025. A step-by-step forensic guide for victims — from the critical first 72 hours to legal recovery pathways and exchange freezes.',
    date: '2026-04-05',
    readMinutes: 12,
    featured: true,
  },
  {
    slug: 'how-to-identify-fake-crypto-trading-platform',
    category: 'Guide',
    title: 'How to Identify a Fake Crypto Trading Platform in 2026',
    excerpt: 'Fake exchanges have become the most effective tool for organized fraud networks. $17 billion lost in 2025. Learn the 10 warning signs and what to do if you\'ve already sent money.',
    date: '2026-04-05',
    readMinutes: 8,
    featured: true,
  },
  {
    slug: 'how-to-trace-stolen-bitcoin',
    category: 'Guide',
    title: 'How to Trace Stolen Bitcoin and Cryptocurrency: A Step-by-Step Guide',
    excerpt: 'Despite the common perception that crypto is untraceable, the opposite is true. Learn exactly how investigators trace stolen funds step by step — from transaction mapping to exchange subpoenas.',
    date: '2026-03-28',
    readMinutes: 10,
    featured: true,
  },
  {
    slug: 'pig-butchering-scam-recovery',
    category: 'Guide',
    title: 'Pig Butchering Scams in 2026: What They Are, How They Work, and What To Do',
    excerpt: 'The most financially devastating form of crypto fraud. $9.3 billion in reported losses in 2024 alone. Learn the full playbook, warning signs, and what to do if you\'re a victim.',
    date: '2026-03-15',
    readMinutes: 9,
    featured: true,
  },
];

/**
 * Returns all blog posts, optionally filtered by locale.
 * Currently we don't have per-locale post lists (all posts exist in all locales),
 * so the locale param is for future use.
 */
export function getAllBlogPosts(_locale?: string): BlogPostMeta[] {
  return BLOG_POSTS;
}

/**
 * Get a specific post by slug.
 */
export function getPostBySlug(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

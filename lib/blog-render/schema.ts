/**
 * JSON schema for blog articles.
 * DeepSeek generates this structure; the renderer converts it to TSX.
 */

export type BlogCategory = 'Guide' | 'Case Study' | 'Legal' | 'Education';
export type BlogLocale = 'en' | 'ru' | 'es' | 'zh' | 'fr' | 'ar';
export type CalloutColor = 'brand' | 'amber' | 'red' | 'indigo' | 'emerald';

export interface BlogArticle {
  // Identifiers
  slug: string;                  // URL slug (kebab-case, no leading slash)
  category: BlogCategory;
  date: string;                  // "April 5, 2026"
  readTime: string;              // "8 min read"

  // SEO metadata
  title: string;                 // <h1>
  excerpt: string;               // for blog index card (max ~200 chars)
  metaTitle: string;             // <title> tag — can differ from h1
  metaDescription: string;       // meta description
  keywords: string[];            // SEO keywords

  // Content
  intro: string[];               // 1-3 lead paragraphs (plain text, may contain [text](url) inline links)
  sections: BlogSection[];
  sources: string;               // single paragraph of citations + legal disclaimer

  // Related articles (slugs of existing posts)
  relatedSlugs?: string[];
}

export interface BlogSection {
  id: string;                    // anchor id (e.g., "what-is")
  heading: string;               // h2 text
  blocks: BlogBlock[];
}

export type BlogBlock =
  | ParagraphBlock
  | H3Block
  | ListBlock
  | PullQuoteBlock
  | WarningBoxBlock
  | ActionStepsBlock
  | ComparisonBlock
  | MidCtaBlock;

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;                  // may contain [text](url) inline links
}

export interface H3Block {
  type: 'h3';
  text: string;
}

export interface ListBlock {
  type: 'list';
  ordered?: boolean;
  items: string[];               // each item may contain [text](url)
}

export interface PullQuoteBlock {
  type: 'pullQuote';
  stat: string;                  // big number/headline (e.g., "$9.3 Billion")
  text: string;                  // explanation
  color?: CalloutColor;          // default 'brand'
}

export interface WarningBoxBlock {
  type: 'warningBox';
  title: string;                 // e.g., "Red Flags to Watch For"
  subsections: { title: string; items: string[] }[];
}

export interface ActionStepsBlock {
  type: 'actionSteps';
  title: string;                 // e.g., "Action Steps for Victims"
  steps: { title: string; text: string; note?: { title: string; text: string } }[];
}

export interface ComparisonBlock {
  type: 'comparison';
  leftTitle: string;             // e.g., "Increases Recovery"
  leftItems: string[];
  rightTitle: string;            // e.g., "Decreases Recovery"
  rightItems: string[];
}

export interface MidCtaBlock {
  type: 'midCta';
  title: string;
  desc: string;
  cta: string;                   // button label
  href: string;                  // path WITHOUT locale prefix (e.g., "/free-evaluation")
}

/**
 * Translation payload — same structure as BlogArticle but per locale.
 */
export type BlogArticleTranslations = Record<BlogLocale, BlogArticle>;

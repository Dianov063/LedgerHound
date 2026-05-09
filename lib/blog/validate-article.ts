/**
 * Server-side guardrail: scan every [text](url) link in a generated BlogArticle
 * and STRIP any link to an internal path not in the whitelist.
 *
 * This is the last line of defense against LLM hallucinated links —
 * the system prompt asks DeepSeek to only use whitelisted paths, but
 * models occasionally invent plausible-looking slugs. Without this
 * validator, we'd ship 404s.
 *
 * External links (https://...) are left alone — they may or may not
 * resolve, but that's a content QA problem, not a structural one.
 */

import { getValidInternalPaths, getValidBlogSlugs } from './valid-internal-paths';

const INLINE_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

interface ValidateResult {
  /** Article with bad links stripped (text kept, just the link removed). */
  cleaned: any;
  /** Human-readable warnings about stripped links. */
  warnings: string[];
}

/**
 * Strip any [text](url) where url is an internal path not on the whitelist.
 * Replaces `[text](/bad-path)` with just `text`.
 * Leaves valid links and external (http/https) links untouched.
 */
function cleanInlineLinks(
  text: string,
  validPaths: Set<string>,
  warnings: string[],
  context: string,
): string {
  return text.replace(INLINE_LINK_RE, (full, linkText: string, url: string) => {
    // External links — leave alone
    if (/^https?:\/\//i.test(url)) return full;
    // Mailto / tel — leave alone
    if (/^(mailto|tel):/i.test(url)) return full;
    // Anchor-only — leave alone
    if (url.startsWith('#')) return full;

    // Normalize: strip trailing slash, query, hash for matching
    const path = url.replace(/[?#].*$/, '').replace(/\/$/, '') || '/';
    if (validPaths.has(path)) return full; // valid — keep

    // Invalid internal link — strip
    warnings.push(`${context}: stripped invalid link [${linkText}](${url})`);
    return linkText;
  });
}

/**
 * Validate and clean a BlogArticle object.
 * Returns the article with all invalid internal links stripped,
 * and a list of human-readable warnings.
 */
export function validateAndCleanArticle(article: any): ValidateResult {
  const warnings: string[] = [];
  const validPaths = getValidInternalPaths();
  const validSlugs = new Set(getValidBlogSlugs());

  // Deep-clone so we don't mutate the LLM output
  const cleaned = JSON.parse(JSON.stringify(article));

  // ── intro: array of paragraphs ──
  if (Array.isArray(cleaned.intro)) {
    cleaned.intro = cleaned.intro.map((p: string, i: number) =>
      typeof p === 'string'
        ? cleanInlineLinks(p, validPaths, warnings, `intro[${i}]`)
        : p,
    );
  }

  // ── sections ──
  if (Array.isArray(cleaned.sections)) {
    for (let s = 0; s < cleaned.sections.length; s++) {
      const section = cleaned.sections[s];
      if (!section || !Array.isArray(section.blocks)) continue;
      const ctx = `sections[${s}]`;

      for (let b = 0; b < section.blocks.length; b++) {
        const block = section.blocks[b];
        if (!block) continue;
        const blockCtx = `${ctx}.blocks[${b}].${block.type}`;

        switch (block.type) {
          case 'paragraph':
          case 'h3':
            if (typeof block.text === 'string') {
              block.text = cleanInlineLinks(block.text, validPaths, warnings, blockCtx);
            }
            break;
          case 'list':
            if (Array.isArray(block.items)) {
              block.items = block.items.map((item: string, i: number) =>
                typeof item === 'string'
                  ? cleanInlineLinks(item, validPaths, warnings, `${blockCtx}.items[${i}]`)
                  : item,
              );
            }
            break;
          case 'pullQuote':
            if (typeof block.text === 'string') {
              block.text = cleanInlineLinks(block.text, validPaths, warnings, `${blockCtx}.text`);
            }
            break;
          case 'warningBox':
            if (Array.isArray(block.subsections)) {
              for (let i = 0; i < block.subsections.length; i++) {
                const sub = block.subsections[i];
                if (sub && Array.isArray(sub.items)) {
                  sub.items = sub.items.map((item: string, j: number) =>
                    typeof item === 'string'
                      ? cleanInlineLinks(item, validPaths, warnings, `${blockCtx}.subsections[${i}].items[${j}]`)
                      : item,
                  );
                }
              }
            }
            break;
          case 'actionSteps':
            if (Array.isArray(block.steps)) {
              for (let i = 0; i < block.steps.length; i++) {
                const step = block.steps[i];
                if (!step) continue;
                if (typeof step.text === 'string') {
                  step.text = cleanInlineLinks(step.text, validPaths, warnings, `${blockCtx}.steps[${i}].text`);
                }
                if (step.note?.text && typeof step.note.text === 'string') {
                  step.note.text = cleanInlineLinks(step.note.text, validPaths, warnings, `${blockCtx}.steps[${i}].note.text`);
                }
              }
            }
            break;
          case 'comparison':
            for (const side of ['leftItems', 'rightItems'] as const) {
              if (Array.isArray(block[side])) {
                block[side] = block[side].map((item: string, i: number) =>
                  typeof item === 'string'
                    ? cleanInlineLinks(item, validPaths, warnings, `${blockCtx}.${side}[${i}]`)
                    : item,
                );
              }
            }
            break;
          case 'midCta': {
            // midCta has a structured `href` field, not inline syntax — validate it.
            if (typeof block.href === 'string') {
              const path = block.href.replace(/[?#].*$/, '').replace(/\/$/, '') || '/';
              if (!/^https?:\/\//i.test(block.href) && !validPaths.has(path)) {
                warnings.push(`${blockCtx}.href: invalid path "${block.href}" → defaulting to /free-evaluation`);
                block.href = '/free-evaluation';
              }
            }
            break;
          }
        }
      }
    }
  }

  // ── relatedSlugs: must all exist in BLOG_POSTS ──
  if (Array.isArray(cleaned.relatedSlugs)) {
    const filtered = cleaned.relatedSlugs.filter((slug: string) => {
      if (typeof slug !== 'string') return false;
      if (validSlugs.has(slug)) return true;
      warnings.push(`relatedSlugs: stripped non-existent slug "${slug}"`);
      return false;
    });
    cleaned.relatedSlugs = filtered;
  }

  return { cleaned, warnings };
}

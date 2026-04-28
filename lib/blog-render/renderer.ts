/**
 * Renders a BlogArticle JSON into a TSX content component string.
 * Output: complete .tsx file content for app/[locale]/blog/{slug}/content/{locale}.tsx
 */

import type { BlogArticle, BlogBlock, CalloutColor } from './schema';

/* ═══════════════════════════════════════════════════════════════════════════
   ESCAPING & STRING SANITATION
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Escape a plain-text string for safe interpolation inside JSX text content.
 * - Replaces { } with &#123; &#125;
 * - Replaces < > with &lt; &gt;
 * - Replaces special quotes with safe equivalents
 */
function escapeJsxText(text: string): string {
  return text
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escape a string for use inside a JSX string attribute value (double-quoted).
 */
function escapeAttr(text: string): string {
  return text.replace(/"/g, '&quot;').replace(/\n/g, ' ');
}

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE LINK PARSING
   Convert [text](url) markdown-style links into <Link> or <a> JSX nodes.
   - URLs starting with / → next/link <Link href={`${base}${url}`}>
   - URLs starting with http(s) → <a href="..." target="_blank" rel="noopener noreferrer">
   ═══════════════════════════════════════════════════════════════════════════ */

interface InlineToken {
  type: 'text' | 'link';
  text: string;
  href?: string;
  external?: boolean;
}

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  // Match [text](url) — non-greedy, allow nested brackets in url not supported
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ type: 'text', text: text.slice(lastIndex, m.index) });
    }
    const linkText = m[1];
    const href = m[2];
    const external = /^https?:\/\//i.test(href);
    tokens.push({ type: 'link', text: linkText, href, external });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', text: text.slice(lastIndex) });
  }
  return tokens;
}

/**
 * Render inline tokens to JSX expression string.
 * Returns content suitable for inserting between JSX tags.
 */
function renderInline(text: string): string {
  const tokens = parseInline(text);
  if (tokens.length === 1 && tokens[0].type === 'text') {
    // Pure text — just escape and return
    return escapeJsxText(tokens[0].text);
  }
  // Mixed content — wrap in fragment with JSX expressions
  const parts: string[] = [];
  for (const t of tokens) {
    if (t.type === 'text') {
      parts.push(escapeJsxText(t.text));
    } else {
      const safeText = escapeJsxText(t.text);
      if (t.external) {
        parts.push(`<a href="${escapeAttr(t.href!)}" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">${safeText}</a>`);
      } else {
        // Internal link — use base prop + path
        parts.push(`<Link href={\`\${base}${t.href}\`} className="text-brand-600 hover:underline">${safeText}</Link>`);
      }
    }
  }
  return parts.join('');
}

/* ═══════════════════════════════════════════════════════════════════════════
   BLOCK RENDERERS
   ═══════════════════════════════════════════════════════════════════════════ */

function colorClasses(color: CalloutColor = 'brand'): { border: string; text: string; bg: string } {
  const map: Record<CalloutColor, { border: string; text: string; bg: string }> = {
    brand: { border: 'border-brand-600', text: 'text-brand-700', bg: 'bg-brand-50' },
    amber: { border: 'border-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    red: { border: 'border-red-500', text: 'text-red-700', bg: 'bg-red-50' },
    indigo: { border: 'border-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50' },
    emerald: { border: 'border-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  };
  return map[color];
}

function renderBlock(block: BlogBlock): string {
  switch (block.type) {
    case 'paragraph':
      return `      <p>${renderInline(block.text)}</p>`;

    case 'h3':
      return `      <h3>${escapeJsxText(block.text)}</h3>`;

    case 'list': {
      const tag = block.ordered ? 'ol' : 'ul';
      const items = block.items.map((item) => `        <li>${renderInline(item)}</li>`).join('\n');
      return `      <${tag}>\n${items}\n      </${tag}>`;
    }

    case 'pullQuote': {
      const c = colorClasses(block.color);
      return `      <div className="not-prose my-8 bg-slate-50 border-l-4 ${c.border} rounded-r-xl p-6">
        <p className="text-2xl font-display font-bold text-slate-900 mb-2">${escapeJsxText(block.stat)}</p>
        <p className="text-sm text-slate-600">${renderInline(block.text)}</p>
      </div>`;
    }

    case 'warningBox': {
      const subsections = block.subsections.map((sub) => `        <div>
          <p className="font-semibold text-slate-800 text-sm mb-2">${escapeJsxText(sub.title)}</p>
          <ul className="space-y-1.5 text-sm text-slate-600">
${sub.items.map((it) => `            <li className="flex items-start gap-2"><AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>${renderInline(it)}</span></li>`).join('\n')}
          </ul>
        </div>`).join('\n');
      return `      <div className="not-prose my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-amber-700 font-display font-bold text-lg">
          <AlertTriangle size={20} />
          ${escapeJsxText(block.title)}
        </div>
${subsections}
      </div>`;
    }

    case 'actionSteps': {
      const steps = block.steps.map((step, i) => {
        const note = step.note
          ? `\n          <div className="not-prose ml-8 my-3 bg-white border border-emerald-200 rounded-xl p-4">
            <p className="text-sm text-emerald-700 font-semibold mb-1">${escapeJsxText(step.note.title)}</p>
            <p className="text-xs text-slate-600">${renderInline(step.note.text)}</p>
          </div>`
          : '';
        return `        <div className="flex gap-3">
          <div className="flex-shrink-0 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">${i + 1}</div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm mb-1">${escapeJsxText(step.title)}</p>
            <p className="text-sm text-slate-600">${renderInline(step.text)}</p>${note}
          </div>
        </div>`;
      }).join('\n');
      return `      <div className="not-prose my-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-700 font-display font-bold text-lg">
          <CheckCircle2 size={20} />
          ${escapeJsxText(block.title)}
        </div>
${steps}
      </div>`;
    }

    case 'comparison': {
      const renderSide = (title: string, items: string[], variant: 'good' | 'bad') => {
        const colorMap = variant === 'good'
          ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'CheckCircle2' }
          : { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'AlertTriangle' };
        return `        <div className="${colorMap.bg} border ${colorMap.border} rounded-xl p-5">
          <p className="font-bold ${colorMap.text} text-sm mb-3 flex items-center gap-2">
            <${colorMap.icon} size={14} /> ${escapeJsxText(title)}
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600">
${items.map((it) => `            <li className="flex items-start gap-2"><span className="text-slate-400">•</span><span>${renderInline(it)}</span></li>`).join('\n')}
          </ul>
        </div>`;
      };
      return `      <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
${renderSide(block.leftTitle, block.leftItems, 'good')}
${renderSide(block.rightTitle, block.rightItems, 'bad')}
      </div>`;
    }

    case 'midCta':
      return `      <div className="not-prose my-12 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-8 text-center">
        <h3 className="font-display font-bold text-xl text-white mb-2">${escapeJsxText(block.title)}</h3>
        <p className="text-brand-100 text-sm mb-5">${escapeJsxText(block.desc)}</p>
        <Link href={\`\${base}${block.href}\`} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors text-sm">
          ${escapeJsxText(block.cta)} <ArrowRight size={14} />
        </Link>
      </div>`;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   IMPORT INFERENCE
   Determine which lucide-react icons need to be imported based on used blocks.
   ═══════════════════════════════════════════════════════════════════════════ */

function collectIcons(article: BlogArticle): Set<string> {
  const icons = new Set<string>();
  for (const section of article.sections) {
    for (const block of section.blocks) {
      switch (block.type) {
        case 'warningBox':
          icons.add('AlertTriangle');
          break;
        case 'actionSteps':
          icons.add('CheckCircle2');
          break;
        case 'comparison':
          icons.add('CheckCircle2');
          icons.add('AlertTriangle');
          break;
        case 'midCta':
          icons.add('ArrowRight');
          break;
      }
    }
  }
  return icons;
}

function needsLink(article: BlogArticle): boolean {
  // Internal links (markdown [text](/path)) or midCta blocks require next/link
  const hasInline = (text: string) => /\[[^\]]+\]\(\/[^)]+\)/.test(text);
  for (const p of article.intro) if (hasInline(p)) return true;
  for (const section of article.sections) {
    for (const block of section.blocks) {
      if (block.type === 'midCta') return true;
      if (block.type === 'paragraph' && hasInline(block.text)) return true;
      if (block.type === 'list') {
        for (const it of block.items) if (hasInline(it)) return true;
      }
    }
  }
  return false;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN RENDERER — outputs full content/{locale}.tsx file
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderContentFile(article: BlogArticle, componentName: string): string {
  const icons = collectIcons(article);
  const importLink = needsLink(article);

  const importLines: string[] = [];
  if (importLink) importLines.push(`import Link from 'next/link';`);
  if (icons.size > 0) {
    importLines.push(`import { ${Array.from(icons).sort().join(', ')} } from 'lucide-react';`);
  }

  const introJsx = article.intro
    .map((p) => `      <p className="text-lg text-slate-700 leading-relaxed">${renderInline(p)}</p>`)
    .join('\n');

  const sectionsJsx = article.sections.map((section) => {
    const blocksJsx = section.blocks.map(renderBlock).join('\n\n');
    return `      <h2 id="${escapeAttr(section.id)}">${escapeJsxText(section.heading)}</h2>\n\n${blocksJsx}`;
  }).join('\n\n');

  return `${importLines.join('\n')}${importLines.length ? '\n\n' : ''}export default function ${componentName}({ base }: { base: string }) {
  return (
    <>
${introJsx}

${sectionsJsx}
    </>
  );
}
`;
}

/**
 * Component name for a content file based on locale.
 * E.g., en → ContentEn, ru → ContentRu.
 */
export function contentComponentName(locale: string): string {
  return 'Content' + locale.charAt(0).toUpperCase() + locale.slice(1).toLowerCase();
}

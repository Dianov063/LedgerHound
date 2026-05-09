/**
 * One-shot script: take the about_page, pricing_page, and services_divorce_page
 * namespaces from messages/en.json and translate them to ru/es/fr/zh/ar via DeepSeek.
 *
 * Run with: npx tsx scripts/translate-body-content.ts
 *
 * Translations are static in Git — Git is the source of truth. After running,
 * REVIEW the diffs manually before committing. Don't make this part of the
 * build pipeline.
 *
 * Required env: DEEPSEEK_API_KEY (in .env.local).
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const TARGET_LOCALES: { code: string; name: string }[] = [
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'zh', name: 'Simplified Chinese (zh-CN)' },
  { code: 'ar', name: 'Arabic' },
];

const NAMESPACES_TO_TRANSLATE = ['about_page', 'pricing_page', 'services_divorce_page'];

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

const SYSTEM_PROMPT = `You are translating UI copy for LedgerHound, a blockchain forensics SaaS company.

Rules:
1. Keep brand name "LedgerHound" untranslated.
2. Keep certification acronyms untranslated: CTCE, CFE, CCI, CAMS, ACFE.
3. Keep tool names untranslated: Chainalysis Reactor, TRM Labs, Elliptic, Etherscan, etc.
4. Keep corporate identifiers untranslated: USPROJECT LLC, EIN numbers, "ledgerhound.vip".
5. Keep email addresses and phone numbers untranslated.
6. Keep "New York, USA" untranslated (legal jurisdiction reference).
7. For Russian: use formal "Вы", professional but not overly bureaucratic tone, natural Russian crypto-fraud terminology.
8. For French: use formal "vous", standard France French.
9. For Chinese: use Simplified Chinese (zh-CN), professional business tone.
10. For Arabic: use Modern Standard Arabic (MSA), ensure proper RTL-friendly punctuation, avoid English-only patterns.
11. For Spanish: use neutral Latin American Spanish (works in both Spain and LatAm).
12. CRITICAL: Some keys split a sentence into parts (e.g. "title_line1" + "title_line2", or hero "title_line1" = "Cryptocurrency in" + "title_line2" = "Divorce & Estates"). When translating, treat them as ONE phrase that gets split — the translation must read naturally when concatenated. If line splitting doesn't work in target language, put the full translation in line1 and an empty string in line2.
13. Preserve length roughly: short labels stay short (don't expand "Stats" into a sentence). Stat values like "48h", "10+", "100%", "6" stay as-is — do NOT translate numbers/symbols.
14. Keep technical terms in English where standard: "blockchain", "Bitcoin", "Ethereum", "TRON", "BNB", "USDT", "DeFi", "NFT", "OFAC".
15. Output MUST be valid JSON matching the input structure exactly. Same keys, same nesting depth. Only translate string values.
16. Output ONLY the JSON object — no markdown fences, no explanation.`;

async function translateNamespace(content: any, targetLocaleName: string): Promise<any> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set');

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Translate this English UI copy JSON to ${targetLocaleName}. Return only JSON.\n\n${JSON.stringify(content, null, 2)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  let text = data.choices[0].message.content as string;
  text = text.trim().replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
  return JSON.parse(text);
}

function validateStructure(reference: any, translated: any, path = ''): string[] {
  const errors: string[] = [];
  if (typeof reference !== typeof translated) {
    errors.push(`${path}: type mismatch (${typeof reference} vs ${typeof translated})`);
    return errors;
  }
  if (typeof reference !== 'object' || reference === null) return errors;

  for (const key of Object.keys(reference)) {
    if (!(key in translated)) {
      errors.push(`${path}.${key}: missing in translation`);
    } else if (typeof reference[key] === 'object') {
      errors.push(...validateStructure(reference[key], translated[key], `${path}.${key}`));
    } else if (typeof translated[key] !== 'string') {
      errors.push(`${path}.${key}: not a string`);
    }
  }
  return errors;
}

async function main() {
  const enPath = path.join(MESSAGES_DIR, 'en.json');
  const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

  // Build a single object containing all 3 namespaces — translate together for consistency
  const sourceBundle: Record<string, any> = {};
  for (const ns of NAMESPACES_TO_TRANSLATE) {
    if (!en[ns]) throw new Error(`messages/en.json has no \`${ns}\` namespace`);
    sourceBundle[ns] = en[ns];
  }

  for (const { code, name } of TARGET_LOCALES) {
    console.log(`\n→ Translating body content to ${name} (${code})...`);
    try {
      const translated = await translateNamespace(sourceBundle, name);

      // Validate structure
      const errors = validateStructure(sourceBundle, translated);
      if (errors.length > 0) {
        console.error(`  ❌ Structure mismatch:`);
        errors.slice(0, 10).forEach((e) => console.error(`     ${e}`));
        if (errors.length > 10) console.error(`     ... +${errors.length - 10} more`);
        console.error(`  Skipping ${code}.json — review the prompt or DeepSeek output.`);
        continue;
      }

      const localePath = path.join(MESSAGES_DIR, `${code}.json`);
      const existing = fs.existsSync(localePath)
        ? JSON.parse(fs.readFileSync(localePath, 'utf-8'))
        : {};

      // Merge translated namespaces into existing locale file
      for (const ns of NAMESPACES_TO_TRANSLATE) {
        existing[ns] = translated[ns];
      }

      fs.writeFileSync(localePath, JSON.stringify(existing, null, 2) + '\n');
      console.log(`  ✅ Saved messages/${code}.json (${NAMESPACES_TO_TRANSLATE.length} namespaces merged)`);
    } catch (err: any) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
  }

  console.log('\n✨ Done. Review the diffs in messages/*.json before committing.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

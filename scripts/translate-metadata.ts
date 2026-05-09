/**
 * One-shot script: take the `metadata` namespace from messages/en.json
 * and translate it to ru/es/fr/zh/ar via DeepSeek API.
 *
 * Run once with:
 *   npx tsx scripts/translate-metadata.ts
 *
 * After running, REVIEW the diffs manually before committing — translations
 * are static in the repo (Git is the source of truth). Don't make this part
 * of the build pipeline.
 *
 * Required env: DEEPSEEK_API_KEY (in .env.local or process env).
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local if present
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const TARGET_LOCALES: { code: string; name: string }[] = [
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'zh', name: 'Simplified Chinese (zh-CN)' },
  { code: 'ar', name: 'Arabic' },
];

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

const SYSTEM_PROMPT = `You are translating SEO metadata (page titles and meta descriptions) for a crypto forensics SaaS called LedgerHound.

Rules:
1. Keep brand name "LedgerHound" untranslated.
2. Titles: 50-65 characters, include primary keyword naturally, action-oriented.
3. Descriptions: 140-160 characters, include primary keyword, value proposition.
4. Use natural phrasing in target language — NOT literal word-for-word translation.
5. For Russian: use formal "Вы" form. Use natural Russian crypto-fraud terminology.
6. For Spanish: neutral Latin American Spanish (works in both Spain and LatAm).
7. For French: standard French (France).
8. For Chinese: Simplified Chinese (zh-CN), not Traditional.
9. For Arabic: Modern Standard Arabic, ensure RTL-friendly punctuation, avoid English-only patterns.
10. Keep technical terms in English where standard: "blockchain", "Bitcoin", "Ethereum", "TRON", "BNB", "USDT", "OFAC", "GDPR", "CCPA", "CTCE", "CFE", "CAMS".
11. Keep "$49" and similar dollar amounts as-is.
12. Output MUST be valid JSON matching the input structure exactly. Same keys, same nesting depth. Only translate "title" and "description" string values.
13. Output ONLY the JSON object — no markdown fences, no explanation.`;

interface Metadata {
  [key: string]: { title: string; description: string } | Metadata;
}

async function translateNamespace(content: Metadata, targetLocaleName: string): Promise<Metadata> {
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
          content: `Translate this English SEO metadata JSON to ${targetLocaleName}. Return only JSON.\n\n${JSON.stringify(content, null, 2)}`,
        },
      ],
      temperature: 0.3,
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
  if (!en.metadata) throw new Error('messages/en.json has no `metadata` namespace');

  for (const { code, name } of TARGET_LOCALES) {
    console.log(`\n→ Translating metadata to ${name} (${code})...`);
    try {
      const translated = await translateNamespace(en.metadata, name);

      // Validate structure
      const errors = validateStructure(en.metadata, translated);
      if (errors.length > 0) {
        console.error(`  ❌ Structure mismatch:`);
        errors.slice(0, 5).forEach((e) => console.error(`     ${e}`));
        if (errors.length > 5) console.error(`     ... +${errors.length - 5} more`);
        console.error(`  Skipping ${code}.json — review the prompt or DeepSeek output.`);
        continue;
      }

      const localePath = path.join(MESSAGES_DIR, `${code}.json`);
      const existing = fs.existsSync(localePath)
        ? JSON.parse(fs.readFileSync(localePath, 'utf-8'))
        : {};
      existing.metadata = translated;
      fs.writeFileSync(localePath, JSON.stringify(existing, null, 2) + '\n');
      console.log(`  ✅ Saved messages/${code}.json`);
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

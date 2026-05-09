/**
 * One-shot: translate the 5 new blog card meta keys
 * (category_guide, category_case_study, category_legal, category_education, min_read)
 * from messages/en.json to ru/es/fr/zh/ar via DeepSeek.
 *
 * MERGES into existing `blog` namespace — does not overwrite other blog keys.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const TARGETS = [
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'zh', name: 'Simplified Chinese (zh-CN)' },
  { code: 'ar', name: 'Arabic' },
];

const NEW_KEYS = ['category_guide', 'category_case_study', 'category_legal', 'category_education', 'min_read'];
const MESSAGES_DIR = path.join(process.cwd(), 'messages');

const SYSTEM_PROMPT = `You are translating blog card UI labels for LedgerHound.

CRITICAL — the "min_read" value uses ICU MessageFormat with a {count} placeholder:
  English source: "{count} min read"
  Russian:        "{count} мин чтения"   (or natural equivalent)
  Spanish:        "{count} min de lectura"
  French:         "{count} min de lecture"
  Chinese:        "{count} 分钟阅读"
  Arabic:         "{count} دقيقة قراءة"

You MUST keep the exact placeholder "{count}" intact (with curly braces) — do not
translate the word "count", do not remove the braces, do not add a number.
The placeholder gets replaced at render time with the actual number.

For category labels (Guide, Case Study, Legal, Education):
  - Use natural locale-appropriate single-word/short labels
  - "Case Study" can be 2 words but stays compact
  - Do not translate "LedgerHound" or any brand name (none here, but as a rule)

Output:
  Same JSON keys, only translate values. Output ONLY the JSON object — no markdown.`;

async function translate(content: any, targetName: string): Promise<any> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set');

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Translate to ${targetName}. Keep {count} intact.\n\n${JSON.stringify(content, null, 2)}` },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) throw new Error(`DeepSeek ${response.status}: ${await response.text()}`);
  const data = await response.json();
  let text = data.choices[0].message.content as string;
  text = text.trim().replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
  return JSON.parse(text);
}

async function main() {
  const enPath = path.join(MESSAGES_DIR, 'en.json');
  const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
  const enBlog = en.blog || {};

  const source: Record<string, string> = {};
  for (const k of NEW_KEYS) {
    if (typeof enBlog[k] !== 'string') throw new Error(`messages/en.json blog.${k} missing`);
    source[k] = enBlog[k];
  }

  for (const { code, name } of TARGETS) {
    console.log(`\n→ ${name} (${code})...`);
    try {
      const translated = await translate(source, name);

      // Validate: same 5 keys, {count} placeholder preserved in min_read
      for (const k of NEW_KEYS) {
        if (typeof translated[k] !== 'string') {
          throw new Error(`missing/invalid key: ${k}`);
        }
      }
      if (!translated.min_read.includes('{count}')) {
        throw new Error(`min_read lost {count} placeholder: "${translated.min_read}"`);
      }

      const localePath = path.join(MESSAGES_DIR, `${code}.json`);
      const existing = fs.existsSync(localePath)
        ? JSON.parse(fs.readFileSync(localePath, 'utf-8'))
        : {};
      // MERGE into existing blog namespace
      existing.blog = { ...(existing.blog || {}), ...translated };
      fs.writeFileSync(localePath, JSON.stringify(existing, null, 2) + '\n');
      console.log(`  ✅ Saved messages/${code}.json`);
      console.log(`     min_read: "${translated.min_read}"`);
    } catch (err: any) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
  }
  console.log('\n✨ Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });

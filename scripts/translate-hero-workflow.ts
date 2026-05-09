/**
 * One-shot: translate the hero_workflow namespace from messages/en.json
 * to ru/es/fr/zh/ar via DeepSeek.
 *
 * Run: npx tsx scripts/translate-hero-workflow.ts
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

const NAMESPACE = 'hero_workflow';
const MESSAGES_DIR = path.join(process.cwd(), 'messages');

const SYSTEM_PROMPT = `You are translating a UI workflow card for LedgerHound (blockchain forensics SaaS).

Rules:
1. Keep brand name "LedgerHound" untranslated.
2. Keep these acronyms LATIN, untranslated: CTCE, KYC, VASP, tx hash.
   For Russian, "tx hash" can be rendered as "хэш транзакции" if natural.
3. Keep numbers as-is: 01, 02, 03, 04, 10+, 72.
4. "48–72h Report": for Russian use "48–72ч"; for other languages
   keep the "h" suffix or use the locale's natural hour abbreviation.
5. For Russian: formal "Вы", professional tone.
6. For Spanish: neutral Latin American Spanish.
7. For French: standard France French, formal "vous".
8. For Chinese: Simplified Chinese (zh-CN).
9. For Arabic: Modern Standard Arabic, RTL-friendly punctuation.
10. Preserve length roughly — these are cramped UI labels, not paragraphs.
11. The "·" middot in result_title is a separator — keep it (or use the locale's
    typographic equivalent if natural, e.g. " — " for Russian).
12. Output MUST be valid JSON, same keys, only translate string values.
13. Output ONLY the JSON object — no markdown fences, no explanation.`;

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
        { role: 'user', content: `Translate this UI workflow card JSON to ${targetName}. Return only JSON.\n\n${JSON.stringify(content, null, 2)}` },
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
  const source = en[NAMESPACE];
  if (!source) throw new Error(`messages/en.json has no \`${NAMESPACE}\` namespace`);

  for (const { code, name } of TARGETS) {
    console.log(`\n→ ${name} (${code})...`);
    try {
      const translated = await translate(source, name);
      // Sanity: same keys
      const missing = Object.keys(source).filter((k) => !(k in translated));
      if (missing.length > 0) {
        console.error(`  ❌ Missing keys in ${code}:`, missing);
        continue;
      }
      const localePath = path.join(MESSAGES_DIR, `${code}.json`);
      const existing = fs.existsSync(localePath)
        ? JSON.parse(fs.readFileSync(localePath, 'utf-8'))
        : {};
      existing[NAMESPACE] = translated;
      fs.writeFileSync(localePath, JSON.stringify(existing, null, 2) + '\n');
      console.log(`  ✅ Saved messages/${code}.json`);
    } catch (err: any) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
  }
  console.log('\n✨ Done. Review messages/*.json before committing.');
}

main().catch((err) => { console.error(err); process.exit(1); });

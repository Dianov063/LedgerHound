# Phase 3 (Spanish report) — Handoff after Part 2 Batch 1

LATAM Spanish (Peru-friendly) forensic report. This doc lets a fresh session
continue without re-discovering context.

## ✅ Completed

### Part 1 — i18n infrastructure
- **`lib/report-i18n.ts`** (new, 366 lines): self-contained `ReportTranslations`
  table (`en` + `es`), `getReportTranslations(locale)` with English fallback,
  `SUPPORTED_REPORT_LOCALES`, `isSupportedReportLocale()`.
  - Deliberately NOT `next-intl/server` `getTranslations` — reports render in a
    background task (Stripe webhook → `waitUntil`) with no request context, so
    that API would fail in production. Mirrors `lib/legal-packs/pdf-i18n.ts`.
- **`lib/reportPdf.tsx`**: `ReportI18nContext` + `useT()` hook. `ReportDocument`
  accepts a `locale` prop, resolves `t`, wraps all pages in the provider.
  React-Context propagation through @react-pdf was verified (page-count test)
  before adoption. All 16 page components read `t` via `useT()`.
- **Pipeline locale threading (end-to-end):**
  `app/[locale]/report/page.tsx` (selector, default = UI locale)
  → `app/api/create-checkout/route.ts` (validates `en|es`, writes Stripe `metadata.locale`)
  → `app/api/webhook/route.ts` (reads `metadata.locale`, passes to all 3 `generateReport()` calls)
  → `lib/generateReport.ts` (`options.locale` → `ReportDocument` prop)
- Language selector UI in the order form (English / Español).

### Part 2 Batch 1 — chrome translations (2 pages)
- **Executive Summary**: all static chrome translated (titles, RISK SCORE /
  RECOVERY PROBABILITY labels, risk-breakdown table + 7 row labels, risk-enum
  labels CRÍTICA/ALTA/MODERADA/BAJA, scam-db headers, "reportes/pérdidas",
  Key Findings header).
- **Recovery Readiness**: 100% Spanish. Its content is *computed in
  reportPdf.tsx* (`calculateReadinessScore` / `calculateInvestigationDifficulty`,
  both now take `t`), so there is NO `generateReport.ts` dependency — fully
  localized including evidence checklist, difficulty factors, tiers, how-to-use.
- ~50 new keys under `exec`, `readiness`, `riskLabels`, `sections` namespaces.

## ⏳ Pending (next sessions)

### Part 2 Batch 2 — `generateReport.ts` locale-awareness  ← THE BIG ONE
~46 parametrized English sentence generators must become locale-aware. They are
the **substance** the police/exchange will read — leaving them English makes a
"Spanish" report half-translated (worse than English-only). Exact locations in
`lib/generateReport.ts`:

| Generator | Lines | Count |
|-----------|-------|-------|
| `keyFindings.push(...)` | ~1436–1477 | 13 |
| `recommendations.push(...)` | ~1482–1496 | 6 |
| `positiveFactors` / `negativeFactors.push(...)` | ~1271–1307 | 8 |
| `roleReasoning.push(...)` | ~1690–1737 | 19 |
| `narrativeSummary` / `narrativeConclusion` (= `...`) | ~1754–1783 | 11 |
| `recoveryAssessment.disclaimer` + tier `label`s | ~1332 + tier block | ~5 |
| `recoveryLabel` tier strings | recovery block | ~4 |

**Strategy:**
1. `generateReport` already receives `reportLocale` (threaded in Part 1). Resolve
   `const rt = getReportTranslations(reportLocale)` near the top.
2. Move each sentence into `report-i18n.ts` as a **parametrized function**, e.g.
   `prose.kfExchangeInteraction: (brands: string) => '...'` with en + es variants.
3. Replace the inline literals with `rt.prose.xxx(params)` calls.
4. Keep numbers in Etherscan format; keep proper names; `wallet` feminine.
5. Re-run all smoke tests + render EN/ES; size delta confirms ES content.

Recommend a **`feature/phase-3-spanish-prose` branch** for safe rollback — this
touches business logic, not just presentation.

### Part 2 Batch 3 — remaining page chrome (14 pages)
Section titles are already translated (Part 1). What remains is each page's body
labels/captions. Pages: Investigation Summary, Asset Summary, Activity Timeline,
Behavioral Patterns, Wallet Analytics, Entity Identification, Address
Verification, Attack Technique Analysis, Fund Flow Graph, Transaction History,
Recovery Assessment (Legal Recommendations IIFE), Actionable Steps, Cross-Chain,
Disclaimer. Same `useT()` pattern already wired into every component.

### Part 3 — Peru-specific guidance section (`locale === 'es'` only)
New page before Disclaimer. Verified contacts:
- **DIVINDAT** (PNP cyber-crime): Av. España 323, Cercado de Lima · (01) 431-8898 · divindat.pnp@gmail.com
- **Ministerio Público** denuncia online: https://denuncias.mpfn.gob.pe/
- **SBS**: 0-800-10840 · solucion@sbs.gob.pe
- **INDECOPI**: 224-7777 · https://www.consumidor.gob.pe/
- **CAL** (Colegio de Abogados de Lima): https://www.cal.org.pe/ (verify colegiatura)
- **RENIEC**: DNI identity-alert guidance if DNI was shared with scammers
`sections.peruResources` key already exists ("Recursos Específicos para Perú").

### Part 4 — Spanish email templates (3 standalone files)
`lib/email-templates/{binance-compliance,tether-legal,divindat-denuncia}-es.md`
(downloadable, NOT part of the PDF). English subject lines, Spanish bodies.

### Part 5 — Final testing
Regenerate ES PDF for Elayne (`0xbc8996a9a5ff12ebf8702e857cc0faa451dc9569`),
spot-check every page, confirm Peru section ES-only, EN regression, build green.

## Glossary (STRICT — do NOT machine-translate)
`wallet` = feminine ("la wallet"); `exchange` = masculine ("el exchange");
`informe` = masculine. Numbers stay Etherscan format (`66,562.32`, not localized).
Proper names untouched (Binance, Tether, USDT, Etherscan, Fake_Phishing####, DZHLWK).
Key terms: Address Poisoning → "Envenenamiento de Direcciones"; Unicode Spoofing →
"Suplantación con Caracteres Unicode"; Main Collector → "Recolector Principal";
Secondary Spoof → "Suplantación Secundaria"; Misdirection → "Desvío de Fondos";
Subpoena → "Citación Judicial"; Preservation Request → "Solicitud de Preservación
de Evidencia"; "may be obtainable via legal subpoena (subject to exchange policy
and data availability)" → "puede obtenerse mediante citación judicial (sujeto a la
política del exchange y disponibilidad de datos)"; "supporting documentation for
legal proceedings" → "documentación de apoyo para procedimientos legales".
Full glossary in the original Phase 3 spec.

## Mechanism reference
- `useT()` in any page component returns the active `ReportTranslations`.
- Data-driven enums (riskLabel, readiness tier, difficulty tier) are English
  values mapped to localized labels at display (see `riskLabelL` in SummaryPage,
  `tierLabel`/`diffLabel` in RecoveryReadinessPage).
- Render test: `npx tsx scripts/test-attack-page-render.tsx` renders BOTH EN
  (`test-reports/attack-page-render-test.pdf`) and ES (`...-es.pdf`).

## Real Elayne case context (for testing realism)
Victim wallet `0xbc8996a9a5ff12ebf8702e857cc0faa451dc9569` (ETH). DZHLWK address-
poisoning campaign, vanity cluster `0x073a…609f`. Unicode-spoof tokens `ꓴꓢꓓꓔ`
(Lisu USDT) and `ÚЅDТ` (Cyrillic USDT). Recovery capped ≤35%.

## Files changed (Part 1 + Batch 1)
- `lib/report-i18n.ts` (new)
- `lib/reportPdf.tsx` (Context + useT + chrome translations; 356 ± lines)
- `lib/generateReport.ts` (locale param threading only — prose NOT yet localized)
- `app/api/create-checkout/route.ts` (locale validation + metadata)
- `app/api/webhook/route.ts` (locale extraction)
- `app/[locale]/report/page.tsx` (language selector)
- `scripts/test-attack-page-render.tsx` (now renders EN + ES)

## Smoke tests (all pass)
`smoke-test-poisoning` 14 · `smoke-test-unicode` 33 · `smoke-test-asset-classify` 7
· `smoke-test-elayne-spoof` 5 · `smoke-test-chainabuse-gate` 11.

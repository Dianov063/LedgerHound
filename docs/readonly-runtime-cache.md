# Read-only Next cache policy — 27 November 2026

LedgerHound runs as UID/GID1000 with a read-only root. Only `/tmp` and
`.next/cache` are writable, with existing memory/CPU/capability restrictions.
Next16.4.6 defaults `experimental.isrFlushToDisk` to true and can write responses,
including negative responses, to `.next/server/route-cache`. A writable
`.next/cache` volume does not cover that path. A successful HTTP404 can still
log `Failed to update prerender cache` / `ENOENT` during background persistence.

Self-host builds disable that disk flush and explicitly retain the existing
50MiB per-process LRU budget. Build-time prerendered pages remain immutable
seeds in the image, runtime responses use bounded memory and expire/evict,
and cache contents may be lost on restart. The single VPS process does not
need a new shared cache service. No writable route-cache directory or broadened
mount is added; S3 application data is unaffected. Other build environments
retain their existing defaults.

Revalidate this experimental Next option after framework upgrades using the
installed handler and a private production-image QA run. Test normal pages,
static assets and both dotted and dotless unique404 paths: LedgerHound's i18n
middleware excludes dotted paths, so testing only localized dotless404s missed
this defect. Verify stderr and disk growth separately from HTTP5xx. A request
spike or scan for configuration files alone does not establish a compromise.

Evidence and the VPS-only release/rollback procedure are in
`review/68-readonly-cache-20261127/REPORT.md` outside Git. The regression test
exercises the real installed Next cache handler with a read-only filesystem
and a small LRU so eviction is demonstrated without a large load test.

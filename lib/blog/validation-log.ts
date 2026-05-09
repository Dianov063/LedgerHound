/**
 * Persistent log of every validateAndCleanArticle invocation that
 * stripped at least one link.
 *
 * Stored in S3 under: blog-validation-logs/YYYY-MM-DD/{ts}-{event}.json
 *
 * Use cases:
 *  - Weekly review: are strip events trending up or down?
 *  - Hot path detection: which fake paths does DeepSeek invent most?
 *  - Mode breakdown: is the failure mostly in generate, humanize, or translate?
 *  - Locale breakdown: do translation passes corrupt links?
 *
 * Read aggregates via /api/blog-agent/validation-stats (admin only).
 */

import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import logger from '@/lib/logger';
import type { StrippedLink } from './validate-article';

const PREFIX = 'blog-validation-logs/';

const getS3 = () =>
  new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

const bucket = () => process.env.AWS_S3_BUCKET!;

export interface ValidationLogEntry {
  ts: string;                    // ISO timestamp
  mode: 'generate' | 'humanize' | 'translate' | 'publish';
  /** Article slug if known (publish mode); otherwise 'pending'. */
  slug: string;
  /** Locale being processed; only meaningful in translate/publish modes. */
  locale?: string;
  /** All link strips from this validation pass. */
  stripped: StrippedLink[];
  /** Article topic/title at time of validation, for debugging. */
  articleTitle?: string;
}

/**
 * Persist a validation event to S3. No-op if there were 0 strips.
 * Fire-and-forget — failures are logged but never block the request.
 */
export async function logValidationEvent(entry: ValidationLogEntry): Promise<void> {
  if (entry.stripped.length === 0) return;

  // Always emit a structured warn log first — visible in Vercel logs immediately,
  // even if S3 write fails or bucket is unreachable.
  for (const s of entry.stripped) {
    logger.warn({
      event: 'blog-validator-strip',
      mode: entry.mode,
      slug: entry.slug,
      locale: entry.locale,
      kind: s.kind,
      path: s.path,
      context: s.context,
      linkText: s.linkText,
    }, `[blog-validator] stripped ${s.kind} "${s.path}" in ${entry.slug} (${entry.mode}${entry.locale ? '/' + entry.locale : ''})`);
  }

  // Persist for cross-week aggregation
  try {
    const date = entry.ts.slice(0, 10);  // YYYY-MM-DD
    const tsSlug = entry.ts.replace(/[:.]/g, '-');
    const key = `${PREFIX}${date}/${tsSlug}-${entry.mode}-${entry.slug.slice(0, 40)}.json`;
    await getS3().send(new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: JSON.stringify(entry, null, 2),
      ContentType: 'application/json',
    }));
  } catch (err) {
    logger.error({ err: (err as Error).message }, '[blog-validator] failed to persist event to S3');
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   AGGREGATIONS (read by /api/blog-agent/validation-stats)
   ───────────────────────────────────────────────────────────────────────── */

export interface ValidationStats {
  rangeDays: number;
  totalEvents: number;       // distinct validations that stripped >= 1 link
  totalStripped: number;     // sum of strips across all events
  byMode: Record<string, number>;
  byLocale: Record<string, number>;
  byKind: Record<StrippedLink['kind'], number>;
  /** Most-frequently-hallucinated paths, top 20. */
  topPaths: { path: string; count: number }[];
  /** Most-affected article slugs, top 20. */
  topSlugs: { slug: string; count: number }[];
  /** Per-day strip counts — for trend visualization. */
  byDay: { date: string; events: number; stripped: number }[];
}

/**
 * Compute stats over the last N days. Range is inclusive of today.
 * Reads all keys under blog-validation-logs/YYYY-MM-DD/ for each day in range.
 */
export async function getValidationStats(days = 30): Promise<ValidationStats> {
  const stats: ValidationStats = {
    rangeDays: days,
    totalEvents: 0,
    totalStripped: 0,
    byMode: {},
    byLocale: {},
    byKind: { 'inline-link': 0, 'midcta-href': 0, 'related-slug': 0 },
    topPaths: [],
    topSlugs: [],
    byDay: [],
  };

  const pathCounts = new Map<string, number>();
  const slugCounts = new Map<string, number>();
  const dayCounts = new Map<string, { events: number; stripped: number }>();

  // Build the list of date prefixes
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const s3 = getS3();

  for (const date of dates) {
    let continuationToken: string | undefined;
    do {
      const resp: any = await s3.send(new ListObjectsV2Command({
        Bucket: bucket(),
        Prefix: `${PREFIX}${date}/`,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }));
      const objects = resp.Contents || [];
      continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;

      // Parallel-fetch up to 20 at a time (Vercel free-tier RPS friendly)
      const chunks: typeof objects[] = [];
      for (let i = 0; i < objects.length; i += 20) chunks.push(objects.slice(i, i + 20));

      for (const chunk of chunks) {
        const settled = await Promise.allSettled(
          chunk.map(async (o: any) => {
            if (!o.Key) return null;
            const r = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: o.Key }));
            const body = await r.Body?.transformToString();
            return body ? (JSON.parse(body) as ValidationLogEntry) : null;
          }),
        );
        for (const s of settled) {
          if (s.status !== 'fulfilled' || !s.value) continue;
          const entry = s.value;

          stats.totalEvents++;
          stats.totalStripped += entry.stripped.length;
          stats.byMode[entry.mode] = (stats.byMode[entry.mode] || 0) + 1;
          if (entry.locale) {
            stats.byLocale[entry.locale] = (stats.byLocale[entry.locale] || 0) + 1;
          }
          slugCounts.set(entry.slug, (slugCounts.get(entry.slug) || 0) + entry.stripped.length);

          for (const s of entry.stripped) {
            stats.byKind[s.kind] = (stats.byKind[s.kind] || 0) + 1;
            pathCounts.set(s.path, (pathCounts.get(s.path) || 0) + 1);
          }

          const dayKey = entry.ts.slice(0, 10);
          const cur = dayCounts.get(dayKey) || { events: 0, stripped: 0 };
          cur.events += 1;
          cur.stripped += entry.stripped.length;
          dayCounts.set(dayKey, cur);
        }
      }
    } while (continuationToken);
  }

  stats.topPaths = Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([path, count]) => ({ path, count }));

  stats.topSlugs = Array.from(slugCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([slug, count]) => ({ slug, count }));

  stats.byDay = Array.from(dayCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, c]) => ({ date, events: c.events, stripped: c.stripped }));

  return stats;
}

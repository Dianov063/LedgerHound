/**
 * The Google Analytics id this build may use, or null.
 *
 * A Vercel Preview deployment (VERCEL_ENV === 'preview') never loads Analytics, whatever
 * NEXT_PUBLIC_GA_ID its environment carries: test visits to a preview must not reach the
 * production property. Production on Vercel and the self-hosted build (no VERCEL_ENV) are
 * unchanged: they use NEXT_PUBLIC_GA_ID when it is set.
 *
 * The caller passes `process.env.NEXT_PUBLIC_GA_ID` written out literally. Next replaces that
 * exact expression at build time; read through a variable it would be empty at run time in the
 * container, where only the build had the id.
 */
export function analyticsId(gaId: string | undefined, vercelEnv: string | undefined): string | null {
  const id = gaId?.trim();
  if (!id) return null;
  if (vercelEnv === 'preview') return null;
  return id;
}

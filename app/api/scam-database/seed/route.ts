import { NextRequest } from 'next/server'
import { seedDatabase, getPlatformIndex, getStats, deleteReportAndPlatform } from '@/lib/scam-db'
import { requireAdmin } from '@/lib/admin-auth'

export const maxDuration = 60 // seconds — prevent Vercel 10s timeout

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  const force = request.nextUrl.searchParams.get('force') === 'true'

  try {
    console.log('[seed/route] GET seed called, force:', force)
    const result = await seedDatabase(force)

    // Return verification data
    const index = await getPlatformIndex()
    const stats = await getStats()

    const message = result.skipped
      ? `Already seeded with ${index.length} platforms. Pass force=true to re-seed.`
      : result.seeded === 0
        ? 'No verified seed platforms defined. Add entries to lib/scam-db-verified-seed.ts. Database is empty (this is expected post-2026-05-20 cleanup).'
        : `Database seeded with ${result.seeded} verified platforms.`

    return Response.json({
      success: true,
      seeded: result.seeded,
      skipped: result.skipped,
      message,
      platforms: index.map(p => ({ slug: p.slug, name: p.name, victims: p.victims, trustScore: p.trustScore })),
      stats,
    })
  } catch (error: any) {
    console.error('[seed/route] Error:', error)
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  const reportId = request.nextUrl.searchParams.get('reportId')
  const platformSlug = request.nextUrl.searchParams.get('platformSlug')

  if (!reportId || !platformSlug) {
    return Response.json({ error: 'Missing reportId or platformSlug query params' }, { status: 400 })
  }

  try {
    console.log(`[seed/route] DELETE called: report=${reportId}, platform=${platformSlug}`)
    const result = await deleteReportAndPlatform(reportId, platformSlug)
    return Response.json({ success: true, ...result })
  } catch (error: any) {
    console.error('[seed/route] DELETE error:', error)
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  let force = false
  try {
    const body = await request.json()
    force = body.force === true
  } catch {
    force = request.nextUrl.searchParams.get('force') === 'true'
  }

  try {
    console.log('[seed/route] POST seed called, force:', force)
    const result = await seedDatabase(force)

    const index = await getPlatformIndex()
    const stats = await getStats()

    const message = result.skipped
      ? `Already seeded with ${index.length} platforms. Pass force=true to re-seed.`
      : result.seeded === 0
        ? 'No verified seed platforms defined. Add entries to lib/scam-db-verified-seed.ts. Database is empty (this is expected post-2026-05-20 cleanup).'
        : `Database seeded with ${result.seeded} verified platforms.`

    return Response.json({
      success: true,
      seeded: result.seeded,
      skipped: result.skipped,
      message,
      platforms: index.map(p => ({ slug: p.slug, name: p.name, victims: p.victims, trustScore: p.trustScore })),
      stats,
    })
  } catch (error: any) {
    console.error('[seed/route] Error:', error)
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

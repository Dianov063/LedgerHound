import { NextRequest } from 'next/server'
import { seedDatabase, getPlatformIndex, getStats, deleteReportAndPlatform } from '@/lib/scam-db'

export const maxDuration = 60 // seconds — prevent Vercel 10s timeout

/* ── Admin auth rate limiting: 5 attempts/min per IP ── */
const authRateLimit = new Map<string, { count: number; reset: number }>()
setInterval(() => { const now = Date.now(); Array.from(authRateLimit.entries()).forEach(([k, v]) => { if (v.reset <= now) authRateLimit.delete(k) }) }, 60000)

function checkAdmin(req: NextRequest): Response | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const now = Date.now()
  const entry = authRateLimit.get(ip)
  if (entry && entry.reset > now) {
    if (entry.count >= 5) {
      return Response.json({ error: 'Too many auth attempts. Try again later.' }, { status: 429 })
    }
    entry.count++
  } else {
    authRateLimit.set(ip, { count: 1, reset: now + 60000 })
  }

  const authHeader = req.headers.get('x-admin-key')
  if (!authHeader || authHeader !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const denied = checkAdmin(request)
  if (denied) return denied

  const force = request.nextUrl.searchParams.get('force') === 'true'

  try {
    console.log('[seed/route] GET seed called, force:', force)
    await seedDatabase(force)

    // Return verification data
    const index = await getPlatformIndex()
    const stats = await getStats()

    return Response.json({
      success: true,
      message: `Database seeded with ${index.length} platforms`,
      platforms: index.map(p => ({ slug: p.slug, name: p.name, victims: p.victims, trustScore: p.trustScore })),
      stats,
    })
  } catch (error: any) {
    console.error('[seed/route] Error:', error)
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const denied = checkAdmin(request)
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
  const denied = checkAdmin(request)
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
    await seedDatabase(force)

    const index = await getPlatformIndex()
    const stats = await getStats()

    return Response.json({
      success: true,
      message: `Database seeded with ${index.length} platforms`,
      platforms: index.map(p => ({ slug: p.slug, name: p.name, victims: p.victims, trustScore: p.trustScore })),
      stats,
    })
  } catch (error: any) {
    console.error('[seed/route] Error:', error)
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

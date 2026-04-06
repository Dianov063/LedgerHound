import { NextRequest } from 'next/server'
import { seedDatabase, getPlatformIndex, getStats, deleteReportAndPlatform } from '@/lib/scam-db'

export const maxDuration = 60 // seconds — prevent Vercel 10s timeout

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[seed/route] GET seed called')
    await seedDatabase()

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
    return Response.json({ error: error.message, stack: error.stack?.split('\n').slice(0, 5) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reportId = searchParams.get('reportId')
  const platformSlug = searchParams.get('platformSlug')

  if (!reportId || !platformSlug) {
    return Response.json({ error: 'Missing reportId or platformSlug query params' }, { status: 400 })
  }

  try {
    console.log(`[seed/route] DELETE called: report=${reportId}, platform=${platformSlug}`)
    const result = await deleteReportAndPlatform(reportId, platformSlug)
    return Response.json({ success: true, ...result })
  } catch (error: any) {
    console.error('[seed/route] DELETE error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let password: string | null = null

  try {
    const body = await request.json()
    password = body.password
  } catch {
    // If body parsing fails, check query params
    const { searchParams } = new URL(request.url)
    password = searchParams.get('password')
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[seed/route] POST seed called')
    await seedDatabase()

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
    return Response.json({ error: error.message, stack: error.stack?.split('\n').slice(0, 5) }, { status: 500 })
  }
}

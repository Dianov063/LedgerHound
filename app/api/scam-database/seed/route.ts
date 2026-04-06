import { NextRequest } from 'next/server'
import { seedDatabase } from '@/lib/scam-db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await seedDatabase()
    return Response.json({ success: true, message: 'Database seeded with 10 platforms' })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { password } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await seedDatabase()
    return Response.json({ success: true, message: 'Database seeded with 10 platforms' })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

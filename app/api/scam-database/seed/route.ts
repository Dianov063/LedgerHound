import { NextRequest } from 'next/server';
import { seedDatabase } from '@/lib/scam-db';

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get('password');

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await seedDatabase();
    return Response.json({ success: true, message: 'Database seeded with 10 platforms' });
  } catch (err: any) {
    console.error('[scam-database/seed]', err);
    return Response.json({ error: err.message || 'Seed failed' }, { status: 500 });
  }
}

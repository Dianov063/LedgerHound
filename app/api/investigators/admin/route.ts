/**
 * Admin API for the Investigator Network.
 *
 * GET    /api/investigators/admin?type=approved|applications  — list
 * POST   /api/investigators/admin                             — actions: approve / reject / update / toggle
 *
 * Auth: x-admin-key header matching ADMIN_PASSWORD env var.
 */

import { NextRequest } from 'next/server';
import {
  listApproved,
  listApplications,
  approveApplication,
  deleteApplication,
  saveApproved,
  deleteApproved,
  getApproved,
} from '@/lib/investigators/storage';
import type { Investigator } from '@/lib/investigators/schema';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

function checkAdmin(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key');
  return !!process.env.ADMIN_PASSWORD && key === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'approved';

  try {
    if (type === 'applications') {
      const apps = await listApplications();
      return Response.json({ items: apps, total: apps.length });
    }
    const approved = await listApproved();
    return Response.json({ items: approved, total: approved.length });
  } catch (err: any) {
    logger.error({ err }, '[investigators/admin] GET failed');
    return Response.json({ error: err.message || 'Failed to list' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action, id, updates } = body;
  if (!action || !id) return Response.json({ error: 'Missing action or id' }, { status: 400 });

  try {
    if (action === 'approve') {
      const result = await approveApplication(id);
      if (!result) return Response.json({ error: 'Application not found' }, { status: 404 });
      return Response.json({ ok: true, investigator: result });
    }

    if (action === 'reject') {
      await deleteApplication(id);
      return Response.json({ ok: true });
    }

    if (action === 'delete') {
      await deleteApproved(id);
      return Response.json({ ok: true });
    }

    if (action === 'update') {
      if (!updates || typeof updates !== 'object') {
        return Response.json({ error: 'Missing updates object' }, { status: 400 });
      }
      const existing = await getApproved(id);
      if (!existing) return Response.json({ error: 'Investigator not found' }, { status: 404 });

      // Whitelist fields admin can edit
      const editable: (keyof Investigator)[] = [
        'name', 'photo', 'city', 'country', 'countryCode',
        'certifications', 'certificationsOther', 'specializations', 'languages',
        'yearsExperience', 'bio', 'linkedinUrl', 'websiteUrl',
        'availability', 'isActive',
        'identityVerified', 'certificationVerified', 'topInvestigator',
        'showStats', 'casesCompleted', 'recoveryRatePercent', 'avgResponseHours',
        'hourlyRateMin', 'hourlyRateMax', 'minCaseSize', 'acceptsContingency',
        'licensedIn', 'expertWitnessIn',
      ];
      const merged: Investigator = { ...existing };
      for (const k of editable) {
        if (k in updates) (merged as any)[k] = updates[k];
      }
      merged.updatedAt = new Date().toISOString();

      await saveApproved(merged);
      return Response.json({ ok: true, investigator: merged });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    logger.error({ err, action, id }, '[investigators/admin] POST failed');
    return Response.json({ error: err.message || 'Action failed' }, { status: 500 });
  }
}

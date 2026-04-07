import { NextRequest, NextResponse } from 'next/server';
import { getResearch, getPipelineStatus, getGeneratedPdfUrl } from '@/lib/legal-packs/s3';
import { COUNTRIES } from '@/lib/legal-packs/countries';
import type { CountryStatus } from '@/lib/legal-packs/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── GET /api/legal-packs?action=... ──

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');

    switch (action) {
      case 'list': {
        const status = await getPipelineStatus();
        const countries = COUNTRIES.map((c) => ({
          ...c,
          pipeline: status.countries[c.code] ?? ({
            researchedAt: null,
            generatedAt: null,
            validatedAt: null,
            status: 'missing',
            templatesGenerated: 0,
            validationPassed: false,
          } satisfies CountryStatus),
        }));
        return NextResponse.json({ countries, lastFullRefresh: status.lastFullRefresh });
      }

      case 'country': {
        const code = searchParams.get('code');
        if (!code) {
          return NextResponse.json({ error: 'Missing "code" query parameter' }, { status: 400 });
        }
        const research = await getResearch(code.toUpperCase());
        if (!research) {
          return NextResponse.json({ error: `No research found for country: ${code}` }, { status: 404 });
        }
        return NextResponse.json({ research });
      }

      case 'status': {
        const status = await getPipelineStatus();
        return NextResponse.json(status);
      }

      case 'pdf-url': {
        const country = searchParams.get('country');
        const template = searchParams.get('template');
        if (!country || !template) {
          return NextResponse.json(
            { error: 'Missing "country" and/or "template" query parameters' },
            { status: 400 },
          );
        }
        const url = await getGeneratedPdfUrl(country.toUpperCase(), template);
        return NextResponse.json({ url });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: "${action}". Supported: list, country, status, pdf-url` },
          { status: 400 },
        );
    }
  } catch (err: any) {
    console.error('[legal-packs GET]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/legal-packs ──

function checkAdmin(req: NextRequest): NextResponse | null {
  const key = req.headers.get('x-admin-key');
  if (!key || key !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { action, countryCode } = body as { action: string; countryCode?: string };

    if (!countryCode) {
      return NextResponse.json({ error: 'Missing "countryCode" in request body' }, { status: 400 });
    }

    const code = countryCode.toUpperCase();

    switch (action) {
      case 'refresh': {
        // Dynamic imports to keep cold-start fast and avoid pulling in Anthropic SDK on every request
        const { researchCountry } = await import('@/scripts/legal-packs/research-agent');
        const { generateTemplatesForCountry } = await import('@/scripts/legal-packs/template-generator');

        const research = await researchCountry(code);
        const generated = await generateTemplatesForCountry(code);

        return NextResponse.json({
          success: true,
          country: code,
          research: { name: research.name, lastUpdated: research.lastUpdated },
          templatesGenerated: generated,
        });
      }

      case 'generate-pdf': {
        const { generateTemplatesForCountry } = await import('@/scripts/legal-packs/template-generator');
        const generated = await generateTemplatesForCountry(code);

        return NextResponse.json({
          success: true,
          country: code,
          templatesGenerated: generated,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: "${action}". Supported: refresh, generate-pdf` },
          { status: 400 },
        );
    }
  } catch (err: any) {
    console.error('[legal-packs POST]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

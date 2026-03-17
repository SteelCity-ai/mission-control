/**
 * GET /api/social/outreach?date=YYYY-MM-DD — get daily outreach log (or list if no date)
 * POST /api/social/outreach — create/init outreach log for a date
 */
import { NextRequest, NextResponse } from 'next/server';
import { getOutreachByDate, initOutreach, listOutreach } from '@/lib/social/fileService';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate') ?? undefined;
    const endDate = searchParams.get('endDate') ?? undefined;

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return errorResponse('VALIDATION_FAILED', 'date must be in YYYY-MM-DD format', 400);
      }
      const outreach = await getOutreachByDate(date);
      if (!outreach) return errorResponse('NOT_FOUND', `No outreach log for ${date}`, 404);
      return NextResponse.json(outreach);
    }

    // List mode
    const records = await listOutreach({ startDate, endDate });
    return NextResponse.json({ outreach: records, count: records.length });
  } catch (err) {
    console.error('[GET /api/social/outreach]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch outreach', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const date = body.date ?? new Date().toISOString().split('T')[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return errorResponse('VALIDATION_FAILED', 'date must be in YYYY-MM-DD format', 400);
    }

    const outreach = await initOutreach(date);
    return NextResponse.json(outreach, { status: 201 });
  } catch (err) {
    console.error('[POST /api/social/outreach]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create outreach log', 500);
  }
}

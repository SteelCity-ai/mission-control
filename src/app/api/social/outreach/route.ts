/**
 * GET /api/social/outreach?clientId=&date=YYYY-MM-DD — get daily outreach log (or list if no date)
 * POST /api/social/outreach — create/init outreach log for a date (clientId required in body)
 *
 * SC-CLIENT-005: Updated to require clientId
 */
import { NextRequest, NextResponse } from 'next/server';
import { getOutreachByDate, initOutreach, listOutreach } from '@/lib/social/fileService';
import { requireActiveClient } from '@/lib/social/clientService';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function clientErrorResponse(err: unknown) {
  if (err instanceof Error) {
    if (err.message === 'CLIENT_MISSING') {
      return errorResponse('CLIENT_MISSING', 'clientId is required', 400);
    }
    if (err.message.startsWith('CLIENT_NOT_FOUND')) {
      return errorResponse('CLIENT_NOT_FOUND', 'Client not found', 404);
    }
    if (err.message.startsWith('CLIENT_ARCHIVED')) {
      return errorResponse('CLIENT_ARCHIVED', 'Client is archived', 404);
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const clientId = searchParams.get('clientId') ?? '';

    try {
      await requireActiveClient(clientId);
    } catch (err) {
      return clientErrorResponse(err) ?? errorResponse('INTERNAL_ERROR', 'Failed to validate client', 500);
    }

    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate') ?? undefined;
    const endDate = searchParams.get('endDate') ?? undefined;

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return errorResponse('VALIDATION_FAILED', 'date must be in YYYY-MM-DD format', 400);
      }
      const outreach = await getOutreachByDate(clientId, date);
      if (!outreach) return errorResponse('NOT_FOUND', `No outreach log for ${date}`, 404);
      return NextResponse.json(outreach);
    }

    // List mode
    const records = await listOutreach(clientId, { startDate, endDate });
    return NextResponse.json({ outreach: records, count: records.length });
  } catch (err) {
    console.error('[GET /api/social/outreach]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch outreach', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { clientId, date: bodyDate } = body;

    try {
      await requireActiveClient(clientId);
    } catch (err) {
      return clientErrorResponse(err) ?? errorResponse('INTERNAL_ERROR', 'Failed to validate client', 500);
    }

    const date = bodyDate ?? new Date().toISOString().split('T')[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return errorResponse('VALIDATION_FAILED', 'date must be in YYYY-MM-DD format', 400);
    }

    const outreach = await initOutreach(clientId, date);
    return NextResponse.json(outreach, { status: 201 });
  } catch (err) {
    console.error('[POST /api/social/outreach]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create outreach log', 500);
  }
}

/**
 * GET /api/social/reminder?clientId= — today's approved posts count for morning banner
 *
 * SC-CLIENT-005: Updated to require clientId
 */
import { NextRequest, NextResponse } from 'next/server';
import { getReminderData } from '@/lib/social/fileService';
import { requireActiveClient } from '@/lib/social/clientService';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId') ?? '';

    try {
      await requireActiveClient(clientId);
    } catch (err: unknown) {
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
      return errorResponse('INTERNAL_ERROR', 'Failed to validate client', 500);
    }

    const today = new Date().toISOString().split('T')[0];
    const data = await getReminderData(clientId, today);
    return NextResponse.json(data);
  } catch (err) {
    console.error('[GET /api/social/reminder]', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reminder data' } },
      { status: 500 }
    );
  }
}

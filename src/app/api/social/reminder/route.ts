/**
 * GET /api/social/reminder — today's approved posts count for morning banner
 */
import { NextRequest, NextResponse } from 'next/server';
import { getReminderData } from '@/lib/social/fileService';

export async function GET(_req: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await getReminderData(today);
    return NextResponse.json(data);
  } catch (err) {
    console.error('[GET /api/social/reminder]', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reminder data' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/social/outreach/[date] — update outreach entry (add likes/comments, update notes)
 *
 * Body options:
 * - { action: "add_like", account: "@handle", url?: "..." }
 * - { action: "add_comment", account: "@handle", text: "...", url?: "..." }
 * - { action: "update", notes?: "...", completed?: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { addLike, addComment, updateOutreach } from '@/lib/social/fileService';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return errorResponse('VALIDATION_FAILED', 'date must be in YYYY-MM-DD format', 400);
    }

    const body = await req.json();
    const { action } = body;

    if (!action) {
      return errorResponse('VALIDATION_FAILED', 'action is required', 400);
    }

    switch (action) {
      case 'add_like': {
        const { account, url } = body;
        if (!account) return errorResponse('VALIDATION_FAILED', 'account is required for add_like', 400);
        const updated = await addLike(date, { account, url });
        return NextResponse.json(updated);
      }

      case 'add_comment': {
        const { account, text, url } = body;
        if (!account) return errorResponse('VALIDATION_FAILED', 'account is required for add_comment', 400);
        if (!text) return errorResponse('VALIDATION_FAILED', 'text is required for add_comment', 400);

        const wordCount = text.trim().split(/\s+/).length;
        if (wordCount < 5) {
          return errorResponse(
            'VALIDATION_FAILED',
            `Comment must be at least 5 words (got ${wordCount})`,
            400
          );
        }

        const updated = await addComment(date, { account, text, url });
        return NextResponse.json(updated);
      }

      case 'update': {
        const { notes, completed } = body;
        const updated = await updateOutreach(date, { notes, completed });
        return NextResponse.json(updated);
      }

      default:
        return errorResponse('VALIDATION_FAILED', `Unknown action: ${action}`, 400);
    }
  } catch (err: unknown) {
    console.error('[PATCH /api/social/outreach/[date]]', err);
    const msg = err instanceof Error ? err.message : 'Failed to update outreach';
    if (msg.includes('not found')) return errorResponse('NOT_FOUND', msg, 404);
    if (msg.includes('at least 5 words')) return errorResponse('VALIDATION_FAILED', msg, 400);
    return errorResponse('INTERNAL_ERROR', msg, 500);
  }
}

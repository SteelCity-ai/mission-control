/**
 * PATCH /api/social/outreach/[date] — update outreach entry (add likes/comments, update notes)
 * clientId must be in the request body
 *
 * Body options:
 * - { clientId, action: "add_like", account: "@handle", url?: "..." }
 * - { clientId, action: "add_comment", account: "@handle", text: "...", url?: "..." }
 * - { clientId, action: "update", notes?: "...", completed?: boolean }
 *
 * SC-CLIENT-005: Updated to require clientId
 */
import { NextRequest, NextResponse } from 'next/server';
import { addLike, addComment, updateOutreach } from '@/lib/social/fileService';
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
    const { clientId, action } = body;

    try {
      await requireActiveClient(clientId);
    } catch (err) {
      return clientErrorResponse(err) ?? errorResponse('INTERNAL_ERROR', 'Failed to validate client', 500);
    }

    if (!action) {
      return errorResponse('VALIDATION_FAILED', 'action is required', 400);
    }

    switch (action) {
      case 'add_like': {
        const { account, url } = body;
        if (!account) return errorResponse('VALIDATION_FAILED', 'account is required for add_like', 400);
        const updated = await addLike(clientId, date, { account, url });
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

        const updated = await addComment(clientId, date, { account, text, url });
        return NextResponse.json(updated);
      }

      case 'update': {
        const { notes, completed } = body;
        const updated = await updateOutreach(clientId, date, { notes, completed });
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

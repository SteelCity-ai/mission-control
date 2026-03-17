/**
 * POST /api/social/posts/[id]/status — transition post status
 * Valid transitions: draft→review, review→draft, review→approved, approved→posted
 */
import { NextRequest, NextResponse } from 'next/server';
import { transitionPostStatus } from '@/lib/social/fileService';
import { STATUS_TRANSITIONS } from '@/lib/social/types';
import type { PostStatus } from '@/lib/social/types';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

const VALID_STATUSES: PostStatus[] = ['draft', 'review', 'approved', 'posted'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, updatedBy } = body;

    if (!status) {
      return errorResponse('VALIDATION_FAILED', 'status is required', 400);
    }

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(
        'VALIDATION_FAILED',
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }

    const updated = await transitionPostStatus(id, status as PostStatus, updatedBy ?? 'mike-1');
    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error('[POST /api/social/posts/[id]/status]', err);
    const msg = err instanceof Error ? err.message : 'Failed to transition status';
    if (msg.includes('not found')) return errorResponse('NOT_FOUND', msg, 404);
    if (msg.includes('Invalid status transition')) return errorResponse('INVALID_STATE_TRANSITION', msg, 409);
    return errorResponse('INTERNAL_ERROR', msg, 500);
  }
}

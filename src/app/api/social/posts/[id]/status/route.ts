/**
 * POST /api/social/posts/[id]/status — transition post status
 * Valid transitions: draft→review, review→draft, review→approved, approved→posted
 *
 * SC-CLIENT-005: Updated to require clientId
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPost, transitionPostStatus } from '@/lib/social/fileService';
import { requireActiveClient } from '@/lib/social/clientService';
import { STATUS_TRANSITIONS } from '@/lib/social/types';
import type { PostStatus } from '@/lib/social/types';

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

const VALID_STATUSES: PostStatus[] = ['draft', 'review', 'approved', 'posted'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { clientId, status, updatedBy } = body;

    // Validate client
    try {
      await requireActiveClient(clientId);
    } catch (err) {
      return clientErrorResponse(err) ?? errorResponse('INTERNAL_ERROR', 'Failed to validate client', 500);
    }

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

    // Verify post belongs to client
    const existingPost = await getPost(clientId, id);
    if (!existingPost || existingPost.clientId !== clientId) {
      return errorResponse('NOT_FOUND', `Post ${id} not found`, 404);
    }

    const updated = await transitionPostStatus(clientId, id, status as PostStatus, updatedBy ?? 'mike-1');
    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error('[POST /api/social/posts/[id]/status]', err);
    const msg = err instanceof Error ? err.message : 'Failed to transition status';
    if (msg.includes('not found')) return errorResponse('NOT_FOUND', msg, 404);
    if (msg.includes('Invalid status transition')) return errorResponse('INVALID_STATE_TRANSITION', msg, 409);
    return errorResponse('INTERNAL_ERROR', msg, 500);
  }
}

/**
 * GET /api/social/posts/[id]?clientId=    — get single post
 * PATCH /api/social/posts/[id]            — update post (clientId in body)
 * DELETE /api/social/posts/[id]?clientId= — soft delete
 *
 * SC-CLIENT-005: Updated to require clientId
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPost, updatePost, softDeletePost } from '@/lib/social/fileService';
import { requireActiveClient } from '@/lib/social/clientService';
import type { Pillar } from '@/lib/social/types';

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = req.nextUrl.searchParams.get('clientId') ?? '';

    try {
      await requireActiveClient(clientId);
    } catch (err) {
      return clientErrorResponse(err) ?? errorResponse('INTERNAL_ERROR', 'Failed to validate client', 500);
    }

    const post = await getPost(clientId, id);
    if (!post) return errorResponse('NOT_FOUND', `Post ${id} not found`, 404);

    // Validate the post belongs to this client
    if (post.clientId !== clientId) {
      return errorResponse('NOT_FOUND', `Post ${id} not found`, 404);
    }

    return NextResponse.json(post);
  } catch (err) {
    console.error('[GET /api/social/posts/[id]]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch post', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { clientId, content, pillar, scheduledDate, notes, tags } = body;

    try {
      await requireActiveClient(clientId);
    } catch (err) {
      return clientErrorResponse(err) ?? errorResponse('INTERNAL_ERROR', 'Failed to validate client', 500);
    }

    // Validate content if provided
    if (content !== undefined && content.length > 2000) {
      return errorResponse('VALIDATION_FAILED', `Content exceeds 2000 characters (got ${content.length})`, 400);
    }

    // Validate scheduled date if provided (not in past)
    if (scheduledDate !== undefined) {
      const today = new Date().toISOString().split('T')[0];
      if (scheduledDate < today) {
        return errorResponse('VALIDATION_FAILED', 'scheduledDate cannot be in the past', 400);
      }
    }

    // Verify post belongs to client
    const existingPost = await getPost(clientId, id);
    if (!existingPost || existingPost.clientId !== clientId) {
      return errorResponse('NOT_FOUND', `Post ${id} not found`, 404);
    }

    const updated = await updatePost(clientId, id, { content, pillar: pillar as Pillar, scheduledDate, notes, tags });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error('[PATCH /api/social/posts/[id]]', err);
    const msg = err instanceof Error ? err.message : 'Failed to update post';
    if (msg.includes('not found')) return errorResponse('NOT_FOUND', msg, 404);
    if (msg.includes('Cannot edit')) return errorResponse('INVALID_STATE', msg, 409);
    return errorResponse('INTERNAL_ERROR', msg, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = req.nextUrl.searchParams.get('clientId') ?? '';

    try {
      await requireActiveClient(clientId);
    } catch (err) {
      return clientErrorResponse(err) ?? errorResponse('INTERNAL_ERROR', 'Failed to validate client', 500);
    }

    // Verify post belongs to client
    const existingPost = await getPost(clientId, id);
    if (!existingPost || existingPost.clientId !== clientId) {
      return errorResponse('NOT_FOUND', `Post ${id} not found`, 404);
    }

    const deleted = await softDeletePost(clientId, id);
    return NextResponse.json({ success: true, post: deleted });
  } catch (err: unknown) {
    console.error('[DELETE /api/social/posts/[id]]', err);
    const msg = err instanceof Error ? err.message : 'Failed to delete post';
    if (msg.includes('not found')) return errorResponse('NOT_FOUND', msg, 404);
    return errorResponse('INTERNAL_ERROR', msg, 500);
  }
}

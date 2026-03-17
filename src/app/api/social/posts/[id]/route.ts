/**
 * GET /api/social/posts/[id]    — get single post
 * PATCH /api/social/posts/[id]  — update post (draft/review only)
 * DELETE /api/social/posts/[id] — soft delete
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPost, updatePost, softDeletePost } from '@/lib/social/fileService';
import type { Pillar, Platform } from '@/lib/social/types';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getPost(id);
    if (!post) return errorResponse('NOT_FOUND', `Post ${id} not found`, 404);
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
    const { content, pillar, scheduledDate, notes, tags } = body;

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

    const updated = await updatePost(id, { content, pillar, scheduledDate, notes, tags });
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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await softDeletePost(id);
    return NextResponse.json({ success: true, post: deleted });
  } catch (err: unknown) {
    console.error('[DELETE /api/social/posts/[id]]', err);
    const msg = err instanceof Error ? err.message : 'Failed to delete post';
    if (msg.includes('not found')) return errorResponse('NOT_FOUND', msg, 404);
    return errorResponse('INTERNAL_ERROR', msg, 500);
  }
}

/**
 * GET /api/social/posts  — list posts (filter by ?week=YYYY-Www or ?startDate&endDate)
 * POST /api/social/posts — create new post
 */
import { NextRequest, NextResponse } from 'next/server';
import { listPosts, createPost } from '@/lib/social/fileService';
import type { Platform, Pillar, PostStatus } from '@/lib/social/types';

// ── Error helper ──────────────────────────────────────────────────────────────
function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const week = searchParams.get('week') ?? undefined;
    const startDate = searchParams.get('startDate') ?? undefined;
    const endDate = searchParams.get('endDate') ?? undefined;
    const status = (searchParams.get('status') ?? undefined) as PostStatus | undefined;
    const platform = (searchParams.get('platform') ?? undefined) as Platform | undefined;

    const posts = await listPosts({ week, startDate, endDate, status, platform });
    return NextResponse.json({ posts, count: posts.length });
  } catch (err) {
    console.error('[GET /api/social/posts]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch posts', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    const { platform, content, scheduledDate, pillar, notes, tags } = body;

    if (!platform) return errorResponse('VALIDATION_FAILED', 'platform is required', 400);
    if (!content) return errorResponse('VALIDATION_FAILED', 'content is required', 400);
    if (!scheduledDate) return errorResponse('VALIDATION_FAILED', 'scheduledDate is required', 400);

    // Validate platform
    const validPlatforms: Platform[] = ['facebook', 'instagram', 'nextdoor', 'gmb'];
    if (!validPlatforms.includes(platform)) {
      return errorResponse('VALIDATION_FAILED', `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`, 400);
    }

    // Validate content length
    if (content.length > 2000) {
      return errorResponse('VALIDATION_FAILED', `Content exceeds 2000 characters (got ${content.length})`, 400);
    }

    // Validate date is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (scheduledDate < today) {
      return errorResponse('VALIDATION_FAILED', 'scheduledDate cannot be in the past', 400);
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
      return errorResponse('VALIDATION_FAILED', 'scheduledDate must be in YYYY-MM-DD format', 400);
    }

    // Validate pillar
    const validPillars: Pillar[] = [
      'humane_difference',
      'honest_experts',
      'no_contract_no_pressure',
      'neighbors_trust_neighbors',
      'behind_the_uniform',
      null,
    ];
    if (pillar !== undefined && !validPillars.includes(pillar)) {
      return errorResponse('VALIDATION_FAILED', 'Invalid pillar value', 400);
    }

    const post = await createPost({
      platform,
      content,
      scheduledDate,
      pillar: pillar ?? null,
      notes,
      tags,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error('[POST /api/social/posts]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create post', 500);
  }
}

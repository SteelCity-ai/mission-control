/**
 * GET /api/clients  — list all clients (filter by ?status=active|archived|all)
 * POST /api/clients — create new client
 *
 * SC-CLIENT-003
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  listClients,
  createClient,
  generateUniqueSlug,
  isValidSlug,
  readIndex,
} from '@/lib/social/clientService';

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: code, message, ...(details ? { details } : {}) }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const statusParam = searchParams.get('status') ?? 'active';

    if (!['active', 'archived', 'all'].includes(statusParam)) {
      return errorResponse(
        'VALIDATION_ERROR',
        'status must be one of: active, archived, all',
        400
      );
    }

    const clients = await listClients(statusParam as 'active' | 'archived' | 'all');
    const index = await readIndex();

    return NextResponse.json({
      clients,
      count: clients.length,
      totalClients: index.totalClients,
      activeClients: index.activeClients,
      archivedClients: index.archivedClients,
    });
  } catch (err) {
    console.error('[GET /api/clients]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch clients', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return errorResponse('VALIDATION_ERROR', 'Request body is required', 400);
    }

    const { name, slug, contactEmail, contactPhone, industry, branding } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('VALIDATION_ERROR', 'name is required', 400);
    }
    if (name.length > 100) {
      return errorResponse('VALIDATION_ERROR', 'name must be 100 characters or less', 400);
    }

    // Validate slug if provided
    if (slug !== undefined) {
      const normalizedSlug = String(slug).toLowerCase().trim();
      if (!isValidSlug(normalizedSlug)) {
        return errorResponse(
          'VALIDATION_ERROR',
          'slug must be 3-50 chars, lowercase alphanumeric and hyphens only',
          400
        );
      }
    }

    // Validate email if provided
    if (contactEmail !== undefined) {
      if (typeof contactEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
        return errorResponse('VALIDATION_ERROR', 'contactEmail must be a valid email address', 400);
      }
    }

    try {
      const client = await createClient({
        name: name.trim(),
        slug: slug ? String(slug).toLowerCase().trim() : undefined,
        contactEmail,
        contactPhone,
        industry,
        branding,
      });

      return NextResponse.json(client, { status: 201 });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.startsWith('SLUG_CONFLICT:')) {
        const parts = err.message.split(':');
        const takenSlug = parts[1];
        const suggestion = parts[2];
        return errorResponse('CONFLICT', `Slug '${takenSlug}' is already taken.`, 409, {
          suggestion,
          code: 'SLUG_CONFLICT',
        });
      }
      if (err instanceof Error && err.message.startsWith('INVALID_SLUG')) {
        return errorResponse('VALIDATION_ERROR', err.message.replace('INVALID_SLUG: ', ''), 400);
      }
      throw err;
    }
  } catch (err) {
    console.error('[POST /api/clients]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to create client', 500);
  }
}

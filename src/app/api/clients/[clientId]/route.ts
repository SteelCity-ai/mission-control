/**
 * GET /api/clients/[clientId]   — get single client
 * PUT /api/clients/[clientId]   — update client details
 *
 * SC-CLIENT-003
 */
import { NextRequest, NextResponse } from 'next/server';
import { getClient, updateClient, updateClientSettings, getClientSettings } from '@/lib/social/clientService';

type Params = { params: Promise<{ clientId: string }> };

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: code, message, ...(details ? { details } : {}) }, { status });
}

export async function GET(
  _req: NextRequest,
  { params }: Params
) {
  try {
    const { clientId } = await params;
    const client = await getClient(clientId);

    if (!client) {
      return errorResponse('NOT_FOUND', `Client '${clientId}' not found`, 404);
    }

    return NextResponse.json(client);
  } catch (err) {
    console.error('[GET /api/clients/[clientId]]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch client', 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { clientId } = await params;
    const body = await req.json().catch(() => null);

    if (!body) {
      return errorResponse('VALIDATION_ERROR', 'Request body is required', 400);
    }

    const { name, contactEmail, contactPhone, industry, branding, platforms, outreachTargets } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return errorResponse('VALIDATION_ERROR', 'name must be a non-empty string', 400);
      }
      if (name.length > 100) {
        return errorResponse('VALIDATION_ERROR', 'name must be 100 characters or less', 400);
      }
    }

    // Validate email if provided
    if (contactEmail !== undefined) {
      if (typeof contactEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
        return errorResponse('VALIDATION_ERROR', 'contactEmail must be a valid email address', 400);
      }
    }

    try {
      const updated = await updateClient(clientId, {
        name: name ? name.trim() : undefined,
        contactEmail,
        contactPhone,
        industry,
        branding,
      });

      // Update settings if platforms/outreachTargets provided
      if (platforms !== undefined || outreachTargets !== undefined) {
        await updateClientSettings(clientId, {
          ...(platforms !== undefined ? { platforms } : {}),
          ...(outreachTargets !== undefined ? { outreachTargets } : {}),
        });
      }

      const settings = await getClientSettings(clientId);
      const enriched = {
        ...updated,
        platforms: settings?.platforms ?? [],
        outreachTargets: settings?.outreachTargets ?? { likes: 25, comments: 5 },
      };

      return NextResponse.json(enriched);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.startsWith('CLIENT_NOT_FOUND')) {
        return errorResponse('NOT_FOUND', `Client '${clientId}' not found`, 404);
      }
      throw err;
    }
  } catch (err) {
    console.error('[PUT /api/clients/[clientId]]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update client', 500);
  }
}

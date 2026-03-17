/**
 * GET /api/clients/[clientId]/settings — get client settings
 * PUT /api/clients/[clientId]/settings — update client settings
 *
 * SC-CLIENT-004
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getClient,
  getClientSettings,
  updateClientSettings,
} from '@/lib/social/clientService';

type Params = { params: Promise<{ clientId: string }> };

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: code, message }, { status });
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

    const settings = await getClientSettings(clientId);
    if (!settings) {
      return errorResponse('NOT_FOUND', `Settings for client '${clientId}' not found`, 404);
    }

    return NextResponse.json(settings);
  } catch (err) {
    console.error('[GET /api/clients/[clientId]/settings]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch client settings', 500);
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

    const client = await getClient(clientId);
    if (!client) {
      return errorResponse('NOT_FOUND', `Client '${clientId}' not found`, 404);
    }

    // Validate platforms if provided
    if (body.platforms !== undefined) {
      if (!Array.isArray(body.platforms)) {
        return errorResponse('VALIDATION_ERROR', 'platforms must be an array', 400);
      }
      const validPlatforms = ['facebook', 'instagram', 'nextdoor', 'gmb'];
      const invalid = body.platforms.filter((p: unknown) => !validPlatforms.includes(String(p)));
      if (invalid.length > 0) {
        return errorResponse(
          'VALIDATION_ERROR',
          `Invalid platforms: ${invalid.join(', ')}. Must be one of: ${validPlatforms.join(', ')}`,
          400
        );
      }
    }

    // Validate outreachTargets if provided
    if (body.outreachTargets !== undefined) {
      const { likes, comments } = body.outreachTargets;
      if (likes !== undefined && (typeof likes !== 'number' || likes < 0)) {
        return errorResponse('VALIDATION_ERROR', 'outreachTargets.likes must be a non-negative number', 400);
      }
      if (comments !== undefined && (typeof comments !== 'number' || comments < 0)) {
        return errorResponse('VALIDATION_ERROR', 'outreachTargets.comments must be a non-negative number', 400);
      }
    }

    // Validate reminderTime if provided
    if (body.reminderTime !== undefined) {
      if (!/^\d{2}:\d{2}$/.test(body.reminderTime)) {
        return errorResponse('VALIDATION_ERROR', 'reminderTime must be in HH:MM format', 400);
      }
    }

    const { platforms, pillars, outreachTargets, brand, timezone, reminderTime } = body;

    const updated = await updateClientSettings(clientId, {
      ...(platforms !== undefined && { platforms }),
      ...(pillars !== undefined && { pillars }),
      ...(outreachTargets !== undefined && { outreachTargets }),
      ...(brand !== undefined && { brand }),
      ...(timezone !== undefined && { timezone }),
      ...(reminderTime !== undefined && { reminderTime }),
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PUT /api/clients/[clientId]/settings]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update client settings', 500);
  }
}

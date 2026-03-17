/**
 * PATCH /api/clients/[clientId]/archive — soft delete (set status to "archived")
 *
 * SC-CLIENT-003
 */
import { NextRequest, NextResponse } from 'next/server';
import { archiveClient } from '@/lib/social/clientService';

type Params = { params: Promise<{ clientId: string }> };

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: code, message }, { status });
}

export async function PATCH(
  _req: NextRequest,
  { params }: Params
) {
  try {
    const { clientId } = await params;

    try {
      const client = await archiveClient(clientId);
      return NextResponse.json({
        ...client,
        message: `Client '${client.name}' archived. All data preserved. Restore with PATCH /api/clients/${clientId}/restore`,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.startsWith('CLIENT_NOT_FOUND')) {
          return errorResponse('NOT_FOUND', `Client '${clientId}' not found`, 404);
        }
        if (err.message.startsWith('CLIENT_ALREADY_ARCHIVED')) {
          return errorResponse('CONFLICT', `Client '${clientId}' is already archived`, 409);
        }
      }
      throw err;
    }
  } catch (err) {
    console.error('[PATCH /api/clients/[clientId]/archive]', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to archive client', 500);
  }
}

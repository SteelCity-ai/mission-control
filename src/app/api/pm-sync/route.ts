/**
 * PM Sync API - POST /api/pm-sync
 * Bidirectional sync between Mission Control Dashboard and Linear
 * 
 * Supported actions:
 * - POST: Trigger sync, update task status in Linear
 * - GET: Get sync status
 */
import { NextRequest, NextResponse } from 'next/server';

// In-memory sync state (reset on server restart)
let syncState = {
  lastSync: null as string | null,
  tasksSynced: 0,
  errors: [] as string[],
  lastError: null as string | null,
};

// Linear API config - must be set via LINEAR_API_KEY env var
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
if (!LINEAR_API_KEY) {
  throw new Error('LINEAR_API_KEY environment variable is required');
}
const LINEAR_ENDPOINT = 'https://api.linear.app/graphql';

// Linear state mappings for STE team
const STATE_MAP: Record<string, string> = {
  'todo': '1178cb1f-2c5c-4a67-8818-b321a812d3e1',
  'in_progress': 'b037ea96-2d1c-49a4-a65a-26fa6251d633',
  'in review': '7259b04a-a243-45a3-9ec2-ddecadaa5ec8',
  'done': 'ccb080e8-dcac-449c-b9d3-83d1b545f953',
  'canceled': 'b6bbb9f5-f58b-4034-8fab-5f39e6fb2474',
  'backlog': 'b1288cde-20bb-4081-8375-8bdc7b180638',
};

interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  state: {
    name: string;
    id: string;
  };
  assignee?: {
    name: string;
    email: string;
  };
}

// Helper: Make GraphQL request to Linear
async function linearQuery(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(LINEAR_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': LINEAR_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });
  
  const data = await response.json();
  
  if (data.errors) {
    throw new Error(data.errors.map((e: { message: string }) => e.message).join(', '));
  }
  
  return data.data;
}

// GET: Return current sync status
export async function GET() {
  return NextResponse.json({
    lastSync: syncState.lastSync,
    tasksSynced: syncState.tasksSynced,
    errors: syncState.errors.slice(-10),
    lastError: syncState.lastError,
  });
}

// POST: Trigger sync or update a task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, taskId, status, identifier } = body;
    
    console.log(`[PM-SYNC] Action: ${action}`, { taskId, status, identifier });
    
    if (action === 'sync') {
      const query = `
        query($teamId: String!) {
          issues(filter: { team: { id: { eq: $teamId } } }, first: 100) {
            nodes {
              id
              identifier
              title
              state { name id }
              assignee { name email }
            }
          }
        }
      `;
      
      const data = await linearQuery(query, { teamId: '4f0371ca-e8ce-402d-95bc-fd4f833c0627' });
      const issues: LinearIssue[] = data.issues.nodes;
      
      syncState.lastSync = new Date().toISOString();
      syncState.tasksSynced = issues.length;
      syncState.lastError = null;
      
      return NextResponse.json({
        success: true,
        message: `Synced ${issues.length} tasks from Linear`,
        lastSync: syncState.lastSync,
        tasks: issues.map(i => ({
          id: i.identifier,
          title: i.title,
          status: i.state.name,
          assignee: i.assignee?.name || null,
        })),
      });
    }
    
    if (action === 'update' && taskId && status) {
      const stateId = STATE_MAP[status.toLowerCase()];
      
      if (!stateId) {
        return NextResponse.json(
          { error: `Unknown status: ${status}. Valid: ${Object.keys(STATE_MAP).join(', ')}` },
          { status: 400 }
        );
      }
      
      const getIssueQuery = `query($identifier: String!) { issue(identifier: $identifier) { id identifier title } }`;
      const issueData = await linearQuery(getIssueQuery, { identifier: taskId });
      
      if (!issueData.issue) {
        return NextResponse.json({ error: `Issue not found: ${taskId}` }, { status: 404 });
      }
      
      const updateMutation = `
        mutation($id: String!, $stateId: String!) {
          issueUpdate(id: $id, input: { stateId: $stateId }) {
            success
            issue { id identifier state { name id } }
          }
        }
      `;
      
      const updateResult = await linearQuery(updateMutation, {
        id: issueData.issue.id,
        stateId,
      });
      
      if (updateResult.issueUpdate.success) {
        syncState.tasksSynced += 1;
        syncState.lastSync = new Date().toISOString();
        
        return NextResponse.json({
          success: true,
          message: `Updated ${taskId} to ${status}`,
          issue: updateResult.issueUpdate.issue,
        });
      } else {
        throw new Error('Failed to update issue');
      }
    }
    
    if (action === 'test') {
      const query = `query { viewer { name } }`;
      const result = await linearQuery(query);
      
      return NextResponse.json({
        success: true,
        message: 'Linear API connection successful',
        user: result.viewer?.name || 'Unknown',
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use: sync, update, or test' },
      { status: 400 }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[PM-SYNC] Error:', errorMessage);
    
    syncState.lastError = errorMessage;
    syncState.errors.push(errorMessage);
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
# PM Sync Integration

This document describes the PM (Project Management) sync integration between Mission Control Dashboard and Linear.

## Overview

The PM Sync integration provides bidirectional synchronization between Mission Control Dashboard and Linear, allowing:
- Viewing Linear issues in the dashboard
- Updating task status from the dashboard
- Real-time sync status monitoring

## Architecture

```mermaid
graph TB
    subgraph "Mission Control Dashboard"
        UI[Dashboard UI]
        Widget[PmSyncWidget]
        API[/api/pm-sync]
    end
    
    subgraph "Sync Layer"
        State[Sync State<br/>in-memory]
    end
    
    subgraph "Linear"
        GraphQL[Linear GraphQL API]
        STE[STE Team<br/>Steelcity-ai]
    end
    
    UI --> Widget
    Widget --> API
    API --> State
    API -- GraphQL --> GraphQL
    GraphQL --> STE
    
    style API fill:#e0f2fe,stroke:#0284c7
    style Widget fill:#fef3c7,stroke:#d97706
    style GraphQL fill:#f0fdf4,stroke:#16a34a
```

## API Endpoints

### GET /api/pm-sync

Returns current sync status.

**Response:**
```json
{
  "lastSync": "2024-01-15T10:30:00.000Z",
  "tasksSynced": 34,
  "errors": ["error message"],
  "lastError": null
}
```

### POST /api/pm-sync

Performs sync or update operations.

**Actions:**

#### 1. Full Sync (`action: "sync"`)
Fetches all issues from Linear team.

```json
{
  "action": "sync"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Synced 34 tasks from Linear",
  "lastSync": "2024-01-15T10:30:00.000Z",
  "tasks": [
    {
      "id": "STE-61",
      "title": "Create PM sync route",
      "status": "In Progress",
      "assignee": "OBWON"
    }
  ]
}
```

#### 2. Update Task Status (`action: "update"`)
Updates a specific task's status in Linear.

```json
{
  "action": "update",
  "taskId": "STE-61",
  "status": "done"
}
```

**Valid statuses:** `todo`, `in_progress`, `in review`, `done`, `canceled`, `backlog`

#### 3. Test Connection (`action: "test"`)
Tests the Linear API connection.

```json
{
  "action": "test"
}
```

## Widget Component

The `PmSyncWidget` displays:
- Last sync timestamp
- Number of tasks synced
- Any sync errors
- "Sync Now" button to trigger manual sync

### Usage

```tsx
import { PmSyncWidget } from "@/components/PmSyncWidget";

// In your page/component:
<PmSyncWidget />
```

## Linear Team Configuration

- **Team:** Steelcity-ai (STE)
- **Team ID:** `4f0371ca-e8ce-402d-95bc-fd4f833c0627`
- **Project:** Mission Control Dashboard

### State Mappings

| Dashboard Status | Linear State ID |
|-----------------|-----------------|
| todo | `1178cb1f-2c5c-4a67-8818-b321a812d3e1` |
| in_progress | `b037ea96-2d1c-49a4-a65a-26fa6251d633` |
| in review | `7259b04a-a243-45a3-9ec2-ddecadaa5ec8` |
| done | `ccb080e8-dcac-449c-b9d3-83d1b545f953` |
| canceled | `b6bbb9f5-f58b-4034-8fab-5f39e6fb2474` |
| backlog | `b1288cde-20bb-4081-8375-8bdc7b180638` |

## Data Flow

1. **Dashboard Load:** Widget fetches current sync status via GET
2. **Manual Sync:** User clicks "Sync Now" → POST with `action: "sync"`
3. **API Processes:** 
   - Queries Linear GraphQL for all STE team issues
   - Updates in-memory sync state
   - Returns synced tasks to dashboard
4. **Task Update:** User updates status → POST with `action: "update"`
5. **API Processes:**
   - Resolves task ID to Linear issue ID
   - Updates issue state via GraphQL mutation
   - Returns updated issue info

## Troubleshooting

### Common Issues

#### "Failed to fetch sync status"
- Check network connectivity
- Verify API key is valid: `curl -H "Authorization: <key>" https://api.linear.app/graphql -d '{"query":"query{viewer{name}}"}'`

#### "Issue not found: STE-XX"
- Verify the issue exists in Linear
- Check the identifier format (must be like "STE-61")

#### "Unknown status: X"
- Valid statuses: `todo`, `in_progress`, `in review`, `done`, `canceled`, `backlog`

### Logs

Check browser console for detailed sync logs:
```
[PM-SYNC] Action: sync {...}
[PM-SYNC] Error: {...}
```

## Future: Adding Other PM Tools

### Architecture for Extensibility

The current implementation is designed to support additional PM tools. To add Jira or Asana:

1. **Create adapter interface:**
```typescript
interface PmAdapter {
  fetchTasks(): Promise<PmTask[]>;
  updateTaskStatus(taskId: string, status: string): Promise<void>;
  getTask(taskId: string): Promise<PmTask>;
}
```

2. **Implement adapters:**
- `src/lib/pm/adapters/linear.ts`
- `src/lib/pm/adapters/jira.ts`
- `src/lib/pm/adapters/asana.ts`

3. **Update API route:**
- Accept `provider` parameter in request
- Route to appropriate adapter based on provider

4. **Update widget:**
- Add provider selector dropdown
- Show provider-specific status

### Example: Adding Jira

```typescript
// src/lib/pm/adapters/jira.ts
export class JiraAdapter implements PmAdapter {
  async fetchTasks() {
    const response = await fetch(`${JIRA_URL}/rest/api/3/search`, {
      headers: { Authorization: `Basic ${btoa(EMAIL:API_TOKEN)}` }
    });
    // Transform JIRA issues to PmTask format
  }
}
```

## Security

- API key stored in `~/.config/linear/api_key` or environment variable `LINEAR_API_KEY`
- Requests include Bearer token authentication
- No sensitive data is logged in production

## Related Tasks

- STE-61: POST /api/pm-sync route
- STE-62: PM sync status widget  
- STE-63: OBWON integration docs
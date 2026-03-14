/**
 * Workflow orchestration API
 * POST /api/orchestrate
 * Accepts workflow requests and queues them for execution
 */
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Steel City agent mapping
const STEEL_CITY_AGENTS: Record<string, { name: string; emoji: string; department: string }> = {
  main: { name: 'Yoda', emoji: '🧙', department: 'Command' },
  foreman: { name: 'R2', emoji: '🤖', department: 'Project Planning' },
  research: { name: '3CP0', emoji: '🔍', department: 'Research' },
  architect: { name: 'Akbar', emoji: '📐', department: 'Architecture' },
  build: { name: 'Luke', emoji: '🔨', department: 'Build' },
  design: { name: 'Leia', emoji: '🎨', department: 'Design' },
  qa: { name: 'Han', emoji: '🎯', department: 'QA' },
  growth: { name: 'Lando', emoji: '📈', department: 'Growth' },
  reporter: { name: 'Chewy', emoji: '📊', department: 'Reporting' },
  'pm-sync': { name: 'OBWON', emoji: '📋', department: 'PM Sync' },
  macgyver: { name: 'MacGyver', emoji: '🛠️', department: 'Utilities' },
};

interface WorkflowRequest {
  task: string;
  agents: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface WorkflowItem {
  id: string;
  task: string;
  agents: string[];
  priority: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: string;
  error?: string;
}

function generateWorkflowId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `wf-${timestamp}-${random}`;
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readWorkflowQueue(): Promise<WorkflowItem[]> {
  try {
    const queuePath = path.join(DATA_DIR, 'workflow-queue.json');
    const data = await fs.readFile(queuePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeWorkflowQueue(queue: WorkflowItem[]): Promise<void> {
  const queuePath = path.join(DATA_DIR, 'workflow-queue.json');
  await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
}

async function readActiveWorkflows(): Promise<WorkflowItem[]> {
  try {
    const activePath = path.join(DATA_DIR, 'active-workflows.json');
    const data = await fs.readFile(activePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeActiveWorkflows(workflows: WorkflowItem[]): Promise<void> {
  const activePath = path.join(DATA_DIR, 'active-workflows.json');
  await fs.writeFile(activePath, JSON.stringify(workflows, null, 2));
}

async function logOrchestrationEvent(workflowId: string, task: string, agents: string[]): Promise<void> {
  try {
    const activitiesPath = path.join(DATA_DIR, 'activities.example.json');
    let activities: Array<Record<string, unknown>> = [];
    
    try {
      const data = await fs.readFile(activitiesPath, 'utf-8');
      activities = JSON.parse(data);
    } catch {
      activities = [];
    }
    
    const newActivity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'orchestration',
      description: `Orchestrated workflow: ${task}`,
      status: 'success',
      duration_ms: null,
      tokens_used: null,
      metadata: {
        workflowId,
        agents,
        eventType: 'workflow_created',
      },
    };
    
    activities.unshift(newActivity);
    
    // Keep only last 100 activities
    const trimmed = activities.slice(0, 100);
    await fs.writeFile(activitiesPath, JSON.stringify(trimmed, null, 2));
  } catch {
    // Silently fail - logging is not critical
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: WorkflowRequest = await request.json();
    
    // Validate request
    if (!body.task || typeof body.task !== 'string') {
      return NextResponse.json(
        { error: 'Task description is required' },
        { status: 400 }
      );
    }
    
    if (!body.agents || !Array.isArray(body.agents) || body.agents.length === 0) {
      return NextResponse.json(
        { error: 'At least one agent must be selected' },
        { status: 400 }
      );
    }
    
    // Validate agent IDs
    for (const agentId of body.agents) {
      if (!STEEL_CITY_AGENTS[agentId]) {
        return NextResponse.json(
          { error: `Invalid agent ID: ${agentId}` },
          { status: 400 }
        );
      }
    }
    
    const priority = body.priority || 'medium';
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Use: low, medium, high, critical' },
        { status: 400 }
      );
    }
    
    // Ensure data directory exists
    await ensureDataDir();
    
    // Create workflow item
    const workflowId = generateWorkflowId();
    const workflow: WorkflowItem = {
      id: workflowId,
      task: body.task,
      agents: body.agents,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    // Add to queue
    const queue = await readWorkflowQueue();
    queue.push(workflow);
    await writeWorkflowQueue(queue);
    
    // Also add to active workflows
    const activeWorkflows = await readActiveWorkflows();
    activeWorkflows.push(workflow);
    await writeActiveWorkflows(activeWorkflows);
    
    // Log the orchestration event
    await logOrchestrationEvent(workflowId, body.task, body.agents);
    
    // Return success
    return NextResponse.json({
      success: true,
      workflowId,
      status: 'pending',
      task: body.task,
      agents: body.agents.map((id: string) => ({
        id,
        ...STEEL_CITY_AGENTS[id],
      })),
      priority,
      message: `Workflow ${workflowId} queued successfully`,
    });
  } catch (error) {
    console.error('[orchestrate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}

// Also support GET to retrieve active workflows
export async function GET(request: NextRequest) {
  try {
    const activeWorkflows = await readActiveWorkflows();
    const queue = await readWorkflowQueue();
    
    return NextResponse.json({
      active: activeWorkflows,
      queue,
      availableAgents: Object.entries(STEEL_CITY_AGENTS).map(([id, info]) => ({
        id,
        ...info,
      })),
    });
  } catch (error) {
    console.error('[orchestrate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve workflows' },
      { status: 500 }
    );
  }
}
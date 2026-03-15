/**
 * Launch Template API
 * POST /api/templates/[id]/launch
 */
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const BUILT_IN_TEMPLATES_DIR = path.join(process.cwd(), 'src', 'data', 'workflow-templates');
const CUSTOM_TEMPLATES_DIR = '/data/workflow-templates';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  parameters: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
  }>;
  steps: Array<{
    agent: string;
    task: string;
  }>;
}

async function loadTemplate(id: string): Promise<WorkflowTemplate | null> {
  const builtInPath = path.join(BUILT_IN_TEMPLATES_DIR, `${id}.json`);
  try {
    const content = await fs.readFile(builtInPath, 'utf-8');
    return JSON.parse(content) as WorkflowTemplate;
  } catch {
    // Not in built-in
  }
  
  const customPath = path.join(CUSTOM_TEMPLATES_DIR, `${id}.json`);
  try {
    const content = await fs.readFile(customPath, 'utf-8');
    return JSON.parse(content) as WorkflowTemplate;
  } catch {
    // Not found
  }
  
  return null;
}

function interpolateTask(task: string, params: Record<string, string>): string {
  let result = task;
  for (const [key, value] of Object.entries(params)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
    
    // Handle pipe defaults like {{focus | default}}
    const defaultRegex = new RegExp(`{{${key}\\|([^}]+)}}`, 'g');
    result = result.replace(defaultRegex, (_, defaultVal) => value || defaultVal.trim());
  }
  return result;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await loadTemplate(id);
    
    if (!template) {
      return NextResponse.json(
        { error: `Template '${id}' not found` },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const paramsMap = body.parameters || {};
    
    // Validate required parameters
    for (const param of template.parameters) {
      if (param.required && !paramsMap[param.key]) {
        return NextResponse.json(
          { error: `Missing required parameter: ${param.key}` },
          { status: 400 }
        );
      }
    }
    
    // Build the workflow request
    const agents = [...new Set(template.steps.map(s => s.agent))];
    const tasks = template.steps.map(s => interpolateTask(s.task, paramsMap));
    const combinedTask = `**${template.name}**\n\n` + tasks.join('\n\n---\n\n');
    
    // Call the orchestrate API
    const orchestrateUrl = new URL('/api/orchestrate', request.url);
    const orchestrateResponse = await fetch(orchestrateUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: combinedTask,
        agents,
        priority: body.priority || 'medium',
      }),
    });
    
    if (!orchestrateResponse.ok) {
      const error = await orchestrateResponse.json();
      return NextResponse.json(
        { error: 'Failed to launch workflow', details: error },
        { status: orchestrateResponse.status }
      );
    }
    
    const result = await orchestrateResponse.json();
    
    return NextResponse.json({
      success: true,
      templateId: id,
      templateName: template.name,
      workflowId: result.workflowId,
      status: result.status,
      message: `Workflow '${template.name}' launched successfully`,
    });
  } catch (error) {
    console.error('[templates:launch] Error:', error);
    return NextResponse.json(
      { error: 'Failed to launch template' },
      { status: 500 }
    );
  }
}

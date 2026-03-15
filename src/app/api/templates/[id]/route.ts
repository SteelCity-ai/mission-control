/**
 * Single Template API
 * GET /api/templates/[id]
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
  category?: string;
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
  // Try built-in first
  const builtInPath = path.join(BUILT_IN_TEMPLATES_DIR, `${id}.json`);
  try {
    const content = await fs.readFile(builtInPath, 'utf-8');
    return JSON.parse(content) as WorkflowTemplate;
  } catch {
    // Not in built-in
  }
  
  // Try custom
  const customPath = path.join(CUSTOM_TEMPLATES_DIR, `${id}.json`);
  try {
    const content = await fs.readFile(customPath, 'utf-8');
    return JSON.parse(content) as WorkflowTemplate;
  } catch {
    // Not found
  }
  
  return null;
}

export async function GET(
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
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('[templates:id] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load template' },
      { status: 500 }
    );
  }
}

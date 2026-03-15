/**
 * Workflow Templates API
 * GET /api/templates - List all templates (built-in + custom)
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

async function loadTemplatesFromDir(dir: string): Promise<WorkflowTemplate[]> {
  const templates: WorkflowTemplate[] = [];
  try {
    await fs.access(dir);
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(dir, file), 'utf-8');
          const template = JSON.parse(content) as WorkflowTemplate;
          templates.push(template);
        } catch (e) {
          console.error(`Failed to parse template ${file}:`, e);
        }
      }
    }
  } catch {
    // Directory doesn't exist, skip
  }
  return templates;
}

export async function GET() {
  try {
    // Load built-in templates
    const builtIn = await loadTemplatesFromDir(BUILT_IN_TEMPLATES_DIR);
    
    // Load custom templates
    const custom = await loadTemplatesFromDir(CUSTOM_TEMPLATES_DIR);
    
    // Combine both lists (custom can override built-in)
    const allTemplates = [...builtIn];
    for (const t of custom) {
      const idx = allTemplates.findIndex(x => x.id === t.id);
      if (idx >= 0) {
        allTemplates[idx] = t;
      } else {
        allTemplates.push(t);
      }
    }
    
    return NextResponse.json({
      templates: allTemplates,
      count: allTemplates.length,
    });
  } catch (error) {
    console.error('[templates] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load templates' },
      { status: 500 }
    );
  }
}

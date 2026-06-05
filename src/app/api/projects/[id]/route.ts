import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface Project {
  id: string;
  name: string;
  clientId: string | null;
  description?: string;
  status: string;
  progress: number;
  milestones: Array<{ id: string; name: string; completed: boolean }>;
  tasksCount: { total: number; completed: number; inProgress: number; blocked: number };
  departments: Record<string, number>;
  recentWork?: string[];
  blockers?: string[];
  startDate: string;
  targetDate: string;
}

function getProjects(): Project[] {
  const dataPath = join(process.cwd(), 'data', 'projects.json');
  if (!existsSync(dataPath)) return [];
  try {
    return JSON.parse(readFileSync(dataPath, 'utf-8'));
  } catch {
    return [];
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projects = getProjects();
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Also return sibling projects (same client) for context
  const related = project.clientId
    ? projects.filter((p) => p.clientId === project.clientId && p.id !== id)
    : [];

  return NextResponse.json({ project, related });
}

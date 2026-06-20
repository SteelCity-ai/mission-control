import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

const DATA_DIR = process.env.MISSION_CONTROL_DATA_DIR || path.join(process.cwd(), 'data');

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  notes: string;
  status: 'todo' | 'doing' | 'done' | 'blocked';
  assigneeId: string;
  assigneeName: string;
  assigneeEmoji: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

function tasksPath(projectId: string) {
  return path.join(DATA_DIR, `project-tasks-${projectId}.json`);
}

async function readTasks(projectId: string): Promise<ProjectTask[]> {
  try {
    const data = await fs.readFile(tasksPath(projectId), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeTasks(projectId: string, tasks: ProjectTask[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(tasksPath(projectId), JSON.stringify(tasks, null, 2));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tasks = await readTasks(id);
  tasks.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    const pDiff = (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    if (pDiff !== 0) return pDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return NextResponse.json({ tasks });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!body?.title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const task: ProjectTask = {
    id: `pt-${Date.now()}-${randomBytes(3).toString('hex')}`,
    projectId: id,
    title: body.title.trim(),
    notes: body.notes?.trim() ?? '',
    status: body.status ?? 'todo',
    assigneeId: body.assigneeId ?? 'main',
    assigneeName: body.assigneeName ?? 'Yoda',
    assigneeEmoji: body.assigneeEmoji ?? '🧙',
    priority: body.priority ?? 'medium',
    createdAt: now,
    updatedAt: now,
  };

  const tasks = await readTasks(id);
  tasks.push(task);
  await writeTasks(id, tasks);

  return NextResponse.json({ task }, { status: 201 });
}

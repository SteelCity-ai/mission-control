import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_DIR = process.env.MISSION_CONTROL_DATA_DIR || path.join(process.cwd(), 'data');

interface ProjectTask {
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id, taskId } = await params;
  const body = await req.json().catch(() => ({}));

  const tasks = await readTasks(id);
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx < 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updated: ProjectTask = {
    ...tasks[idx],
    ...body,
    id: taskId,
    projectId: id,
    updatedAt: now,
  };

  if (body.status === 'done' && !tasks[idx].completedAt) {
    updated.completedAt = now;
  }
  if (body.status && body.status !== 'done') {
    delete updated.completedAt;
  }

  tasks[idx] = updated;
  await writeTasks(id, tasks);

  return NextResponse.json({ task: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id, taskId } = await params;
  const tasks = await readTasks(id);
  const filtered = tasks.filter((t) => t.id !== taskId);
  if (filtered.length === tasks.length) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  await writeTasks(id, filtered);
  return NextResponse.json({ success: true });
}

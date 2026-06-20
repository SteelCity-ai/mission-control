/**
 * GET /api/attention
 * Aggregates actionable attention items from projects, tasks, and workflows.
 * Returns items sorted by urgency.
 */
import { NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const DATA_DIR = process.env.MISSION_CONTROL_DATA_DIR || join(process.cwd(), 'data');

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface AttentionItem {
  id: string;
  severity: Severity;
  type: 'blocker' | 'at-risk' | 'stalled' | 'overdue' | 'needs-review' | 'no-tasks';
  title: string;
  detail: string;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  action: string;
  actionUrl: string;
}

function readJSON<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

function daysUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 86400000;
}

export async function GET() {
  const items: AttentionItem[] = [];

  interface Project {
    id: string;
    name: string;
    clientId: string | null;
    status: string;
    progress: number;
    blockers?: string[];
    targetDate: string;
    tasksCount: { total: number; completed: number; inProgress: number; blocked: number };
    milestones: Array<{ id: string; name: string; completed: boolean }>;
  }

  interface Workflow {
    id: string;
    task: string;
    agents: string[];
    status: string;
    priority: string;
    createdAt: string;
  }

  interface ProjectTask {
    id: string;
    projectId: string;
    title: string;
    status: string;
    priority: string;
    updatedAt: string;
  }

  // --- Projects ---
  const projects = readJSON<Project[]>(join(DATA_DIR, 'projects.json'), []);

  for (const p of projects) {
    if (p.status === 'archived' || p.status === 'completed') continue;

    // Blocked tasks in project summary
    if (p.tasksCount.blocked > 0) {
      items.push({
        id: `blocker-${p.id}`,
        severity: 'high',
        type: 'blocker',
        title: `${p.tasksCount.blocked} blocked task${p.tasksCount.blocked > 1 ? 's' : ''} — ${p.name}`,
        detail: p.blockers?.length
          ? p.blockers[0] + (p.blockers.length > 1 ? ` (+${p.blockers.length - 1} more)` : '')
          : 'Tasks are blocked — investigate and unblock.',
        projectId: p.id,
        projectName: p.name,
        clientId: p.clientId ?? undefined,
        action: 'View Project',
        actionUrl: `/projects/${p.id}`,
      });
    }

    // Overdue projects
    const daysLeft = daysUntil(p.targetDate);
    if (daysLeft < 0 && p.progress < 100) {
      items.push({
        id: `overdue-${p.id}`,
        severity: 'critical',
        type: 'overdue',
        title: `Overdue — ${p.name}`,
        detail: `Target was ${new Date(p.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${Math.abs(Math.round(daysLeft))} days ago) and project is ${p.progress}% complete.`,
        projectId: p.id,
        projectName: p.name,
        clientId: p.clientId ?? undefined,
        action: 'Review',
        actionUrl: `/projects/${p.id}`,
      });
    } else if (daysLeft >= 0 && daysLeft <= 14 && p.progress < 70) {
      // At risk: deadline in ≤14 days but <70% done
      items.push({
        id: `atrisk-${p.id}`,
        severity: 'high',
        type: 'at-risk',
        title: `At risk — ${p.name}`,
        detail: `${Math.round(daysLeft)} days until deadline, only ${p.progress}% complete.`,
        projectId: p.id,
        projectName: p.name,
        clientId: p.clientId ?? undefined,
        action: 'Check Progress',
        actionUrl: `/projects/${p.id}`,
      });
    }

    // Low progress / stalled (active project, <20% done, no milestone activity)
    if (p.status === 'active' && p.progress < 20) {
      const completedMs = p.milestones.filter((m) => m.completed).length;
      if (completedMs === 0) {
        items.push({
          id: `stalled-${p.id}`,
          severity: 'medium',
          type: 'stalled',
          title: `Stalled — ${p.name}`,
          detail: `Active project at ${p.progress}% with no completed milestones. May need a kickstart.`,
          projectId: p.id,
          projectName: p.name,
          clientId: p.clientId ?? undefined,
          action: 'Dispatch Agent',
          actionUrl: `/projects/${p.id}`,
        });
      }
    }
  }

  // --- Per-project tasks ---
  try {
    const dataFiles = readdirSync(DATA_DIR);
    for (const file of dataFiles) {
      if (!file.startsWith('project-tasks-') || !file.endsWith('.json')) continue;
      const projectId = file.replace('project-tasks-', '').replace('.json', '');
      const tasks = readJSON<ProjectTask[]>(join(DATA_DIR, file), []);
      const project = projects.find((p) => p.id === projectId);

      // Blocked tasks in task board
      const blockedTasks = tasks.filter((t) => t.status === 'blocked');
      if (blockedTasks.length > 0) {
        items.push({
          id: `task-blocked-${projectId}`,
          severity: 'high',
          type: 'blocker',
          title: `${blockedTasks.length} blocked task${blockedTasks.length > 1 ? 's' : ''} — ${project?.name ?? projectId}`,
          detail: blockedTasks[0].title + (blockedTasks.length > 1 ? ` (+${blockedTasks.length - 1} more)` : ''),
          projectId,
          projectName: project?.name,
          action: 'View Tasks',
          actionUrl: `/projects/${projectId}`,
        });
      }

      // Doing tasks not updated in 3+ days
      const stalledDoing = tasks.filter(
        (t) => t.status === 'doing' && daysSince(t.updatedAt) >= 3
      );
      if (stalledDoing.length > 0) {
        items.push({
          id: `task-stalled-${projectId}`,
          severity: 'medium',
          type: 'stalled',
          title: `Stalled task${stalledDoing.length > 1 ? 's' : ''} — ${project?.name ?? projectId}`,
          detail: `"${stalledDoing[0].title}" has been in-progress for ${Math.floor(daysSince(stalledDoing[0].updatedAt))} days.`,
          projectId,
          projectName: project?.name,
          action: 'Check Tasks',
          actionUrl: `/projects/${projectId}`,
        });
      }

      // Critical priority tasks that are not done
      const criticalPending = tasks.filter(
        (t) => t.priority === 'critical' && t.status !== 'done'
      );
      if (criticalPending.length > 0) {
        items.push({
          id: `task-critical-${projectId}`,
          severity: 'critical',
          type: 'needs-review',
          title: `Critical task pending — ${project?.name ?? projectId}`,
          detail: criticalPending[0].title,
          projectId,
          projectName: project?.name,
          action: 'Address Now',
          actionUrl: `/projects/${projectId}`,
        });
      }
    }
  } catch {
    // Data dir read failure — skip task items
  }

  // --- Workflows ---
  const workflows = readJSON<Workflow[]>(join(DATA_DIR, 'active-workflows.json'), []);
  const oldPending = workflows.filter(
    (w) => w.status === 'pending' && daysSince(w.createdAt) >= 1
  );
  if (oldPending.length > 0) {
    items.push({
      id: 'stalled-workflows',
      severity: 'medium',
      type: 'stalled',
      title: `${oldPending.length} workflow${oldPending.length > 1 ? 's' : ''} pending >24h`,
      detail: `"${oldPending[0].task.slice(0, 80)}…" and ${oldPending.length - 1} other${oldPending.length > 1 ? 's' : ''} may be stuck.`,
      action: 'View Workflows',
      actionUrl: '/workflows',
    });
  }

  // Sort: critical first, then high, medium, low
  const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Deduplicate by project (keep only the most severe item per project)
  const seen = new Set<string>();
  const deduped = items.filter((item) => {
    const key = item.projectId ? `${item.projectId}-${item.type}` : item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({
    items: deduped,
    count: deduped.length,
    critical: deduped.filter((i) => i.severity === 'critical').length,
    high: deduped.filter((i) => i.severity === 'high').length,
  });
}

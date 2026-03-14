/**
 * Projects API - GET /api/projects
 * Returns list of active projects with their status, progress, milestones, and department breakdown
 */
import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  milestones: Array<{ id: string; name: string; completed: boolean }>;
  tasksCount: {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
  };
  departments: Record<string, number>;
  startDate: string;
  targetDate: string;
}

function getProjects(): Project[] {
  const dataPath = join(process.cwd(), 'data', 'projects.json');
  
  if (!existsSync(dataPath)) {
    return [];
  }
  
  try {
    const data = readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading projects:', error);
    return [];
  }
}

export async function GET() {
  try {
    const projects = getProjects();
    
    // Calculate summary stats
    const totalTasks = projects.reduce((sum, p) => sum + p.tasksCount.total, 0);
    const completedTasks = projects.reduce((sum, p) => sum + p.tasksCount.completed, 0);
    const inProgressTasks = projects.reduce((sum, p) => sum + p.tasksCount.inProgress, 0);
    const blockedTasks = projects.reduce((sum, p) => sum + p.tasksCount.blocked, 0);
    
    return NextResponse.json({
      projects,
      summary: {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

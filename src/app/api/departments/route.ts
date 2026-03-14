/**
 * Departments API - GET /api/departments
 * Returns our 7 departments with agent names, task counts, active tasks, and completion %
 */
import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface Department {
  id: string;
  name: string;
  agentName: string;
  agentEmoji: string;
  agentColor: string;
  taskCount: number;
  activeTasks: number;
  completedTasks: number;
  blockedTasks: number;
  completionRate: number;
}

// Steel City departments and their lead agents
const STEEL_CITY_DEPARTMENTS = [
  { id: 'research', name: 'Research', agentName: '3CP0', agentEmoji: '🔍', agentColor: '#8B5CF6' },
  { id: 'architecture', name: 'Architecture', agentName: 'Akbar', agentEmoji: '📐', agentColor: '#F59E0B' },
  { id: 'build', name: 'Build', agentName: 'Luke', agentEmoji: '🔨', agentColor: '#EF4444' },
  { id: 'design', name: 'Design', agentName: 'Leia', agentEmoji: '🎨', agentColor: '#EC4899' },
  { id: 'qa', name: 'QA', agentName: 'Han', agentEmoji: '🎯', agentColor: '#10B981' },
  { id: 'growth', name: 'Growth', agentName: 'Lando', agentEmoji: '📈', agentColor: '#3B82F6' },
  { id: 'reporting', name: 'Reporting', agentName: 'Chewy', agentEmoji: '📊', agentColor: '#14B8A6' },
];

function getTasksByDepartment(): Record<string, { total: number; active: number; completed: number; blocked: number }> {
  const dataPath = join(process.cwd(), 'data', 'tasks.json');
  
  const deptCounts: Record<string, { total: number; active: number; completed: number; blocked: number }> = {};
  
  // Initialize all departments
  STEEL_CITY_DEPARTMENTS.forEach(dept => {
    deptCounts[dept.name] = { total: 0, active: 0, completed: 0, blocked: 0 };
  });
  
  if (!existsSync(dataPath)) {
    return deptCounts;
  }
  
  try {
    const data = readFileSync(dataPath, 'utf-8');
    const tasks = JSON.parse(data);
    
    tasks.forEach((task: any) => {
      const deptName = task.department;
      if (deptCounts[deptName]) {
        deptCounts[deptName].total++;
        
        if (task.status === 'done' || task.status === 'completed') {
          deptCounts[deptName].completed++;
        } else if (task.status === 'blocked') {
          deptCounts[deptName].blocked++;
          deptCounts[deptName].active++;
        } else if (task.status === 'in_progress' || task.status === 'in progress') {
          deptCounts[deptName].active++;
        }
      }
    });
  } catch (error) {
    console.error('Error reading tasks:', error);
  }
  
  return deptCounts;
}

export async function GET() {
  try {
    const taskCounts = getTasksByDepartment();
    
    const departments: Department[] = STEEL_CITY_DEPARTMENTS.map(dept => {
      const counts = taskCounts[dept.name];
      const completionRate = counts.total > 0 
        ? Math.round((counts.completed / counts.total) * 100) 
        : 0;
      
      return {
        id: dept.id,
        name: dept.name,
        agentName: dept.agentName,
        agentEmoji: dept.agentEmoji,
        agentColor: dept.agentColor,
        taskCount: counts.total,
        activeTasks: counts.active,
        completedTasks: counts.completed,
        blockedTasks: counts.blocked,
        completionRate,
      };
    });
    
    // Calculate summary
    const totalTasks = departments.reduce((sum, d) => sum + d.taskCount, 0);
    const totalActive = departments.reduce((sum, d) => sum + d.activeTasks, 0);
    const totalCompleted = departments.reduce((sum, d) => sum + d.completedTasks, 0);
    const totalBlocked = departments.reduce((sum, d) => sum + d.blockedTasks, 0);
    
    return NextResponse.json({
      departments,
      summary: {
        totalDepartments: departments.length,
        totalTasks,
        activeTasks: totalActive,
        completedTasks: totalCompleted,
        blockedTasks: totalBlocked,
        overallCompletionRate: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

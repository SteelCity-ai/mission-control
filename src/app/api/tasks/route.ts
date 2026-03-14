/**
 * Tasks API - GET /api/tasks
 * Returns tasks with optional filtering by department, status, and priority
 * Query params: ?department=X&status=Y&priority=Z
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface Task {
  id: string;
  title: string;
  description: string;
  department: string;
  status: string;
  priority: number;
  assignee: string;
  assigneeEmoji: string;
  dependencies: string[];
  createdAt: string;
  updatedAt: string;
}

function getTasks(): Task[] {
  const dataPath = join(process.cwd(), 'data', 'tasks.json');
  
  if (!existsSync(dataPath)) {
    return [];
  }
  
  try {
    const data = readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading tasks:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Filter params
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignee = searchParams.get('assignee');
    
    let tasks = getTasks();
    
    // Apply filters
    if (department) {
      tasks = tasks.filter(t => 
        t.department.toLowerCase() === department.toLowerCase()
      );
    }
    
    if (status) {
      tasks = tasks.filter(t => 
        t.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    if (priority !== null) {
      const priorityNum = parseInt(priority, 10);
      if (!isNaN(priorityNum)) {
        tasks = tasks.filter(t => t.priority === priorityNum);
      }
    }
    
    if (assignee) {
      tasks = tasks.filter(t => 
        t.assignee.toLowerCase() === assignee.toLowerCase()
      );
    }
    
    // Calculate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => 
      t.status === 'done' || t.status === 'completed'
    ).length;
    const inProgressTasks = tasks.filter(t => 
      t.status === 'in_progress' || t.status === 'in progress'
    ).length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    const todoTasks = tasks.filter(t => 
      t.status === 'todo' || t.status === 'pending' || t.status === 'backlog'
    ).length;
    
    return NextResponse.json({
      tasks,
      filters: {
        department,
        status,
        priority,
        assignee,
      },
      stats: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        blocked: blockedTasks,
        todo: todoTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

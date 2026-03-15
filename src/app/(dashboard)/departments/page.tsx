"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  User,
  Link2,
  Filter,
} from "lucide-react";

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

interface TasksResponse {
  tasks: Task[];
  filters: {
    department: string | null;
    status: string | null;
    priority: string | null;
    assignee: string | null;
  };
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
    todo: number;
    completionRate: number;
  };
}

const DEPARTMENTS = [
  { id: "all",          name: "All Departments", emoji: "🏢", color: "var(--accent)" },
  { id: "research",     name: "Research",        emoji: "🔬", color: "#8B5CF6" },
  { id: "architecture", name: "Architecture",    emoji: "🏗️", color: "#F59E0B" },
  { id: "build",        name: "Build",           emoji: "⚡", color: "#22C55E" },
  { id: "design",       name: "Design",          emoji: "🎨", color: "#EC4899" },
  { id: "qa",           name: "QA",              emoji: "🛡️", color: "#EF4444" },
  { id: "growth",       name: "Growth",          emoji: "📣", color: "#F97316" },
  { id: "reporting",    name: "Reporting",       emoji: "📊", color: "#D97706" },
];

const STATUS_COLUMNS = [
  { id: "todo", name: "TODO", icon: Clock, color: "var(--neutral)" },
  { id: "in_progress", name: "IN PROGRESS", icon: Zap, color: "var(--accent)" },
  { id: "blocked", name: "BLOCKED", icon: AlertTriangle, color: "var(--error)" },
  { id: "done", name: "DONE", icon: CheckCircle, color: "var(--success)" },
];

const PRIORITY_LABELS = ["P0", "P1", "P2", "P3"];

function getPriorityClass(priority: number): string {
  return `priority-p${priority}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DepartmentsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [stats, setStats] = useState<TasksResponse["stats"] | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDepartment !== "all") {
        params.set("department", selectedDepartment);
      }

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const data: TasksResponse = await res.json();
      setTasks(data.tasks);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getTasksByStatus = (status: string): Task[] => {
    if (status === "todo") {
      return tasks.filter(
        (t) =>
          t.status === "todo" ||
          t.status === "pending" ||
          t.status === "backlog"
      );
    }
    if (status === "in_progress") {
      return tasks.filter(
        (t) => t.status === "in_progress" || t.status === "in progress"
      );
    }
    return tasks.filter((t) => t.status === status);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div
          className="flex items-center justify-center min-h-[400px]"
          style={{ color: "var(--text-muted)" }}
        >
          Loading tasks...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl md:text-3xl font-bold mb-2"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
            letterSpacing: "-1.5px",
          }}
        >
          <Zap className="inline-block w-8 h-8 mr-2 mb-1" />
          Department Tasks
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Kanban board view of all Steel City tasks
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div
          className="mb-6 p-4 rounded-xl"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Total:
              </span>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {stats.total}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: "var(--success)" }} />
              <span className="font-semibold" style={{ color: "var(--success)" }}>
                {stats.completed}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: "var(--warning)" }} />
              <span className="font-semibold" style={{ color: "var(--warning)" }}>
                {stats.inProgress}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: "var(--error)" }} />
              <span className="font-semibold" style={{ color: "var(--error)" }}>
                {stats.blocked}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Completion:
              </span>
              <span className="font-semibold" style={{ color: "var(--accent)" }}>
                {stats.completionRate}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Department Filter Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-1 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
          {DEPARTMENTS.map((dept) => {
            const isActive = selectedDepartment === dept.id;
            const activeColor = dept.color;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDepartment(dept.id)}
                className="flex items-center gap-1.5 px-3 py-2 font-medium text-sm whitespace-nowrap transition-all rounded-t-lg"
                style={{
                  color: isActive ? activeColor : "var(--text-secondary)",
                  backgroundColor: isActive ? `${activeColor}10` : "transparent",
                  borderBottom: isActive ? `2px solid ${activeColor}` : "2px solid transparent",
                  cursor: "pointer",
                  marginBottom: "-1px",
                }}
              >
                <span>{dept.emoji}</span>
                {dept.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {STATUS_COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const ColumnIcon = column.icon;

          return (
            <div
              key={column.id}
              className={`kanban-column ${column.id}`}
              style={{ borderTop: `3px solid ${column.color}` }}
            >
              <div className="kanban-column-header">
                <div className="flex items-center gap-2">
                  <ColumnIcon className="w-4 h-4" style={{ color: column.color }} />
                  {column.name}
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: `${column.color}20`,
                    color: column.color,
                  }}
                >
                  {columnTasks.length}
                </span>
              </div>
              <div className="kanban-cards">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg transition-all duration-150 group/card"
                    style={{
                      backgroundColor: "var(--card-elevated)",
                      border: "1px solid var(--border)",
                      cursor: "grab",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = column.color;
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px rgba(0,0,0,0.4)`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.transform = "";
                      (e.currentTarget as HTMLElement).style.boxShadow = "";
                    }}
                  >
                    {/* Priority pill */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={getPriorityClass(task.priority)}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {task.id}
                      </span>
                    </div>

                    {/* Title */}
                    <h4
                      className="text-sm font-semibold mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {task.title}
                    </h4>

                    {/* Description */}
                    <p
                      className="text-xs mb-3 line-clamp-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {task.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      {/* Assignee */}
                      <div
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <User className="w-3 h-3" />
                        <span>{task.assigneeEmoji}</span>
                        <span>{task.assignee}</span>
                      </div>

                      {/* Department badge */}
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: "var(--accent-muted)",
                          color: "var(--accent)",
                        }}
                      >
                        {task.department}
                      </span>
                    </div>

                    {/* Dependencies */}
                    {task.dependencies && task.dependencies.length > 0 && (
                      <div
                        className="mt-2 pt-2 flex items-center gap-1 text-xs"
                        style={{
                          color: "var(--text-muted)",
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Depends on: {task.dependencies.join(", ")}</span>
                      </div>
                    )}

                    {/* Date */}
                    <div
                      className="mt-2 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Updated {formatDate(task.updatedAt)}
                    </div>
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div
                    className="text-center py-8 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { WeatherWidget } from "@/components/WeatherWidget";
import { Notepad } from "@/components/Notepad";
import {
  Activity,
  CheckCircle,
  XCircle,
  Calendar,
  Circle,
  Bot,
  MessageSquare,
  Users,
  Gamepad2,
  Brain,
  Puzzle,
  Zap,
  Server,
  Terminal,
  FolderKanban,
  Gauge,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { BRANDING, getAgentDisplayName } from "@/config/branding";

interface Stats {
  total: number;
  today: number;
  success: number;
  error: number;
  byType: Record<string, number>;
}

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  model: string;
  status: "online" | "offline";
  lastActivity?: string;
  botToken?: string;
}

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
}

interface Department {
  id: string;
  name: string;
  agentName: string;
  agentEmoji: string;
  agentColor: string;
  taskCount: number;
  activeTasks: number;
  completionRate: number;
}

interface ProjectSummary {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  completionRate: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, success: 0, error: 0, byType: {} });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/activities/stats").then(r => r.json()),
      fetch("/api/agents").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/departments").then(r => r.json()),
    ]).then(([actStats, agentsData, projectsData, deptsData]) => {
      setStats({
        total: actStats.total || 0,
        today: actStats.today || 0,
        success: actStats.byStatus?.success || 0,
        error: actStats.byStatus?.error || 0,
        byType: actStats.byType || {},
      });
      setAgents(agentsData.agents || []);
      setProjects(projectsData.projects || []);
      setProjectSummary(projectsData.summary || null);
      setDepartments(deptsData.departments || []);
    }).catch(console.error);
  }, []);

  const activeProjects = projects.filter(p => p.status === 'active');

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 
          className="text-2xl md:text-3xl font-bold mb-1"
          style={{ 
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-primary)',
            letterSpacing: '-1.5px'
          }}
        >
          {BRANDING.agentEmoji} {BRANDING.appTitle}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Overview of {BRANDING.companyName} agent activity
        </p>
      </div>

      {/* Quick Stats - Project focused */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4 md:mb-6">
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            title="Active Projects"
            value={projectSummary?.activeProjects?.toString() || "0"}
            icon={<FolderKanban className="w-5 h-5" />}
            iconColor="var(--accent)"
          />
          <StatsCard
            title="Tasks In Progress"
            value={projectSummary?.inProgressTasks?.toString() || "0"}
            icon={<Zap className="w-5 h-5" />}
            iconColor="var(--warning)"
          />
          <StatsCard
            title="Tasks Completed"
            value={projectSummary?.completedTasks?.toString() || "0"}
            icon={<CheckCircle className="w-5 h-5" />}
            iconColor="var(--success)"
          />
          <StatsCard
            title="Blocked Tasks"
            value={projectSummary?.blockedTasks?.toString() || "0"}
            icon={<AlertTriangle className="w-5 h-5" />}
            iconColor="var(--error)"
          />
        </div>

        {/* Weather Widget */}
        <div className="lg:col-span-1">
          <WeatherWidget />
        </div>
      </div>

      {/* Projects Overview */}
      <div 
        className="mb-6 rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        <div 
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="accent-line" />
            <h2 
              className="text-base font-semibold"
              style={{ 
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-primary)'
              }}
            >
              <Gauge className="inline-block w-5 h-5 mr-2 mb-1" />
              Active Projects
            </h2>
          </div>
          <Link
            href="/projects"
            className="text-sm font-medium"
            style={{ color: 'var(--accent)' }}
          >
            View all →
          </Link>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map((project) => (
              <div
                key={project.id}
                className="p-4 rounded-lg transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: 'var(--card-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 
                    className="font-semibold"
                    style={{ 
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {project.name}
                  </h3>
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: project.status === 'active' ? 'var(--success-bg)' : 'var(--neutral-soft)',
                      color: project.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
                    }}
                  >
                    {project.status}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Progress</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{project.progress}%</span>
                  </div>
                  <div 
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--border)' }}
                  >
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${project.progress}%`,
                        backgroundColor: project.progress >= 80 ? 'var(--success)' : project.progress >= 50 ? 'var(--warning)' : 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
                
                {/* Task counts */}
                <div className="flex items-center gap-3 text-xs">
                  <span style={{ color: 'var(--success)' }}>
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    {project.tasksCount.completed}
                  </span>
                  <span style={{ color: 'var(--warning)' }}>
                    <Zap className="w-3 h-3 inline mr-1" />
                    {project.tasksCount.inProgress}
                  </span>
                  <span style={{ color: 'var(--error)' }}>
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    {project.tasksCount.blocked}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Status Summary */}
      <div 
        className="mb-6 rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        <div 
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="accent-line" />
            <h2 
              className="text-base font-semibold"
              style={{ 
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-primary)'
              }}
            >
              <Users className="inline-block w-5 h-5 mr-2 mb-1" />
              Department Status
            </h2>
          </div>
          <Link
            href="/departments"
            className="text-sm font-medium"
            style={{ color: 'var(--accent)' }}
          >
            View all →
          </Link>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-3 rounded-lg text-center transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--card-elevated)',
                  border: `1px solid ${dept.agentColor}40`,
                }}
              >
                <div className="text-2xl mb-1">{dept.agentEmoji}</div>
                <div 
                  className="text-sm font-semibold mb-1"
                  style={{ 
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {dept.name}
                </div>
                <div 
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {dept.activeTasks} active
                </div>
                <div 
                  className="text-xs mt-1 font-medium"
                  style={{ color: dept.agentColor }}
                >
                  {dept.completionRate}% done
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Activity Feed */}
        <div 
          className="lg:col-span-2 rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <div 
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="accent-line" />
              <h2 
                className="text-base font-semibold"
                style={{ 
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-primary)'
                }}
              >
                Recent Activity
              </h2>
            </div>
            <a
              href="/activity"
              className="text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              View all →
            </a>
          </div>
          <div className="p-0">
            <ActivityFeed limit={5} />
          </div>
        </div>

        {/* Quick Links */}
        <div 
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <div 
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="accent-line" />
              <h2 
                className="text-base font-semibold"
                style={{ 
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-primary)'
                }}
              >
                Quick Links
              </h2>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            {[
              { href: "/departments", icon: Users, label: "Departments", color: "#8B5CF6" },
              { href: "/tasks", icon: Zap, label: "Tasks", color: "var(--accent)" },
              { href: "/agents", icon: Bot, label: "Agents", color: "#10B981" },
              { href: "/logs", icon: Terminal, label: "Live Logs", color: "#60a5fa" },
              { href: "/memory", icon: Brain, label: "Memory", color: "#f59e0b" },
              { href: "/skills", icon: Puzzle, label: "Skills", color: "#4ade80" },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link
                key={href}
                href={href}
                className="p-3 rounded-lg transition-all hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--card-elevated)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Notepad */}
          <div style={{ margin: "1rem", marginTop: "0.5rem" }}>
            <Notepad />
          </div>
        </div>
      </div>
    </div>
  );
}

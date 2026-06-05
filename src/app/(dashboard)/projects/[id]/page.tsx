"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProjectTaskBoard } from "@/components/ProjectTaskBoard";
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  AlertTriangle,
  Zap,
  Send,
  ChevronRight,
  Target,
  Users,
  ListTodo,
  Calendar,
  BookOpen,
} from "lucide-react";

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

interface RelatedProject {
  id: string;
  name: string;
  status: string;
  progress: number;
}

const AGENTS = [
  { id: "main", name: "Yoda", emoji: "🧙", dept: "Command" },
  { id: "foreman", name: "R2", emoji: "🤖", dept: "Project Planning" },
  { id: "research", name: "3CP0", emoji: "🔍", dept: "Research" },
  { id: "architect", name: "Akbar", emoji: "📐", dept: "Architecture" },
  { id: "build", name: "Luke", emoji: "🔨", dept: "Build" },
  { id: "design", name: "Leia", emoji: "🎨", dept: "Design" },
  { id: "qa", name: "Han", emoji: "🎯", dept: "QA" },
  { id: "growth", name: "Lando", emoji: "📈", dept: "Growth" },
  { id: "reporter", name: "Chewy", emoji: "📊", dept: "Reporting" },
  { id: "macgyver", name: "MacGyver", emoji: "🛠️", dept: "Utilities" },
];

function getRecommendedTasks(project: Project): Array<{ label: string; prompt: string; agentId: string }> {
  const tasks: Array<{ label: string; prompt: string; agentId: string }> = [];

  if (project.tasksCount.blocked > 0) {
    tasks.push({
      label: `Resolve ${project.tasksCount.blocked} blocked task${project.tasksCount.blocked > 1 ? "s" : ""}`,
      prompt: `Investigate and resolve the blocked tasks in the "${project.name}" project. Identify root causes and propose solutions or workarounds.`,
      agentId: "foreman",
    });
  }

  const nextMilestone = project.milestones.find((m) => !m.completed);
  if (nextMilestone) {
    tasks.push({
      label: `Work on: ${nextMilestone.name}`,
      prompt: `Continue work on milestone "${nextMilestone.name}" for the "${project.name}" project. Review current progress and determine next concrete steps.`,
      agentId: "build",
    });
  }

  if (project.blockers && project.blockers.length > 0) {
    tasks.push({
      label: "Investigate blockers",
      prompt: `For the "${project.name}" project, investigate the following blockers and propose solutions:\n${project.blockers.map((b) => `- ${b}`).join("\n")}`,
      agentId: "research",
    });
  }

  tasks.push({
    label: "Generate status report",
    prompt: `Generate a detailed status report for the "${project.name}" project. Include: current progress (${project.progress}%), completed milestones, active work, blockers, and recommended next actions.`,
    agentId: "reporter",
  });

  tasks.push({
    label: "Run QA check",
    prompt: `Run a QA review of the current state of "${project.name}". Check for issues, regressions, missing tests, and quality concerns. Report findings.`,
    agentId: "qa",
  });

  if (project.progress < 50) {
    tasks.push({
      label: "Architecture review",
      prompt: `Review the architecture and technical approach for "${project.name}". Identify any design issues, scalability concerns, or opportunities to improve the approach before we go deeper.`,
      agentId: "architect",
    });
  }

  return tasks.slice(0, 5);
}

function statusColor(status: string) {
  if (status === "active") return "var(--positive)";
  if (status === "planning") return "var(--accent)";
  if (status === "blocked") return "var(--negative)";
  return "var(--text-muted)";
}

function statusBg(status: string) {
  if (status === "active") return "var(--positive-soft)";
  if (status === "planning") return "rgba(14,165,233,0.12)";
  if (status === "blocked") return "rgba(239,68,68,0.12)";
  return "var(--surface)";
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [related, setRelated] = useState<RelatedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("main");
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{ success: boolean; message: string } | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/projects/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setProject(data.project);
        setRelated(data.related || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleRecommendedClick = (task: { prompt: string; agentId: string }) => {
    setPrompt(task.prompt);
    setSelectedAgent(task.agentId);
    promptRef.current?.focus();
  };

  const handleDispatch = async () => {
    if (!prompt.trim() || !selectedAgent) return;
    setDispatching(true);
    setDispatchResult(null);
    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: prompt, agents: [selectedAgent], priority: "medium" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDispatchResult({ success: true, message: `Dispatched to ${data.agents?.[0]?.name ?? selectedAgent} — ID: ${data.workflowId}` });
        setPrompt("");
      } else {
        setDispatchResult({ success: false, message: data.error || "Dispatch failed" });
      }
    } catch {
      setDispatchResult({ success: false, message: "Network error" });
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8" style={{ color: "var(--text-muted)" }}>
        Loading project…
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="p-8">
        <p style={{ color: "var(--text-muted)" }}>Project not found.</p>
        <Link href="/" style={{ color: "var(--accent)", fontSize: "14px" }}>← Back to dashboard</Link>
      </div>
    );
  }

  const recommended = getRecommendedTasks(project);
  const completedMilestones = project.milestones.filter((m) => m.completed).length;
  const deptEntries = Object.entries(project.departments).filter(([, v]) => v > 0);

  return (
    <div className="p-4 md:p-6" style={{ maxWidth: "1200px" }}>
      {/* Back nav */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        {project.clientId && (
          <>
            <ChevronRight className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
            <Link
              href={`/clients/${project.clientId}`}
              className="text-sm"
              style={{ color: "var(--accent)" }}
            >
              {project.clientId}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
        <span className="text-sm" style={{ color: "var(--text-primary)" }}>{project.name}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", letterSpacing: "-1px" }}
          >
            {project.name}
          </h1>
          {project.description && (
            <p className="text-sm max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              {project.description}
            </p>
          )}
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex-shrink-0"
          style={{
            backgroundColor: statusBg(project.status),
            color: statusColor(project.status),
            border: `1px solid ${statusColor(project.status)}40`,
          }}
        >
          {project.status}
        </span>
      </div>

      {/* Top row: progress + milestones + task counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Progress */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Progress</span>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span
              className="text-3xl font-bold tabular-nums"
              style={{
                fontFamily: "var(--font-heading)",
                color: project.progress >= 80 ? "var(--positive)" : project.progress >= 50 ? "var(--warning)" : "var(--accent)",
              }}
            >
              {project.progress}%
            </span>
            <span className="text-xs pb-1" style={{ color: "var(--text-muted)" }}>complete</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${project.progress}%`,
                background: project.progress >= 80
                  ? "linear-gradient(90deg,#22C55E,#4ADE80)"
                  : project.progress >= 50
                  ? "linear-gradient(90deg,#F59E0B,#FFC233)"
                  : "linear-gradient(90deg,#0EA5E9,#38BDF8)",
                transition: "width 0.6s ease",
              }}
            />
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
            <Calendar className="w-3 h-3" />
            <span>Target: {new Date(project.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>

        {/* Milestones */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Milestones</span>
            </div>
            <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              {completedMilestones}/{project.milestones.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {project.milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                {m.completed ? (
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--positive)" }} />
                ) : (
                  <Circle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--border-strong)" }} />
                )}
                <span
                  className="text-xs leading-tight"
                  style={{ color: m.completed ? "var(--text-muted)" : "var(--text-primary)", textDecoration: m.completed ? "line-through" : "none" }}
                >
                  {m.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Task counts */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Tasks</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Done", value: project.tasksCount.completed, color: "var(--positive)" },
              { label: "Active", value: project.tasksCount.inProgress, color: "var(--warning)" },
              { label: "Blocked", value: project.tasksCount.blocked, color: "var(--negative)" },
              { label: "Total", value: project.tasksCount.total, color: "var(--text-secondary)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-2 rounded-lg" style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)" }}>
                <div className="text-lg font-bold tabular-nums" style={{ color, fontFamily: "var(--font-heading)" }}>{value}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content: recommended tasks + prompt box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Recommended tasks */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
              Recommended Tasks
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Click to fill the prompt box</p>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {recommended.map((task, i) => {
              const agent = AGENTS.find((a) => a.id === task.agentId);
              return (
                <button
                  key={i}
                  onClick={() => handleRecommendedClick(task)}
                  className="w-full text-left p-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: "var(--card-elevated)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card-hover, var(--card-elevated))";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card-elevated)";
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{task.label}</span>
                    {agent && (
                      <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                        {agent.emoji} {agent.name}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt box */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
              Prompt an Agent
            </h2>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe a task for ${project.name}…`}
              rows={5}
              className="w-full resize-none rounded-lg p-3 text-sm"
              style={{
                backgroundColor: "var(--card-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                outline: "none",
                fontFamily: "var(--font-mono)",
                lineHeight: "1.5",
              }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "var(--border)"; }}
            />

            <div className="flex items-center gap-2">
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="flex-1 rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--card-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {AGENTS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.emoji} {a.name} — {a.dept}
                  </option>
                ))}
              </select>

              <button
                onClick={handleDispatch}
                disabled={!prompt.trim() || dispatching}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "#fff",
                  opacity: !prompt.trim() || dispatching ? 0.5 : 1,
                  cursor: !prompt.trim() || dispatching ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-heading)",
                  flexShrink: 0,
                }}
              >
                <Send className="w-4 h-4" />
                {dispatching ? "Sending…" : "Dispatch"}
              </button>
            </div>

            {dispatchResult && (
              <div
                className="px-3 py-2 rounded-lg text-xs"
                style={{
                  backgroundColor: dispatchResult.success ? "var(--positive-soft)" : "rgba(239,68,68,0.12)",
                  color: dispatchResult.success ? "var(--positive)" : "var(--negative)",
                  border: `1px solid ${dispatchResult.success ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}
              >
                {dispatchResult.success ? "✓ " : "✗ "}{dispatchResult.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: recent work + blockers + departments + related */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent work */}
        {project.recentWork && project.recentWork.length > 0 && (
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
              Recent Work
            </h3>
            <div className="flex flex-col gap-2">
              {project.recentWork.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--positive)" }} />
                  <span className="text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blockers */}
        {project.blockers && project.blockers.length > 0 && (
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--negative)" }}>
              Active Blockers
            </h3>
            <div className="flex flex-col gap-2">
              {project.blockers.map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--negative)" }} />
                  <span className="text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Department breakdown */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Department Breakdown
            </h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {deptEntries.sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between gap-2">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{dept}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${Math.round((count / Math.max(...deptEntries.map(([, v]) => v))) * 60)}px`,
                      backgroundColor: "var(--accent)",
                      opacity: 0.6,
                    }}
                  />
                  <span className="text-xs tabular-nums font-semibold w-4 text-right" style={{ color: "var(--text-primary)" }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-project task board */}
      <div
        className="mt-4 rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <ListTodo className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <h2
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
          >
            Project Tasks
          </h2>
          <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>
            — add, track, and dispatch work items
          </span>
        </div>
        <div className="p-4">
          <ProjectTaskBoard projectId={project.id} projectName={project.name} />
        </div>
      </div>

      {/* Related projects (same client) */}
      {related.length > 0 && (
        <div className="mt-4">
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                Related Projects
              </h3>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {related.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/projects/${rp.id}`}
                  className="p-3 rounded-lg block transition-all"
                  style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)", textDecoration: "none" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{rp.name}</span>
                    <span className="text-xs" style={{ color: statusColor(rp.status) }}>{rp.status}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${rp.progress}%`, backgroundColor: "var(--accent)", opacity: 0.7 }}
                    />
                  </div>
                  <span className="text-xs mt-1 block" style={{ color: "var(--text-muted)" }}>{rp.progress}%</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

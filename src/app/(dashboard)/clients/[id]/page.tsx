"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Zap,
  Send,
  ExternalLink,
  FolderKanban,
  ChevronRight,
} from "lucide-react";

interface Client {
  id: string;
  slug: string;
  name: string;
  status: string;
  industry?: string;
  contactEmail?: string;
  branding?: { primaryColor?: string; logoUrl?: string };
  platforms?: string[];
}

interface Project {
  id: string;
  name: string;
  clientId: string | null;
  description?: string;
  status: string;
  progress: number;
  milestones: Array<{ id: string; name: string; completed: boolean }>;
  tasksCount: { total: number; completed: number; inProgress: number; blocked: number };
  blockers?: string[];
  recentWork?: string[];
  targetDate: string;
}

const AGENTS = [
  { id: "main", name: "Yoda", emoji: "🧙", dept: "Command" },
  { id: "foreman", name: "R2", emoji: "🤖", dept: "Project Planning" },
  { id: "research", name: "3CP0", emoji: "🔍", dept: "Research" },
  { id: "build", name: "Luke", emoji: "🔨", dept: "Build" },
  { id: "design", name: "Leia", emoji: "🎨", dept: "Design" },
  { id: "qa", name: "Han", emoji: "🎯", dept: "QA" },
  { id: "growth", name: "Lando", emoji: "📈", dept: "Growth" },
  { id: "reporter", name: "Chewy", emoji: "📊", dept: "Reporting" },
];

const INDUSTRY_LABELS: Record<string, string> = {
  "pest-control": "Pest Control",
  restaurant: "Restaurant",
  retail: "Retail",
  healthcare: "Healthcare",
  automotive: "Automotive",
  "professional-services": "Professional Services",
  roofing: "Roofing",
  construction: "Construction",
  other: "Other",
};

function statusColor(status: string) {
  if (status === "active") return "var(--positive)";
  if (status === "planning") return "var(--accent)";
  if (status === "blocked") return "var(--negative)";
  return "var(--text-muted)";
}

function progressColor(pct: number) {
  if (pct >= 80) return "linear-gradient(90deg,#22C55E,#4ADE80)";
  if (pct >= 50) return "linear-gradient(90deg,#F59E0B,#FFC233)";
  return "linear-gradient(90deg,#0EA5E9,#38BDF8)";
}

function getClientRecommendations(client: Client, projects: Project[]): Array<{ label: string; prompt: string; agentId: string }> {
  const tasks: Array<{ label: string; prompt: string; agentId: string }> = [];
  const totalBlocked = projects.reduce((s, p) => s + p.tasksCount.blocked, 0);
  const activeProjects = projects.filter((p) => p.status === "active");

  if (totalBlocked > 0) {
    tasks.push({
      label: `Resolve ${totalBlocked} blocked task${totalBlocked > 1 ? "s" : ""} across projects`,
      prompt: `For client "${client.name}", investigate all blocked tasks across their projects and propose resolutions. Projects: ${projects.map((p) => p.name).join(", ")}.`,
      agentId: "foreman",
    });
  }

  tasks.push({
    label: `Generate ${client.name} status summary`,
    prompt: `Generate a comprehensive status report for client "${client.name}". Cover all active projects (${activeProjects.map((p) => p.name).join(", ")}), recent progress, blockers, and recommended next actions.`,
    agentId: "reporter",
  });

  if (activeProjects.length > 0) {
    const lowest = activeProjects.sort((a, b) => a.progress - b.progress)[0];
    tasks.push({
      label: `Advance "${lowest.name}" (${lowest.progress}% complete)`,
      prompt: `The "${lowest.name}" project for ${client.name} is at ${lowest.progress}% progress. Review the current state and determine the highest-impact next steps to move it forward.`,
      agentId: "build",
    });
  }

  tasks.push({
    label: `Review QA status for all ${client.name} projects`,
    prompt: `Run a QA review across all "${client.name}" projects (${projects.map((p) => p.name).join(", ")}). Identify quality issues, missing tests, or areas needing attention.`,
    agentId: "qa",
  });

  return tasks.slice(0, 4);
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("main");
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{ success: boolean; message: string } | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!idParam) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/clients/${idParam}`).then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      }),
      fetch("/api/projects").then((r) => r.json()),
    ])
      .then(([clientData, projectsData]) => {
        if (!clientData) return;
        setClient(clientData);
        const allProjects: Project[] = projectsData?.projects ?? [];
        // Match by clientId === client slug or id
        const clientId = clientData.slug ?? idParam;
        setProjects(allProjects.filter((p) => p.clientId === clientId || p.clientId === idParam));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [idParam]);

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
    return <div className="p-8" style={{ color: "var(--text-muted)" }}>Loading client…</div>;
  }

  if (notFound || !client) {
    return (
      <div className="p-8">
        <p style={{ color: "var(--text-muted)" }}>Client not found.</p>
        <Link href="/clients" style={{ color: "var(--accent)", fontSize: "14px" }}>← Back to clients</Link>
      </div>
    );
  }

  const accentColor = client.branding?.primaryColor ?? "var(--accent)";
  const industryLabel = INDUSTRY_LABELS[client.industry ?? "other"] ?? client.industry ?? "Client";
  const recommendations = getClientRecommendations(client, projects);
  const totalTasks = projects.reduce((s, p) => s + p.tasksCount.total, 0);
  const doneTasks = projects.reduce((s, p) => s + p.tasksCount.completed, 0);
  const activeTasks = projects.reduce((s, p) => s + p.tasksCount.inProgress, 0);
  const blockedTasks = projects.reduce((s, p) => s + p.tasksCount.blocked, 0);

  return (
    <div className="p-4 md:p-6" style={{ maxWidth: "1200px" }}>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
        >
          <ArrowLeft className="w-4 h-4" />
          Clients
        </button>
        <ChevronRight className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
        <span className="text-sm" style={{ color: "var(--text-primary)" }}>{client.name}</span>
      </div>

      {/* Header */}
      <div
        className="mb-6 rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="h-1" style={{ backgroundColor: accentColor }} />
        <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {client.branding?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.branding.logoUrl}
                alt=""
                style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", border: "1px solid var(--border)" }}
              />
            ) : (
              <div
                style={{
                  width: 52, height: 52, borderRadius: 10,
                  backgroundColor: accentColor + "22",
                  color: accentColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 800,
                  border: `1px solid ${accentColor}33`,
                  flexShrink: 0,
                }}
              >
                {client.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
            )}
            <div>
              <h1
                className="text-xl font-bold mb-1"
                style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", letterSpacing: "-0.5px" }}
              >
                {client.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-semibold uppercase px-2 py-0.5 rounded"
                  style={{ color: accentColor, backgroundColor: accentColor + "18" }}
                >
                  {industryLabel}
                </span>
                {client.contactEmail && (
                  <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {client.contactEmail}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex items-center gap-4">
            {[
              { label: "Projects", value: projects.length, color: "var(--accent)" },
              { label: "Done", value: doneTasks, color: "var(--positive)" },
              { label: "Active", value: activeTasks, color: "var(--warning)" },
              { label: "Blocked", value: blockedTasks, color: blockedTasks > 0 ? "var(--negative)" : "var(--text-muted)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className="text-lg font-bold tabular-nums" style={{ color, fontFamily: "var(--font-heading)" }}>{value}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
              </div>
            ))}
            {client.slug && (
              <Link
                href={`/social?client=${client.slug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)", textDecoration: "none" }}
              >
                <ExternalLink className="w-3 h-3" />
                Social
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Projects list */}
      <div
        className="mb-4 rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
              {client.name} Projects
            </h2>
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {projects.length} project{projects.length !== 1 ? "s" : ""}
            {totalTasks > 0 && ` · ${totalTasks} tasks total`}
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)", fontSize: 14 }}>
            No projects linked to this client yet.
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => {
              const completedMs = project.milestones.filter((m) => m.completed).length;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="p-4 rounded-xl transition-all"
                    style={{
                      backgroundColor: "var(--card-elevated)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = accentColor;
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-accent)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.transform = "";
                      (e.currentTarget as HTMLElement).style.boxShadow = "";
                    }}
                  >
                    {/* Project header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3
                        className="font-semibold text-sm leading-tight"
                        style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
                      >
                        {project.name}
                      </h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: project.status === "active" ? "var(--positive-soft)" : "var(--surface)",
                          color: statusColor(project.status),
                          border: `1px solid ${statusColor(project.status)}40`,
                        }}
                      >
                        {project.status}
                      </span>
                    </div>

                    {project.description && (
                      <p className="text-xs mb-3 leading-snug" style={{ color: "var(--text-muted)" }}>
                        {project.description.length > 100 ? project.description.slice(0, 100) + "…" : project.description}
                      </p>
                    )}

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Progress · {completedMs}/{project.milestones.length} milestones
                        </span>
                        <span
                          className="text-xs font-bold tabular-nums"
                          style={{ color: project.progress >= 80 ? "var(--positive)" : project.progress >= 50 ? "var(--warning)" : "var(--accent)" }}
                        >
                          {project.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${project.progress}%`, background: progressColor(project.progress) }}
                        />
                      </div>
                    </div>

                    {/* Task counts */}
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1" style={{ color: "var(--positive)" }}>
                        <CheckCircle className="w-3 h-3" />
                        <span className="font-semibold">{project.tasksCount.completed}</span>
                        <span style={{ color: "var(--text-muted)" }}>done</span>
                      </span>
                      <span className="flex items-center gap-1" style={{ color: "var(--warning)" }}>
                        <Zap className="w-3 h-3" />
                        <span className="font-semibold">{project.tasksCount.inProgress}</span>
                        <span style={{ color: "var(--text-muted)" }}>active</span>
                      </span>
                      {project.tasksCount.blocked > 0 && (
                        <span className="flex items-center gap-1" style={{ color: "var(--negative)" }}>
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-semibold">{project.tasksCount.blocked}</span>
                          <span style={{ color: "var(--text-muted)" }}>blocked</span>
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-1" style={{ color: "var(--accent)" }}>
                        <span>Open →</span>
                      </span>
                    </div>

                    {/* Blockers */}
                    {project.blockers && project.blockers.length > 0 && (
                      <div
                        className="mt-3 px-2 py-1.5 rounded text-xs"
                        style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--negative)" }}
                      >
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        {project.blockers[0]}
                        {project.blockers.length > 1 && ` (+${project.blockers.length - 1} more)`}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom row: recommended tasks + prompt box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recommended tasks */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
              Recommended Actions
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Click to fill the prompt box</p>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {recommendations.map((task, i) => {
              const agent = AGENTS.find((a) => a.id === task.agentId);
              return (
                <button
                  key={i}
                  onClick={() => {
                    setPrompt(task.prompt);
                    setSelectedAgent(task.agentId);
                    promptRef.current?.focus();
                  }}
                  className="w-full text-left p-3 rounded-lg transition-all"
                  style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = accentColor; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
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
              placeholder={`Describe a task for ${client.name}…`}
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
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = accentColor; }}
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: accentColor,
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
    </div>
  );
}

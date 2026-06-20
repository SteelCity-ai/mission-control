"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, CheckCircle, Loader2, AlertCircle, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";

interface WorkflowItem {
  id: string;
  task: string;
  agents: string[];
  priority: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface AgentInfo {
  id: string;
  name: string;
  emoji: string;
  department: string;
}

const AGENT_MAP: Record<string, { name: string; emoji: string }> = {
  main:      { name: "Yoda",     emoji: "🧙" },
  foreman:   { name: "R2",       emoji: "🤖" },
  research:  { name: "3CP0",     emoji: "🔍" },
  architect: { name: "Akbar",    emoji: "📐" },
  build:     { name: "Luke",     emoji: "🔨" },
  design:    { name: "Leia",     emoji: "🎨" },
  qa:        { name: "Han",      emoji: "🎯" },
  growth:    { name: "Lando",    emoji: "📈" },
  reporter:  { name: "Chewy",    emoji: "📊" },
  "pm-sync": { name: "OBWON",   emoji: "📋" },
  macgyver:  { name: "MacGyver", emoji: "🛠️" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function statusIcon(status: string) {
  if (status === "completed") return <CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--positive)" }} />;
  if (status === "failed")    return <AlertCircle className="w-3.5 h-3.5" style={{ color: "var(--negative)" }} />;
  if (status === "running")   return <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--accent)" }} />;
  return <Clock className="w-3.5 h-3.5" style={{ color: "var(--warning)" }} />;
}

function statusLabel(status: string) {
  if (status === "completed") return { text: "Done",    color: "var(--positive)" };
  if (status === "failed")    return { text: "Failed",  color: "var(--negative)" };
  if (status === "running")   return { text: "Running", color: "var(--accent)" };
  return                             { text: "Pending", color: "var(--warning)" };
}

interface Props {
  limit?: number;
  refreshTrigger?: number;
  showHeader?: boolean;
}

export function ActiveWorkflows({ limit = 8, refreshTrigger = 0, showHeader = true }: Props) {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orchestrate");
      if (!res.ok) return;
      const data = await res.json();
      // Merge active + queue, deduplicate by id, sort newest first
      const all: WorkflowItem[] = [...(data.active ?? []), ...(data.queue ?? [])];
      const seen = new Set<string>();
      const deduped = all.filter((w) => {
        if (seen.has(w.id)) return false;
        seen.add(w.id);
        return true;
      });
      deduped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setWorkflows(deduped.slice(0, limit));
      setLastRefresh(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  // Auto-refresh every 15s while there are pending/running workflows
  useEffect(() => {
    const hasPending = workflows.some((w) => w.status === "pending" || w.status === "running");
    if (!hasPending) return;
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [workflows, load]);

  if (loading) {
    return (
      <div className="p-4 text-xs" style={{ color: "var(--text-muted)" }}>
        Loading dispatches…
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="p-5 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        No dispatches yet. Use the Command bar above to send a task to an agent.
      </div>
    );
  }

  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Updated {timeAgo(lastRefresh.toISOString())}
          </span>
          <button
            onClick={load}
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--text-muted)", cursor: "pointer", background: "none", border: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      )}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {workflows.map((wf) => {
          const agentId = wf.agents?.[0] ?? "";
          const agent = AGENT_MAP[agentId];
          const sl = statusLabel(wf.status);
          return (
            <div
              key={wf.id}
              className="px-4 py-3 flex items-start gap-3"
              style={{ transition: "background 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card-elevated)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              {/* Status icon */}
              <div className="mt-0.5 flex-shrink-0">{statusIcon(wf.status)}</div>

              {/* Task content */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm leading-snug mb-1"
                  style={{
                    color: "var(--text-primary)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"],
                    overflow: "hidden",
                  }}
                >
                  {wf.task}
                </p>
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  {agent && (
                    <span style={{ color: "var(--text-muted)" }}>
                      {agent.emoji} {agent.name}
                    </span>
                  )}
                  <span style={{ color: sl.color, fontWeight: 600 }}>{sl.text}</span>
                  <span style={{ color: "var(--text-muted)" }}>{timeAgo(wf.createdAt)}</span>
                  <span
                    className="font-mono"
                    style={{ color: "var(--text-muted)", fontSize: "10px" }}
                  >
                    {wf.id.slice(0, 16)}
                  </span>
                </div>
              </div>

              {/* Priority badge */}
              {wf.priority && wf.priority !== "medium" && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    backgroundColor: wf.priority === "critical" || wf.priority === "high"
                      ? "rgba(239,68,68,0.12)" : "rgba(251,191,36,0.1)",
                    color: wf.priority === "critical" || wf.priority === "high"
                      ? "var(--negative)" : "var(--warning)",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {wf.priority}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {workflows.length >= limit && (
        <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
          <Link
            href="/workflows"
            className="text-xs"
            style={{ color: "var(--accent)" }}
          >
            View all dispatches →
          </Link>
        </div>
      )}
    </div>
  );
}

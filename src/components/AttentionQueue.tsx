"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, TrendingDown, XCircle, ArrowRight, RefreshCw } from "lucide-react";

interface AttentionItem {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  title: string;
  detail: string;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  action: string;
  actionUrl: string;
}

const SEVERITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)" },
  high:     { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
  medium:   { color: "#0EA5E9", bg: "rgba(14,165,233,0.06)", border: "rgba(14,165,233,0.2)" },
  low:      { color: "var(--text-muted)", bg: "transparent",  border: "var(--border)" },
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  blocker:      <XCircle className="w-3.5 h-3.5" />,
  "at-risk":    <TrendingDown className="w-3.5 h-3.5" />,
  stalled:      <Clock className="w-3.5 h-3.5" />,
  overdue:      <AlertTriangle className="w-3.5 h-3.5" />,
  "needs-review": <AlertTriangle className="w-3.5 h-3.5" />,
  "no-tasks":   <Clock className="w-3.5 h-3.5" />,
};

interface Props {
  limit?: number;
  compact?: boolean;
}

export function AttentionQueue({ limit = 6, compact = false }: Props) {
  const [items, setItems] = useState<AttentionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [critical, setCritical] = useState(0);

  const load = async () => {
    try {
      const res = await fetch("/api/attention");
      if (!res.ok) return;
      const data = await res.json();
      setItems((data.items ?? []).slice(0, limit));
      setCritical(data.critical ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-4 text-xs" style={{ color: "var(--text-muted)" }}>
        Scanning for issues…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-5 text-center">
        <div className="text-2xl mb-2">✓</div>
        <p className="text-sm font-medium" style={{ color: "var(--positive)" }}>All clear</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>No attention items right now.</p>
      </div>
    );
  }

  return (
    <div>
      {!compact && critical > 0 && (
        <div
          className="px-4 py-2 flex items-center gap-2 text-xs font-semibold"
          style={{ backgroundColor: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {critical} critical item{critical > 1 ? "s" : ""} need immediate attention
        </div>
      )}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {items.map((item) => {
          const style = SEVERITY_STYLE[item.severity] ?? SEVERITY_STYLE.low;
          const icon = TYPE_ICON[item.type] ?? <AlertTriangle className="w-3.5 h-3.5" />;
          return (
            <div
              key={item.id}
              className="px-4 py-3 flex items-start gap-3"
              style={{ borderLeft: `3px solid ${style.color}` }}
            >
              <span className="mt-0.5 flex-shrink-0" style={{ color: style.color }}>
                {icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug" style={{ color: "var(--text-primary)" }}>
                  {item.title}
                </p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--text-muted)" }}>
                  {item.detail}
                </p>
              </div>
              <Link
                href={item.actionUrl}
                className="flex items-center gap-1 text-xs font-semibold flex-shrink-0 px-2.5 py-1 rounded-lg transition-colors"
                style={{
                  backgroundColor: style.bg,
                  color: style.color,
                  border: `1px solid ${style.border}`,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                {item.action}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          );
        })}
      </div>
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {items.length} item{items.length !== 1 ? "s" : ""} need attention
        </span>
        <button
          onClick={load}
          className="flex items-center gap-1 text-xs"
          style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>
    </div>
  );
}

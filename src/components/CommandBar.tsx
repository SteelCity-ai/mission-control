"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ChevronDown } from "lucide-react";

const AGENTS = [
  { id: "main",      name: "Yoda",    emoji: "🧙", dept: "Command" },
  { id: "foreman",   name: "R2",      emoji: "🤖", dept: "Project Planning" },
  { id: "research",  name: "3CP0",    emoji: "🔍", dept: "Research" },
  { id: "architect", name: "Akbar",   emoji: "📐", dept: "Architecture" },
  { id: "build",     name: "Luke",    emoji: "🔨", dept: "Build" },
  { id: "design",    name: "Leia",    emoji: "🎨", dept: "Design" },
  { id: "qa",        name: "Han",     emoji: "🎯", dept: "QA" },
  { id: "growth",    name: "Lando",   emoji: "📈", dept: "Growth" },
  { id: "reporter",  name: "Chewy",   emoji: "📊", dept: "Reporting" },
  { id: "macgyver",  name: "MacGyver",emoji: "🛠️", dept: "Utilities" },
];

interface CommandBarProps {
  onDispatched?: (workflowId: string, task: string, agent: string) => void;
  placeholder?: string;
  compact?: boolean;
}

export function CommandBar({ onDispatched, placeholder, compact = false }: CommandBarProps) {
  const [task, setTask] = useState("");
  const [agentId, setAgentId] = useState("main");
  const [dispatching, setDispatching] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showAgents, setShowAgents] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedAgent = AGENTS.find((a) => a.id === agentId) ?? AGENTS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAgents(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const dispatch = async () => {
    if (!task.trim() || dispatching) return;
    setDispatching(true);
    setResult(null);
    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.trim(), agents: [agentId], priority: "medium" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ success: true, message: `✓ Dispatched to ${selectedAgent.name} — ${data.workflowId}` });
        onDispatched?.(data.workflowId, task.trim(), agentId);
        setTask("");
        setTimeout(() => setResult(null), 4000);
      } else {
        setResult({ success: false, message: data.error ?? "Dispatch failed" });
      }
    } catch {
      setResult({ success: false, message: "Network error" });
    } finally {
      setDispatching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      dispatch();
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      {!compact && (
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)", fontFamily: "var(--font-heading)" }}
          >
            ⚡ Command
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            ⌘ Enter to dispatch
          </span>
        </div>
      )}
      <div className={compact ? "p-3" : "p-4"}>
        <textarea
          ref={textareaRef}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Dispatch a task to any agent… (⌘ Enter to send)"}
          rows={compact ? 2 : 3}
          className="w-full resize-none rounded-lg p-3 text-sm"
          style={{
            backgroundColor: "var(--card-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            outline: "none",
            fontFamily: "var(--font-mono)",
            lineHeight: "1.5",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--accent)"; }}
          onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "var(--border)"; }}
        />

        <div className="flex items-center gap-2 mt-2">
          {/* Agent picker */}
          <div ref={dropdownRef} className="relative flex-1">
            <button
              onClick={() => setShowAgents((s) => !s)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: "var(--card-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              <span>{selectedAgent.emoji} {selectedAgent.name} — {selectedAgent.dept}</span>
              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
            </button>
            {showAgents && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-50"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                {AGENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setAgentId(a.id); setShowAgents(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                    style={{
                      backgroundColor: a.id === agentId ? "var(--card-elevated)" : "transparent",
                      color: a.id === agentId ? "var(--accent)" : "var(--text-primary)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--card-elevated)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = a.id === agentId ? "var(--card-elevated)" : "transparent"; }}
                  >
                    <span>{a.emoji}</span>
                    <span className="font-medium">{a.name}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>— {a.dept}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={dispatch}
            disabled={!task.trim() || dispatching}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0"
            style={{
              backgroundColor: "var(--accent)",
              color: "#fff",
              opacity: !task.trim() || dispatching ? 0.45 : 1,
              cursor: !task.trim() || dispatching ? "not-allowed" : "pointer",
              fontFamily: "var(--font-heading)",
              transition: "opacity 0.15s",
            }}
          >
            <Send className="w-4 h-4" />
            {dispatching ? "Sending…" : "Dispatch"}
          </button>
        </div>

        {result && (
          <div
            className="mt-2 px-3 py-2 rounded-lg text-xs"
            style={{
              backgroundColor: result.success ? "var(--positive-soft)" : "rgba(239,68,68,0.1)",
              color: result.success ? "var(--positive)" : "var(--negative)",
              border: `1px solid ${result.success ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              fontFamily: "var(--font-mono)",
            }}
          >
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Check, Trash2, ChevronDown, AlertTriangle, Zap, Clock, Send } from "lucide-react";

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  notes: string;
  status: "todo" | "doing" | "done" | "blocked";
  assigneeId: string;
  assigneeName: string;
  assigneeEmoji: string;
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const AGENTS = [
  { id: "main",      name: "Yoda",     emoji: "🧙" },
  { id: "foreman",   name: "R2",       emoji: "🤖" },
  { id: "research",  name: "3CP0",     emoji: "🔍" },
  { id: "architect", name: "Akbar",    emoji: "📐" },
  { id: "build",     name: "Luke",     emoji: "🔨" },
  { id: "design",    name: "Leia",     emoji: "🎨" },
  { id: "qa",        name: "Han",      emoji: "🎯" },
  { id: "growth",    name: "Lando",    emoji: "📈" },
  { id: "reporter",  name: "Chewy",    emoji: "📊" },
  { id: "macgyver",  name: "MacGyver", emoji: "🛠️" },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  todo:    { label: "To Do",   color: "var(--text-muted)",   bg: "var(--surface)",        icon: <Clock className="w-3 h-3" /> },
  doing:   { label: "Doing",   color: "var(--warning)",      bg: "rgba(245,158,11,0.1)",  icon: <Zap className="w-3 h-3" /> },
  blocked: { label: "Blocked", color: "var(--negative)",     bg: "rgba(239,68,68,0.1)",   icon: <AlertTriangle className="w-3 h-3" /> },
  done:    { label: "Done",    color: "var(--positive)",     bg: "var(--positive-soft)",  icon: <Check className="w-3 h-3" /> },
};

const PRIORITY_COLORS: Record<string, string> = {
  low:      "var(--text-muted)",
  medium:   "var(--accent)",
  high:     "var(--warning)",
  critical: "var(--negative)",
};

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  projectId: string;
  projectName: string;
}

export function ProjectTaskBoard({ projectId, projectName }: Props) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newAgent, setNewAgent] = useState("main");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Dispatch state
  const [dispatching, setDispatching] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  useEffect(() => {
    if (showAdd) setTimeout(() => titleRef.current?.focus(), 50);
  }, [showAdd]);

  const addTask = async () => {
    if (!newTitle.trim() || saving) return;
    setSaving(true);
    const agent = AGENTS.find((a) => a.id === newAgent) ?? AGENTS[0];
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          notes: newNotes.trim(),
          assigneeId: agent.id,
          assigneeName: agent.name,
          assigneeEmoji: agent.emoji,
          priority: newPriority,
          status: "todo",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => [...prev, data.task]);
        setNewTitle("");
        setNewNotes("");
        setNewAgent("main");
        setNewPriority("medium");
        setShowAdd(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<ProjectTask>) => {
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
    }
  };

  const deleteTask = async (taskId: string) => {
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const dispatchTask = async (task: ProjectTask) => {
    setDispatching(task.id);
    try {
      const prompt = task.notes
        ? `${task.title}\n\nContext: ${task.notes}`
        : task.title;
      await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: `[${projectName}] ${prompt}`,
          agents: [task.assigneeId],
          priority: task.priority,
        }),
      });
      await updateTask(task.id, { status: "doing" });
    } finally {
      setDispatching(null);
    }
  };

  const groups: Record<string, ProjectTask[]> = { todo: [], doing: [], blocked: [], done: [] };
  for (const t of tasks) groups[t.status]?.push(t);

  const activeTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");

  if (loading) return <div className="py-4 text-xs" style={{ color: "var(--text-muted)" }}>Loading tasks…</div>;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          {activeTasks.length > 0 && <span className="font-semibold" style={{ color: "var(--warning)" }}>{activeTasks.length} active</span>}
          {doneTasks.length > 0 && <span>{doneTasks.length} done</span>}
          {tasks.length === 0 && <span>No tasks yet</span>}
        </div>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            backgroundColor: showAdd ? "var(--accent)" : "var(--card-elevated)",
            border: "1px solid var(--border)",
            color: showAdd ? "#fff" : "var(--text-primary)",
            cursor: "pointer",
            fontFamily: "var(--font-heading)",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </button>
      </div>

      {/* Add task form */}
      {showAdd && (
        <div
          className="mb-4 rounded-xl p-4"
          style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--accent)", boxShadow: "0 0 0 1px var(--accent)" }}
        >
          <div className="flex flex-col gap-3">
            <input
              ref={titleRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addTask(); } }}
              placeholder="Task title…"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                outline: "none",
              }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "var(--border)"; }}
            />
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes / context (optional)…"
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                outline: "none",
                fontFamily: "var(--font-mono)",
              }}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={newAgent}
                onChange={(e) => setNewAgent(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none" }}
              >
                {AGENTS.map((a) => (
                  <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
                ))}
              </select>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as "low" | "medium" | "high" | "critical")}
                className="px-2 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <button
                onClick={() => { setShowAdd(false); setNewTitle(""); setNewNotes(""); }}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                disabled={!newTitle.trim() || saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  cursor: !newTitle.trim() || saving ? "not-allowed" : "pointer",
                  opacity: !newTitle.trim() || saving ? 0.5 : 1,
                  fontFamily: "var(--font-heading)",
                }}
              >
                <Plus className="w-3 h-3" />
                {saving ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task list */}
      {tasks.length === 0 && !showAdd && (
        <div className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No tasks yet — add one to start tracking work on this project.
        </div>
      )}

      {(["doing", "blocked", "todo", "done"] as const).map((status) => {
        const items = groups[status];
        if (items.length === 0) return null;
        const meta = STATUS_META[status];
        return (
          <div key={status} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: meta.color }}>{meta.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
                {meta.label}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>({items.length})</span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  expanded={expandedId === task.id}
                  onToggleExpand={() => setExpandedId(expandedId === task.id ? null : task.id)}
                  onUpdate={(updates) => updateTask(task.id, updates)}
                  onDelete={() => deleteTask(task.id)}
                  onDispatch={() => dispatchTask(task)}
                  dispatching={dispatching === task.id}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({
  task,
  expanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onDispatch,
  dispatching,
}: {
  task: ProjectTask;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (u: Partial<ProjectTask>) => void;
  onDelete: () => void;
  onDispatch: () => void;
  dispatching: boolean;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState(task.notes);
  const meta = STATUS_META[task.status];

  const cycleStatus = () => {
    const order: ProjectTask["status"][] = ["todo", "doing", "done", "blocked"];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    onUpdate({ status: next });
  };

  const saveNotes = () => {
    onUpdate({ notes: notesVal });
    setEditingNotes(false);
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: "var(--card-elevated)", border: `1px solid var(--border)` }}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ borderLeft: `3px solid ${meta.color}` }}
      >
        {/* Status cycle button */}
        <button
          onClick={cycleStatus}
          title={`Status: ${meta.label} — click to cycle`}
          className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors"
          style={{ backgroundColor: meta.bg, color: meta.color, border: "none", cursor: "pointer" }}
        >
          {meta.icon}
        </button>

        {/* Title */}
        <span
          className="flex-1 text-sm leading-snug min-w-0 cursor-pointer"
          style={{
            color: task.status === "done" ? "var(--text-muted)" : "var(--text-primary)",
            textDecoration: task.status === "done" ? "line-through" : "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          onClick={onToggleExpand}
        >
          {task.title}
        </span>

        {/* Agent */}
        <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }} title={task.assigneeName}>
          {task.assigneeEmoji}
        </span>

        {/* Priority dot */}
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
          title={`Priority: ${task.priority}`}
        />

        {/* Dispatch button */}
        {task.status !== "done" && (
          <button
            onClick={onDispatch}
            disabled={dispatching}
            title={`Dispatch to ${task.assigneeName}`}
            className="flex-shrink-0 p-1 rounded transition-opacity"
            style={{
              color: "var(--accent)",
              opacity: dispatching ? 0.5 : 0.7,
              background: "none",
              border: "none",
              cursor: dispatching ? "wait" : "pointer",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = dispatching ? "0.5" : "0.7"; }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Expand */}
        <button
          onClick={onToggleExpand}
          className="flex-shrink-0 p-0.5 rounded"
          style={{
            color: "var(--text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            transform: expanded ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="px-4 py-3 border-t"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          {/* Status + priority selectors */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <select
              value={task.status}
              onChange={(e) => onUpdate({ status: e.target.value as ProjectTask["status"] })}
              className="px-2 py-1 rounded text-xs"
              style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none" }}
            >
              <option value="todo">To Do</option>
              <option value="doing">Doing</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
            <select
              value={task.priority}
              onChange={(e) => onUpdate({ priority: e.target.value as ProjectTask["priority"] })}
              className="px-2 py-1 rounded text-xs"
              style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)", color: PRIORITY_COLORS[task.priority], outline: "none" }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={task.assigneeId}
              onChange={(e) => {
                const a = AGENTS.find((ag) => ag.id === e.target.value);
                if (a) onUpdate({ assigneeId: a.id, assigneeName: a.name, assigneeEmoji: a.emoji });
              }}
              className="px-2 py-1 rounded text-xs"
              style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none" }}
            >
              {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>)}
            </select>
            <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
              Updated {timeAgo(task.updatedAt)}
            </span>
            <button
              onClick={onDelete}
              className="p-1 rounded"
              title="Delete task"
              style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--negative)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Notes / agent output */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Notes / Agent Output
              </span>
              {!editingNotes && (
                <button
                  onClick={() => { setNotesVal(task.notes); setEditingNotes(true); }}
                  className="text-xs"
                  style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Edit
                </button>
              )}
            </div>
            {editingNotes ? (
              <div>
                <textarea
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  rows={4}
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg text-xs resize-y"
                  style={{
                    backgroundColor: "var(--card-elevated)",
                    border: "1px solid var(--accent)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "var(--font-mono)",
                    lineHeight: "1.6",
                  }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={saveNotes}
                    className="px-3 py-1 rounded text-xs font-semibold"
                    style={{ backgroundColor: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingNotes(false)}
                    className="px-3 py-1 rounded text-xs"
                    style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p
                className="text-xs leading-relaxed whitespace-pre-wrap"
                style={{ color: task.notes ? "var(--text-secondary)" : "var(--text-muted)", fontFamily: task.notes ? "var(--font-mono)" : "inherit" }}
              >
                {task.notes || "No notes yet. Click Edit to add context or paste agent output here."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

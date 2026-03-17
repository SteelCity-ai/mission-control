"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Heart,
} from "lucide-react";
import type { DailyOutreach } from "@/lib/social/types";

const LIKES_TARGET = 25;
const COMMENTS_TARGET = 5;
const MIN_COMMENT_WORDS = 5;

interface LikeEntry {
  checked: boolean;
  account: string;
  url: string;
}

interface CommentEntry {
  checked: boolean;
  account: string;
  text: string;
  url: string;
  wordCount: number;
  error: string;
}

function initLikes(): LikeEntry[] {
  return Array.from({ length: LIKES_TARGET }, () => ({
    checked: false,
    account: "",
    url: "",
  }));
}

function initComments(): CommentEntry[] {
  return Array.from({ length: COMMENTS_TARGET }, () => ({
    checked: false,
    account: "",
    text: "",
    url: "",
    wordCount: 0,
    error: "",
  }));
}

export function OutreachTab() {
  const today = new Date().toISOString().split("T")[0];
  const [likes, setLikes] = useState<LikeEntry[]>(initLikes());
  const [comments, setComments] = useState<CommentEntry[]>(initComments());
  const [saving, setSaving] = useState<string | null>(null);
  const [outreachData, setOutreachData] = useState<DailyOutreach | null>(null);
  const [historicalLogs, setHistoricalLogs] = useState<DailyOutreach[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load today's data
  useEffect(() => {
    fetch(`/api/social/outreach?date=${today}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DailyOutreach | null) => {
        if (!data) return;
        setOutreachData(data);
        // Pre-fill from existing data
        const existingLikes = initLikes();
        data.likes.forEach((like, i) => {
          if (i < LIKES_TARGET) {
            existingLikes[i] = { checked: true, account: like.account, url: like.url ?? "" };
          }
        });
        setLikes(existingLikes);

        const existingComments = initComments();
        data.comments.forEach((comment, i) => {
          if (i < COMMENTS_TARGET) {
            existingComments[i] = {
              checked: true,
              account: comment.account,
              text: comment.text,
              url: comment.url ?? "",
              wordCount: comment.wordCount,
              error: "",
            };
          }
        });
        setComments(existingComments);
      })
      .catch(() => null);
  }, []);

  // Load history when expanded
  const loadHistory = async () => {
    if (historyLoading || historicalLogs.length > 0) return;
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/social/outreach");
      if (res.ok) {
        const data = await res.json();
        setHistoricalLogs(
          (data.outreach ?? []).filter((o: DailyOutreach) => o.date !== today)
        );
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleToggleHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next) loadHistory();
  };

  // Save a like entry
  const handleLikeSave = async (index: number) => {
    const entry = likes[index];
    if (!entry.account.trim()) return;

    const key = `like-${index}`;
    setSaving(key);
    try {
      // Ensure today's log exists
      await fetch("/api/social/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });

      const res = await fetch(`/api/social/outreach/${today}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_like",
          account: entry.account.trim(),
          url: entry.url.trim() || undefined,
        }),
      });

      if (res.ok) {
        const updated: DailyOutreach = await res.json();
        setOutreachData(updated);
        setLikes((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], checked: true };
          return next;
        });
      }
    } finally {
      setSaving(null);
    }
  };

  const handleCommentSave = async (index: number) => {
    const entry = comments[index];
    if (!entry.account.trim() || !entry.text.trim()) return;

    const wordCount = entry.text.trim().split(/\s+/).length;
    if (wordCount < MIN_COMMENT_WORDS) {
      setComments((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          error: `Need at least ${MIN_COMMENT_WORDS} words (got ${wordCount})`,
          wordCount,
        };
        return next;
      });
      return;
    }

    const key = `comment-${index}`;
    setSaving(key);
    try {
      await fetch("/api/social/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });

      const res = await fetch(`/api/social/outreach/${today}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_comment",
          account: entry.account.trim(),
          text: entry.text.trim(),
          url: entry.url.trim() || undefined,
        }),
      });

      if (res.ok) {
        const updated: DailyOutreach = await res.json();
        setOutreachData(updated);
        setComments((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], checked: true, error: "", wordCount };
          return next;
        });
      } else {
        const err = await res.json();
        setComments((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], error: err.error?.message ?? "Failed" };
          return next;
        });
      }
    } finally {
      setSaving(null);
    }
  };

  const likesCompleted = outreachData?.likes.length ?? likes.filter((l) => l.checked).length;
  const commentsCompleted =
    outreachData?.comments.length ?? comments.filter((c) => c.checked).length;
  const isComplete =
    likesCompleted >= LIKES_TARGET && commentsCompleted >= COMMENTS_TARGET;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header with completion status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 2px 0",
            }}
          >
            Daily Outreach Tracker
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            {today} — Track your daily social engagement
          </p>
        </div>
        {isComplete && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: "var(--positive-soft)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--positive)",
            }}
          >
            <CheckCircle2
              className="w-5 h-5"
              style={{ color: "var(--positive)" }}
            />
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--positive)",
              }}
            >
              All goals complete! 🎉
            </span>
          </div>
        )}
      </div>

      {/* Progress summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <StatCard
          icon={<Heart className="w-4 h-4" />}
          label="Likes"
          current={likesCompleted}
          target={LIKES_TARGET}
          color="var(--accent)"
        />
        <StatCard
          icon={<MessageSquare className="w-4 h-4" />}
          label="Comments"
          current={commentsCompleted}
          target={COMMENTS_TARGET}
          color="var(--positive)"
        />
      </div>

      {/* Likes section */}
      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Heart className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
              flex: 1,
            }}
          >
            Likes ({likesCompleted} / {LIKES_TARGET})
          </h3>
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            Check after liking each account
          </span>
        </div>

        <div style={{ padding: "12px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px",
            }}
          >
            {likes.map((entry, i) => (
              <LikeRow
                key={i}
                index={i}
                entry={entry}
                saving={saving === `like-${i}`}
                onChange={(field, val) => {
                  setLikes((prev) => {
                    const next = [...prev];
                    next[i] = { ...next[i], [field]: val };
                    return next;
                  });
                }}
                onSave={() => handleLikeSave(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <MessageSquare
            className="w-4 h-4"
            style={{ color: "var(--positive)" }}
          />
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
              flex: 1,
            }}
          >
            Comments ({commentsCompleted} / {COMMENTS_TARGET})
          </h3>
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            Min {MIN_COMMENT_WORDS} words each
          </span>
        </div>

        <div
          style={{
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {comments.map((entry, i) => (
            <CommentRow
              key={i}
              index={i}
              entry={entry}
              saving={saving === `comment-${i}`}
              onChange={(field, val) => {
                setComments((prev) => {
                  const next = [...prev];
                  next[i] = { ...next[i], [field]: val, error: "" };
                  if (field === "text") {
                    next[i].wordCount = (val as string).trim().split(/\s+/).filter(Boolean).length;
                  }
                  return next;
                });
              }}
              onSave={() => handleCommentSave(i)}
            />
          ))}
        </div>
      </div>

      {/* Historical logs */}
      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <button
          onClick={handleToggleHistory}
          style={{
            width: "100%",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          {showHistory ? (
            <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          ) : (
            <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          )}
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Historical Logs
          </span>
        </button>

        {showHistory && (
          <div style={{ borderTop: "1px solid var(--border)" }}>
            {historyLoading ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                }}
              >
                Loading history...
              </div>
            ) : historicalLogs.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                }}
              >
                No historical logs yet.
              </div>
            ) : (
              historicalLogs.map((log) => (
                <div
                  key={log.date}
                  style={{
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-primary)",
                      minWidth: "100px",
                    }}
                  >
                    {log.date}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {log.likes.length} likes · {log.comments.length} comments
                  </span>
                  {log.completed ? (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--positive)",
                        backgroundColor: "var(--positive-soft)",
                        padding: "2px 8px",
                        borderRadius: "999px",
                      }}
                    >
                      ✓ Complete
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      Incomplete
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  current,
  target,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <span style={{ color }}>{icon}</span>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text-primary)",
            fontFamily: "var(--font-heading)",
          }}
        >
          {current}
          <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            /{target}
          </span>
        </span>
      </div>
      <div
        style={{
          height: "6px",
          backgroundColor: "var(--surface)",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            backgroundColor: color,
            borderRadius: "999px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

function LikeRow({
  index,
  entry,
  saving,
  onChange,
  onSave,
}: {
  index: number;
  entry: LikeEntry;
  saving: boolean;
  onChange: (field: string, val: string) => void;
  onSave: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 8px",
        borderRadius: "var(--radius-md)",
        backgroundColor: entry.checked ? "rgba(34,197,94,0.05)" : "var(--surface)",
        border: `1px solid ${entry.checked ? "rgba(34,197,94,0.2)" : "var(--border)"}`,
      }}
    >
      {/* Checkbox indicator */}
      <div style={{ flexShrink: 0 }}>
        {entry.checked ? (
          <CheckCircle2 className="w-4 h-4" style={{ color: "var(--positive)" }} />
        ) : (
          <Circle className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        )}
      </div>

      <span
        style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          color: "var(--text-muted)",
          minWidth: "16px",
        }}
      >
        {index + 1}.
      </span>

      <input
        type="text"
        placeholder="@account"
        value={entry.account}
        readOnly={entry.checked}
        onChange={(e) => onChange("account", e.target.value)}
        onBlur={() => {
          if (!entry.checked && entry.account.trim()) onSave();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !entry.checked) onSave();
        }}
        style={{
          flex: 1,
          background: "none",
          border: "none",
          outline: "none",
          fontSize: "12px",
          color: entry.checked ? "var(--text-muted)" : "var(--text-primary)",
          fontFamily: "var(--font-body)",
          cursor: entry.checked ? "default" : "text",
        }}
      />

      {saving && (
        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>…</span>
      )}
    </div>
  );
}

function CommentRow({
  index,
  entry,
  saving,
  onChange,
  onSave,
}: {
  index: number;
  entry: CommentEntry;
  saving: boolean;
  onChange: (field: string, val: string | boolean) => void;
  onSave: () => void;
}) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "var(--radius-md)",
        backgroundColor: entry.checked ? "rgba(34,197,94,0.05)" : "var(--surface)",
        border: `1px solid ${entry.error ? "var(--negative)" : entry.checked ? "rgba(34,197,94,0.2)" : "var(--border)"}`,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}
      >
        {entry.checked ? (
          <CheckCircle2 className="w-4 h-4" style={{ color: "var(--positive)" }} />
        ) : (
          <Circle className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        )}
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-muted)",
          }}
        >
          Comment {index + 1}
        </span>
        {entry.wordCount > 0 && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color:
                entry.wordCount >= MIN_COMMENT_WORDS
                  ? "var(--positive)"
                  : "var(--warning)",
            }}
          >
            {entry.wordCount} words
          </span>
        )}
      </div>

      {/* Account input */}
      <input
        type="text"
        placeholder="@account"
        value={entry.account}
        readOnly={entry.checked}
        onChange={(e) => onChange("account", e.target.value)}
        style={{
          width: "100%",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "6px 10px",
          fontSize: "12px",
          color: "var(--text-primary)",
          outline: "none",
          marginBottom: "6px",
          boxSizing: "border-box",
          cursor: entry.checked ? "default" : "text",
          fontFamily: "var(--font-body)",
        }}
      />

      {/* Comment text */}
      <textarea
        placeholder="Write your comment here... (min 5 words)"
        value={entry.text}
        readOnly={entry.checked}
        rows={2}
        onChange={(e) => onChange("text", e.target.value)}
        style={{
          width: "100%",
          backgroundColor: "var(--surface)",
          border: `1px solid ${entry.error ? "var(--negative)" : "var(--border)"}`,
          borderRadius: "var(--radius-sm)",
          padding: "6px 10px",
          fontSize: "12px",
          color: "var(--text-primary)",
          outline: "none",
          marginBottom: "6px",
          boxSizing: "border-box",
          resize: "none",
          cursor: entry.checked ? "default" : "text",
          fontFamily: "var(--font-body)",
        }}
      />

      {entry.error && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--negative)",
            margin: "0 0 6px 0",
          }}
        >
          {entry.error}
        </p>
      )}

      {!entry.checked && (
        <button
          onClick={onSave}
          disabled={saving || !entry.account.trim() || !entry.text.trim()}
          style={{
            padding: "6px 12px",
            borderRadius: "var(--radius-md)",
            border: "none",
            backgroundColor: "var(--positive)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 600,
            opacity: saving || !entry.account.trim() || !entry.text.trim() ? 0.5 : 1,
          }}
        >
          {saving ? "Saving..." : "Log Comment"}
        </button>
      )}
    </div>
  );
}

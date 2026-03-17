"use client";

import { useState } from "react";
import { X, Send, Save, CheckCircle } from "lucide-react";
import type { SocialPost, Platform, Pillar } from "@/lib/social/types";
import { PLATFORM_LABELS, PILLAR_NAMES } from "@/lib/social/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (post: SocialPost) => void;
  clientId: string;
}

const PLATFORMS: Platform[] = ["facebook", "instagram", "nextdoor", "gmb"];
const PILLARS: Array<{ id: NonNullable<Pillar>; label: string }> = Object.entries(
  PILLAR_NAMES
).map(([id, label]) => ({ id: id as NonNullable<Pillar>, label }));

export function NewPostDrawer({ open, onClose, onCreated, clientId }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [platform, setPlatform] = useState<Platform>("facebook");
  const [content, setContent] = useState("");
  const [pillar, setPillar] = useState<Pillar>(null);
  const [scheduledDate, setScheduledDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setContent("");
    setPillar(null);
    setScheduledDate(today);
    setNotes("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const createPost = async (
    autoStatus?: "review" | "approved" | "posted"
  ) => {
    if (!content.trim()) {
      setError("Content is required.");
      return;
    }
    if (content.length > 2000) {
      setError("Content must be ≤ 2000 characters.");
      return;
    }
    if (!scheduledDate || scheduledDate < today) {
      setError("Scheduled date cannot be in the past.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create draft
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          platform,
          content: content.trim(),
          pillar: pillar || null,
          scheduledDate,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to create post");
      }

      let post: SocialPost = await res.json();

      // Auto-advance status if requested
      if (autoStatus) {
        const transitions = [
          ...(autoStatus === "review" || autoStatus === "approved" || autoStatus === "posted"
            ? ["review"]
            : []),
          ...(autoStatus === "approved" || autoStatus === "posted" ? ["approved"] : []),
          ...(autoStatus === "posted" ? ["posted"] : []),
        ] as Array<"review" | "approved" | "posted">;

        for (const status of transitions) {
          const statusRes = await fetch(`/api/social/posts/${post.id}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
          if (statusRes.ok) {
            post = await statusRes.json();
          }
        }
      }

      onCreated(post);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const charCount = content.length;
  const overLimit = charCount > 2000;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)",
          zIndex: 80,
        }}
      />

      {/* Drawer panel — right side, 33% width */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "33%",
          minWidth: "400px",
          maxWidth: "560px",
          backgroundColor: "var(--card)",
          borderLeft: "1px solid var(--border)",
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            New Post
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              padding: "4px",
              borderRadius: "6px",
              transition: "color 0.15s",
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {/* Platform selector */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}
            >
              Platform *
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${platform === p ? "var(--accent)" : "var(--border)"}`,
                    backgroundColor:
                      platform === p ? "var(--accent-soft)" : "transparent",
                    color:
                      platform === p ? "var(--accent)" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: platform === p ? 600 : 400,
                    transition: "all 0.15s ease",
                  }}
                >
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Content textarea */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}
            >
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content here..."
              rows={8}
              style={{
                width: "100%",
                backgroundColor: "var(--surface)",
                border: `1px solid ${overLimit ? "var(--negative)" : "var(--border)"}`,
                borderRadius: "var(--radius-md)",
                padding: "12px",
                fontSize: "14px",
                lineHeight: "1.6",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => {
                if (!overLimit)
                  (e.target as HTMLTextAreaElement).style.borderColor =
                    "var(--accent)";
              }}
              onBlur={(e) => {
                if (!overLimit)
                  (e.target as HTMLTextAreaElement).style.borderColor =
                    "var(--border)";
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: overLimit ? "var(--negative)" : "var(--text-muted)",
                  fontWeight: overLimit ? 600 : 400,
                }}
              >
                {charCount} / 2000
              </span>
            </div>
          </div>

          {/* Pillar */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}
            >
              Content Pillar
            </label>
            <select
              value={pillar ?? ""}
              onChange={(e) =>
                setPillar((e.target.value as Pillar) || null)
              }
              style={{
                width: "100%",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "10px 12px",
                fontSize: "13px",
                color: "var(--text-primary)",
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">— None —</option>
              {PILLARS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date picker */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}
            >
              Scheduled Date *
            </label>
            <input
              type="date"
              value={scheduledDate}
              min={today}
              onChange={(e) => setScheduledDate(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "10px 12px",
                fontSize: "13px",
                color: "var(--text-primary)",
                outline: "none",
                fontFamily: "var(--font-mono)",
                boxSizing: "border-box",
                colorScheme: "dark",
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}
            >
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes for this post..."
              rows={2}
              style={{
                width: "100%",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "10px 12px",
                fontSize: "13px",
                lineHeight: "1.5",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "var(--negative-soft)",
                border: "1px solid var(--negative)",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                color: "var(--negative)",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            {/* Save Draft */}
            <button
              onClick={() => createPost()}
              disabled={loading || overLimit}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                backgroundColor: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
                opacity: loading || overLimit ? 0.6 : 1,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--accent)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--accent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-secondary)";
              }}
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>

            {/* Submit for Review */}
            <button
              onClick={() => createPost("review")}
              disabled={loading || overLimit}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px",
                borderRadius: "var(--radius-md)",
                border: "none",
                backgroundColor: "var(--warning)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                opacity: loading || overLimit ? 0.6 : 1,
                fontFamily: "var(--font-heading)",
              }}
            >
              <Send className="w-4 h-4" />
              For Review
            </button>
          </div>

          {/* Approve */}
          <button
            onClick={() => createPost("approved")}
            disabled={loading || overLimit}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px",
              borderRadius: "var(--radius-md)",
              border: "none",
              backgroundColor: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              opacity: loading || overLimit ? 0.6 : 1,
              fontFamily: "var(--font-heading)",
            }}
          >
            <CheckCircle className="w-4 h-4" />
            Create & Approve
          </button>
        </div>
      </div>
    </>
  );
}

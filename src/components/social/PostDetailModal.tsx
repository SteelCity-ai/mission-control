"use client";

import { useState } from "react";
import { X, CheckCircle, Send, Eye, RotateCcw, Trash2 } from "lucide-react";
import type { SocialPost, PostStatus } from "@/lib/social/types";
import { STATUS_TRANSITIONS, PLATFORM_LABELS, PLATFORM_COLORS } from "@/lib/social/types";
import { PostStatusBadge } from "./PostStatusBadge";

interface Props {
  post: SocialPost;
  onClose: () => void;
  onUpdate: (updated: SocialPost) => void;
  onDelete: (id: string) => void;
}

const STATUS_ACTION_LABELS: Record<PostStatus, string> = {
  draft: "Submit for Review",
  review: "Approve",
  approved: "Mark as Posted",
  posted: "",
};

const STATUS_ACTION_ICONS: Record<PostStatus, React.ReactNode> = {
  draft: <Send className="w-4 h-4" />,
  review: <CheckCircle className="w-4 h-4" />,
  approved: <CheckCircle className="w-4 h-4" />,
  posted: null,
};

export function PostDetailModal({ post, onClose, onUpdate, onDelete }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatuses = STATUS_TRANSITIONS[post.status];
  const primaryNext = nextStatuses[nextStatuses.length - 1]; // last = forward direction

  const handleStatusTransition = async (targetStatus: PostStatus) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/social/posts/${post.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to update status");
      }
      const updated: SocialPost = await res.json();
      onUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/social/posts/${post.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete post");
      onDelete(post.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const platformColor = PLATFORM_COLORS[post.platform];
  const platformLabel = PLATFORM_LABELS[post.platform];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Post details"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "relative",
          width: "640px",
          maxWidth: "90vw",
          maxHeight: "85vh",
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            borderTop: `3px solid ${platformColor}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#fff",
                backgroundColor: platformColor,
                fontFamily: "var(--font-heading)",
              }}
            >
              {platformLabel}
            </span>
            <PostStatusBadge status={post.status} />
            {post.scheduledDate && (
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {post.scheduledDate}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              padding: "4px",
              borderRadius: "6px",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-muted)";
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* Content */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
              }}
            >
              Content
            </label>
            <div
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "14px",
                fontSize: "14px",
                lineHeight: "1.6",
                color: "var(--text-primary)",
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-body)",
              }}
            >
              {post.content}
            </div>
          </div>

          {/* Metadata row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {post.pillarName && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "4px",
                  }}
                >
                  Content Pillar
                </label>
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {post.pillarName}
                </span>
              </div>
            )}

            {post.approvedAt && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "4px",
                  }}
                >
                  Approved
                </label>
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {new Date(post.approvedAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {post.postedAt && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "4px",
                  }}
                >
                  Posted
                </label>
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {new Date(post.postedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {post.notes && (
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "8px",
                }}
              >
                Notes
              </label>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.5",
                  margin: 0,
                }}
              >
                {post.notes}
              </p>
            </div>
          )}

          {/* Status history */}
          {post.statusHistory && post.statusHistory.length > 0 && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "8px",
                }}
              >
                Status History
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {post.statusHistory.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <PostStatusBadge status={h.status} size="sm" />
                    <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {new Date(h.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: "16px",
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

        {/* Footer actions */}
        {post.status !== "posted" && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${confirmDelete ? "var(--negative)" : "var(--border)"}`,
                backgroundColor: confirmDelete ? "var(--negative-soft)" : "transparent",
                color: confirmDelete ? "var(--negative)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
                transition: "all 0.15s ease",
              }}
            >
              <Trash2 className="w-4 h-4" />
              {confirmDelete ? "Confirm Delete?" : "Delete"}
            </button>

            {/* Forward transitions */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {/* Back to draft from review */}
              {post.status === "review" && (
                <button
                  onClick={() => handleStatusTransition("draft")}
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    backgroundColor: "transparent",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Back to Draft
                </button>
              )}

              {/* Primary forward action */}
              {primaryNext && (
                <button
                  onClick={() => handleStatusTransition(primaryNext)}
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    backgroundColor: "var(--accent)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    opacity: loading ? 0.7 : 1,
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  {STATUS_ACTION_ICONS[post.status]}
                  {STATUS_ACTION_LABELS[post.status]}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

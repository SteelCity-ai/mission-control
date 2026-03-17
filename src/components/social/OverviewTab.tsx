"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import type { SocialPost, DailyOutreach } from "@/lib/social/types";
import { PLATFORM_LABELS, PLATFORM_COLORS } from "@/lib/social/types";
import { PostStatusBadge } from "./PostStatusBadge";

interface Props {
  onRefresh?: () => void;
}

export function OverviewTab({ onRefresh }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [approvedPosts, setApprovedPosts] = useState<SocialPost[]>([]);
  const [outreach, setOutreach] = useState<DailyOutreach | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsRes, outreachRes] = await Promise.allSettled([
        fetch(`/api/social/posts?startDate=${today}&endDate=${today}&status=approved`),
        fetch(`/api/social/outreach?date=${today}`),
      ]);

      if (postsRes.status === "fulfilled" && postsRes.value.ok) {
        const data = await postsRes.value.json();
        setApprovedPosts(data.posts ?? []);
      }

      if (outreachRes.status === "fulfilled" && outreachRes.value.ok) {
        const data = await outreachRes.value.json();
        setOutreach(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkPosted = async (postId: string) => {
    setMarkingId(postId);
    try {
      const res = await fetch(`/api/social/posts/${postId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "posted" }),
      });
      if (res.ok) {
        setApprovedPosts((prev) => prev.filter((p) => p.id !== postId));
        onRefresh?.();
      }
    } finally {
      setMarkingId(null);
    }
  };

  const likesCount = outreach?.likes.length ?? 0;
  const commentsCount = outreach?.comments.length ?? 0;
  const LIKES_TARGET = 25;
  const COMMENTS_TARGET = 5;

  const formattedDate = new Date(today + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Date header */}
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
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 2px 0",
            }}
          >
            {formattedDate}
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            Daily social media overview
          </p>
        </div>
        <button
          onClick={loadData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            backgroundColor: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "12px",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
          }}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Ready to Post Today */}
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
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Ready to Post Today
            </h3>
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {approvedPosts.length} approved
            </span>
          </div>

          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "13px",
              }}
            >
              Loading...
            </div>
          ) : approvedPosts.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "13px",
              }}
            >
              <CheckCircle2
                className="w-8 h-8 mx-auto mb-2"
                style={{ color: "var(--positive)", opacity: 0.5 }}
              />
              No approved posts for today.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {approvedPosts.map((post, i) => (
                <div
                  key={post.id}
                  style={{
                    padding: "16px 20px",
                    borderBottom:
                      i < approvedPosts.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  {/* Platform indicator */}
                  <div
                    style={{
                      width: "4px",
                      alignSelf: "stretch",
                      borderRadius: "2px",
                      backgroundColor: PLATFORM_COLORS[post.platform],
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: PLATFORM_COLORS[post.platform],
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        {PLATFORM_LABELS[post.platform]}
                      </span>
                      <PostStatusBadge status={post.status} size="sm" />
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                        lineHeight: "1.5",
                        margin: 0,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {post.content}
                    </p>
                  </div>

                  <button
                    onClick={() => handleMarkPosted(post.id)}
                    disabled={markingId === post.id}
                    style={{
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      backgroundColor: "var(--positive)",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      fontFamily: "var(--font-heading)",
                      opacity: markingId === post.id ? 0.7 : 1,
                      transition: "opacity 0.15s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Posted
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outreach Progress */}
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
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Daily Outreach
            </h3>
          </div>

          <div
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Likes progress */}
            <ProgressBar
              label="Likes"
              current={likesCount}
              target={LIKES_TARGET}
              color="var(--accent)"
            />

            {/* Comments progress */}
            <ProgressBar
              label="Comments"
              current={commentsCount}
              target={COMMENTS_TARGET}
              color="var(--positive)"
            />

            {/* Completion badge */}
            {outreach?.completed && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  backgroundColor: "var(--positive-soft)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--positive)",
                }}
              >
                <CheckCircle2
                  className="w-4 h-4"
                  style={{ color: "var(--positive)" }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--positive)",
                  }}
                >
                  Daily goals complete! 🎉
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-secondary)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {current} / {target}
        </span>
      </div>
      <div
        style={{
          height: "8px",
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
      <div
        style={{
          marginTop: "3px",
          fontSize: "11px",
          color: "var(--text-muted)",
          textAlign: "right",
        }}
      >
        {pct}% complete
      </div>
    </div>
  );
}

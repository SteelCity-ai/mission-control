"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SocialPost } from "@/lib/social/types";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/social/types";
import { PostDetailModal } from "./PostDetailModal";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekBounds(referenceDate: Date): { start: Date; end: Date; label: string } {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (dt: Date) =>
    dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const label = `${fmt(monday)} – ${fmt(sunday)}, ${monday.getFullYear()}`;
  return { start: monday, end: sunday, label };
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getISOWeek(d: Date): string {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - jan1.getTime()) / 86400000) + 1;
  const week = Math.ceil((dayOfYear + ((jan1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

interface CalendarTabProps {
  clientId: string;
}

export function CalendarTab({ clientId }: CalendarTabProps) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  // Compute current week reference
  const referenceDate = new Date();
  referenceDate.setDate(referenceDate.getDate() + weekOffset * 7);
  const { start: weekStart, end: weekEnd, label: weekLabel } = getWeekBounds(referenceDate);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const isoWeek = getISOWeek(weekStart);

  useEffect(() => {
    setLoading(true);
    const startStr = toISODate(weekStart);
    const endStr = toISODate(weekEnd);
    fetch(`/api/social/posts?clientId=${clientId}&startDate=${startStr}&endDate=${endStr}`)
      .then((r) => r.json())
      .then((data) => setPosts(data.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [weekOffset]);

  const postsByDate = weekDates.reduce<Record<string, SocialPost[]>>((acc, d) => {
    const key = toISODate(d);
    acc[key] = posts.filter((p) => p.scheduledDate === key);
    return acc;
  }, {});

  const handlePostUpdated = (updated: SocialPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedPost(updated);
  };

  const handlePostDeleted = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setSelectedPost(null);
  };

  const todayStr = toISODate(new Date());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Week navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            backgroundColor: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "13px",
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
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>

        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {weekLabel}
          </span>
          {weekOffset === 0 && (
            <span
              style={{
                display: "block",
                fontSize: "11px",
                color: "var(--accent)",
                fontWeight: 600,
              }}
            >
              This Week
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                backgroundColor: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "12px",
                transition: "all 0.15s ease",
              }}
            >
              Today
            </button>
          )}
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              backgroundColor: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "13px",
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
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "8px",
        }}
      >
        {weekDates.map((date, i) => {
          const dateStr = toISODate(date);
          const dayPosts = postsByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              style={{
                backgroundColor: "var(--card)",
                border: `1px solid ${isToday ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                minHeight: "140px",
              }}
            >
              {/* Day header */}
              <div
                style={{
                  padding: "10px 12px 8px",
                  borderBottom: "1px solid var(--border)",
                  backgroundColor: isToday ? "var(--accent-soft)" : "transparent",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: isToday ? "var(--accent)" : "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {DAY_LABELS[i]}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: isToday ? "var(--accent)" : "var(--text-primary)",
                    fontFamily: "var(--font-heading)",
                    lineHeight: 1,
                    marginTop: "2px",
                  }}
                >
                  {date.getDate()}
                </div>
              </div>

              {/* Posts */}
              <div
                style={{
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {loading ? (
                  <div
                    style={{
                      height: "24px",
                      backgroundColor: "var(--surface)",
                      borderRadius: "4px",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                ) : (
                  dayPosts.map((post) => (
                    <PostChip
                      key={post.id}
                      post={post}
                      onClick={() => setSelectedPost(post)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", paddingTop: "4px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
          Platforms:
        </span>
        {(["facebook", "instagram", "nextdoor", "gmb"] as const).map((p) => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "2px",
                backgroundColor: PLATFORM_COLORS[p],
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {PLATFORM_LABELS[p]}
            </span>
          </div>
        ))}
      </div>

      {/* Post detail modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdate={handlePostUpdated}
          onDelete={handlePostDeleted}
        />
      )}
    </div>
  );
}

function PostChip({
  post,
  onClick,
}: {
  post: SocialPost;
  onClick: () => void;
}) {
  const color = PLATFORM_COLORS[post.platform];
  const STATUS_OPACITY: Record<string, number> = {
    draft: 0.5,
    review: 0.75,
    approved: 1,
    posted: 0.6,
  };

  return (
    <button
      onClick={onClick}
      title={`${PLATFORM_LABELS[post.platform]}: ${post.content.slice(0, 80)}...`}
      style={{
        width: "100%",
        padding: "3px 6px",
        borderRadius: "4px",
        border: "none",
        backgroundColor: color,
        opacity: STATUS_OPACITY[post.status] ?? 1,
        cursor: "pointer",
        textAlign: "left",
        fontSize: "10px",
        fontWeight: 600,
        color: "#fff",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        transition: "opacity 0.15s ease, transform 0.1s ease",
        fontFamily: "var(--font-heading)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.opacity =
          String(STATUS_OPACITY[post.status] ?? 1);
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
    >
      {post.content.slice(0, 30)}
      {post.content.length > 30 ? "..." : ""}
    </button>
  );
}

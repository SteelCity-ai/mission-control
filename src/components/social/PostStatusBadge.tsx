"use client";

import type { PostStatus } from "@/lib/social/types";

const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; color: string; bg: string }
> = {
  draft: { label: "Draft", color: "#9CA3AF", bg: "rgba(156,163,175,0.12)" },
  review: { label: "Review", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  approved: {
    label: "Approved",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.12)",
  },
  posted: { label: "Posted", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
};

interface Props {
  status: PostStatus;
  size?: "sm" | "md";
}

export function PostStatusBadge({ status, size = "md" }: Props) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: size === "sm" ? "1px 6px" : "2px 8px",
        borderRadius: "999px",
        fontSize: size === "sm" ? "10px" : "11px",
        fontWeight: 600,
        fontFamily: "var(--font-heading)",
        color: cfg.color,
        backgroundColor: cfg.bg,
        letterSpacing: "0.3px",
        textTransform: "uppercase",
      }}
    >
      {cfg.label}
    </span>
  );
}

"use client";

import type { Platform } from "@/lib/social/types";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/social/types";

interface Props {
  platform: Platform;
  size?: "sm" | "md";
  onClick?: () => void;
}

export function PlatformChip({ platform, size = "sm", onClick }: Props) {
  const color = PLATFORM_COLORS[platform];
  const label = PLATFORM_LABELS[platform];

  // First letter abbreviation for small chips
  const abbrev = {
    facebook: "F",
    instagram: "I",
    nextdoor: "N",
    gmb: "G",
  }[platform];

  return (
    <span
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) onClick();
      }}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        padding: size === "sm" ? "2px 6px" : "3px 10px",
        borderRadius: "6px",
        fontSize: size === "sm" ? "10px" : "12px",
        fontWeight: 700,
        fontFamily: "var(--font-heading)",
        color: "#fff",
        backgroundColor: color,
        cursor: onClick ? "pointer" : "default",
        letterSpacing: "0.2px",
        userSelect: "none",
        transition: "opacity 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (onClick)
          (e.currentTarget as HTMLSpanElement).style.opacity = "0.85";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLSpanElement).style.opacity = "1";
      }}
    >
      {size === "sm" ? abbrev : label}
    </span>
  );
}

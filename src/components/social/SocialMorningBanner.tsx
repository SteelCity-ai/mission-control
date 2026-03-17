"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coffee, X, ChevronRight } from "lucide-react";

interface ReminderData {
  today: string;
  approvedCount: number;
  posts: Array<{
    id: string;
    platform: string;
    content: string;
  }>;
}

export function SocialMorningBanner() {
  const [data, setData] = useState<ReminderData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed today
    const dismissedDate = sessionStorage.getItem("social-banner-dismissed");
    const today = new Date().toISOString().split("T")[0];
    if (dismissedDate === today) {
      setDismissed(true);
      return;
    }

    fetch("/api/social/reminder")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => null);
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split("T")[0];
    sessionStorage.setItem("social-banner-dismissed", today);
    setDismissed(true);
  };

  if (dismissed || !data || data.approvedCount === 0) return null;

  return (
    <div
      style={{
        background: "rgba(14, 165, 233, 0.10)",
        borderLeft: "4px solid var(--accent)",
        borderBottom: "1px solid var(--border)",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Coffee
          className="w-4 h-4"
          style={{ color: "var(--accent)", flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-body)",
          }}
        >
          <strong style={{ color: "var(--text-primary)" }}>
            ☕ Good Morning!
          </strong>{" "}
          You have{" "}
          <strong style={{ color: "var(--accent)" }}>
            {data.approvedCount} approved post
            {data.approvedCount !== 1 ? "s" : ""}
          </strong>{" "}
          ready for today.
        </span>
        <Link
          href="/social?tab=overview"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--accent)",
            textDecoration: "none",
          }}
        >
          View Schedule
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <button
        onClick={handleDismiss}
        aria-label="Dismiss banner"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          padding: "4px",
          borderRadius: "4px",
          transition: "color 0.15s ease",
          flexShrink: 0,
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
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

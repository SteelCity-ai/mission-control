"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Calendar, LayoutDashboard, Users, Plus } from "lucide-react";
import { OverviewTab } from "@/components/social/OverviewTab";
import { CalendarTab } from "@/components/social/CalendarTab";
import { OutreachTab } from "@/components/social/OutreachTab";
import { NewPostDrawer } from "@/components/social/NewPostDrawer";
import { SocialMorningBanner } from "@/components/social/SocialMorningBanner";
import type { SocialPost } from "@/lib/social/types";

type TabId = "overview" | "calendar" | "outreach";

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "calendar", label: "Calendar", icon: <Calendar className="w-4 h-4" /> },
  { id: "outreach", label: "Outreach", icon: <Users className="w-4 h-4" /> },
];

function SocialPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && ["overview", "calendar", "outreach"].includes(tabParam)
      ? tabParam
      : "overview"
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    router.push(`/social?tab=${tab}`, { scroll: false });
  };

  const handlePostCreated = (_post: SocialPost) => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--background)",
      }}
    >
      {/* Morning banner */}
      <SocialMorningBanner />

      {/* Page header */}
      <div
        style={{
          padding: "24px 32px 0",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Absolute Pest Services
              </span>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Social Content Manager
            </h1>
          </div>

          {/* New Post button */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "var(--radius-md)",
              border: "none",
              backgroundColor: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "var(--font-heading)",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--accent-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--accent)";
            }}
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>

        {/* Tabs */}
        <nav style={{ display: "flex", gap: "0" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: activeTab === tab.id ? 600 : 400,
                color:
                  activeTab === tab.id
                    ? "var(--accent)"
                    : "var(--text-secondary)",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: `2px solid ${
                  activeTab === tab.id ? "var(--accent)" : "transparent"
                }`,
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily:
                  activeTab === tab.id
                    ? "var(--font-heading)"
                    : "var(--font-body)",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-secondary)";
                }
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div
        style={{
          flex: 1,
          padding: "28px 32px",
          overflowY: "auto",
        }}
      >
        {activeTab === "overview" && (
          <OverviewTab key={refreshKey} onRefresh={() => setRefreshKey((k) => k + 1)} />
        )}
        {activeTab === "calendar" && <CalendarTab key={refreshKey} />}
        {activeTab === "outreach" && <OutreachTab />}
      </div>

      {/* New Post Drawer */}
      <NewPostDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={handlePostCreated}
      />
    </div>
  );
}

export default function SocialPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", color: "var(--text-muted)" }}>Loading...</div>}>
      <SocialPageContent />
    </Suspense>
  );
}

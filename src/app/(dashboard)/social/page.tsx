"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Calendar, LayoutDashboard, Users, Plus, Building2 } from "lucide-react";
import Link from "next/link";
import { OverviewTab } from "@/components/social/OverviewTab";
import { CalendarTab } from "@/components/social/CalendarTab";
import { OutreachTab } from "@/components/social/OutreachTab";
import { NewPostDrawer } from "@/components/social/NewPostDrawer";
import { SocialMorningBanner } from "@/components/social/SocialMorningBanner";
import { ClientSelector } from "@/components/social/ClientSelector";
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
  const clientSlug = searchParams.get("client");

  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && ["overview", "calendar", "outreach"].includes(tabParam)
      ? tabParam
      : "overview"
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [hasClients, setHasClients] = useState<boolean | null>(null); // null = loading

  // Load whether any clients exist (for empty state messaging)
  useEffect(() => {
    fetch("/api/clients?status=active")
      .then((r) => r.ok ? r.json() : { clients: [] })
      .then((data) => {
        setHasClients((data.clients ?? []).length > 0);
      })
      .catch(() => setHasClients(false));
  }, []);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/social?${params.toString()}`, { scroll: false });
  };

  const handlePostCreated = (_post: SocialPost) => {
    setRefreshKey((k) => k + 1);
  };

  const handleClientChange = (clientId: string | null) => {
    setActiveClientId(clientId);
    setRefreshKey((k) => k + 1);
  };

  const noClientSelected = !clientSlug || !activeClientId;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--background)",
      }}
    >
      {/* Morning banner — only when a client is selected */}
      {!noClientSelected && <SocialMorningBanner clientId={activeClientId} />}

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
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {/* Client Selector replaces hardcoded name */}
              <ClientSelector onClientChange={handleClientChange} />
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

          {/* New Post button — only when client selected */}
          {!noClientSelected && (
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
                flexShrink: 0,
                alignSelf: "flex-start",
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
          )}
        </div>

        {/* Tabs — only when client selected */}
        {!noClientSelected && (
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
        )}
      </div>

      {/* Tab content / Empty state */}
      <div
        style={{
          flex: 1,
          padding: noClientSelected ? "0" : "28px 32px",
          overflowY: "auto",
        }}
      >
        {noClientSelected ? (
          /* ── Empty state: no client selected ── */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "400px",
              padding: "60px 40px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
              }}
            >
              <Building2 style={{ width: "36px", height: "36px", color: "var(--accent)" }} />
            </div>

            {hasClients === false ? (
              /* No clients exist yet */
              <>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: "0 0 10px 0",
                  }}
                >
                  Welcome to Social Content Manager
                </h2>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    maxWidth: "420px",
                    margin: "0 0 28px 0",
                    lineHeight: "1.7",
                  }}
                >
                  Let&apos;s set up your Mission Control. Add your first client to start managing their social media presence.
                </p>
                <Link
                  href="/clients"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--accent)",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 600,
                    textDecoration: "none",
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  <Plus style={{ width: "16px", height: "16px" }} />
                  Add Your First Client
                </Link>
              </>
            ) : (
              /* Clients exist, but none selected */
              <>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: "0 0 10px 0",
                  }}
                >
                  Pick a client to get started
                </h2>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--text-muted)",
                    maxWidth: "380px",
                    margin: "0 0 28px 0",
                    lineHeight: "1.7",
                  }}
                >
                  Select a client from the dropdown above to view and manage their social content.
                </p>
                <div style={{ display: "flex", gap: "12px" }}>
                  <Link
                    href="/clients"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 18px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      backgroundColor: "transparent",
                      color: "var(--text-muted)",
                      fontSize: "13px",
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                  >
                    Manage Clients
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ── Tab content ── */
          <>
            {activeTab === "overview" && (
              <OverviewTab
                key={`overview-${refreshKey}-${activeClientId}`}
                clientId={activeClientId!}
                onRefresh={() => setRefreshKey((k) => k + 1)}
              />
            )}
            {activeTab === "calendar" && (
              <CalendarTab
                key={`calendar-${refreshKey}-${activeClientId}`}
                clientId={activeClientId!}
              />
            )}
            {activeTab === "outreach" && (
              <OutreachTab
                key={`outreach-${refreshKey}-${activeClientId}`}
                clientId={activeClientId!}
              />
            )}
          </>
        )}
      </div>

      {/* New Post Drawer */}
      {!noClientSelected && (
        <NewPostDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onCreated={handlePostCreated}
          clientId={activeClientId!}
        />
      )}
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

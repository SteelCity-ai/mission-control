"use client";

import { useEffect, useState, Suspense } from "react";
import { Plus, Users, RotateCcw, Archive } from "lucide-react";
import { ClientCard } from "@/components/clients/ClientCard";
import { ClientForm } from "@/components/clients/ClientForm";
import type { Client } from "@/lib/social/clientService";

interface ClientWithSettings extends Client {
  platforms?: string[];
  outreachTargets?: { likes: number; comments: number };
}

function ClientsPageContent() {
  const [clients, setClients] = useState<ClientWithSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithSettings | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeClients = clients.filter((c) => c.status === "active");
  const archivedClients = clients.filter((c) => c.status === "archived");
  const displayedClients = showArchived ? clients : activeClients;

  const loadClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients?status=all");
      if (res.ok) {
        const data = await res.json();
        setClients((data.clients ?? []) as ClientWithSettings[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleEdit = (client: ClientWithSettings) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  const handleSaved = (saved: ClientWithSettings) => {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditingClient(null);
  };

  const handleArchiveToggle = async (client: ClientWithSettings) => {
    setArchivingId(client.id);
    try {
      const endpoint =
        client.status === "archived"
          ? `/api/clients/${client.id}/restore`
          : `/api/clients/${client.id}/archive`;

      const res = await fetch(endpoint, { method: "PATCH" });
      if (res.ok) {
        const updated: ClientWithSettings = await res.json();
        setClients((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
      }
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Page header */}
      <div
        style={{
          padding: "28px 32px 24px",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <Users style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
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
                Clients
              </h1>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              {activeClients.length} active
              {archivedClients.length > 0 && ` · ${archivedClients.length} archived`}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Toggle archived */}
            {archivedClients.length > 0 && (
              <button
                onClick={() => setShowArchived((s) => !s)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 14px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${showArchived ? "var(--accent)" : "var(--border)"}`,
                  backgroundColor: showArchived ? "var(--accent-soft)" : "transparent",
                  color: showArchived ? "var(--accent)" : "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  transition: "all 0.15s ease",
                }}
              >
                <Archive style={{ width: "14px", height: "14px" }} />
                {showArchived ? "Hide Archived" : "Show Archived"}
              </button>
            )}

            {/* Add Client button */}
            <button
              onClick={() => { setEditingClient(null); setShowForm(true); }}
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
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)";
              }}
            >
              <Plus style={{ width: "16px", height: "16px" }} />
              Add Client
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "28px 32px" }}>
        {loading ? (
          /* Loading skeleton */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: "200px",
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : displayedClients.length === 0 ? (
          /* Empty state */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 40px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <Users style={{ width: "32px", height: "32px", color: "var(--accent)" }} />
            </div>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 8px 0",
              }}
            >
              {showArchived ? "No archived clients" : "Welcome to Mission Control"}
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                maxWidth: "400px",
                margin: "0 0 28px 0",
                lineHeight: "1.6",
              }}
            >
              {showArchived
                ? "You haven't archived any clients yet."
                : "Let's set up your first client to start managing their social media presence."}
            </p>
            {!showArchived && (
              <button
                onClick={() => { setEditingClient(null); setShowForm(true); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  backgroundColor: "var(--accent)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: "var(--font-heading)",
                }}
              >
                <Plus style={{ width: "16px", height: "16px" }} />
                Add Your First Client
              </button>
            )}
          </div>
        ) : (
          /* Client grid */
          <div>
            {showArchived && archivedClients.length > 0 && activeClients.length > 0 && (
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  margin: "0 0 16px 0",
                }}
              >
                Active Clients ({activeClients.length})
              </h2>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {displayedClients
                .filter((c) => c.status === "active")
                .map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onEdit={handleEdit}
                    onArchiveToggle={handleArchiveToggle}
                    archiving={archivingId === client.id}
                  />
                ))}
            </div>

            {showArchived && archivedClients.length > 0 && (
              <>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    margin: "32px 0 16px 0",
                  }}
                >
                  Archived ({archivedClients.length})
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {archivedClients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onEdit={handleEdit}
                      onArchiveToggle={handleArchiveToggle}
                      archiving={archivingId === client.id}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Client form modal */}
      {showForm && (
        <ClientForm
          client={editingClient}
          onSave={handleSaved}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", color: "var(--text-muted)" }}>Loading...</div>}>
      <ClientsPageContent />
    </Suspense>
  );
}

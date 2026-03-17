"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Check,
  Search,
  Building2,
  Plus,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { Client } from "@/lib/social/clientService";

const INDUSTRY_LABELS: Record<string, string> = {
  "pest-control": "Pest Control",
  restaurant: "Restaurant",
  retail: "Retail",
  healthcare: "Healthcare",
  automotive: "Automotive",
  "professional-services": "Pro Services",
  other: "Other",
};

const INDUSTRY_COLORS: Record<string, string> = {
  "pest-control": "#16a34a",
  restaurant: "#ea580c",
  retail: "#7c3aed",
  healthcare: "#0284c7",
  automotive: "#b45309",
  "professional-services": "#0f766e",
  other: "#64748b",
};

interface Props {
  onClientChange?: (clientId: string | null) => void;
}

export function ClientSelector({ onClientChange }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientSlug = searchParams.get("client");

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeClient, setActiveClient] = useState<Client | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch clients on mount
  useEffect(() => {
    fetch("/api/clients?status=active")
      .then((r) => r.ok ? r.json() : { clients: [] })
      .then((data) => {
        const list: Client[] = data.clients ?? [];
        setClients(list);

        // Set active from URL or first client
        if (clientSlug) {
          const found = list.find((c) => c.slug === clientSlug);
          setActiveClient(found ?? null);
          onClientChange?.(found?.id ?? null);
        } else if (list.length === 1) {
          // Auto-select if only one
          setActiveClient(list[0]);
          onClientChange?.(list[0].id);
        }
      })
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  // Sync when URL param changes
  useEffect(() => {
    if (!clientSlug) {
      setActiveClient(null);
      onClientChange?.(null);
      return;
    }
    const found = clients.find((c) => c.slug === clientSlug);
    if (found) {
      setActiveClient(found);
      onClientChange?.(found.id);
    }
  }, [clientSlug, clients]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = (client: Client) => {
    setActiveClient(client);
    onClientChange?.(client.id);
    setOpen(false);
    setQuery("");

    // Update URL — preserve existing params (tab etc)
    const params = new URLSearchParams(searchParams.toString());
    params.set("client", client.slug);
    router.push(`/social?${params.toString()}`, { scroll: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  const filtered = clients.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.industry ?? "").toLowerCase().includes(q)
    );
  });

  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 12px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          backgroundColor: open ? "var(--surface-hover)" : "var(--surface)",
          color: "var(--text-primary)",
          cursor: loading ? "wait" : "pointer",
          fontSize: "14px",
          fontWeight: 600,
          fontFamily: "var(--font-heading)",
          transition: "all 0.15s ease",
          minWidth: "200px",
          maxWidth: "320px",
        }}
        onMouseEnter={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)";
        }}
        onMouseLeave={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
        }}
      >
        {/* Logo / initials */}
        {activeClient ? (
          activeClient.branding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeClient.branding.logoUrl}
              alt=""
              style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "4px",
                backgroundColor: INDUSTRY_COLORS[activeClient.industry ?? "other"] + "22",
                color: INDUSTRY_COLORS[activeClient.industry ?? "other"],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials(activeClient.name)}
            </div>
          )
        ) : (
          <Building2 style={{ width: "18px", height: "18px", color: "var(--text-muted)", flexShrink: 0 }} />
        )}

        {/* Name */}
        <span
          style={{
            flex: 1,
            textAlign: "left",
            color: activeClient ? "var(--text-primary)" : "var(--text-muted)",
            fontWeight: activeClient ? 600 : 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Loading..." : activeClient ? activeClient.name : "Select client…"}
        </span>

        {/* Industry badge */}
        {activeClient?.industry && (
          <span
            style={{
              fontSize: "9px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
              color: INDUSTRY_COLORS[activeClient.industry] ?? "var(--text-muted)",
              backgroundColor: (INDUSTRY_COLORS[activeClient.industry] ?? "#64748b") + "18",
              padding: "2px 6px",
              borderRadius: "999px",
              flexShrink: 0,
            }}
          >
            {INDUSTRY_LABELS[activeClient.industry] ?? activeClient.industry}
          </span>
        )}

        <ChevronDown
          style={{
            width: "16px",
            height: "16px",
            color: "var(--text-muted)",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          onKeyDown={handleKeyDown}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: "280px",
            maxWidth: "340px",
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            zIndex: 200,
            overflow: "hidden",
          }}
        >
          {/* Search */}
          <div
            style={{
              padding: "8px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 10px",
                backgroundColor: "var(--surface)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
              }}
            >
              <Search style={{ width: "14px", height: "14px", color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search clients…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontSize: "13px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                }}
              >
                {clients.length === 0 ? (
                  <div>
                    <p style={{ margin: "0 0 12px 0" }}>No clients yet.</p>
                    <Link
                      href="/clients"
                      onClick={() => setOpen(false)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 14px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--accent)",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      <Plus style={{ width: "14px", height: "14px" }} />
                      Add First Client
                    </Link>
                  </div>
                ) : (
                  "No clients match your search."
                )}
              </div>
            ) : (
              filtered.map((client) => {
                const isActive = client.id === activeClient?.id;
                const color = INDUSTRY_COLORS[client.industry ?? "other"];
                return (
                  <button
                    key={client.id}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(client)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      background: isActive ? "var(--accent-soft)" : "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "none";
                    }}
                  >
                    {/* Avatar */}
                    {client.branding?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={client.branding.logoUrl}
                        alt=""
                        style={{ width: "28px", height: "28px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          backgroundColor: color + "22",
                          color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {initials(client.name)}
                      </div>
                    )}

                    {/* Name + industry */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: isActive ? 700 : 500,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {client.name}
                      </div>
                      {client.industry && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                          {INDUSTRY_LABELS[client.industry] ?? client.industry}
                        </div>
                      )}
                    </div>

                    {/* Check mark */}
                    {isActive && (
                      <Check style={{ width: "14px", height: "14px", color: "var(--accent)", flexShrink: 0 }} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer: Manage link */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              padding: "8px 12px",
            }}
          >
            <Link
              href="/clients"
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "var(--text-muted)",
                textDecoration: "none",
                padding: "6px 4px",
                borderRadius: "var(--radius-sm)",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)";
              }}
            >
              <ExternalLink style={{ width: "12px", height: "12px" }} />
              Manage Clients
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

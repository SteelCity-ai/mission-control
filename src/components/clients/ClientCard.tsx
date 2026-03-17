"use client";

import { Archive, RotateCcw, Settings, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Client } from "@/lib/social/clientService";

// Enriched client includes settings data
interface ClientWithSettings extends Client {
  platforms?: string[];
  outreachTargets?: { likes: number; comments: number };
}

const INDUSTRY_LABELS: Record<string, string> = {
  "pest-control": "Pest Control",
  restaurant: "Restaurant",
  retail: "Retail",
  healthcare: "Healthcare",
  automotive: "Automotive",
  "professional-services": "Professional Services",
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

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "FB",
  instagram: "IG",
  nextdoor: "ND",
  gmb: "GMB",
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E1306C",
  nextdoor: "#00B259",
  gmb: "#EA4335",
};

interface Props {
  client: ClientWithSettings;
  onEdit: (client: ClientWithSettings) => void;
  onArchiveToggle: (client: ClientWithSettings) => void;
  archiving?: boolean;
}

export function ClientCard({ client, onEdit, onArchiveToggle, archiving }: Props) {
  const isArchived = client.status === "archived";
  const industryColor = INDUSTRY_COLORS[client.industry ?? "other"] ?? "#64748b";
  const industryLabel = INDUSTRY_LABELS[client.industry ?? "other"] ?? client.industry ?? "Unknown";

  const initials = client.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        opacity: isArchived ? 0.65 : 1,
        transition: "box-shadow 0.2s ease, opacity 0.2s ease",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Color bar */}
      <div
        style={{
          height: "4px",
          backgroundColor: client.branding?.primaryColor ?? industryColor,
        }}
      />

      {/* Card body */}
      <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          {/* Avatar */}
          {client.branding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={client.branding.logoUrl}
              alt=""
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                objectFit: "cover",
                flexShrink: 0,
                border: "1px solid var(--border)",
              }}
            />
          ) : (
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                backgroundColor: industryColor + "22",
                color: industryColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 800,
                flexShrink: 0,
                border: `1px solid ${industryColor}33`,
              }}
            >
              {initials}
            </div>
          )}

          {/* Name + status */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {client.name}
              </h3>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  backgroundColor: isArchived
                    ? "var(--surface)"
                    : "var(--positive-soft)",
                  color: isArchived ? "var(--text-muted)" : "var(--positive)",
                  border: `1px solid ${isArchived ? "var(--border)" : "var(--positive)"}`,
                  flexShrink: 0,
                }}
              >
                {isArchived ? "Archived" : "Active"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  color: industryColor,
                  backgroundColor: industryColor + "18",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                {industryLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Platforms row */}
        {client.platforms && client.platforms.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {client.platforms.map((p: string) => (
              <span
                key={p}
                title={p}
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: PLATFORM_COLORS[p] ?? "#64748b",
                  backgroundColor: (PLATFORM_COLORS[p] ?? "#64748b") + "18",
                  border: `1px solid ${(PLATFORM_COLORS[p] ?? "#64748b")}30`,
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                {PLATFORM_LABELS[p] ?? p.toUpperCase()}
              </span>
            ))}
          </div>
        )}

        {/* Contact */}
        {client.contactEmail && (
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {client.contactEmail}
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "var(--surface)",
        }}
      >
        {/* View in Social */}
        {!isArchived && (
          <Link
            href={`/social?client=${client.slug}`}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent)",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "var(--font-heading)",
            }}
          >
            <ExternalLink style={{ width: "13px", height: "13px" }} />
            Dashboard
          </Link>
        )}

        {/* Edit */}
        <button
          onClick={() => onEdit(client)}
          title="Edit client"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "7px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            backgroundColor: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
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
          <Settings style={{ width: "14px", height: "14px" }} />
        </button>

        {/* Archive / Restore */}
        <button
          onClick={() => onArchiveToggle(client)}
          disabled={archiving}
          title={isArchived ? "Restore client" : "Archive client"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "7px",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${isArchived ? "var(--positive)" : "var(--border)"}`,
            backgroundColor: "transparent",
            color: isArchived ? "var(--positive)" : "var(--text-muted)",
            cursor: archiving ? "wait" : "pointer",
            opacity: archiving ? 0.5 : 1,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!isArchived) {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--negative)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--negative)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isArchived) {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            }
          }}
        >
          {isArchived ? (
            <RotateCcw style={{ width: "14px", height: "14px" }} />
          ) : (
            <Archive style={{ width: "14px", height: "14px" }} />
          )}
        </button>
      </div>
    </div>
  );
}

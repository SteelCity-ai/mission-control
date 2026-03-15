/**
 * PM Sync Status Widget
 * Shows sync status with Linear and provides manual sync trigger
 */
"use client";

import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

interface SyncStatus {
  lastSync: string | null;
  tasksSynced: number;
  errors: string[];
  lastError: string | null;
}

export function PmSyncWidget() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pm-sync");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch sync status:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    // Guard: Don't sync if we don't have initial status yet (Bug 3 fix)
    if (!status) {
      return;
    }
    
    setSyncing(true);
    try {
      const res = await fetch("/api/pm-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(prev => prev ? ({
          ...prev,
          lastSync: data.lastSync,
          tasksSynced: data.tasks?.length || 0,
          lastError: null,
        }) : null);
      } else {
        setStatus(prev => prev ? ({
          ...prev,
          lastError: data.error,
        }) : null);
      }
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatTime = (iso: string | null) => {
    if (!iso) return "Never";
    const date = new Date(iso);
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
    });
  };

  return (
    <div style={{
      padding: "1rem",
      backgroundColor: "var(--card)",
      borderRadius: "0.75rem",
      border: "1px solid var(--border)",
    }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        marginBottom: "0.75rem" 
      }}>
        <div style={{ 
          fontSize: "0.75rem", 
          color: "var(--text-muted)", 
          textTransform: "uppercase", 
          letterSpacing: "0.05em" 
        }}>
          🔄 PM Sync
        </div>
        {status?.lastError ? (
          <XCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
        ) : status?.lastSync ? (
          <CheckCircle className="w-4 h-4" style={{ color: "#22c55e" }} />
        ) : (
          <Clock className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        )}
      </div>

      {/* Stats */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "0.5rem",
        marginBottom: "0.75rem" 
      }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Last Sync</div>
          <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            {loading ? "..." : formatTime(status?.lastSync || null)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Tasks</div>
          <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            {loading ? "..." : status?.tasksSynced || 0}
          </div>
        </div>
      </div>

      {/* Error display */}
      {status?.lastError && (
        <div style={{ 
          fontSize: "0.7rem", 
          color: "#ef4444", 
          marginBottom: "0.5rem",
          padding: "0.375rem",
          backgroundColor: "rgba(239,68,68,0.1)",
          borderRadius: "0.375rem",
        }}>
          {status.lastError}
        </div>
      )}

      {/* Sync button */}
      <button
        onClick={triggerSync}
        disabled={syncing || !status}
        title={!status ? "Waiting for initial status..." : undefined}
        style={{
          width: "100%",
          padding: "0.5rem",
          backgroundColor: syncing ? "var(--card-elevated)" : "var(--accent)",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          fontSize: "0.8rem",
          fontWeight: 600,
          cursor: syncing ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.375rem",
          opacity: syncing ? 0.7 : 1,
          transition: "all 0.2s",
        }}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing..." : "Sync Now"}
      </button>
    </div>
  );
}
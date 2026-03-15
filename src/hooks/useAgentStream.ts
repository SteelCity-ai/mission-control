"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export interface AgentStatus {
  id: string;
  name: string;
  status: "active" | "idle" | "error" | "unknown";
  model?: string;
  lastActivity?: string;
}

interface UseAgentStreamOptions {
  /** Maximum retry attempts before falling back to polling (default: 3) */
  maxRetries?: number;
  /** Polling fallback URL (default: /api/agents) */
  fallbackUrl?: string;
  /** Polling interval in ms (default: 10000) */
  pollingInterval?: number;
}

interface UseAgentStreamReturn {
  agents: AgentStatus[];
  loading: boolean;
  error: string | null;
  source: "sse" | "polling";
  retryCount: number;
  /** Force reconnect to SSE */
  reconnect: () => void;
  /** Manually switch to polling fallback */
  switchToPolling: () => void;
}

/**
 * React hook for real-time agent status via SSE with polling fallback
 */
export function useAgentStream(options: UseAgentStreamOptions = {}): UseAgentStreamReturn {
  const {
    maxRetries = 3,
    fallbackUrl = "/api/agents",
    pollingInterval = 10000,
  } = options;

  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"sse" | "polling">("sse");
  const [retryCount, setRetryCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const fetchPolling = useCallback(async () => {
    try {
      const res = await fetch(fallbackUrl);
      const data = await res.json();
      const apiAgents = data.agents || [];
      
      // Transform API response to AgentStatus format
      const transformed: AgentStatus[] = apiAgents.map((agent: any) => ({
        id: agent.id,
        name: agent.name || agent.id,
        status: agent.status === "online" ? "active" : 
                agent.status === "offline" ? "idle" :
                agent.status || "idle",
        model: agent.model,
        lastActivity: agent.lastActivity,
      }));
      
      setAgents(transformed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  }, [fallbackUrl]);

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;
    
    isPollingRef.current = true;
    setSource("polling");
    setError(null);
    
    // Initial fetch
    fetchPolling();
    
    // Start interval
    pollingIntervalRef.current = setInterval(fetchPolling, pollingInterval);
  }, [fetchPolling, pollingInterval]);

  const stopPolling = useCallback(() => {
    clearPolling();
    isPollingRef.current = false;
  }, [clearPolling]);

  const connectSSE = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setLoading(true);
    setError(null);

    const eventSource = new EventSource("/api/agents/stream");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setLoading(false);
      setRetryCount(0);
      setError(null);
      // Switch to SSE source if we were polling
      if (isPollingRef.current) {
        stopPolling();
        setSource("sse");
        isPollingRef.current = false;
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.agents && Array.isArray(data.agents)) {
          setAgents(data.agents);
        }
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
      
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      if (newRetryCount >= maxRetries) {
        // Max retries reached, fall back to polling
        setError("SSE connection failed, falling back to polling");
        startPolling();
      } else {
        // Retry SSE connection (EventSource handles reconnection automatically)
        setError(`Connection error (retry ${newRetryCount}/${maxRetries})`);
      }
    };
  }, [retryCount, maxRetries, startPolling, stopPolling]);

  const reconnect = useCallback(() => {
    stopPolling();
    setRetryCount(0);
    setSource("sse");
    connectSSE();
  }, [connectSSE, stopPolling]);

  const switchToPolling = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    startPolling();
  }, [startPolling]);

  // Initial connection
  useEffect(() => {
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      clearPolling();
    };
  }, []);

  return {
    agents,
    loading,
    error,
    source,
    retryCount,
    reconnect,
    switchToPolling,
  };
}
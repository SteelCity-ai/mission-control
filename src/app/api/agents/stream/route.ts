/**
 * Real-time agent status stream via SSE
 * GET /api/agents/stream
 * Polls OpenClaw gateway every 2 seconds for agent status updates
 */
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

// Gateway URL for OpenClaw - try Docker internal first, then local
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://host.docker.internal:18789';
const GATEWAY_FALLBACK = 'http://127.0.0.1:18789';

interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'unknown';
  model?: string;
  lastActivity?: string;
}

interface StreamData {
  agents: AgentStatus[];
  timestamp: string;
  source: 'gateway' | 'fallback' | 'config';
}

// Fallback config used when an agent doesn't define its own ui config
const DEFAULT_AGENT_CONFIG: Record<string, { emoji: string; color: string; name?: string }> = {
  main: {
    emoji: process.env.NEXT_PUBLIC_AGENT_EMOJI || '🤖',
    color: '#ff6b35',
    name: process.env.NEXT_PUBLIC_AGENT_NAME || 'Mission Control',
  },
};

/**
 * Try to get agent status from OpenClaw gateway
 */
async function fetchGatewayAgents(): Promise<AgentStatus[] | null> {
  const urls = [GATEWAY_URL, GATEWAY_FALLBACK];
  
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${url}/agents`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        const data = await response.json();
        return data.agents?.map((agent: any) => ({
          id: agent.id,
          name: agent.name || agent.id,
          status: agent.status === 'active' ? 'active' : 
                  agent.status === 'busy' ? 'active' :
                  agent.status === 'idle' ? 'idle' : 'idle',
          model: agent.model,
          lastActivity: agent.lastActivity || agent.lastSeen,
        })) || [];
      }
    } catch {
      // Try next URL
    }
  }
  
  return null;
}

/**
 * Get session counts per agent from openclaw sessions command
 */
function getAgentSessionCounts(): Record<string, number> {
  try {
    const output = execSync('openclaw sessions --all-agents --json 2>/dev/null', {
      timeout: 5000,
      encoding: 'utf-8',
    });
    const data = JSON.parse(output);
    const sessions: Array<{ agentId: string }> = data.sessions || [];
    
    const counts: Record<string, number> = {};
    for (const session of sessions) {
      const agentId = session.agentId;
      counts[agentId] = (counts[agentId] || 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

/**
 * Get agent display info from config or defaults
 */
function getAgentDisplayInfo(agentId: string, agentConfig: any): { name: string } {
  const configName = agentConfig?.name;
  const defaults = DEFAULT_AGENT_CONFIG[agentId];
  return {
    name: configName || defaults?.name || agentId,
  };
}

/**
 * Get agent status from local config (fallback when gateway unavailable)
 */
function getLocalAgents(): AgentStatus[] {
  try {
    const configPath = (process.env.OPENCLAW_DIR || '/root/.openclaw') + '/openclaw.json';
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const sessionCounts = getAgentSessionCounts();
    
    return config.agents.list.map((agent: any) => {
      const agentInfo = getAgentDisplayInfo(agent.id, agent);
      
      // Check memory file for activity
      const memoryPath = join(agent.workspace, 'memory');
      let lastActivity: string | undefined;
      let status: 'active' | 'idle' | 'error' = 'idle';
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const memoryFile = join(memoryPath, `${today}.md`);
        const stat = require('fs').statSync(memoryFile);
        lastActivity = stat.mtime.toISOString();
        // Active if activity within last 2 minutes
        status = Date.now() - stat.mtime.getTime() < 2 * 60 * 1000 ? 'active' : 'idle';
      } catch {
        // No recent activity
      }
      
      // If active sessions, mark as active
      if (sessionCounts[agent.id] > 0) {
        status = 'active';
      }
      
      return {
        id: agent.id,
        name: agentInfo.name,
        status,
        model: agent.model?.primary || config.agents.defaults?.model?.primary,
        lastActivity,
      };
    });
  } catch (error) {
    console.error('Error reading local agents:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: StreamData) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller closed
        }
      };

      // Send initial connection message
      send({
        agents: [],
        timestamp: new Date().toISOString(),
        source: 'config',
      });

      let lastAgents: AgentStatus[] = [];

      const poll = async () => {
        if (closed) return;

        try {
          // Try gateway first
          let agents = await fetchGatewayAgents();
          let source: StreamData['source'] = 'gateway';
          
          // Fallback to local config
          if (!agents || agents.length === 0) {
            agents = getLocalAgents();
            source = agents.length > 0 ? 'fallback' : 'config';
          }

          // Only send if data changed
          const agentsJson = JSON.stringify(agents);
          if (agentsJson !== JSON.stringify(lastAgents)) {
            lastAgents = agents || [];
            send({
              agents: lastAgents,
              timestamp: new Date().toISOString(),
              source,
            });
          }
        } catch (error) {
          // On error, send unknown status
          const fallbackAgents: AgentStatus[] = lastAgents.length > 0 
            ? lastAgents.map(a => ({ ...a, status: 'unknown' as const }))
            : [];
          
          send({
            agents: fallbackAgents,
            timestamp: new Date().toISOString(),
            source: 'config',
          });
        }

        if (!closed) {
          setTimeout(poll, 2000);
        }
      };

      // Start polling
      poll();

      // Cleanup on disconnect
      request.signal?.addEventListener('abort', () => {
        closed = true;
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
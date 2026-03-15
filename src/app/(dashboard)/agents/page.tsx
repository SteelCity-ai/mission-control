"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Circle,
  MessageSquare,
  HardDrive,
  Shield,
  Users,
  Activity,
  ExternalLink,
  GitBranch,
  LayoutGrid,
  Briefcase,
} from "lucide-react";
import { AgentOrganigrama } from "@/components/AgentOrganigrama";

// Steel City department mapping
const AGENT_DEPARTMENTS: Record<string, { dept: string; color: string }> = {
  main: { dept: "Command", color: "#FF6B35" },
  foreman: { dept: "Project Planning", color: "#8B5CF6" },
  research: { dept: "Research", color: "#8B5CF6" },
  architect: { dept: "Architecture", color: "#F59E0B" },
  build: { dept: "Build", color: "#EF4444" },
  design: { dept: "Design", color: "#EC4899" },
  qa: { dept: "QA", color: "#10B981" },
  growth: { dept: "Growth", color: "#3B82F6" },
  reporter: { dept: "Reporting", color: "#14B8A6" },
  "pm-sync": { dept: "PM Sync", color: "#6366F1" },
  macgyver: { dept: "Utilities", color: "#F97316" },
};

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  model: string;
  workspace: string;
  dmPolicy?: string;
  allowAgents: string[];
  allowAgentsDetails?: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
  botToken?: string;
  status: "online" | "offline";
  lastActivity?: string;
  activeSessions: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"cards" | "organigrama">("cards");

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastActivity = (timestamp?: string) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getAgentDepartment = (agentId: string) => {
    return AGENT_DEPARTMENTS[agentId] || { dept: "Unknown", color: "#666" };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-lg" style={{ color: "var(--text-muted)" }}>
            Loading agents...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
            letterSpacing: "-1.5px",
          }}
        >
          <Users className="inline-block w-8 h-8 mr-2 mb-1" />
          Steel City Agents
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          {agents.length} agents configured • Multi-agent system overview
        </p>
      </div>

      {/* Department Legend */}
      <div 
        className="mb-6 p-4 rounded-xl"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider mr-2" style={{ color: "var(--text-muted)" }}>
            Departments
          </span>
          {Object.entries(AGENT_DEPARTMENTS).slice(1).map(([id, { dept, color }]) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: `${color}18`,
                color,
                border: `1px solid ${color}40`,
              }}
            >
              <span 
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              {dept}
            </span>
          ))}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid var(--border)" }}>
        {[
          { id: "cards" as const, label: "Agent Cards", icon: LayoutGrid },
          { id: "organigrama" as const, label: "Organigrama", icon: GitBranch },
        ].map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all rounded-t-lg"
              style={{
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                backgroundColor: isActive ? "var(--accent-soft)" : "transparent",
                borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                outline: "none",
                cursor: "pointer",
                marginBottom: "-1px",
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Organigrama View */}
      {activeTab === "organigrama" && (
        <div className="rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Agent Hierarchy</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Visualization of agent communication allowances</p>
          </div>
          <AgentOrganigrama agents={agents} />
        </div>
      )}

      {/* Agents Grid */}
      {activeTab === "cards" && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.map((agent) => {
          const deptInfo = getAgentDepartment(agent.id);
          
          return (
            <div
              key={agent.id}
              className="agent-card"
              style={{
                backgroundColor: "var(--card)",
                border: `1px solid ${agent.color}30`,
                transition: "all 200ms ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = `${agent.color}80`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${agent.color}20`;
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = `${agent.color}30`;
                (e.currentTarget as HTMLElement).style.boxShadow = "";
                (e.currentTarget as HTMLElement).style.transform = "";
              }}
            >
              {/* Header with status */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: `linear-gradient(135deg, ${agent.color}15, transparent)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                      backgroundColor: `${agent.color}20`,
                      border: `2px solid ${agent.color}`,
                    }}
                  >
                    {agent.emoji}
                  </div>
                  <div>
                    <h3
                      className="text-lg font-bold"
                      style={{
                        fontFamily: "var(--font-heading)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {agent.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Circle
                        className="status-dot"
                        style={{
                          fill: agent.status === "online" ? "#4ade80" : "#6b7280",
                          color: agent.status === "online" ? "#4ade80" : "#6b7280",
                        }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{
                          color:
                            agent.status === "online"
                              ? "#4ade80"
                              : "var(--text-muted)",
                        }}
                      >
                        {agent.status}
                      </span>
                    </div>
                  </div>
                </div>

                {agent.botToken && (
                  <div title="Telegram Bot Connected">
                    <MessageSquare
                      className="w-5 h-5"
                      style={{ color: "#0088cc" }}
                    />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-5 space-y-4">
                {/* Department */}
                <div className="flex items-start gap-3">
                  <Briefcase className="w-4 h-4 mt-0.5" style={{ color: deptInfo.color }} />
                  <div className="flex-1">
                    <div
                      className="text-xs font-medium mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Department
                    </div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: deptInfo.color }}
                    >
                      {deptInfo.dept}
                    </div>
                  </div>
                </div>

                {/* Model */}
                <div className="flex items-start gap-3">
                  <Bot className="w-4 h-4 mt-0.5" style={{ color: agent.color }} />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-xs font-medium mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Model
                    </div>
                    <div
                      className="text-sm font-mono truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {agent.model}
                    </div>
                  </div>
                </div>

                {/* Workspace */}
                <div className="flex items-start gap-3">
                  <HardDrive
                    className="w-4 h-4 mt-0.5"
                    style={{ color: agent.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-xs font-medium mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Workspace
                    </div>
                    <div
                      className="text-sm font-mono truncate"
                      style={{ color: "var(--text-primary)" }}
                      title={agent.workspace}
                    >
                      {agent.workspace}
                    </div>
                  </div>
                </div>

                {/* DM Policy */}
                {agent.dmPolicy && (
                  <div className="flex items-start gap-3">
                    <Shield
                      className="w-4 h-4 mt-0.5"
                      style={{ color: agent.color }}
                    />
                    <div className="flex-1">
                      <div
                        className="text-xs font-medium mb-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        DM Policy
                      </div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {agent.dmPolicy}
                      </div>
                    </div>
                  </div>
                )}

                {/* Subagents */}
                {agent.allowAgents.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Users
                      className="w-4 h-4 mt-0.5"
                      style={{ color: agent.color }}
                    />
                    <div className="flex-1">
                      <div
                        className="text-xs font-medium mb-2"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Can spawn subagents ({agent.allowAgents.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {agent.allowAgentsDetails && agent.allowAgentsDetails.length > 0 ? (
                          agent.allowAgentsDetails.map((subagent) => (
                            <div
                              key={subagent.id}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all hover:scale-105"
                              style={{
                                backgroundColor: `${subagent.color}15`,
                                border: `1px solid ${subagent.color}40`,
                              }}
                              title={`${subagent.name} (${subagent.id})`}
                            >
                              <span className="text-sm">{subagent.emoji}</span>
                              <span
                                style={{
                                  color: subagent.color,
                                  fontWeight: 600,
                                }}
                              >
                                {subagent.name}
                              </span>
                            </div>
                          ))
                        ) : (
                          agent.allowAgents.map((subagent) => (
                            <span
                              key={subagent}
                              className="text-xs px-2 py-1 rounded"
                              style={{
                                backgroundColor: `${agent.color}20`,
                                color: agent.color,
                                fontWeight: 500,
                              }}
                            >
                              {subagent}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Last Activity */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Last activity: {formatLastActivity(agent.lastActivity)}
                    </span>
                  </div>
                  {agent.activeSessions > 0 && (
                    <span
                      className="text-xs font-medium px-2 py-1 rounded"
                      style={{
                        backgroundColor: "var(--success)20",
                        color: "var(--success)",
                      }}
                    >
                      {agent.activeSessions} active
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

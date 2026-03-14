/**
 * Branding Configuration
 * 
 * Customize this file to match your instance's branding.
 * This keeps personal/instance-specific data out of the main codebase.
 */

export const BRANDING = {
  // Main agent name and emoji
  agentName: process.env.NEXT_PUBLIC_AGENT_NAME || "Steel City Command",
  agentEmoji: process.env.NEXT_PUBLIC_AGENT_EMOJI || "⚙️",

  // About page — agent identity
  agentLocation: process.env.NEXT_PUBLIC_AGENT_LOCATION || "Pittsburgh, PA",
  birthDate: process.env.NEXT_PUBLIC_BIRTH_DATE || "",          // ISO date, e.g. "2026-01-01"
  agentAvatar: process.env.NEXT_PUBLIC_AGENT_AVATAR || "",      // path under /public, e.g. "/avatar.jpg"
  agentDescription: process.env.NEXT_PUBLIC_AGENT_DESCRIPTION || "Pittsburgh-based AI agent team — where steel meets silicon.", // one-line description

  // User/owner information (optional - used in workflow descriptions)
  ownerUsername: process.env.NEXT_PUBLIC_OWNER_USERNAME || "steelcityai",
  ownerEmail: process.env.NEXT_PUBLIC_OWNER_EMAIL || "team@steelcityai.com",
  ownerCollabEmail: process.env.NEXT_PUBLIC_OWNER_COLLAB_EMAIL || "collabs@steelcityai.com",

  // Social media handles (optional - for workflow descriptions)
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "@SteelCityAI",

  // Company/organization name (shown in office 3D view)
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || "STEEL CITY AI, LLC",

  // App title (shown in browser tab)
  appTitle: process.env.NEXT_PUBLIC_APP_TITLE || "Steel City Command",

  // Theme name for custom styling
  themeName: process.env.NEXT_PUBLIC_THEME_NAME || "steelcity",
} as const;

// Helper to get full agent display name
export function getAgentDisplayName(): string {
  return `${BRANDING.agentName} ${BRANDING.agentEmoji}`;
}

/**
 * Agent memory stats API
 * GET /api/memory/agents
 * Returns memory counts per agent from local memory files
 */
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/root/.openclaw';
const WORKSPACE = path.join(OPENCLAW_DIR, 'workspace');
const MEMORY_DIR = path.join(WORKSPACE, 'memory');

interface AgentMemoryStats {
  agentId: string;
  agentName: string;
  agentEmoji: string;
  department: string;
  memoryFiles: number;
  totalEntries: number;
  lastUpdated: string | null;
}

// Steel City agent info
const STEEL_CITY_AGENTS: Record<string, { name: string; emoji: string; department: string }> = {
  main: { name: 'Yoda', emoji: '🧙', department: 'Command' },
  foreman: { name: 'R2', emoji: '🤖', department: 'Project Planning' },
  research: { name: '3CP0', emoji: '🔍', department: 'Research' },
  architect: { name: 'Akbar', emoji: '📐', department: 'Architecture' },
  build: { name: 'Luke', emoji: '🔨', department: 'Build' },
  design: { name: 'Leia', emoji: '🎨', department: 'Design' },
  qa: { name: 'Han', emoji: '🎯', department: 'QA' },
  growth: { name: 'Lando', emoji: '📈', department: 'Growth' },
  reporter: { name: 'Chewy', emoji: '📊', department: 'Reporting' },
  'pm-sync': { name: 'OBWON', emoji: '📋', department: 'PM Sync' },
  macgyver: { name: 'MacGyver', emoji: '🛠️', department: 'Utilities' },
};

async function countMemoryEntries(filePath: string): Promise<number> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    // Count distinct entries (lines that look like dated entries or section headers)
    const lines = content.split('\n');
    let count = 0;
    let inEntry = false;
    
    for (const line of lines) {
      // Count markdown headers as entry markers
      if (line.match(/^#{1,3}\s+/)) {
        count++;
        inEntry = true;
      } else if (line.match(/^\d{4}-\d{2}-\d{2}/)) {
        // Date-based entries
        count++;
        inEntry = true;
      } else if (line.trim() === '---' && inEntry) {
        // Entry separators
        count++;
      }
    }
    
    // Minimum 1 if file exists and has content
    return count > 0 ? count : 1;
  } catch {
    return 0;
  }
}

async function getLastUpdated(filePath: string): Promise<string | null> {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime.toISOString();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const agents: AgentMemoryStats[] = [];
    
    // Check for agent-specific memory files in memory directory
    // Files like: 2025-01-15.md, or agent-specific naming
    
    // Also check root workspace files (AGENTS.md, MEMORY.md, etc.)
    const rootFiles = ['MEMORY.md', 'SOUL.md', 'USER.md', 'AGENTS.md'];
    
    // Build agent stats
    for (const [agentId, info] of Object.entries(STEEL_CITY_AGENTS)) {
      let memoryFiles = 0;
      let totalEntries = 0;
      let lastUpdated: string | null = null;
      
      // Check for agent-specific memory files
      try {
        const files = await fs.readdir(MEMORY_DIR);
        const agentFiles = files.filter(f => 
          f.includes(agentId) || f.includes(info.name.toLowerCase())
        );
        
        for (const file of agentFiles) {
          const filePath = path.join(MEMORY_DIR, file);
          memoryFiles++;
          totalEntries += await countMemoryEntries(filePath);
          const fileUpdated = await getLastUpdated(filePath);
          if (!lastUpdated || (fileUpdated && fileUpdated > lastUpdated)) {
            lastUpdated = fileUpdated;
          }
        }
      } catch {
        // Memory directory might not exist
      }
      
      // Check root workspace memory files
      for (const rootFile of rootFiles) {
        const rootPath = path.join(WORKSPACE, rootFile);
        try {
          await fs.access(rootPath);
          const fileUpdated = await getLastUpdated(rootPath);
          if (!lastUpdated || (fileUpdated && fileUpdated > lastUpdated)) {
            lastUpdated = fileUpdated;
          }
        } catch {
          // File doesn't exist
        }
      }
      
      // Add at least 1 entry if agent is known
      if (totalEntries === 0 && Object.keys(STEEL_CITY_AGENTS).includes(agentId)) {
        totalEntries = 1;
        memoryFiles = rootFiles.length;
      }
      
      agents.push({
        agentId,
        agentName: info.name,
        agentEmoji: info.emoji,
        department: info.department,
        memoryFiles,
        totalEntries,
        lastUpdated,
      });
    }
    
    // Also include "workspace" as a catch-all
    agents.push({
      agentId: 'workspace',
      agentName: 'Workspace',
      agentEmoji: '📁',
      department: 'System',
      memoryFiles: 0,
      totalEntries: 0,
      lastUpdated: null,
    });
    
    // Try to count actual memory files in workspace
    try {
      const memFiles = await fs.readdir(MEMORY_DIR);
      const mdFiles = memFiles.filter(f => f.endsWith('.md'));
      
      // Update workspace stats
      const wsIndex = agents.findIndex(a => a.agentId === 'workspace');
      if (wsIndex >= 0) {
        agents[wsIndex].memoryFiles = mdFiles.length;
        
        // Calculate total entries across all memory files
        let totalWsEntries = 0;
        let latestUpdate: string | null = null;
        
        for (const file of mdFiles.slice(0, 30)) {
          const filePath = path.join(MEMORY_DIR, file);
          totalWsEntries += await countMemoryEntries(filePath);
          const fileUpdated = await getLastUpdated(filePath);
          if (!latestUpdate || (fileUpdated && fileUpdated > latestUpdate)) {
            latestUpdate = fileUpdated;
          }
        }
        
        agents[wsIndex].totalEntries = totalWsEntries;
        agents[wsIndex].lastUpdated = latestUpdate;
      }
    } catch {
      // Memory directory doesn't exist
    }
    
    return NextResponse.json({ 
      agents,
      totalMemoryFiles: agents.reduce((sum, a) => sum + a.memoryFiles, 0),
      totalEntries: agents.reduce((sum, a) => sum + a.totalEntries, 0),
    });
  } catch (error) {
    console.error('[memory/agents] Error:', error);
    return NextResponse.json({ error: 'Failed to get agent memory stats' }, { status: 500 });
  }
}
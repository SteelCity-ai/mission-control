import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || "/data/.openclaw";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  modified?: Date;
  children?: FileNode[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspace = searchParams.get("workspace") || "main";
  const filePath = searchParams.get("path") || "";

  try {
    // Read workspace paths from openclaw.json
    const configPath = path.join(OPENCLAW_DIR, "openclaw.json");
    let openclawConfig: any = {};
    try {
      const configContent = await fs.readFile(configPath, "utf-8");
      openclawConfig = JSON.parse(configContent);
    } catch (e) {
      console.warn("Could not read openclaw.json, using defaults");
    }

    let workspacePath = "";
    
    // Map workspace ID to actual path from config
    if (workspace === "main" || workspace === "workspace") {
      workspacePath = path.join(OPENCLAW_DIR, "workspace");
    } else {
      // Check config for agent workspace
      const agents = openclawConfig?.agents?.list || [];
      const agent = agents.find((a: any) => a.id === workspace || a.name?.toLowerCase() === workspace);
      
      if (agent && agent.workspace) {
        // Resolve ~ to OPENCLAW_DIR parent
        workspacePath = agent.workspace.replace(/^~\/\.openclaw/, OPENCLAW_DIR);
      } else {
        // Fallback
        workspacePath = path.join(OPENCLAW_DIR, `workspace-${workspace}`);
        if (workspace.startsWith("workspace-")) {
          workspacePath = path.join(OPENCLAW_DIR, workspace);
        }
      }
    }

    const fullPath = path.join(workspacePath, filePath);
    
    // Prevent directory traversal
    if (!fullPath.startsWith(workspacePath)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    try {
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        const items = await fs.readdir(fullPath, { withFileTypes: true });
        
        const files: FileNode[] = [];
        for (const item of items) {
          // Skip hidden files/folders
          if (item.name.startsWith('.')) continue;
          
          const itemPath = path.join(fullPath, item.name);
          try {
            const itemStats = await fs.stat(itemPath);
            files.push({
              name: item.name,
              path: path.join(filePath, item.name).replace(/\\/g, '/'),
              type: item.isDirectory() ? "folder" : "file",
              size: itemStats.size,
              modified: itemStats.mtime
            });
          } catch (e) {
            // Ignore items we can't stat
          }
        }
        
        // Sort: folders first, then alphabetically
        files.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === "folder" ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        
        return NextResponse.json(files);
      } else {
        // Return file content
        const content = await fs.readFile(fullPath, "utf-8");
        return NextResponse.json({ path: filePath, content });
      }
    } catch (e) {
      return NextResponse.json({ error: "File or directory not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}

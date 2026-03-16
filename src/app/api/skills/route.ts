import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const BUILT_IN_SKILLS_DIR = "/data/.npm-global/lib/node_modules/openclaw/skills";
const OPENCLAW_DIR = process.env.OPENCLAW_DIR || "/data/.openclaw";
const WORKSPACE_SKILLS_DIR = path.join(OPENCLAW_DIR, "workspace", "skills");

interface Skill {
  id: string;
  name: string;
  description: string;
  source: "system" | "workspace";
  path: string;
}

function parseFrontmatter(content: string): Record<string, string> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match || !match[1]) return null;
  
  const result: Record<string, string> = {};
  const lines = match[1].split("\n");
  
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    if (key && value) {
      result[key] = value;
    }
  }
  
  return result;
}

async function scanSkillDir(dirPath: string, location: "built-in" | "workspace"): Promise<Skill[]> {
  const skills: Skill[] = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillDirPath = path.join(dirPath, entry.name);
        const skillMdPath = path.join(skillDirPath, "SKILL.md");
        
        try {
          const content = await fs.readFile(skillMdPath, "utf-8");
          const frontmatter = parseFrontmatter(content);
          
          if (frontmatter && frontmatter.name) {
            skills.push({
              id: entry.name,
              name: frontmatter.name,
              description: frontmatter.description || "No description provided.",
              source: location === "built-in" ? "system" : "workspace",
              path: skillDirPath,
            });
          }
        } catch (e) {
          // SKILL.md not found or accessible, skip
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to read skills directory ${dirPath}:`, error);
  }
  return skills;
}

export async function GET() {
  try {
    const [builtInSkills, workspaceSkills] = await Promise.all([
      scanSkillDir(BUILT_IN_SKILLS_DIR, "built-in"),
      scanSkillDir(WORKSPACE_SKILLS_DIR, "workspace")
    ]);

    const allSkills = [...builtInSkills, ...workspaceSkills];

    return NextResponse.json({ skills: allSkills });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { OPENCLAW_HOME } from "@/lib/openclaw";

interface SkillInfo {
  name: string;
  hasSkillMd: boolean;
  skillMdContent?: string;
}

interface PluginInfo {
  name: string;
  path: string;
  hasConfig: boolean;
  skillCount: number;
  skills: SkillInfo[];
  description?: string;
  version?: string;
  readmeContent?: string;
  fileCount?: number;
  totalSize?: number;
}

export async function GET() {
  try {
    const extDir = path.join(OPENCLAW_HOME, "extensions");

    let entries;
    try {
      entries = await fs.readdir(extDir, { withFileTypes: true });
    } catch {
      return NextResponse.json({ success: true, data: [] });
    }

    const plugins: PluginInfo[] = [];

    for (const entry of entries.filter((e) => e.isDirectory())) {
      const pluginPath = path.join(extDir, entry.name);
      const pluginInfo: PluginInfo = {
        name: entry.name,
        path: pluginPath,
        hasConfig: false,
        skillCount: 0,
        skills: [],
      };

      try {
        const files = await fs.readdir(pluginPath, { withFileTypes: true });

        // Check for config files and extract metadata
        for (const configFile of ["package.json", "openclaw.plugin.json", "manifest.json"]) {
          if (files.some((f) => f.name === configFile)) {
            pluginInfo.hasConfig = true;
            try {
              const content = await fs.readFile(path.join(pluginPath, configFile), "utf-8");
              const parsed = JSON.parse(content);
              pluginInfo.description = parsed.description || parsed.name;
              pluginInfo.version = parsed.version;
            } catch {
              // skip unreadable config
            }
            break;
          }
        }

        // Read README.md
        if (files.some((f) => f.name === "README.md")) {
          try {
            pluginInfo.readmeContent = await fs.readFile(
              path.join(pluginPath, "README.md"),
              "utf-8"
            );
            // Truncate if too long
            if (pluginInfo.readmeContent.length > 2000) {
              pluginInfo.readmeContent = pluginInfo.readmeContent.slice(0, 2000) + "\n\n... (truncated)";
            }
          } catch {
            // skip
          }
        }

        // Count files recursively (shallow)
        let fileCount = 0;
        let totalSize = 0;
        for (const f of files) {
          try {
            const stat = await fs.stat(path.join(pluginPath, f.name));
            if (stat.isFile()) {
              fileCount++;
              totalSize += stat.size;
            }
          } catch {
            // skip
          }
        }
        pluginInfo.fileCount = fileCount;
        pluginInfo.totalSize = totalSize;

        // Look for skills directory
        const skillsDir = files.find((f) => f.name === "skills" && f.isDirectory());
        if (skillsDir) {
          const skillEntries = await fs.readdir(
            path.join(pluginPath, "skills"),
            { withFileTypes: true }
          );

          for (const skill of skillEntries.filter((s) => s.isDirectory())) {
            const skillInfo: SkillInfo = { name: skill.name, hasSkillMd: false };
            try {
              const skillFiles = await fs.readdir(
                path.join(pluginPath, "skills", skill.name)
              );
              skillInfo.hasSkillMd = skillFiles.includes("SKILL.md");
              if (skillInfo.hasSkillMd) {
                try {
                  const mdContent = await fs.readFile(
                    path.join(pluginPath, "skills", skill.name, "SKILL.md"),
                    "utf-8"
                  );
                  skillInfo.skillMdContent = mdContent.length > 1000
                    ? mdContent.slice(0, 1000) + "..."
                    : mdContent;
                } catch {
                  // skip
                }
              }
            } catch {
              // skip
            }
            pluginInfo.skills.push(skillInfo);
          }
          pluginInfo.skillCount = pluginInfo.skills.length;
        }
      } catch {
        // skip unreadable plugin dirs
      }

      plugins.push(pluginInfo);
    }

    return NextResponse.json({ success: true, data: plugins });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list plugins";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { OPENCLAW_HOME } from "@/lib/openclaw";

interface PluginInfo {
  name: string;
  path: string;
  hasConfig: boolean;
  skillCount: number;
  skills: { name: string; hasSkillMd: boolean }[];
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

        // Check for config
        pluginInfo.hasConfig = files.some(
          (f) =>
            f.name === "config.json" ||
            f.name === "package.json" ||
            f.name === "manifest.json"
        );

        // Look for skills directory
        const skillsDir = files.find((f) => f.name === "skills" && f.isDirectory());
        if (skillsDir) {
          const skillEntries = await fs.readdir(
            path.join(pluginPath, "skills"),
            { withFileTypes: true }
          );

          for (const skill of skillEntries.filter((s) => s.isDirectory())) {
            try {
              const skillFiles = await fs.readdir(
                path.join(pluginPath, "skills", skill.name)
              );
              pluginInfo.skills.push({
                name: skill.name,
                hasSkillMd: skillFiles.includes("SKILL.md"),
              });
            } catch {
              pluginInfo.skills.push({ name: skill.name, hasSkillMd: false });
            }
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

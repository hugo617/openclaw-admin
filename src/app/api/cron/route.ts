import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { OPENCLAW_HOME } from "@/lib/openclaw";

interface CronTask {
  name: string;
  filename: string;
  config: Record<string, unknown>;
  modifiedAt: string;
  size: number;
}

export async function GET() {
  try {
    const cronDir = path.join(OPENCLAW_HOME, "cron");

    let entries;
    try {
      entries = await fs.readdir(cronDir);
    } catch {
      return NextResponse.json({ success: true, data: [] });
    }

    const tasks: CronTask[] = [];

    for (const filename of entries.filter((f) => f.endsWith(".json"))) {
      const fullPath = path.join(cronDir, filename);
      const stat = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, "utf-8");
      let config: Record<string, unknown>;
      try {
        config = JSON.parse(content);
      } catch {
        config = { _raw: content };
      }

      tasks.push({
        name: filename.replace(/\.json$/, ""),
        filename,
        config,
        modifiedAt: stat.mtime.toISOString(),
        size: stat.size,
      });
    }

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list cron tasks";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { OPENCLAW_HOME } from "@/lib/openclaw";

interface CronRun {
  ts: number;
  jobId: string;
  action: string;
  status: string;
  error?: string;
  summary?: string;
  durationMs?: number;
  model?: string;
  provider?: string;
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number };
}

interface CronTask {
  name: string;
  filename: string;
  config: Record<string, unknown>;
  modifiedAt: string;
  size: number;
  runs: CronRun[];
  stats: {
    totalRuns: number;
    successCount: number;
    errorCount: number;
    avgDurationMs: number;
  };
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

    for (const filename of entries.filter((f) => f.endsWith(".json") && !f.endsWith(".bak"))) {
      const fullPath = path.join(cronDir, filename);
      const stat = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, "utf-8");
      let config: Record<string, unknown>;
      try {
        config = JSON.parse(content);
      } catch {
        config = { _raw: content };
      }

      // Read execution history from runs/
      const runs: CronRun[] = [];
      let successCount = 0;
      let errorCount = 0;
      let totalDuration = 0;

      try {
        const runsDir = path.join(cronDir, "runs");
        const runFiles = await fs.readdir(runsDir);
        // Find runs matching this job (by jobId prefix or filename-based)
        for (const runFile of runFiles.filter((f) => f.endsWith(".jsonl"))) {
          try {
            const runContent = await fs.readFile(path.join(runsDir, runFile), "utf-8");
            const lines = runContent.trim().split("\n").filter(Boolean);
            for (const line of lines) {
              try {
                const run = JSON.parse(line) as CronRun;
                runs.push(run);
                if (run.status === "error") errorCount++;
                else successCount++;
                if (run.durationMs) totalDuration += run.durationMs;
              } catch {
                // skip malformed
              }
            }
          } catch {
            // skip unreadable run files
          }
        }
      } catch {
        // runs dir may not exist
      }

      tasks.push({
        name: filename.replace(/\.json$/, ""),
        filename,
        config,
        modifiedAt: stat.mtime.toISOString(),
        size: stat.size,
        runs: runs.sort((a, b) => b.ts - a.ts).slice(0, 50),
        stats: {
          totalRuns: runs.length,
          successCount,
          errorCount,
          avgDurationMs: runs.length > 0 ? Math.round(totalDuration / runs.length) : 0,
        },
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

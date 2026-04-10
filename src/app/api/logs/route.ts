import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { OPENCLAW_HOME } from "@/lib/openclaw";

interface LogFile {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const logPath = url.searchParams.get("file");
    const lines = parseInt(url.searchParams.get("lines") || "100", 10);

    const logsDir = path.join(OPENCLAW_HOME, "logs");

    // List log files
    if (!logPath) {
      let entries;
      try {
        entries = await fs.readdir(logsDir, { withFileTypes: true });
      } catch {
        return NextResponse.json({ success: true, data: [] });
      }

      const logFiles: LogFile[] = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Check subdirectory for log files
          try {
            const subEntries = await fs.readdir(
              path.join(logsDir, entry.name),
              { withFileTypes: true }
            );
            for (const sub of subEntries.filter((s) => s.isFile())) {
              const fullPath = path.join(logsDir, entry.name, sub.name);
              const stat = await fs.stat(fullPath);
              logFiles.push({
                name: `${entry.name}/${sub.name}`,
                path: `${entry.name}/${sub.name}`,
                size: stat.size,
                modifiedAt: stat.mtime.toISOString(),
              });
            }
          } catch {
            // skip unreadable
          }
        } else if (entry.isFile()) {
          const fullPath = path.join(logsDir, entry.name);
          const stat = await fs.stat(fullPath);
          logFiles.push({
            name: entry.name,
            path: entry.name,
            size: stat.size,
            modifiedAt: stat.mtime.toISOString(),
          });
        }
      }

      return NextResponse.json({ success: true, data: logFiles });
    }

    // Read specific log file
    const fullPath = path.join(logsDir, logPath);
    // Validate no path traversal
    if (!fullPath.startsWith(logsDir)) {
      return NextResponse.json(
        { success: false, error: "Invalid path" },
        { status: 400 }
      );
    }

    const content = await fs.readFile(fullPath, "utf-8");
    const allLines = content.trim().split("\n");
    const tailLines = allLines.slice(-lines);

    return NextResponse.json({
      success: true,
      data: { content: tailLines.join("\n"), totalLines: allLines.length },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read logs";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

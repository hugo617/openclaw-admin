import { NextResponse } from "next/server";
import { OPENCLAW_HOME } from "@/lib/openclaw";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

// Only search key config/data directories, not the entire tree
const SEARCH_DIRS = [
  "agents/main",
  "cron",
  "memory",
  "workspace",
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Search specific directories + root config files
    const allResults: SearchResult[] = [];

    // Search root-level files (openclaw.json, etc.)
    try {
      const { stdout } = await execFileAsync("grep", [
        "-rn",
        "--max-count=3",
        "--binary-files=without-match",
        "--exclude-dir=*",
        "-E",
        safeQuery,
        OPENCLAW_HOME,
      ], { maxBuffer: 256 * 1024, timeout: 3000 });
      allResults.push(...parseGrepOutput(stdout));
    } catch { /* no matches or timeout */ }

    // Search specific subdirectories
    for (const dir of SEARCH_DIRS) {
      const dirPath = path.join(OPENCLAW_HOME, dir);
      try {
        const { stdout } = await execFileAsync("grep", [
          "-rn",
          "--max-count=2",
          "--binary-files=without-match",
          "--exclude=*.{db,sqlite,db-journal,db-wal,db-shm}",
          "-E",
          safeQuery,
          dirPath,
        ], { maxBuffer: 256 * 1024, timeout: 3000 });
        allResults.push(...parseGrepOutput(stdout));
      } catch { /* no matches or timeout */ }

      if (allResults.length >= 30) break;
    }

    return NextResponse.json({
      success: true,
      data: allResults.slice(0, 30),
    });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

interface SearchResult {
  path: string;
  line: number;
  content: string;
}

function parseGrepOutput(stdout: string): SearchResult[] {
  return stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) return null;
      const rest = line.slice(colonIdx + 1);
      const lineNumIdx = rest.indexOf(":");
      if (lineNumIdx === -1) return null;
      const filePath = line.slice(0, colonIdx);
      const lineNumber = rest.slice(0, lineNumIdx);
      const content = rest.slice(lineNumIdx + 1);
      return {
        path: filePath.replace(OPENCLAW_HOME + "/", ""),
        line: parseInt(lineNumber, 10),
        content: content.slice(0, 200),
      };
    })
    .filter(Boolean) as SearchResult[];
}

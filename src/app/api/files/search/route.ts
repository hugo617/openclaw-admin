import { NextResponse } from "next/server";
import { OPENCLAW_HOME } from "@/lib/openclaw";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

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

    // Use grep for fast file content search (safe: query is escaped)
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try {
      const { stdout } = await execFileAsync("grep", [
        "-rn",
        "--max-count=5",
        "--binary-files=without-match",
        "-E",
        safeQuery,
        OPENCLAW_HOME,
      ], {
        maxBuffer: 1024 * 1024,
        timeout: 10000,
      });

      const results = stdout
        .split("\n")
        .filter(Boolean)
        .slice(0, 50)
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
        .filter(Boolean);

      return NextResponse.json({ success: true, data: results });
    } catch {
      // grep returns exit code 1 when no matches
      return NextResponse.json({ success: true, data: [] });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import {
  searchMemory,
  searchMemoryLike,
  getMemoryStats,
  getRecentMemories,
  getMemoriesByPath,
  getFiles,
  isMemoryDbAvailable,
} from "@/lib/memory-client";

export async function GET(request: Request) {
  try {
    if (!isMemoryDbAvailable()) {
      return NextResponse.json({
        success: true,
        data: {
          entries: [],
          stats: { totalChunks: 0, totalFiles: 0, dbSize: 0, bySource: {}, byModel: {} },
          grouped: {},
          files: [],
        },
      });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    const mode = url.searchParams.get("mode");

    if (mode === "stats") {
      const stats = getMemoryStats();
      return NextResponse.json({ success: true, data: stats });
    }

    if (mode === "grouped") {
      const grouped = getMemoriesByPath();
      const stats = getMemoryStats();
      return NextResponse.json({ success: true, data: { grouped, stats } });
    }

    if (mode === "files") {
      const files = getFiles();
      return NextResponse.json({ success: true, data: files });
    }

    let entries;
    if (query) {
      // Try FTS first, fall back to LIKE search
      try {
        entries = searchMemory(query);
      } catch {
        entries = searchMemoryLike(query);
      }
    } else {
      entries = getRecentMemories();
    }

    const stats = getMemoryStats();

    return NextResponse.json({
      success: true,
      data: { entries, stats },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to query memory";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

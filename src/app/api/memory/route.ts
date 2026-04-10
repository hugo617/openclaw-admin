import { NextResponse } from "next/server";
import {
  searchMemory,
  getMemoryStats,
  getRecentMemories,
  isMemoryDbAvailable,
} from "@/lib/memory-client";

export async function GET(request: Request) {
  try {
    if (!isMemoryDbAvailable()) {
      return NextResponse.json({
        success: true,
        data: { entries: [], stats: { totalEntries: 0, dbSize: 0 } },
      });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    const mode = url.searchParams.get("mode");

    if (mode === "stats") {
      const stats = getMemoryStats();
      return NextResponse.json({ success: true, data: stats });
    }

    const entries = query
      ? searchMemory(query)
      : getRecentMemories();

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

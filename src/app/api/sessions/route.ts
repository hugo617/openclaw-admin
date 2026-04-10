import { NextResponse } from "next/server";
import { listSessions } from "@/lib/session-parser";

export async function GET() {
  try {
    const sessions = await listSessions();
    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list sessions";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

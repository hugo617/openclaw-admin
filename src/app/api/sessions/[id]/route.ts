import { NextResponse } from "next/server";
import { getSessionDetail } from "@/lib/session-parser";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const detail = await getSessionDetail(id);
    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get session";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

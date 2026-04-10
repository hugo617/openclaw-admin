import { NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/lib/config";

export async function GET() {
  try {
    const config = await readConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read config";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const config = (await request.json()) as Record<string, unknown>;
    await writeConfig(config);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to write config";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

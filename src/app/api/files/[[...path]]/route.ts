import { NextResponse } from "next/server";
import { buildFileTree, getStats, readFileContent, writeFileContent, resolvePath } from "@/lib/openclaw";
import fs from "fs/promises";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const filePath = (pathSegments ?? []).join("/");

    // No path = root file tree or stats
    if (!filePath) {
      const url = new URL(request.url);
      const mode = url.searchParams.get("mode");

      if (mode === "stats") {
        const stats = await getStats();
        return NextResponse.json({ success: true, data: stats });
      }

      const tree = await buildFileTree();
      return NextResponse.json({ success: true, data: tree });
    }

    // Specific file or directory
    const fullPath = resolvePath(filePath);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const items = entries
        .filter((e) => !e.name.startsWith(".") || e.name === ".env")
        .map((e) => ({
          name: e.name,
          type: e.isDirectory() ? "directory" : "file",
        }));
      return NextResponse.json({ success: true, data: { type: "directory", items } });
    }

    const content = await readFileContent(filePath);
    return NextResponse.json({
      success: true,
      data: { type: "file", content, size: stat.size, modifiedAt: stat.mtime.toISOString() },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read file";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const filePath = (pathSegments ?? []).join("/");

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: "No file path provided" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as { content: string };

    if (typeof body.content !== "string") {
      return NextResponse.json(
        { success: false, error: "content must be a string" },
        { status: 400 }
      );
    }

    await writeFileContent(filePath, body.content);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to write file";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

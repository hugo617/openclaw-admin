import fs from "fs/promises";
import path from "path";
import { OPENCLAW_HOME } from "./openclaw";

export interface SessionMeta {
  id: string;
  filename: string;
  size: number;
  modifiedAt: string;
  messageCount: number;
  status: "active" | "reset" | "deleted";
  channel?: string;
  preview?: string;
}

export interface SessionMessage {
  role: string;
  content: string;
  timestamp?: string;
}

export async function listSessions(): Promise<SessionMeta[]> {
  const sessionsDir = path.join(OPENCLAW_HOME, "agents/main/sessions");

  let entries: string[];
  try {
    entries = await fs.readdir(sessionsDir);
  } catch {
    return [];
  }

  const sessionFiles = entries.filter((f) => f.endsWith(".jsonl"));

  const sessions: SessionMeta[] = [];

  for (const filename of sessionFiles) {
    const fullPath = path.join(sessionsDir, filename);
    const stat = await fs.stat(fullPath);
    const id = filename.replace(/\.jsonl.*$/, "");

    let status: SessionMeta["status"] = "active";
    if (filename.includes(".reset.")) status = "reset";
    else if (filename.includes(".deleted.")) status = "deleted";

    // Read first few lines for preview and count
    let messageCount = 0;
    let preview = "";
    let channel: string | undefined;
    try {
      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      messageCount = lines.length;

      if (lines.length > 0) {
        try {
          const firstMsg = JSON.parse(lines[0]);
          channel = firstMsg.channel || firstMsg.metadata?.channel;
          // Find first user message for preview
          for (const line of lines.slice(0, 5)) {
            try {
              const msg = JSON.parse(line);
              if (msg.role === "user" && msg.content) {
                preview =
                  typeof msg.content === "string"
                    ? msg.content.slice(0, 100)
                    : JSON.stringify(msg.content).slice(0, 100);
                break;
              }
            } catch {
              // skip malformed lines
            }
          }
        } catch {
          // skip malformed first line
        }
      }
    } catch {
      // skip unreadable files
    }

    sessions.push({
      id,
      filename,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      messageCount,
      status,
      channel,
      preview,
    });
  }

  return sessions.sort(
    (a, b) =>
      new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
  );
}

export async function getSessionDetail(
  id: string
): Promise<{ meta: SessionMeta; messages: SessionMessage[] }> {
  const sessionsDir = path.join(OPENCLAW_HOME, "agents/main/sessions");

  // Find the file matching this session ID
  const entries = await fs.readdir(sessionsDir);
  const filename = entries.find(
    (f) => f.startsWith(id) && f.endsWith(".jsonl")
  );
  if (!filename) {
    throw new Error(`Session ${id} not found`);
  }

  const fullPath = path.join(sessionsDir, filename);
  const stat = await fs.stat(fullPath);
  const content = await fs.readFile(fullPath, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);

  const messages: SessionMessage[] = [];
  for (const line of lines) {
    try {
      const msg = JSON.parse(line);
      let content: string;
      if (typeof msg.content === "string") {
        content = msg.content;
      } else if (msg.content == null) {
        content = "";
      } else if (Array.isArray(msg.content)) {
        // Anthropic-style content blocks
        content = msg.content
          .map((block: Record<string, unknown>) => {
            if (typeof block === "string") return block;
            if (block.text) return block.text;
            return JSON.stringify(block);
          })
          .join("\n");
      } else {
        content = JSON.stringify(msg.content, null, 2);
      }
      messages.push({
        role: msg.role || "unknown",
        content,
        timestamp: msg.timestamp || msg.metadata?.timestamp || undefined,
      });
    } catch {
      // skip malformed lines
    }
  }

  let status: SessionMeta["status"] = "active";
  if (filename.includes(".reset.")) status = "reset";
  else if (filename.includes(".deleted.")) status = "deleted";

  return {
    meta: {
      id,
      filename,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      messageCount: messages.length,
      status,
    },
    messages,
  };
}

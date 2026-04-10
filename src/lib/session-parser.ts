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
  model?: string;
  provider?: string;
  cwd?: string;
  version?: number;
  totalTokens?: number;
}

export interface ContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  name?: string;
  id?: string;
  arguments?: Record<string, unknown>;
  toolCallId?: string;
  toolName?: string;
  details?: Record<string, unknown>;
  isError?: boolean;
}

export interface SessionMessage {
  id: string;
  role: string;
  content: string;
  contentBlocks: ContentBlock[];
  timestamp?: string;
  model?: string;
  provider?: string;
  usage?: {
    input: number;
    output: number;
    totalTokens: number;
    cost?: { total: number };
  };
  stopReason?: string;
}

interface JsonlLine {
  type: string;
  id?: string;
  timestamp?: string;
  message?: {
    role: string;
    content: ContentBlock[] | string;
    timestamp?: number;
    model?: string;
    provider?: string;
    usage?: SessionMessage["usage"];
    stopReason?: string;
  };
  provider?: string;
  modelId?: string;
  cwd?: string;
  version?: number;
  customType?: string;
  data?: Record<string, unknown>;
}

function extractTextFromBlocks(blocks: ContentBlock[]): string {
  return blocks
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text!)
    .join("\n");
}

function extractPreviewFromBlocks(blocks: ContentBlock[]): string {
  const text = extractTextFromBlocks(blocks);
  return text.slice(0, 100);
}

function inferChannelFromCustom(data: Record<string, unknown> | undefined): string | undefined {
  if (!data) return undefined;
  const sender = data.sender as string | undefined;
  const isGroup = data.is_group_chat as boolean | undefined;
  if (sender) return isGroup ? "group" : "dm";
  return undefined;
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

    let messageCount = 0;
    let preview = "";
    let channel: string | undefined;
    let model: string | undefined;
    let provider: string | undefined;
    let cwd: string | undefined;
    let version: number | undefined;
    let totalTokens = 0;

    try {
      const fileContent = await fs.readFile(fullPath, "utf-8");
      const lines = fileContent.trim().split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const parsed: JsonlLine = JSON.parse(line);

          if (parsed.type === "session") {
            cwd = parsed.cwd;
            version = parsed.version;
          } else if (parsed.type === "model_change") {
            model = parsed.modelId;
            provider = parsed.provider;
          } else if (parsed.type === "message" && parsed.message) {
            messageCount++;
            if (!preview && parsed.message.role === "user") {
              const blocks = Array.isArray(parsed.message.content)
                ? parsed.message.content
                : [{ type: "text", text: String(parsed.message.content) }];
              // Strip metadata prefixes from preview
              let previewText = extractPreviewFromBlocks(blocks);
              const metadataPrefix = "Conversation info (untrusted metadata):";
              if (previewText.includes(metadataPrefix)) {
                const lines = previewText.split("\n");
                const afterMetadata = lines.slice(
                  lines.findIndex((l) => l.includes("]: ")) + 1
                );
                previewText = afterMetadata.join(" ").slice(0, 100);
              }
              preview = previewText;
            }
            if (
              parsed.message.role === "user" &&
              Array.isArray(parsed.message.content)
            ) {
              const customBlocks = parsed.message.content.filter(
                (b) => b.type === "text" && (b.text?.includes("sender") || b.text?.includes("group_subject"))
              );
              if (customBlocks.length > 0) {
                channel = "messaging";
              }
            }
            if (
              parsed.message.role === "assistant" &&
              parsed.message.usage
            ) {
              totalTokens += parsed.message.usage.totalTokens ?? 0;
            }
          } else if (parsed.type === "custom" && parsed.customType) {
            const ch = inferChannelFromCustom(
              parsed.data as Record<string, unknown>
            );
            if (ch) channel = ch;
          }
        } catch {
          // skip malformed lines
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
      model,
      provider,
      cwd,
      version,
      totalTokens: totalTokens > 0 ? totalTokens : undefined,
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

  const entries = await fs.readdir(sessionsDir);
  const filename = entries.find(
    (f) => f.startsWith(id) && f.endsWith(".jsonl")
  );
  if (!filename) {
    throw new Error(`Session ${id} not found`);
  }

  const fullPath = path.join(sessionsDir, filename);
  const stat = await fs.stat(fullPath);
  const fileContent = await fs.readFile(fullPath, "utf-8");
  const lines = fileContent.trim().split("\n").filter(Boolean);

  const messages: SessionMessage[] = [];
  let model: string | undefined;
  let provider: string | undefined;
  let cwd: string | undefined;
  let version: number | undefined;
  let channel: string | undefined;
  let totalTokens = 0;

  for (const line of lines) {
    try {
      const parsed: JsonlLine = JSON.parse(line);

      if (parsed.type === "session") {
        cwd = parsed.cwd;
        version = parsed.version;
      } else if (parsed.type === "model_change") {
        model = parsed.modelId;
        provider = parsed.provider;
      } else if (parsed.type === "custom" && parsed.customType) {
        const ch = inferChannelFromCustom(
          parsed.data as Record<string, unknown>
        );
        if (ch) channel = ch;
      } else if (parsed.type === "message" && parsed.message) {
        const blocks: ContentBlock[] = Array.isArray(parsed.message.content)
          ? parsed.message.content
          : [{ type: "text", text: String(parsed.message.content ?? "") }];

        const textContent = extractTextFromBlocks(blocks);

        if (parsed.message.usage) {
          totalTokens += parsed.message.usage.totalTokens ?? 0;
        }

        messages.push({
          id: parsed.id ?? "",
          role: parsed.message.role,
          content: textContent,
          contentBlocks: blocks,
          timestamp: parsed.timestamp,
          model: parsed.message.model,
          provider: parsed.message.provider,
          usage: parsed.message.usage,
          stopReason: parsed.message.stopReason,
        });
      }
      // Skip other types: thinking_level_change, summary, etc.
    } catch {
      // skip malformed lines
    }
  }

  let status: SessionMeta["status"] = "active";
  if (filename.includes(".reset.")) status = "reset";
  else if (filename.includes(".deleted.")) status = "deleted";

  let preview: string | undefined;
  const firstUser = messages.find((m) => m.role === "user");
  if (firstUser) {
    preview = firstUser.content.slice(0, 100);
  }

  return {
    meta: {
      id,
      filename,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      messageCount: messages.length,
      status,
      channel,
      preview,
      model,
      provider,
      cwd,
      version,
      totalTokens: totalTokens > 0 ? totalTokens : undefined,
    },
    messages,
  };
}

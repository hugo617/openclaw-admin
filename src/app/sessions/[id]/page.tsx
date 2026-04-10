"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatSize } from "@/lib/format";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  name?: string;
  arguments?: Record<string, unknown>;
  toolCallId?: string;
  toolName?: string;
  details?: Record<string, unknown>;
  isError?: boolean;
}

interface SessionMessage {
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

interface SessionDetail {
  meta: {
    id: string;
    filename: string;
    size: number;
    modifiedAt: string;
    messageCount: number;
    status: "active" | "reset" | "deleted";
    model?: string;
    provider?: string;
    totalTokens?: number;
  };
  messages: SessionMessage[];
}

function roleColor(role: string): string {
  switch (role) {
    case "user":
      return "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400";
    case "assistant":
      return "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400";
    case "toolResult":
      return "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400";
    case "system":
      return "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400";
    default:
      return "bg-muted border-border";
  }
}

function ThinkingBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <span>{expanded ? "▾" : "▸"}</span> Thinking ({text.length} chars)
      </button>
      {expanded && (
        <div className="mt-1 p-2 rounded bg-muted/50 text-xs text-muted-foreground whitespace-pre-wrap max-h-48 overflow-auto">
          {text}
        </div>
      )}
    </div>
  );
}

function ToolCallBlock({ name, args }: { name: string; args: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-2 rounded border border-border/50 bg-muted/30 p-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs w-full text-left"
      >
        <Badge variant="outline" className="text-xs font-mono">{name}</Badge>
        <span className="text-muted-foreground">
          {expanded ? "Hide args" : "Show args"}
        </span>
      </button>
      {expanded && (
        <pre className="mt-2 text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-32">
          {JSON.stringify(args, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ToolResultBlock({ name, content, details, isError }: {
  name?: string;
  content: string;
  details?: Record<string, unknown>;
  isError?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-2 rounded border border-border/50 bg-muted/30 p-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs w-full text-left"
      >
        {name && <Badge variant="outline" className="text-xs font-mono">{name}</Badge>}
        {isError && <Badge variant="destructive" className="text-xs">Error</Badge>}
        {details && (
          <span className="text-muted-foreground">
            {String(details.exitCode !== undefined ? `exit: ${details.exitCode}` : "")}
            {details.durationMs !== undefined ? ` ${details.durationMs}ms` : ""}
          </span>
        )}
        <span className="text-muted-foreground ml-auto">
          {expanded ? "Hide" : "Show"}
        </span>
      </button>
      {expanded && (
        <pre className="mt-2 text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-32 whitespace-pre-wrap">
          {content}
        </pre>
      )}
    </div>
  );
}

function MessageContent({ message }: { message: SessionMessage }) {
  const hasBlocks = message.contentBlocks.length > 0;

  if (!hasBlocks) {
    return (
      <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{message.content || ""}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="text-sm space-y-2">
      {message.contentBlocks.map((block, i) => {
        if (block.type === "text" && block.text) {
          return (
            <div key={i} className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  code(props) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    const inline = !match;
                    if (inline) {
                      return (
                        <code className="bg-muted px-1 py-0.5 rounded text-xs" {...rest}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md text-xs"
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    );
                  },
                }}
              >
                {block.text}
              </ReactMarkdown>
            </div>
          );
        }
        if (block.type === "thinking" && block.thinking) {
          return <ThinkingBlock key={i} text={block.thinking} />;
        }
        if (block.type === "toolCall" && block.name) {
          return (
            <ToolCallBlock
              key={i}
              name={block.name}
              args={block.arguments ?? {}}
            />
          );
        }
        if (block.type === "toolResult") {
          const textBlock = block.text ?? JSON.stringify(block);
          return (
            <ToolResultBlock
              key={i}
              name={block.toolName}
              content={textBlock}
              details={block.details as Record<string, unknown> | undefined}
              isError={block.isError}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (res.success) setDetail(res.data);
        else setError(res.error);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load session");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-96 bg-muted rounded" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <Card>
          <CardContent className="p-6 text-destructive">
            {error || "Session not found"}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Back
        </Button>
        <h2 className="text-lg font-semibold font-mono">{id}</h2>
        <Badge>{detail.meta.status}</Badge>
      </div>

      {/* Session Info */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span>{detail.meta.messageCount} messages</span>
        <span>{formatSize(detail.meta.size)}</span>
        {detail.meta.model && <Badge variant="outline">{detail.meta.model}</Badge>}
        {detail.meta.totalTokens != null && (
          <span>{detail.meta.totalTokens.toLocaleString()} tokens</span>
        )}
        <span>{new Date(detail.meta.modifiedAt).toLocaleString()}</span>
      </div>

      {/* Messages */}
      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-3">
          {detail.messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg border p-4 ${roleColor(msg.role)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {msg.role}
                </Badge>
                {msg.model && (
                  <Badge variant="secondary" className="text-xs">{msg.model}</Badge>
                )}
                {msg.usage && (
                  <span className="text-xs text-muted-foreground">
                    {msg.usage.totalTokens.toLocaleString()} tokens
                    {msg.usage.cost && ` ($${msg.usage.cost.total.toFixed(4)})`}
                  </span>
                )}
                {msg.timestamp && !isNaN(new Date(msg.timestamp).getTime()) && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                )}
              </div>
              <MessageContent message={msg} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

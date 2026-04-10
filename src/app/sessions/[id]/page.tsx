"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatSize } from "@/lib/format";

interface SessionMessage {
  role: string;
  content: string;
  timestamp?: string;
}

interface SessionDetail {
  meta: {
    id: string;
    filename: string;
    size: number;
    modifiedAt: string;
    messageCount: number;
    status: "active" | "reset" | "deleted";
  };
  messages: SessionMessage[];
}

function roleColor(role: string): string {
  switch (role) {
    case "user":
      return "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400";
    case "assistant":
      return "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400";
    case "system":
      return "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400";
    default:
      return "bg-muted border-border";
  }
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setDetail(res.data);
        else setError(res.error);
      })
      .catch(() => setError("Failed to load session"))
      .finally(() => setLoading(false));
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
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{detail.meta.messageCount} messages</span>
        <span>{formatSize(detail.meta.size)}</span>
        <span>{new Date(detail.meta.modifiedAt).toLocaleString()}</span>
      </div>

      {/* Messages */}
      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-3">
          {detail.messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 ${roleColor(msg.role)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {msg.role}
                </Badge>
                {msg.timestamp && !isNaN(new Date(msg.timestamp).getTime()) && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="text-sm whitespace-pre-wrap break-words max-w-full overflow-hidden">
                {(msg.content ?? "").length > 2000
                  ? (msg.content ?? "").slice(0, 2000) + "... (truncated)"
                  : msg.content ?? ""}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

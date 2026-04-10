"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type ConfigData = Record<string, unknown>;

function JsonHighlight({ content }: { content: string }) {
  const highlighted = useMemo(() => {
    try {
      const formatted = JSON.stringify(JSON.parse(content), null, 2);
      return formatted
        .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span style="color: hsl(221, 83%, 53%)">$1</span>:')
        .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color: hsl(142, 71%, 45%)">$1</span>')
        .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color: hsl(38, 92%, 50%)">$1</span>')
        .replace(/:\s*(true|false)/g, ': <span style="color: hsl(0, 84%, 60%)">$1</span>')
        .replace(/:\s*(null)/g, ': <span style="color: hsl(0, 0%, 50%)">$1</span>');
    } catch {
      return null;
    }
  }, [content]);

  if (highlighted === null) {
    return <pre className="text-sm font-mono whitespace-pre-wrap">{content}</pre>;
  }
  return (
    <pre
      className="text-sm font-mono whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

export default function ConfigPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setConfig(res.data);
        else setError(res.error);
      })
      .catch(() => setError("Failed to load config"))
      .finally(() => setLoading(false));
  }, []);

  function startEditing() {
    if (config) {
      setEditContent(JSON.stringify(config, null, 2));
      setEditing(true);
    }
  }

  async function saveConfig() {
    setSaving(true);
    setError(null);
    try {
      const parsed = JSON.parse(editContent);
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(parsed);
        setEditing(false);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Invalid JSON format");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-96 bg-muted rounded" />
      </div>
    );
  }

  const configStr = config ? JSON.stringify(config, null, 2) : "";
  // Extract key sections for summary
  const model = (config?.model as string) || "unknown";
  const channels = config?.channels as Record<string, unknown> | undefined;
  const channelNames = channels ? Object.keys(channels) : [];

  return (
    <div className="space-y-6">
      {/* Config Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{model}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {channelNames.length > 0 ? (
                channelNames.map((ch) => (
                  <Badge key={ch} variant="secondary">{ch}</Badge>
                ))
              ) : (
                <span className="text-muted-foreground">None configured</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">File Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{configStr.length.toLocaleString()} chars</div>
          </CardContent>
        </Card>
      </div>

      {/* Config Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">openclaw.json</CardTitle>
            <div className="flex gap-2">
              {!editing ? (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  Edit Config
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveConfig} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 text-destructive text-sm p-3">
              {error}
            </div>
          )}
          <ScrollArea className="h-[calc(100vh-320px)]">
            {editing ? (
              <textarea
                className="w-full min-h-[600px] font-mono text-sm bg-muted/50 rounded-md p-4 border-0 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            ) : (
              <JsonHighlight content={configStr} />
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface FileViewerProps {
  filePath: string | null;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    json: "json",
    jsonl: "json",
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    md: "markdown",
    txt: "text",
    yaml: "yaml",
    yml: "yaml",
    sh: "bash",
    env: "text",
    css: "css",
  };
  return map[ext] || "text";
}

function isBinary(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ["db", "sqlite", "zip", "png", "jpg", "jpeg", "gif", "ico", "woff", "woff2"].includes(ext);
}

function JsonHighlight({ content }: { content: string }) {
  try {
    const formatted = JSON.stringify(JSON.parse(content), null, 2);
    // Simple JSON syntax highlighting
    const highlighted = formatted.replace(
      /("(?:[^"\\]|\\.)*")\s*:/g,
      '<span style="color: hsl(221, 83%, 53%)">$1</span>:'
    ).replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      ': <span style="color: hsl(142, 71%, 45%)">$1</span>'
    ).replace(
      /:\s*(\d+\.?\d*)/g,
      ': <span style="color: hsl(38, 92%, 50%)">$1</span>'
    ).replace(
      /:\s*(true|false)/g,
      ': <span style="color: hsl(0, 84%, 60%)">$1</span>'
    ).replace(
      /:\s*(null)/g,
      ': <span style="color: hsl(0, 0%, 50%)">$1</span>'
    );
    return (
      <pre
        className="text-sm font-mono whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  } catch {
    return <pre className="text-sm font-mono whitespace-pre-wrap">{content}</pre>;
  }
}

export function FileViewer({ filePath }: FileViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ size: number; modifiedAt: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState<string>("");

  useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    setError(null);
    setEditing(false);

    const apiPath = filePath.split("/").map(encodeURIComponent).join("/");
    fetch(`/api/files/${apiPath}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setContent(res.data.content);
          setFileInfo({ size: res.data.size, modifiedAt: res.data.modifiedAt });
        } else {
          setError(res.error);
        }
      })
      .catch(() => setError("Failed to fetch file"))
      .finally(() => setLoading(false));
  }, [filePath]);

  if (!filePath) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a file to preview
      </div>
    );
  }

  const filename = filePath.split("/").pop() ?? filePath;
  const lang = getLanguage(filename);
  const binary = isBinary(filename);
  const canEdit = !binary && (lang === "json" || lang === "markdown" || lang === "text" || lang === "yaml");

  async function handleSave() {
    if (!filePath) return;
    const apiPath = filePath.split("/").map(encodeURIComponent).join("/");
    try {
      const res = await fetch(`/api/files/${apiPath}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      const data = await res.json();
      if (data.success) {
        setContent(editContent);
        setEditing(false);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to save file");
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  if (binary) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {filename}
            <Badge variant="secondary">Binary</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Binary file - preview not available
            {fileInfo && ` (${formatSize(fileInfo.size)})`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {filename}
            <Badge variant="outline">{lang}</Badge>
            {fileInfo && (
              <span className="text-xs text-muted-foreground font-normal">
                {formatSize(fileInfo.size)}
              </span>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {canEdit && !editing && (
              <Button variant="outline" size="sm" onClick={() => { setEditContent(content ?? ""); setEditing(true); }}>
                Edit
              </Button>
            )}
            {editing && (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full max-h-[calc(100vh-220px)]">
          {editing ? (
            <textarea
              className="w-full h-full min-h-[500px] font-mono text-sm bg-muted/50 rounded-md p-3 border-0 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
          ) : lang === "json" || lang === "jsonl" ? (
            <JsonHighlight content={content ?? ""} />
          ) : (
            <pre className="text-sm font-mono whitespace-pre-wrap">{content}</pre>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentFile {
  name: string;
  path: string;
  modifiedAt: string;
  size: number;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentActivity() {
  const [files, setFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    fetch("/api/files?mode=stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setFiles(res.data.recentFiles.slice(0, 15));
      });
  }, []);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {files.length === 0 ? (
            <div className="h-64 animate-pulse rounded bg-muted" />
          ) : (
            files.map((file) => (
              <div
                key={file.path}
                className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent transition-colors"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {file.path}
                  </span>
                </div>
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatSize(file.size)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(file.modifiedAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSize, timeAgo } from "@/lib/format";

interface RecentFile {
  name: string;
  path: string;
  modifiedAt: string;
  size: number;
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

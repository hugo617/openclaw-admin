"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatSize, formatDate } from "@/lib/format";

interface LogFile {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
}

function getLogLevel(line: string): "info" | "warn" | "error" | "debug" | "unknown" {
  const lower = line.toLowerCase();
  if (lower.includes("[error]") || lower.includes("error:")) return "error";
  if (lower.includes("[warn]") || lower.includes("warning:")) return "warn";
  if (lower.includes("[info]") || lower.includes("info:")) return "info";
  if (lower.includes("[debug]")) return "debug";
  return "unknown";
}

function levelColor(level: string): string {
  switch (level) {
    case "error": return "text-red-500";
    case "warn": return "text-yellow-600";
    case "info": return "text-blue-500";
    case "debug": return "text-gray-400";
    default: return "";
  }
}

export default function LogsPage() {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<string>("");
  const [totalLines, setTotalLines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingLog, setLoadingLog] = useState(false);

  useEffect(() => {
    fetch("/api/logs")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setLogFiles(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  function selectLog(logPath: string) {
    setSelectedLog(logPath);
    setLoadingLog(true);
    fetch(`/api/logs?file=${encodeURIComponent(logPath)}&lines=200`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setLogContent(res.data.content);
          setTotalLines(res.data.totalLines);
        }
      })
      .finally(() => setLoadingLog(false));
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left: Log Files */}
      <div className="w-72 shrink-0 border border-border rounded-lg bg-card flex flex-col">
        <div className="p-3 border-b border-border">
          <h3 className="text-sm font-medium">Log Files</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {loading ? (
            <div className="animate-pulse space-y-2 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded" />
              ))}
            </div>
          ) : logFiles.length === 0 ? (
            <div className="text-sm text-muted-foreground p-2">
              No log files found
            </div>
          ) : (
            <div className="space-y-1">
              {logFiles.map((log) => (
                <button
                  key={log.path}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors ${
                    selectedLog === log.path ? "bg-primary/10 text-primary" : ""
                  }`}
                  onClick={() => selectLog(log.path)}
                >
                  <div className="font-medium truncate">{log.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatSize(log.size)} - {formatDate(log.modifiedAt)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Log Content */}
      <div className="flex-1 min-w-0">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {selectedLog ? selectedLog.split("/").pop() : "Select a log file"}
              </CardTitle>
              {selectedLog && (
                <span className="text-xs text-muted-foreground">
                  {totalLines} lines
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {!selectedLog ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select a log file to view
              </div>
            ) : loadingLog ? (
              <div className="animate-pulse space-y-1">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-full max-h-[calc(100vh-200px)]">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {logContent.split("\n").map((line, i) => {
                    const level = getLogLevel(line);
                    return (
                      <div key={i} className={levelColor(level)}>
                        {line}
                      </div>
                    );
                  })}
                </pre>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatSize, formatDate } from "@/lib/format";

interface LogFile {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
}

type LogLevel = "info" | "warn" | "error" | "debug" | "unknown";

function getLogLevel(line: string): LogLevel {
  const lower = line.toLowerCase();
  if (lower.includes("[error]") || lower.includes("error:")) return "error";
  if (lower.includes("[warn]") || lower.includes("warning:")) return "warn";
  if (lower.includes("[info]") || lower.includes("info:")) return "info";
  if (lower.includes("[debug]")) return "debug";
  return "unknown";
}

function levelColor(level: LogLevel): string {
  switch (level) {
    case "error": return "text-red-500";
    case "warn": return "text-yellow-600";
    case "info": return "text-blue-500";
    case "debug": return "text-gray-400";
    default: return "";
  }
}

const LEVELS: LogLevel[] = ["error", "warn", "info", "debug", "unknown"];

function tryFormatJson(line: string): string {
  try {
    const parsed = JSON.parse(line);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return line;
  }
}

export default function LogsPage() {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState<string>("");
  const [totalLines, setTotalLines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingLog, setLoadingLog] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LogLevel | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [formatJson, setFormatJson] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
          setRawContent(res.data.content);
          setTotalLines(res.data.totalLines);
        }
      })
      .finally(() => setLoadingLog(false));
  }

  const lines = rawContent.split("\n");

  const filteredLines = useCallback(() => {
    return lines.filter((line) => {
      if (levelFilter) {
        const level = getLogLevel(line);
        if (level !== levelFilter) return false;
      }
      if (searchKeyword && !line.toLowerCase().includes(searchKeyword.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [lines, levelFilter, searchKeyword])();

  // Count by level
  const levelCounts = lines.reduce((acc, line) => {
    const level = getLogLevel(line);
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLines, autoScroll]);

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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {filteredLines.length}/{totalLines} lines
                  </span>
                  <button
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`text-xs px-2 py-0.5 rounded border ${autoScroll ? "bg-primary/10" : ""}`}
                  >
                    Auto-scroll
                  </button>
                  <button
                    onClick={() => setFormatJson(!formatJson)}
                    className={`text-xs px-2 py-0.5 rounded border ${formatJson ? "bg-primary/10" : ""}`}
                  >
                    JSON
                  </button>
                </div>
              )}
            </div>
            {/* Level filters */}
            {selectedLog && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setLevelFilter(null)}
                  className={`text-xs px-2 py-0.5 rounded border ${!levelFilter ? "bg-primary/10" : ""}`}
                >
                  All
                </button>
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setLevelFilter(levelFilter === level ? null : level)}
                    className={`text-xs px-2 py-0.5 rounded border ${levelFilter === level ? "bg-primary/10" : ""} ${levelColor(level)}`}
                  >
                    {level} ({levelCounts[level] || 0})
                  </button>
                ))}
                <Input
                  placeholder="Filter..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-40 h-6 text-xs"
                />
              </div>
            )}
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
              <div ref={scrollRef} className="h-full max-h-[calc(100vh-260px)] overflow-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {filteredLines.map((line, i) => {
                    const level = getLogLevel(line);
                    const displayLine = formatJson ? tryFormatJson(line) : line;
                    return (
                      <div key={i} className={levelColor(level)}>
                        {displayLine}
                      </div>
                    );
                  })}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

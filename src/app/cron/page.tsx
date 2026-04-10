"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatSize, formatDate } from "@/lib/format";

interface CronRun {
  ts: number;
  jobId: string;
  action: string;
  status: string;
  error?: string;
  summary?: string;
  durationMs?: number;
  model?: string;
}

interface CronTask {
  name: string;
  filename: string;
  config: Record<string, unknown>;
  modifiedAt: string;
  size: number;
  runs: CronRun[];
  stats: {
    totalRuns: number;
    successCount: number;
    errorCount: number;
    avgDurationMs: number;
  };
}

function runStatusColor(status: string): string {
  if (status === "error") return "border-red-500/30 bg-red-500/5";
  return "border-green-500/30 bg-green-500/5";
}

export default function CronPage() {
  const [tasks, setTasks] = useState<CronTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cron")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setTasks(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalRuns = tasks.reduce((sum, t) => sum + t.stats.totalRuns, 0);
  const totalSuccess = tasks.reduce((sum, t) => sum + t.stats.successCount, 0);
  const totalErrors = tasks.reduce((sum, t) => sum + t.stats.errorCount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cron Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRuns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRuns > 0 ? `${Math.round((totalSuccess / totalRuns) * 100)}%` : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalErrors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No cron tasks found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{task.name}</CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {task.stats.totalRuns} runs
                    </Badge>
                    {task.stats.avgDurationMs > 0 && (
                      <span className="text-xs text-muted-foreground">
                        avg {task.stats.avgDurationMs.toLocaleString()}ms
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatSize(task.size)} - {formatDate(task.modifiedAt)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ScrollArea className="max-h-32">
                  <pre className="text-sm font-mono bg-muted p-3 rounded">
                    {JSON.stringify(task.config, null, 2)}
                  </pre>
                </ScrollArea>

                {/* Run History */}
                {task.runs.length > 0 && (
                  <div>
                    <button
                      onClick={() => setExpandedTask(expandedTask === task.name ? null : task.name)}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {expandedTask === task.name ? "Hide" : "Show"} {task.runs.length} runs
                    </button>
                    {expandedTask === task.name && (
                      <ScrollArea className="max-h-64 mt-2">
                        <div className="space-y-2">
                          {task.runs.slice(0, 20).map((run, i) => (
                            <div
                              key={i}
                              className={`rounded border p-2 text-xs ${runStatusColor(run.status)}`}
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant={run.status === "error" ? "destructive" : "default"} className="text-xs">
                                  {run.status}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {new Date(run.ts).toLocaleString()}
                                </span>
                                {run.durationMs != null && (
                                  <span className="text-muted-foreground">
                                    {run.durationMs.toLocaleString()}ms
                                  </span>
                                )}
                                {run.model && (
                                  <Badge variant="outline" className="text-xs">{run.model}</Badge>
                                )}
                              </div>
                              {run.error && (
                                <p className="mt-1 text-red-500">{run.error}</p>
                              )}
                              {run.summary && (
                                <p className="mt-1 text-muted-foreground truncate">{run.summary.slice(0, 200)}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

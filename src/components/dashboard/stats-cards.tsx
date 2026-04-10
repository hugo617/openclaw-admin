"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSize } from "@/lib/format";

interface Stats {
  totalFiles: number;
  totalSize: number;
  totalDirectories: number;
  sessionCount: number;
  pluginCount: number;
  cronTaskCount: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/files?mode=stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
      });
  }, []);

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    { title: "Total Files", value: stats.totalFiles.toLocaleString(), sub: `${stats.totalDirectories} directories` },
    { title: "Total Size", value: formatSize(stats.totalSize), sub: "across all files" },
    { title: "Sessions", value: stats.sessionCount.toString(), sub: "conversation history" },
    { title: "Plugins / Cron", value: `${stats.pluginCount} / ${stats.cronTaskCount}`, sub: "extensions & tasks" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

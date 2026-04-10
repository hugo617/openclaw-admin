"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AgentInfo {
  model: string;
  provider?: string;
  channels: string[];
  agents: string[];
}

export function AgentStatusCard() {
  const [info, setInfo] = useState<AgentInfo | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const config = res.data;
          const channels = config.channels ? Object.keys(config.channels as object) : [];
          const agents = config.agents ? Object.keys(config.agents as object) : ["main"];
          setInfo({
            model: config.model ?? config.defaultModel ?? "unknown",
            provider: config.provider,
            channels,
            agents,
          });
        }
      })
      .catch(() => {
        // Config may not be available
      });
  }, []);

  if (!info) {
    return <div className="h-48 animate-pulse rounded bg-muted" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agent Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Model</span>
          <Badge variant="outline">{info.model}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Agents</span>
          <span className="text-sm font-medium">{info.agents.length}</span>
        </div>
        {info.channels.length > 0 && (
          <div>
            <span className="text-sm text-muted-foreground">Channels</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {info.channels.map((ch) => (
                <Badge key={ch} variant="secondary" className="text-xs">{ch}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

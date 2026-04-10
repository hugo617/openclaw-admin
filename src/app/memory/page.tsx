"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatSize } from "@/lib/format";

interface MemoryEntry {
  id: string;
  text: string;
  path: string;
  source: string;
  model: string;
  startLine: number;
  endLine: number;
  updatedAt: string;
  rank?: number;
}

interface MemoryStats {
  totalChunks: number;
  totalFiles: number;
  dbSize: number;
  bySource: Record<string, number>;
  byModel: Record<string, number>;
}

export default function MemoryPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setEntries(res.data.entries ?? []);
          setStats(res.data.stats ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSearch() {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/memory?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.data.entries ?? []);
      }
    } finally {
      setSearching(false);
    }
  }

  function handleClear() {
    setSearch("");
    setSourceFilter(null);
    fetch("/api/memory")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setEntries(res.data.entries ?? []);
      });
  }

  const filteredEntries = sourceFilter
    ? entries.filter((e) => e.source === sourceFilter)
    : entries;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Chunks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalChunks ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Indexed Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFiles ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Database Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSize(stats?.dbSize ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats?.bySource && Object.entries(stats.bySource).map(([source, count]) => (
                <Badge
                  key={source}
                  variant={sourceFilter === source ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setSourceFilter(sourceFilter === source ? null : source)}
                >
                  {source} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Memory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search chunks (FTS5)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-md"
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? "Searching..." : "Search"}
            </Button>
            {(search || sourceFilter) && (
              <Button variant="outline" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {search ? `Results for "${search}"` : "Recent Memories"} ({filteredEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-480px)]">
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded" />
                ))}
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {search ? "No results found" : "No memories stored"}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{entry.source}</Badge>
                      <Badge variant="secondary" className="text-xs">{entry.model}</Badge>
                      <span className="text-xs text-muted-foreground font-mono truncate">
                        {entry.path}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        L{entry.startLine}-{entry.endLine}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {expandedId === entry.id
                        ? entry.text
                        : entry.text.length > 200
                          ? entry.text.slice(0, 200) + "..."
                          : entry.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

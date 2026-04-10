"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, MessageSquare, Database, Settings, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  type: "file" | "session" | "memory" | "config";
  title: string;
  subtitle?: string;
  href: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Cmd+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const lowerQ = q.toLowerCase();
      const allResults: SearchResult[] = [];

      // Search files
      const filesRes = await fetch(`/api/files/search?q=${encodeURIComponent(q)}`);
      const filesData = await filesRes.json();
      if (filesData.success) {
        for (const r of filesData.data.slice(0, 5)) {
          allResults.push({
            type: "file",
            title: r.path.split("/").pop() || r.path,
            subtitle: r.path,
            href: `/files`,
          });
        }
      }

      // Search sessions
      const sessionsRes = await fetch("/api/sessions");
      const sessionsData = await sessionsRes.json();
      if (sessionsData.success) {
        for (const s of sessionsData.data) {
          if (
            s.id.toLowerCase().includes(lowerQ) ||
            s.preview?.toLowerCase().includes(lowerQ) ||
            s.model?.toLowerCase().includes(lowerQ)
          ) {
            allResults.push({
              type: "session",
              title: s.preview || s.id.slice(0, 8),
              subtitle: `${s.model || "unknown"} - ${s.messageCount} messages`,
              href: `/sessions/${s.id}`,
            });
          }
          if (allResults.filter((r) => r.type === "session").length >= 5) break;
        }
      }

      // Search memory
      const memoryRes = await fetch(`/api/memory?q=${encodeURIComponent(q)}`);
      const memoryData = await memoryRes.json();
      if (memoryData.success && memoryData.data.entries) {
        for (const entry of memoryData.data.entries.slice(0, 5)) {
          allResults.push({
            type: "memory",
            title: entry.text?.slice(0, 80) || entry.path,
            subtitle: `${entry.source} - ${entry.path}`,
            href: "/memory",
          });
        }
      }

      setResults(allResults);
    } catch {
      // ignore errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  }

  if (!open) return null;

  const typeIcons = {
    file: FileText,
    session: MessageSquare,
    memory: Database,
    config: Settings,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-lg shadow-2xl">
        <div className="flex items-center border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            className="flex-1 bg-transparent px-3 py-3 text-sm outline-none"
            placeholder="Search files, sessions, memory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => setOpen(false)} className="text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {loading && (
          <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
        )}
        {!loading && results.length > 0 && (
          <div className="max-h-64 overflow-auto">
            {results.map((result, i) => {
              const Icon = typeIcons[result.type];
              return (
                <button
                  key={i}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-accent transition-colors"
                  onClick={() => handleSelect(result)}
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {result.type}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
        {!loading && query.length >= 2 && results.length === 0 && (
          <div className="px-4 py-3 text-sm text-muted-foreground">No results found</div>
        )}
      </div>
    </div>
  );
}

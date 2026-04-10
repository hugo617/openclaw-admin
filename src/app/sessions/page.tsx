"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSize, formatDate } from "@/lib/format";

interface SessionMeta {
  id: string;
  filename: string;
  size: number;
  modifiedAt: string;
  messageCount: number;
  status: "active" | "reset" | "deleted";
  channel?: string;
  preview?: string;
  model?: string;
  provider?: string;
  totalTokens?: number;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "active") return "default";
  if (status === "reset") return "secondary";
  return "destructive";
}

const PAGE_SIZE = 20;

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setSessions(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = sessions;
    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.preview?.toLowerCase().includes(q) ||
          s.channel?.toLowerCase().includes(q) ||
          s.model?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, sessions, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter((s) => s.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Showing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filtered.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Sessions</CardTitle>
              <div className="flex gap-1">
                {["active", "reset", "deleted"].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(statusFilter === status ? null : status);
                      setPage(1);
                    }}
                    className={`px-2 py-0.5 text-xs rounded-md border transition-colors ${
                      statusFilter === status
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <Input
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-64 h-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <Link
                          href={`/sessions/${session.id}`}
                          className="text-primary hover:underline font-mono text-xs"
                        >
                          {session.id.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(session.status)}>
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {session.model ? (
                          <Badge variant="outline" className="text-xs">{session.model}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-sm">{session.messageCount}</TableCell>
                      <TableCell className="text-sm">{formatSize(session.size)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(session.modifiedAt)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-48 truncate">
                        {session.preview || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-muted-foreground">
                    Page {currentPage} of {totalPages} ({filtered.length} sessions)
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { FileTree, type FileTreeNode } from "@/components/files/file-tree";
import { FileViewer } from "@/components/files/file-viewer";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchResult {
  path: string;
  line: number;
  content: string;
}

export default function FilesPage() {
  const [tree, setTree] = useState<FileTreeNode | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentSearch, setContentSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setTree(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(node: FileTreeNode) {
    if (node.type === "file") {
      setSelectedPath(node.relativePath);
    }
  }

  async function handleContentSearch() {
    if (!contentSearch.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/files/search?q=${encodeURIComponent(contentSearch)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } finally {
      setSearching(false);
    }
  }

  function filterTree(
    node: FileTreeNode,
    query: string
  ): FileTreeNode | null {
    const q = query.toLowerCase();
    if (node.type === "file") {
      return node.name.toLowerCase().includes(q) ? node : null;
    }
    const filteredChildren = (node.children ?? [])
      .map((c) => filterTree(c, q))
      .filter(Boolean) as FileTreeNode[];

    if (
      filteredChildren.length > 0 ||
      node.name.toLowerCase().includes(q)
    ) {
      return { ...node, children: filteredChildren };
    }
    return null;
  }

  const displayedTree = tree
    ? searchQuery
      ? filterTree(tree, searchQuery) ?? tree
      : tree
    : null;

  // Breadcrumb from selected path
  const breadcrumbs = selectedPath ? selectedPath.split("/") : [];

  return (
    <div className="space-y-4">
      {/* Content Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search file contents (grep)..."
          value={contentSearch}
          onChange={(e) => setContentSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleContentSearch()}
          className="max-w-md h-8 text-sm"
        />
        <button
          onClick={handleContentSearch}
          disabled={searching}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md disabled:opacity-50"
        >
          {searching ? "..." : "Search"}
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Content Search Results ({searchResults.length})
              </CardTitle>
              <button
                onClick={() => setSearchResults([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-48">
              <div className="space-y-1">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => setSelectedPath(result.path)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        L{result.line}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {result.path}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-1">{result.content}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Breadcrumb */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => setSelectedPath(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            root
          </button>
          {breadcrumbs.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-muted-foreground">/</span>
              <span
                className={i === breadcrumbs.length - 1 ? "font-medium" : "text-muted-foreground"}
              >
                {part}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-14rem)] gap-4">
        {/* Left: File Tree */}
        <div className="w-80 shrink-0 border border-border rounded-lg bg-card flex flex-col">
          <div className="p-3 border-b border-border">
            <Input
              placeholder="Filter files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1 overflow-auto p-2">
            {loading ? (
              <div className="animate-pulse space-y-2 p-2">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-6 bg-muted rounded" />
                ))}
              </div>
            ) : displayedTree ? (
              <FileTree
                tree={displayedTree}
                selectedPath={selectedPath}
                onSelect={handleSelect}
              />
            ) : (
              <div className="text-sm text-muted-foreground p-2">
                No files found
              </div>
            )}
          </div>
        </div>

        {/* Right: File Viewer */}
        <div className="flex-1 min-w-0">
          <FileViewer filePath={selectedPath} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { FileTree, type FileTreeNode } from "@/components/files/file-tree";
import { FileViewer } from "@/components/files/file-viewer";
import { Input } from "@/components/ui/input";

export default function FilesPage() {
  const [tree, setTree] = useState<FileTreeNode | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Simple search filter: flatten tree and match
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

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left: File Tree */}
      <div className="w-80 shrink-0 border border-border rounded-lg bg-card flex flex-col">
        <div className="p-3 border-b border-border">
          <Input
            placeholder="Search files..."
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
  );
}

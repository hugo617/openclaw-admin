"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface FileTreeNode {
  name: string;
  relativePath: string;
  type: "file" | "directory";
  size: number;
  children?: FileTreeNode[];
  extension?: string;
}

interface FileTreeProps {
  node: FileTreeNode;
  selectedPath: string | null;
  onSelect: (node: FileTreeNode) => void;
  depth?: number;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(name: string, isDir: boolean): string {
  if (isDir) return "📁";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const icons: Record<string, string> = {
    json: "{}",
    jsonl: "⟨⟩",
    ts: "TS",
    js: "JS",
    md: "M↓",
    txt: "TXT",
    db: "⊞",
    sqlite: "⊞",
    sh: "#!",
    env: "🔒",
    yaml: "Y",
    yml: "Y",
    zip: "📦",
    png: "🖼",
    jpg: "🖼",
  };
  return icons[ext] || "📄";
}

function FileTreeItem({
  node,
  selectedPath,
  onSelect,
  depth = 0,
}: FileTreeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDir = node.type === "directory";
  const isSelected = selectedPath === node.relativePath;

  return (
    <div>
      <button
        className={cn(
          "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors",
          isSelected && "bg-primary/10 text-primary font-medium"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isDir) setExpanded(!expanded);
          onSelect(node);
        }}
      >
        <span className="shrink-0 text-xs w-5 text-center">
          {isDir ? (expanded ? "▾" : "▸") : getFileIcon(node.name, false)}
        </span>
        <span className="truncate flex-1 text-left">{node.name}</span>
        {!isDir && (
          <span className="text-xs text-muted-foreground shrink-0">
            {formatSize(node.size)}
          </span>
        )}
      </button>
      {isDir && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.relativePath}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileTreeRootProps {
  tree: FileTreeNode;
  selectedPath: string | null;
  onSelect: (node: FileTreeNode) => void;
}

export function FileTree({ tree, selectedPath, onSelect }: FileTreeRootProps) {
  return (
    <div className="h-full overflow-auto">
      {tree.children?.map((child) => (
        <FileTreeItem
          key={child.relativePath}
          node={child}
          selectedPath={selectedPath}
          onSelect={onSelect}
          depth={0}
        />
      ))}
    </div>
  );
}

import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";

const HOME = os.homedir();
const OPENCLAW_HOME = (
  process.env.OPENCLAW_HOME?.replace("~", HOME) || `${HOME}/.openclaw`
);

export interface FileTreeNode {
  name: string;
  path: string;
  relativePath: string;
  type: "file" | "directory";
  size: number;
  modifiedAt: string;
  children?: FileTreeNode[];
  extension?: string;
}

export interface DashboardStats {
  totalFiles: number;
  totalSize: number;
  totalDirectories: number;
  sessionCount: number;
  pluginCount: number;
  cronTaskCount: number;
  fileTypeDistribution: Record<string, { count: number; size: number }>;
  directorySizes: { name: string; size: number }[];
  recentFiles: { name: string; path: string; modifiedAt: string; size: number }[];
}

const FORBIDDEN_PATTERNS = ["../", "..\\", "\0"];

function resolvePath(relativePath: string): string {
  const clean = relativePath.startsWith("/")
    ? relativePath.slice(1)
    : relativePath;

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (clean.includes(pattern)) {
      throw new Error(`Invalid path: path traversal detected`);
    }
  }

  const resolved = path.resolve(OPENCLAW_HOME, clean);

  if (!resolved.startsWith(OPENCLAW_HOME)) {
    throw new Error(`Invalid path: path traversal detected`);
  }

  return resolved;
}

function getFileExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext || "other";
}

function formatFileType(ext: string): string {
  const map: Record<string, string> = {
    ".json": "JSON",
    ".jsonl": "JSONL",
    ".ts": "TypeScript",
    ".js": "JavaScript",
    ".md": "Markdown",
    ".txt": "Text",
    ".db": "SQLite",
    ".sqlite": "SQLite",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".sh": "Shell",
    ".zip": "Archive",
    ".png": "Image",
    ".jpg": "Image",
    ".jpeg": "Image",
    ".svg": "Image",
    ".env": "Config",
  };
  return map[ext] || "Other";
}

async function buildTreeRecursive(
  dirPath: string,
  relativeTo: string
): Promise<FileTreeNode[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nodes: FileTreeNode[] = [];

  const sorted = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of sorted) {
    if (entry.name.startsWith(".") && entry.name !== ".env") continue;

    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(relativeTo, fullPath);

    let stat;
    try {
      stat = await fs.lstat(fullPath);
    } catch {
      // Broken symlink or permission denied — skip
      continue;
    }

    try {
      if (stat.isDirectory()) {
        const children = await buildTreeRecursive(fullPath, relativeTo);
        const dirSize = children.reduce((sum: number, c) => sum + c.size, 0);
        nodes.push({
          name: entry.name,
          path: fullPath,
          relativePath: relPath,
          type: "directory",
          size: dirSize,
          modifiedAt: stat.mtime.toISOString(),
          children,
        });
      } else {
        nodes.push({
          name: entry.name,
          path: fullPath,
          relativePath: relPath,
          type: "file",
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          extension: getFileExtension(entry.name),
        });
      }
    } catch {
      // Permission errors or other issues inside directory — skip
    }
  }

  return nodes;
}

export async function buildFileTree(): Promise<FileTreeNode> {
  const stat = await fs.stat(OPENCLAW_HOME);
  const children = await buildTreeRecursive(OPENCLAW_HOME, OPENCLAW_HOME);
  return {
    name: ".openclaw",
    path: OPENCLAW_HOME,
    relativePath: "",
    type: "directory",
    size: children.reduce((sum, c) => sum + c.size, 0),
    modifiedAt: stat.mtime.toISOString(),
    children,
  };
}

export async function readFileContent(relativePath: string): Promise<string> {
  const fullPath = resolvePath(relativePath);
  return fs.readFile(fullPath, "utf-8");
}

export async function writeFileContent(
  relativePath: string,
  content: string
): Promise<void> {
  const fullPath = resolvePath(relativePath);

  // Create backup
  if (fsSync.existsSync(fullPath)) {
    const backupPath = `${fullPath}.bak.${Date.now()}`;
    await fs.copyFile(fullPath, backupPath);
  }

  await fs.writeFile(fullPath, content, "utf-8");
}

function collectFiles(node: FileTreeNode): FileTreeNode[] {
  if (node.type === "file") return [node];
  const files: FileTreeNode[] = [];
  for (const child of node.children ?? []) {
    files.push(...collectFiles(child));
  }
  return files;
}

export async function getStats(): Promise<DashboardStats> {
  const tree = await buildFileTree();
  const allFiles = collectFiles(tree);
  const allDirs = flattenDirs(tree);

  // File type distribution
  const fileTypeDist: Record<string, { count: number; size: number }> = {};
  for (const file of allFiles) {
    const ext = file.extension || "other";
    const label = formatFileType(ext);
    if (!fileTypeDist[label]) {
      fileTypeDist[label] = { count: 0, size: 0 };
    }
    fileTypeDist[label].count += 1;
    fileTypeDist[label].size += file.size;
  }

  // Directory sizes
  const dirSizes = (tree.children ?? [])
    .map((child) => ({ name: child.name, size: child.size }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  // Recent files
  const recentFiles = [...allFiles]
    .sort(
      (a, b) =>
        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    )
    .slice(0, 20);

  // Session count
  const sessionsDir = path.join(
    OPENCLAW_HOME,
    "agents/main/sessions"
  );
  let sessionCount = 0;
  try {
    const sessionFiles = await fs.readdir(sessionsDir);
    sessionCount = sessionFiles.filter(
      (f) => f.endsWith(".jsonl") && !f.includes(".deleted.")
    ).length;
  } catch {
    // sessions dir might not exist
  }

  // Plugin count
  let pluginCount = 0;
  try {
    const extDir = path.join(OPENCLAW_HOME, "extensions");
    const entries = await fs.readdir(extDir, { withFileTypes: true });
    pluginCount = entries.filter((e) => e.isDirectory()).length;
  } catch {
    // extensions dir might not exist
  }

  // Cron tasks
  let cronTaskCount = 0;
  try {
    const cronDir = path.join(OPENCLAW_HOME, "cron");
    const entries = await fs.readdir(cronDir);
    cronTaskCount = entries.filter((f) => f.endsWith(".json")).length;
  } catch {
    // cron dir might not exist
  }

  return {
    totalFiles: allFiles.length,
    totalSize: allFiles.reduce((sum, f) => sum + f.size, 0),
    totalDirectories: allDirs.length,
    sessionCount,
    pluginCount,
    cronTaskCount,
    fileTypeDistribution: fileTypeDist,
    directorySizes: dirSizes,
    recentFiles,
  };
}

function flattenDirs(node: FileTreeNode): FileTreeNode[] {
  const dirs: FileTreeNode[] = [];
  if (node.type === "directory" && node.relativePath !== "") {
    dirs.push(node);
  }
  for (const child of node.children ?? []) {
    if (child.type === "directory") {
      dirs.push(...flattenDirs(child));
    }
  }
  return dirs;
}

export { OPENCLAW_HOME, resolvePath, formatFileType };

# CLAUDE.md - OpenClaw Admin Dashboard

## Project Overview

Next.js 16 admin dashboard for the OpenClaw AI Agent framework. Reads data from `~/.openclaw/` (configurable via `OPENCLAW_HOME` env var).

## Architecture

- **App Router** with server-side API routes and client-side page components
- **SQLite** access via better-sqlite3 (must be in `serverExternalPackages` in next.config.ts)
- **shadcn/ui** for UI components (`src/components/ui/`)
- **lucide-react** for icons

## Key Rules

- All client components must have `"use client"` directive
- Server modules (fs, better-sqlite3) cannot be imported in client components
- Use `@/lib/format` for formatSize/formatDate/timeAgo (not inline duplicates)
- API routes return `{ success: boolean, data?: T, error?: string }`
- File writes create `.bak` backups automatically
- Path resolution has traversal protection (check FORBIDDEN_PATTERNS)

## Testing

```bash
pnpm test          # Run vitest
pnpm test:watch    # Watch mode
```

Tests are in `src/lib/__tests__/`. Core libraries only (format, session-parser, openclaw security).

## Lint Rules

- No JSX inside try/catch (use useMemo pattern)
- No synchronous setState in useEffect (use callback or derived state)
- All imports must be used

## Data Sources

- **Config**: `~/.openclaw/openclaw.json`
- **Sessions**: `~/.openclaw/agents/main/sessions/*.jsonl`
- **Memory**: `~/.openclaw/memory/main.sqlite` (tables: chunks, files, meta, chunks_fts)
- **Plugins**: `~/.openclaw/extensions/*/`
- **Cron**: `~/.openclaw/cron/jobs.json` + `~/.openclaw/cron/runs/*.jsonl`
- **Logs**: `~/.openclaw/logs/*.log`

## Session JSONL Format

Lines have a `type` field:
- `session` - Header with version, id, cwd
- `model_change` - Provider and model info
- `message` - Chat messages with nested `message.role` and `message.content` (array of blocks)
- Content block types: `text`, `thinking`, `toolCall`, `toolResult`

# OpenClaw Admin Dashboard

A web-based admin dashboard for managing and monitoring the [OpenClaw](https://github.com/hugo617/openclaw) AI Agent framework.

## Features

- **Dashboard** - Overview with file type charts, directory size rankings, agent status
- **File Browser** - Navigate, view, edit files with content search (grep), breadcrumbs, and large file warnings
- **Config Editor** - Section-based editing for openclaw.json with tabs and raw JSON mode
- **Sessions** - Browse AI conversations with markdown rendering, code highlighting, collapsible blocks
- **Memory** - Search SQLite memory with FTS5, filter by source/model, grouped views
- **Plugins** - View installed plugins with README display, skill content, file statistics
- **Cron Tasks** - Monitor scheduled tasks with execution history, success rates, duration stats
- **Logs** - Real-time log viewer with level filtering, keyword search, JSON formatting
- **Global Search** - Cmd+K search across files, sessions, and memory
- **Dark Mode** - Theme toggle with system preference detection

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI**: Tailwind CSS 4 + shadcn/ui + lucide-react icons
- **Charts**: Recharts 3
- **Database**: SQLite via better-sqlite3
- **Markdown**: react-markdown + react-syntax-highlighter
- **Theming**: next-themes
- **Testing**: Vitest + @testing-library/react

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
git clone https://github.com/hugo617/openclaw-admin.git
cd openclaw-admin
pnpm install
cp .env.example .env.local
# Edit .env.local to set your OPENCLAW_HOME path
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCLAW_HOME` | Path to OpenClaw data directory | `~/.openclaw` |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/files` | GET | Get file tree or stats (`?mode=stats`) |
| `/api/files/[...path]` | GET | Read file or directory |
| `/api/files/[...path]` | PUT | Write file content (with backup) |
| `/api/files/search?q=` | GET | Grep-based file content search |
| `/api/config` | GET/PUT | Read/write openclaw.json |
| `/api/sessions` | GET | List all sessions with metadata |
| `/api/sessions/[id]` | GET | Get session detail with messages |
| `/api/memory` | GET | Recent memories + stats |
| `/api/memory?q=` | GET | FTS5 search memories |
| `/api/memory?mode=grouped` | GET | Memories grouped by file path |
| `/api/plugins` | GET | List plugins with skills and README |
| `/api/cron` | GET | List cron tasks with run history |
| `/api/logs` | GET | List log files |
| `/api/logs?file=&lines=` | GET | Read log file |

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   ├── config/            # Config editor page
│   ├── cron/              # Cron tasks page
│   ├── files/             # File browser page
│   ├── logs/              # Log viewer page
│   ├── memory/            # Memory viewer page
│   ├── plugins/           # Plugin manager page
│   └── sessions/          # Session list + detail pages
├── components/
│   ├── dashboard/         # Dashboard components (charts, cards)
│   ├── error-boundary.tsx # Global error boundary
│   ├── files/             # File tree + viewer
│   ├── layout/            # Sidebar, header, global search
│   ├── theme-provider.tsx # Theme context provider
│   ├── theme-toggle.tsx   # Light/dark/system toggle
│   └── ui/                # shadcn/ui components
└── lib/
    ├── __tests__/         # Unit tests
    ├── config.ts          # Config read/write
    ├── format.ts          # Shared formatting utilities
    ├── memory-client.ts   # SQLite memory client
    ├── openclaw.ts        # Core file system operations
    ├── session-parser.ts  # JSONL session parser
    └── utils.ts           # Class name utilities
```

## License

MIT

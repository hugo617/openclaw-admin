# OpenClaw Admin Dashboard

A web-based admin dashboard for managing and monitoring the [OpenClaw](https://github.com/hugo617/openclaw) AI Agent framework.

## Features

- **Dashboard** - Overview of files, sessions, plugins, and cron tasks with interactive charts
- **File Browser** - Navigate, view, and edit files in your OpenClaw home directory
- **Config Editor** - Visual editor for `openclaw.json` configuration
- **Sessions** - Browse and inspect AI conversation sessions with full message history
- **Memory** - Search and explore the SQLite memory database
- **Plugins** - View installed plugins and their skills
- **Cron Tasks** - Monitor scheduled tasks and execution history
- **Logs** - Real-time log viewer with level filtering

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI**: Tailwind CSS 4 + shadcn/ui
- **Charts**: Recharts 3
- **Database**: SQLite (better-sqlite3)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/hugo617/openclaw-admin.git
cd openclaw-admin

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local to set your OPENCLAW_HOME path

# Start development server
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
| `/api/files` | GET | Get file tree or stats |
| `/api/files/[...path]` | GET | Read file content |
| `/api/files/[...path]` | PUT | Write file content |
| `/api/config` | GET | Read openclaw.json |
| `/api/config` | PUT | Update openclaw.json |
| `/api/sessions` | GET | List all sessions |
| `/api/sessions/[id]` | GET | Get session detail |
| `/api/memory` | GET | Get recent memories or stats |
| `/api/memory?q=query` | GET | Search memories |
| `/api/plugins` | GET | List installed plugins |
| `/api/cron` | GET | List cron tasks |
| `/api/logs` | GET | List log files |
| `/api/logs?file=path` | GET | Read log content |

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript type checking |

## Development

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Build
pnpm build
```

## License

MIT

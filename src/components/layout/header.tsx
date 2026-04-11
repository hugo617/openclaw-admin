"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/files": "File Browser",
  "/config": "Config Editor",
  "/sessions": "Sessions",
  "/memory": "Memory",
  "/plugins": "Plugins",
  "/cron": "Cron Tasks",
  "/logs": "Logs",
};

export function Header() {
  const pathname = usePathname();
  const basePath = pathname.startsWith("/sessions/") ? "/sessions" : pathname;
  const pageName = pageNames[basePath] || "OpenClaw";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/95 backdrop-blur px-6">
      <h1 className="text-lg font-semibold">{pageName}</h1>
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
          {process.env.NEXT_PUBLIC_OPENCLAW_HOME || "~/.openclaw"}
        </span>
      </div>
    </header>
  );
}

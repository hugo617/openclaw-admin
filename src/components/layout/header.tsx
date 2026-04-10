"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [sidebarWidth, setSidebarWidth] = useState(240);

  useEffect(() => {
    const sidebar = document.querySelector("aside");
    if (!sidebar) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSidebarWidth(entry.contentRect.width);
      }
    });
    observer.observe(sidebar);
    return () => observer.disconnect();
  }, []);

  const basePath = pathname.startsWith("/sessions/") ? "/sessions" : pathname;
  const pageName = pageNames[basePath] || "OpenClaw";

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/95 backdrop-blur px-6 transition-all duration-200"
      style={{ marginLeft: sidebarWidth }}
    >
      <h1 className="text-lg font-semibold">{pageName}</h1>
      <span className="ml-auto text-xs text-muted-foreground font-mono">
        {process.env.NEXT_PUBLIC_OPENCLAW_HOME || "~/.openclaw"}
      </span>
    </header>
  );
}

"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-md border p-0.5">
      <button
        onClick={() => setTheme("light")}
        title="Light"
        className="rounded p-1.5 text-xs transition-colors text-muted-foreground hover:bg-accent"
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        title="Dark"
        className="rounded p-1.5 text-xs transition-colors text-muted-foreground hover:bg-accent"
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setTheme("system")}
        title="System"
        className="rounded p-1.5 text-xs transition-colors text-muted-foreground hover:bg-accent"
      >
        <Monitor className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

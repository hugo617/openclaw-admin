"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 56 : 224; // w-14 = 56px, w-56 = 224px

  return (
    <>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className="flex min-h-screen flex-col transition-[margin-left] duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        {children}
      </div>
    </>
  );
}

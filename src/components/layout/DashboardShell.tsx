"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <Header sidebarCollapsed={collapsed} />
        <CommandPalette />
        <main
          className={cn(
            "pt-14 min-h-screen transition-all duration-300",
            collapsed ? "pl-16" : "pl-[260px]"
          )}
        >
          <div className="p-6 h-full">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}

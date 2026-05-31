"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Bell, Sun, Moon, Monitor, ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BreadcrumbItem } from "@/types";

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
}

const routeBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  "/overview": [{ label: "Dashboard" }],
  "/analytics/sales": [{ label: "Analytics", href: "/analytics/sales" }, { label: "Sales" }],
  "/analytics/revenue": [{ label: "Analytics", href: "/analytics/sales" }, { label: "Revenue" }],
  "/analytics/users": [{ label: "Analytics", href: "/analytics/sales" }, { label: "Users" }],
  "/analytics/products": [{ label: "Analytics", href: "/analytics/sales" }, { label: "Products" }],
  "/analytics/regional": [{ label: "Analytics", href: "/analytics/sales" }, { label: "Regional" }],
  "/analytics/marketing": [{ label: "Analytics", href: "/analytics/sales" }, { label: "Marketing" }],
  "/reports": [{ label: "Reports" }],
  "/data": [{ label: "Data Import" }],
  "/activity": [{ label: "Activity" }],
  "/notifications": [{ label: "Notifications" }],
  "/admin/users": [{ label: "Admin", href: "/admin/users" }, { label: "Users" }],
  "/admin/activity": [{ label: "Admin", href: "/admin/users" }, { label: "Audit Logs" }],
  "/admin/settings": [{ label: "Admin", href: "/admin/users" }, { label: "Settings" }],
};

type Theme = "light" | "dark" | "system";

export function Header({ onMenuClick, sidebarCollapsed }: HeaderProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("system");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifCount] = useState(3);

  const breadcrumbs = routeBreadcrumbs[pathname] || [{ label: "DataPulse" }];

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) || "system";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else if (t === "light") root.classList.remove("dark");
    else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  };

  const cycleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <header className="fixed top-0 right-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4"
      style={{ left: sidebarCollapsed ? "64px" : "260px", transition: "left 0.3s ease" }}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
            {crumb.href && i < breadcrumbs.length - 1 ? (
              <Link href={crumb.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate">
                {crumb.label}
              </Link>
            ) : (
              <span className={cn("text-sm font-medium truncate", i === breadcrumbs.length - 1 ? "text-foreground" : "text-muted-foreground")}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Search hint */}
        <button
          onClick={() => {
            const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
            document.dispatchEvent(event);
          }}
          className="hidden md:flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-2 rounded bg-background border border-border px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
        </button>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Bell className="h-4 w-4" />
          {notifCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {notifCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

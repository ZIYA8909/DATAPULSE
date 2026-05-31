"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, DollarSign, Users, Package,
  Globe, Megaphone, FileText, Upload, Activity, Bell,
  Settings, Shield, Search, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const commands = [
  { label: "Dashboard", href: "/overview", icon: LayoutDashboard, group: "Navigation" },
  { label: "Sales Analytics", href: "/analytics/sales", icon: TrendingUp, group: "Analytics" },
  { label: "Revenue Analytics", href: "/analytics/revenue", icon: DollarSign, group: "Analytics" },
  { label: "User Analytics", href: "/analytics/users", icon: Users, group: "Analytics" },
  { label: "Product Performance", href: "/analytics/products", icon: Package, group: "Analytics" },
  { label: "Regional Analytics", href: "/analytics/regional", icon: Globe, group: "Analytics" },
  { label: "Marketing Campaigns", href: "/analytics/marketing", icon: Megaphone, group: "Analytics" },
  { label: "Reports", href: "/reports", icon: FileText, group: "Workspace" },
  { label: "Data Import", href: "/data", icon: Upload, group: "Workspace" },
  { label: "Activity Log", href: "/activity", icon: Activity, group: "Workspace" },
  { label: "Notifications", href: "/notifications", icon: Bell, group: "Workspace" },
  { label: "User Management", href: "/admin/users", icon: Users, group: "Admin" },
  { label: "Audit Trail", href: "/admin/activity", icon: Activity, group: "Admin" },
  { label: "Platform Settings", href: "/admin/settings", icon: Settings, group: "Admin" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.group.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const groupedFiltered = filtered.reduce<Record<string, typeof commands>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {});

  const allFiltered = Object.values(groupedFiltered).flat();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allFiltered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && allFiltered[selectedIndex]) {
        router.push(allFiltered[selectedIndex].href);
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, allFiltered, selectedIndex, router]);

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search pages and actions..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {Object.entries(groupedFiltered).map(([group, items]) => (
            <div key={group} className="mb-2">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group}
              </div>
              {items.map((cmd) => {
                const Icon = cmd.icon;
                const flatIndex = allFiltered.indexOf(cmd);
                const isSelected = flatIndex === selectedIndex;
                return (
                  <button
                    key={cmd.href}
                    onClick={() => navigate(cmd.href)}
                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{cmd.label}</span>
                    {isSelected && <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-60" />}
                  </button>
                );
              })}
            </div>
          ))}
          {allFiltered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-muted px-1 py-0.5">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-muted px-1 py-0.5">↵</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-muted px-1 py-0.5">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

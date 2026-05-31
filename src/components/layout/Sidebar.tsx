"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3, LayoutDashboard, TrendingUp, Users, Package,
  Globe, Megaphone, FileText, Upload, Settings, Shield,
  ChevronLeft, ChevronRight, LogOut, Activity, Bell,
  DollarSign, ChevronDown, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { ROLE_COLORS } from "@/lib/constants";

const navigation = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/overview", icon: LayoutDashboard },
    ],
  },
  {
    group: "Analytics",
    items: [
      { label: "Sales", href: "/analytics/sales", icon: TrendingUp },
      { label: "Revenue", href: "/analytics/revenue", icon: DollarSign },
      { label: "Users", href: "/analytics/users", icon: Users },
      { label: "Products", href: "/analytics/products", icon: Package },
      { label: "Regional", href: "/analytics/regional", icon: Globe },
      { label: "Marketing", href: "/analytics/marketing", icon: Megaphone },
    ],
  },
  {
    group: "Workspace",
    items: [
      { label: "Reports", href: "/reports", icon: FileText },
      { label: "Data Import", href: "/data", icon: Upload },
      { label: "Activity", href: "/activity", icon: Activity },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    group: "Administration",
    items: [
      { label: "User Management", href: "/admin/users", icon: Users, adminOnly: true },
      { label: "Audit Logs", href: "/admin/activity", icon: Activity, adminOnly: true },
      { label: "Settings", href: "/admin/settings", icon: Settings, adminOnly: true },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const isAdmin = session?.user && (session.user as any).role === "ADMIN";

  const isActive = (href: string) => {
    if (href === "/overview") return pathname === "/overview";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-card border-r border-border",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-14 shrink-0 items-center border-b border-border px-4",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-brand shadow-md shadow-primary/20">
          <BarChart3 className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold tracking-tight">DataPulse</span>
            <div className="text-xs text-muted-foreground leading-none mt-0.5">Business Intelligence</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground",
            collapsed && "absolute -right-3 top-4 border border-border bg-card shadow-sm"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navigation.map((section) => {
          // Filter admin-only items
          const visibleItems = section.items.filter(
            (item) => !(item as any).adminOnly || isAdmin
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.group} className="mb-2">
              {!collapsed && (
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {section.group}
                  </span>
                </div>
              )}
              {collapsed && <div className="border-t border-border/50 my-1.5" />}

              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "nav-item",
                      active && "nav-item-active",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "")} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Organization Badge */}
      {!collapsed && session?.user && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">Meridian Capital Group</span>
          </div>
        </div>
      )}

      {/* User profile */}
      <div className="border-t border-border p-2">
        <div className={cn(
          "flex items-center gap-3 rounded-md px-2 py-2",
          collapsed && "justify-center"
        )}>
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-white text-xs font-semibold shadow-sm">
            {session?.user?.name ? getInitials(session.user.name) : "?"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{session?.user?.name}</p>
              <span className={cn(
                "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
                ROLE_COLORS[(session?.user as any)?.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.VIEWER
              )}>
                {(session?.user as any)?.role || "Viewer"}
              </span>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

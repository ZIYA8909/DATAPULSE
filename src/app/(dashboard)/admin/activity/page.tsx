"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Filter } from "lucide-react";
import { formatDate, formatRelativeTime, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ROLE_COLORS } from "@/lib/constants";

const ACTION_STYLES: Record<string, string> = {
  LOGIN: "bg-green-500/15 text-green-700 dark:text-green-400",
  LOGOUT: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  CREATE: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  UPDATE: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  DELETE: "bg-red-500/15 text-red-600 dark:text-red-400",
  EXPORT: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  IMPORT: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  VIEW: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  SHARE: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Signed in", LOGOUT: "Signed out", CREATE: "Created",
  UPDATE: "Updated", DELETE: "Deleted", EXPORT: "Exported",
  IMPORT: "Imported", VIEW: "Viewed", SHARE: "Shared",
};

export default function AdminActivityPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (actionFilter !== "all") params.set("action", actionFilter);
      const res = await fetch(`/api/admin/activity?${params}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, [page, actionFilter]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const actions = ["all", "LOGIN", "CREATE", "UPDATE", "DELETE", "EXPORT", "IMPORT", "VIEW"];

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Complete log of all user actions and system events.</p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-1.5">{data?.total || 0} events</span>
      </div>

      {/* Action filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {actions.map((action) => (
          <button key={action} onClick={() => { setActionFilter(action); setPage(1); }}
            className={cn("rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              actionFilter === action ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted")}>
            {action === "all" ? "All Events" : ACTION_LABELS[action] || action}
          </button>
        ))}
      </div>

      {/* Activity timeline */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["User", "Action", "Resource", "IP Address", "Time"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-4 py-3.5"><div className="skeleton h-4 rounded w-24" /></td>
                ))}</tr>
              )) : (data?.items || []).map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-primary text-white text-xs font-semibold">
                        {getInitials(log.user.name)}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{log.user.name}</p>
                        <span className={cn("text-[10px] font-medium rounded-sm px-1 py-0.5", ROLE_COLORS[log.user.role as keyof typeof ROLE_COLORS])}>
                          {log.user.role}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", ACTION_STYLES[log.action] || "bg-muted")}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-xs font-medium capitalize">{log.entity}</p>
                      {log.entityName && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{log.entityName}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">{log.ip || "—"}</td>
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-xs">{formatRelativeTime(log.createdAt)}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDate(log.createdAt, "MMM d, HH:mm")}</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">Page {page} of {data.totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-40">Previous</button>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

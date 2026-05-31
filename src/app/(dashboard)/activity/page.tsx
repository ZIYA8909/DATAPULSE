"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Filter } from "lucide-react";
import { formatRelativeTime, formatDate, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ROLE_COLORS } from "@/lib/constants";

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Signed in", LOGOUT: "Signed out", CREATE: "Created",
  UPDATE: "Updated", DELETE: "Deleted", EXPORT: "Exported",
  IMPORT: "Imported", VIEW: "Viewed", SHARE: "Shared",
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-emerald-500", LOGOUT: "bg-zinc-400", CREATE: "bg-blue-500",
  UPDATE: "bg-amber-500", DELETE: "bg-red-500", EXPORT: "bg-violet-500",
  IMPORT: "bg-cyan-500", VIEW: "bg-zinc-400", SHARE: "bg-pink-500",
};

export default function ActivityPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/activity?page=${page}&pageSize=20`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Activity Timeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track all user actions across the platform.</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[39px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-1">
          {loading ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <div className="skeleton h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="skeleton h-4 w-64 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
              </div>
            </div>
          )) : (data?.items || []).map((log: any, i: number) => (
            <div key={log.id} className="relative flex items-start gap-4 rounded-xl p-3 hover:bg-muted/20 transition-colors">
              {/* Avatar */}
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-primary text-white text-xs font-semibold z-10">
                {getInitials(log.user.name)}
              </div>

              {/* Dot on timeline */}
              <span className={cn("absolute left-[35px] top-5 h-2 w-2 rounded-full z-10 ring-2 ring-background",
                ACTION_COLORS[log.action] || "bg-zinc-400")} />

              {/* Content */}
              <div className="flex-1 min-w-0 ml-2">
                <p className="text-sm">
                  <span className="font-semibold">{log.user.name}</span>
                  {" "}<span className="text-muted-foreground">{(ACTION_LABELS[log.action] || log.action).toLowerCase()}</span>
                  {log.entityName && <span className="font-medium"> {log.entityName}</span>}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn("text-[10px] font-medium rounded-sm px-1 py-0.5", ROLE_COLORS[log.user.role as keyof typeof ROLE_COLORS])}>
                    {log.user.role}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(log.createdAt)}</span>
                  {log.ip && <span className="text-[11px] text-muted-foreground/60 font-mono">{log.ip}</span>}
                </div>
              </div>

              <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                {formatDate(log.createdAt, "MMM d, HH:mm")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-md border border-border px-4 py-2 text-xs hover:bg-accent disabled:opacity-40 transition-colors">Previous</button>
          <span className="text-xs text-muted-foreground">Page {page} of {data.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
            className="rounded-md border border-border px-4 py-2 text-xs hover:bg-accent disabled:opacity-40 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}

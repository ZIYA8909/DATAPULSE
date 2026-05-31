"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Cpu } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  SUCCESS: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  INFO: <Info className="h-4 w-4 text-blue-500" />,
  WARNING: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  ERROR: <XCircle className="h-4 w-4 text-red-500" />,
  SYSTEM: <Cpu className="h-4 w-4 text-zinc-400" />,
};

const TYPE_BG: Record<string, string> = {
  SUCCESS: "bg-emerald-500/10",
  INFO: "bg-blue-500/10",
  WARNING: "bg-amber-500/10",
  ERROR: "bg-red-500/10",
  SYSTEM: "bg-zinc-500/10",
};

export default function NotificationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
    toast.success("All notifications marked as read");
    fetchNotifications();
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchNotifications();
  };

  const notifications = (data?.notifications || []).filter((n: any) =>
    filter === "all" || !n.read
  );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.unreadCount ? `${data.unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            {(["all", "unread"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {f === "all" ? "All" : `Unread (${data?.unreadCount || 0})`}
              </button>
            ))}
          </div>
          {data?.unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
              <CheckCheck className="h-3.5 w-3.5" />Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-5">
              <div className="skeleton h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-sm">No notifications</p>
            <p className="text-xs text-muted-foreground mt-1">{filter === "unread" ? "All caught up! No unread notifications." : "You have no notifications yet."}</p>
          </div>
        ) : (
          notifications.map((notif: any) => (
            <div
              key={notif.id}
              onClick={() => !notif.read && markRead(notif.id)}
              className={cn(
                "flex items-start gap-4 p-5 transition-colors cursor-default",
                !notif.read && "bg-primary/3 hover:bg-primary/5",
                notif.read && "hover:bg-muted/20"
              )}
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5", TYPE_BG[notif.type] || "bg-muted")}>
                {TYPE_ICONS[notif.type]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm font-medium", !notif.read && "font-semibold")}>{notif.title}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {!notif.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(notif.createdAt)}</span>
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{notif.body}</p>
                {notif.link && (
                  <Link href={notif.link} className="mt-2 inline-flex text-xs text-primary font-medium hover:underline">
                    View details →
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

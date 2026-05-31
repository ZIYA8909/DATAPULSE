"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Shield, UserCheck, UserX, Search, ChevronDown, MoreHorizontal } from "lucide-react";
import { formatDate, formatRelativeTime, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ROLE_COLORS, USER_ROLES } from "@/lib/constants";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      setData(await res.json());
    } finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role }),
      });
      if (!res.ok) { toast.error("Failed to update role"); return; }
      toast.success("Role updated", { description: `User role changed to ${role}.` });
      fetchUsers();
    } finally { setActiveMenu(null); }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, isActive: !isActive }),
      });
      if (!res.ok) { toast.error("Failed to update user"); return; }
      toast.success(isActive ? "User deactivated" : "User activated");
      fetchUsers();
    } finally { setActiveMenu(null); }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage team members, roles, and access permissions.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium">{data?.total || 0} users</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          {["all", "ADMIN", "ANALYST", "VIEWER"].map((role) => (
            <button key={role} onClick={() => { setRoleFilter(role); setPage(1); }}
              className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                roleFilter === role ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {role === "all" ? "All" : USER_ROLES[role as keyof typeof USER_ROLES]}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["User", "Role", "Department", "Status", "Last Active", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-4"><div className="skeleton h-4 rounded" style={{ width: j === 0 ? "140px" : "80px" }} /></td>
                  ))}
                </tr>
              )) : (data?.items || []).map((user: any) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary text-white text-xs font-semibold">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", ROLE_COLORS[user.role as keyof typeof ROLE_COLORS])}>
                      {USER_ROLES[user.role as keyof typeof USER_ROLES]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs">{user.jobTitle || "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn("flex items-center gap-1 text-xs font-medium w-fit",
                      user.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", user.isActive ? "bg-emerald-500" : "bg-red-500")} />
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                    {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : "Never"}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(user.createdAt, "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="relative">
                      <button onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {activeMenu === user.id && (
                        <div className="absolute right-0 top-8 z-10 w-44 rounded-lg border border-border bg-card shadow-lg overflow-hidden animate-in">
                          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Change Role</div>
                          {["ADMIN", "ANALYST", "VIEWER"].map((role) => (
                            <button key={role} onClick={() => handleRoleChange(user.id, role)}
                              className="flex w-full items-center px-3 py-2 text-xs hover:bg-muted transition-colors">
                              {USER_ROLES[role as keyof typeof USER_ROLES]}
                            </button>
                          ))}
                          <div className="border-t border-border mt-1" />
                          <button onClick={() => handleToggleActive(user.id, user.isActive)}
                            className={cn("flex w-full items-center px-3 py-2 text-xs hover:bg-muted transition-colors",
                              user.isActive ? "text-red-500" : "text-emerald-600")}>
                            {user.isActive ? "Deactivate User" : "Activate User"}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
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

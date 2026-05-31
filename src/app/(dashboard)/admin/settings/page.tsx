"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Settings, Bell, Key, Building2, Shield, Save, Copy, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = ["Organization", "Notifications", "API Keys", "Security"] as const;
type Tab = typeof tabs[number];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Organization");
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState("Meridian Capital Group");
  const [industry, setIndustry] = useState("Financial Services");

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast.success("Settings saved", { description: "Your changes have been applied." });
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your organization, notifications, and security preferences.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar nav */}
        <nav className="flex flex-row gap-1 lg:flex-col lg:w-48 shrink-0">
          {[
            { id: "Organization", icon: Building2 },
            { id: "Notifications", icon: Bell },
            { id: "API Keys", icon: Key },
            { id: "Security", icon: Shield },
          ].map(({ id, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id as Tab)}
              className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                activeTab === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline lg:inline">{id}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeTab === "Organization" && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <h2 className="text-sm font-semibold">Organization Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Organization Name</label>
                  <input value={orgName} onChange={e => setOrgName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Industry</label>
                  <select value={industry} onChange={e => setIndustry(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                    {["Financial Services", "Healthcare Technology", "E-Commerce & Retail", "Supply Chain & Logistics", "Clean Energy", "Software & SaaS", "Manufacturing"].map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Plan</label>
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">Enterprise</span>
                    <span className="text-xs text-muted-foreground">Renews Jan 1, 2026</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 rounded-lg gradient-brand text-white px-4 py-2 text-sm font-medium shadow-sm hover:opacity-90 disabled:opacity-50 transition-all">
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "Notifications" && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <h2 className="text-sm font-semibold">Notification Preferences</h2>
              <div className="space-y-3">
                {[
                  { label: "Weekly Revenue Report", desc: "Receive a weekly summary of revenue metrics every Monday", enabled: true },
                  { label: "Campaign Alerts", desc: "Get notified when campaign ROAS drops below threshold", enabled: true },
                  { label: "New User Registrations", desc: "Email when new users join your organization", enabled: false },
                  { label: "Data Import Completion", desc: "Notification when CSV imports finish processing", enabled: true },
                  { label: "Report Failures", desc: "Alert when scheduled reports fail to generate", enabled: true },
                  { label: "API Usage Warnings", desc: "Notify when API usage exceeds 80% of monthly limit", enabled: true },
                ].map((notif, i) => (
                  <label key={notif.label} className="flex items-start gap-4 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/20 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notif.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.desc}</p>
                    </div>
                    <div className={cn("mt-0.5 relative h-5 w-9 rounded-full transition-colors shrink-0", notif.enabled ? "bg-primary" : "bg-muted")}>
                      <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", notif.enabled ? "translate-x-4" : "translate-x-0.5")} />
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 rounded-lg gradient-brand text-white px-4 py-2 text-sm font-medium shadow-sm hover:opacity-90 disabled:opacity-50 transition-all">
                  <Save className="h-3.5 w-3.5" />{saving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "API Keys" && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">API Keys</h2>
                <button onClick={() => toast.info("Create API key flow — coming soon")}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                  <Key className="h-3.5 w-3.5" />Create Key
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Production Integration", key: "dp_live_k7x9mq2nr4p8v3wz6y1ts5aj0eublfc", prefix: "dp_live_k", lastUsed: "2 days ago", active: true },
                  { name: "Staging / Testing", key: "dp_test_r2m8nq5xt1p4v7wz3y6aj0eublkfc9s", prefix: "dp_test_r", lastUsed: "7 days ago", active: true },
                ].map((apiKey) => (
                  <div key={apiKey.name} className="rounded-lg border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{apiKey.name}</p>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-md bg-muted px-3 py-1.5 text-xs font-mono text-muted-foreground">
                        {apiKey.prefix}••••••••••••••••••••••••
                      </code>
                      <button onClick={() => copyKey(apiKey.key)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Last used: {apiKey.lastUsed}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Security" && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <h2 className="text-sm font-semibold">Security Settings</h2>
              <div className="space-y-3">
                {[
                  { label: "Two-Factor Authentication", desc: "Require 2FA for all admin users", status: "Enabled", color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Session Timeout", desc: "Automatically sign out after 8 hours of inactivity", status: "8 hours", color: "text-muted-foreground" },
                  { label: "IP Allowlisting", desc: "Restrict access to specific IP ranges", status: "Disabled", color: "text-amber-500" },
                  { label: "Audit Logging", desc: "Log all user actions to the audit trail", status: "Enabled", color: "text-emerald-600 dark:text-emerald-400" },
                ].map((setting) => (
                  <div key={setting.label} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-medium">{setting.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{setting.desc}</p>
                    </div>
                    <span className={cn("text-xs font-semibold", setting.color)}>{setting.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

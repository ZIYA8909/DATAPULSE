"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X, Eye, Trash2, Database } from "lucide-react";
import { formatBytes, formatDate, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  READY: { color: "text-emerald-600 dark:text-emerald-400", icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Ready" },
  PROCESSING: { color: "text-amber-500", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, label: "Processing" },
  ERROR: { color: "text-red-500", icon: <AlertCircle className="h-3.5 w-3.5" />, label: "Error" },
};

export default function DataImportPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewDataset, setPreviewDataset] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data/upload");
      const data = await res.json();
      setDatasets(data.datasets || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDatasets(); }, [fetchDatasets]);

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Invalid file type", { description: "Only CSV files are supported." });
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name.replace(".csv", "").replace(/_/g, " "));

    try {
      const res = await fetch("/api/data/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Upload complete", { description: `${data.dataset.rows} rows imported successfully.` });
      fetchDatasets();
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Data Import</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Upload CSV files to import data into DataPulse.</p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all",
          dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-card hover:border-primary/40 hover:bg-muted/20"
        )}
      >
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />

        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin" />
            <p className="font-medium text-sm">Processing your file...</p>
            <p className="text-xs text-muted-foreground">Parsing rows and validating columns</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={cn("mx-auto flex h-14 w-14 items-center justify-center rounded-full transition-colors",
              dragOver ? "bg-primary/20" : "bg-muted")}>
              <Upload className={cn("h-6 w-6 transition-colors", dragOver ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div>
              <p className="font-semibold text-sm">Drop your CSV file here</p>
              <p className="text-xs text-muted-foreground mt-1">or <span className="text-primary">browse to upload</span> · Max 50MB</p>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />CSV format</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />Auto-detection</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />Column preview</span>
            </div>
          </div>
        )}
      </div>

      {/* Dataset list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Import History</h2>
          <span className="text-xs text-muted-foreground">{datasets.length} datasets</span>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 rounded" />)}
          </div>
        ) : datasets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Database className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">No datasets yet</p>
            <p className="text-xs text-muted-foreground mt-1">Upload your first CSV file above.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {datasets.map((ds) => {
              const statusInfo = STATUS_STYLES[ds.status] || STATUS_STYLES.READY;
              return (
                <div key={ds.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{ds.name}</p>
                      <span className={cn("flex items-center gap-1 text-xs font-medium", statusInfo.color)}>
                        {statusInfo.icon}{statusInfo.label}
                      </span>
                    </div>
                    {ds.status === "ERROR" && ds.errorMessage ? (
                      <p className="text-xs text-red-500 mt-0.5 truncate">{ds.errorMessage}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ds.rows > 0 ? `${ds.rows.toLocaleString()} rows` : "—"} · {formatBytes(ds.size)} · {ds.originalName}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">{ds.uploadedBy?.name}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(ds.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {ds.status === "READY" && ds.preview && (
                      <button onClick={() => setPreviewDataset(ds)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewDataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPreviewDataset(null)} />
          <div className="relative w-full max-w-4xl rounded-xl border border-border bg-card shadow-xl animate-in overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold">{previewDataset.name}</h2>
                <p className="text-xs text-muted-foreground">{previewDataset.rows} rows · {previewDataset.columns?.length} columns</p>
              </div>
              <button onClick={() => setPreviewDataset(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {previewDataset.columns?.map((col: any) => (
                      <th key={col.name} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">{col.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(previewDataset.preview || []).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/20">
                      {previewDataset.columns?.map((col: any) => (
                        <td key={col.name} className="px-3 py-2 whitespace-nowrap text-muted-foreground">{row[col.name] || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
              Showing first {Math.min(10, previewDataset.rows)} of {previewDataset.rows} rows
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

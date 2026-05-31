import { cn } from "@/lib/utils";
import { BarChart3, FileText, Search, Upload, AlertCircle } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon = BarChart3, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center",
      className
    )}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function NoDataState() {
  return (
    <EmptyState
      icon={BarChart3}
      title="No data available"
      description="There's no data to display for the selected date range or filters. Try adjusting your filters."
    />
  );
}

export function NoReportsState({ onCreateReport }: { onCreateReport?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No reports yet"
      description="Create your first report to start tracking and sharing insights with your team."
      action={onCreateReport ? { label: "Create Report", onClick: onCreateReport } : undefined}
    />
  );
}

export function NoSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title={`No results for "${query}"`}
      description="Try searching with different keywords or adjusting your filters."
    />
  );
}

export function NoDatasetsState({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={Upload}
      title="No datasets uploaded"
      description="Upload a CSV file to start importing data into DataPulse."
      action={onUpload ? { label: "Upload Dataset", onClick: onUpload } : undefined}
    />
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Something went wrong"
      description={message || "An error occurred while loading data. Please try refreshing the page."}
    />
  );
}

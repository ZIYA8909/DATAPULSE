export const APP_NAME = "DataPulse";
export const APP_TAGLINE = "Decisions powered by data.";

export const DATE_PRESETS = [
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 30 days", value: "30d", days: 30 },
  { label: "Last 90 days", value: "90d", days: 90 },
  { label: "Last 6 months", value: "6mo", days: 180 },
  { label: "Year to date", value: "ytd", days: -1 },
  { label: "Last 12 months", value: "12mo", days: 365 },
] as const;

export const USER_ROLES = {
  ADMIN: "Admin",
  ANALYST: "Analyst",
  VIEWER: "Viewer",
} as const;

export const ROLE_COLORS = {
  ADMIN: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  ANALYST: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  VIEWER: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
} as const;

export const ANALYTICS_METRICS = {
  revenue: { label: "Revenue", format: "currency", color: "#6366f1" },
  active_users: { label: "Active Users", format: "number", color: "#06b6d4" },
  sessions: { label: "Sessions", format: "number", color: "#8b5cf6" },
  conversions: { label: "Conversions", format: "number", color: "#10b981" },
  bounce_rate: { label: "Bounce Rate", format: "percent", color: "#f59e0b" },
  avg_session_duration: { label: "Avg. Session", format: "duration", color: "#ec4899" },
} as const;

export const CHART_COLORS = {
  primary: "#6366f1",
  secondary: "#06b6d4",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
  teal: "#14b8a6",
  orange: "#f97316",
};

export const CHART_COLORS_ARRAY = Object.values(CHART_COLORS);

export const REGIONS = [
  "North America",
  "Europe",
  "Asia Pacific",
  "Latin America",
  "Middle East & Africa",
];

export const TRAFFIC_SOURCES = [
  "Organic Search",
  "Paid Search",
  "Direct",
  "Social Media",
  "Email",
  "Referral",
];

export const REPORT_TYPES = [
  { value: "revenue", label: "Revenue" },
  { value: "sales", label: "Sales" },
  { value: "users", label: "User Analytics" },
  { value: "products", label: "Product Performance" },
  { value: "regional", label: "Regional" },
  { value: "marketing", label: "Marketing" },
  { value: "custom", label: "Custom" },
] as const;

export const NOTIFICATION_TYPES = {
  INFO: { color: "text-blue-500", bg: "bg-blue-500/10" },
  SUCCESS: { color: "text-emerald-500", bg: "bg-emerald-500/10" },
  WARNING: { color: "text-amber-500", bg: "bg-amber-500/10" },
  ERROR: { color: "text-red-500", bg: "bg-red-500/10" },
  SYSTEM: { color: "text-zinc-500", bg: "bg-zinc-500/10" },
} as const;

export const PAGINATION_SIZES = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

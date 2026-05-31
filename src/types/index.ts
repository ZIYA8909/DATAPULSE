export type UserRole = "ADMIN" | "ANALYST" | "VIEWER";
export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "SYSTEM";
export type ReportStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type DatasetStatus = "PROCESSING" | "READY" | "ERROR";
export type ActivityAction = "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "EXPORT" | "IMPORT" | "VIEW" | "SHARE";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  image?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface KPIMetric {
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent: number;
  trend: "up" | "down" | "neutral";
  format: "currency" | "number" | "percent" | "duration";
  sparkline?: number[];
}

export interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

export interface SalesRecord {
  id: string;
  date: Date;
  product: string;
  sku: string;
  category: string;
  revenue: number;
  units: number;
  cogs: number;
  margin: number;
  region: string;
  country: string;
  channel: string;
  salesRep?: string | null;
  customerId?: string | null;
  createdAt: Date;
}

export interface AnalyticsRecord {
  id: string;
  date: Date;
  metric: string;
  value: number;
  dimension?: string | null;
  category?: string | null;
  region?: string | null;
  source?: string | null;
}

export interface ReportItem {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  status: ReportStatus;
  isScheduled: boolean;
  scheduleFreq?: string | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ActivityLogItem {
  id: string;
  action: ActivityAction;
  entity: string;
  entityId?: string | null;
  entityName?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  link?: string | null;
  createdAt: Date;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  jobTitle?: string | null;
  department?: string | null;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  organization?: {
    id: string;
    name: string;
  } | null;
}

export interface DatasetItem {
  id: string;
  name: string;
  filename: string;
  originalName: string;
  size: number;
  rows: number;
  status: DatasetStatus;
  errorMessage?: string | null;
  createdAt: Date;
  uploadedBy: {
    id: string;
    name: string;
  };
}

export type DateRange = {
  from: Date;
  to: Date;
};

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
  requiredRole?: UserRole[];
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

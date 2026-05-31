import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[0-9]/, "Must include a number")
    .regex(/[^A-Za-z0-9]/, "Must include a special character"),
  confirmPassword: z.string(),
  organizationName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"]).optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createReportSchema = z.object({
  name: z.string().min(2, "Report name is required"),
  description: z.string().optional(),
  type: z.enum(["revenue", "sales", "users", "products", "regional", "marketing", "custom"]),
  config: z.record(z.string(), z.unknown()),
  isScheduled: z.boolean().optional().default(false),
  scheduleFreq: z.enum(["daily", "weekly", "monthly"]).optional(),
});

export const analyticsQuerySchema = z.object({
  metric: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.string().optional(),
  region: z.string().optional(),
  source: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(25),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const salesQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  region: z.string().optional(),
  channel: z.string().optional(),
  product: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(25),
  sortBy: z.string().optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type SalesQueryInput = z.infer<typeof salesQuerySchema>;

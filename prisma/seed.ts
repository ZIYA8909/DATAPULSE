import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import path from "path";

// Load .env
config({ path: path.join(process.cwd(), ".env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


// Enum string constants (Prisma v7 - no longer exported from @prisma/client)
const UserRole = { ADMIN: "ADMIN", ANALYST: "ANALYST", VIEWER: "VIEWER" } as const;
const ActivityAction = { LOGIN: "LOGIN", LOGOUT: "LOGOUT", CREATE: "CREATE", UPDATE: "UPDATE", DELETE: "DELETE", EXPORT: "EXPORT", IMPORT: "IMPORT", VIEW: "VIEW", SHARE: "SHARE" } as const;
const NotificationType = { INFO: "INFO", SUCCESS: "SUCCESS", WARNING: "WARNING", ERROR: "ERROR", SYSTEM: "SYSTEM" } as const;
const DatasetStatus = { READY: "READY", PROCESSING: "PROCESSING", ERROR: "ERROR" } as const;
const ReportStatus = { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" } as const;


const SALT_ROUNDS = 12;

// ─── Seed Helpers ────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

function dateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ─── Realistic Data Constants ─────────────────────────────────────────────────

const organizations = [
  { name: "Reliance DataTech Pvt Ltd", slug: "reliance-datatech", domain: "reliancedatatech.in", industry: "Financial Services", size: "501-1000", plan: "enterprise" },
  { name: "Tata HealthGrid Systems", slug: "tata-healthgrid", domain: "tatahealthgrid.io", industry: "Healthcare Technology", size: "201-500", plan: "pro" },
  { name: "Infosys LogiChain", slug: "infosys-logichain", domain: "infosyslogichain.co.in", industry: "Supply Chain & Logistics", size: "1001-5000", plan: "enterprise" },
  { name: "Flipkart Commerce Analytics", slug: "flipkart-analytics", domain: "flipkartanalytics.com", industry: "E-Commerce & Retail", size: "51-200", plan: "pro" },
  { name: "Adani Green Intelligence", slug: "adani-green", domain: "adanigreen.in", industry: "Clean Energy", size: "11-50", plan: "starter" },
];

const products = [
  { name: "Enterprise Suite Pro", sku: "ESP-001", category: "Software", baseRevenue: 380000, cogs: 38000 },
  { name: "Analytics Core Module", sku: "ACM-002", category: "Software", baseRevenue: 95000, cogs: 9500 },
  { name: "DataBridge Connector", sku: "DBC-003", category: "Integration", baseRevenue: 62000, cogs: 6200 },
  { name: "CloudSync Platform", sku: "CSP-004", category: "Infrastructure", baseRevenue: 190000, cogs: 47500 },
  { name: "SecureVault API", sku: "SVA-005", category: "Security", baseRevenue: 47000, cogs: 4700 },
  { name: "ReportIQ Premium", sku: "RIQ-006", category: "Reporting", baseRevenue: 75000, cogs: 7500 },
  { name: "AI Insights Add-on", sku: "AIA-007", category: "AI/ML", baseRevenue: 142000, cogs: 28400 },
  { name: "Mobile Dashboard SDK", sku: "MDS-008", category: "SDK", baseRevenue: 38000, cogs: 3800 },
  { name: "Custom Workflow Engine", sku: "CWE-009", category: "Automation", baseRevenue: 285000, cogs: 57000 },
  { name: "Compliance Monitor", sku: "CMN-010", category: "Compliance", baseRevenue: 56000, cogs: 5600 },
  { name: "Data Warehouse Bundle", sku: "DWB-011", category: "Infrastructure", baseRevenue: 425000, cogs: 106250 },
  { name: "API Gateway Manager", sku: "AGM-012", category: "Integration", baseRevenue: 85000, cogs: 8500 },
  { name: "User Behavior Tracker", sku: "UBT-013", category: "Analytics", baseRevenue: 28000, cogs: 2800 },
  { name: "Predictive Analytics ML", sku: "PAM-014", category: "AI/ML", baseRevenue: 228000, cogs: 45600 },
  { name: "Executive Dashboards", sku: "EXD-015", category: "Reporting", baseRevenue: 114000, cogs: 11400 },
];

const regions = ["North India", "South India", "West India", "East India", "International"];
const countries: Record<string, string[]> = {
  "North India": ["Delhi", "Uttar Pradesh", "Rajasthan", "Punjab", "Haryana"],
  "South India": ["Maharashtra", "Karnataka", "Tamil Nadu", "Telangana", "Kerala"],
  "West India": ["Gujarat", "Goa", "Madhya Pradesh", "Chhattisgarh"],
  "East India": ["West Bengal", "Odisha", "Bihar", "Jharkhand"],
  "International": ["UAE", "Singapore", "United States", "United Kingdom"],
};
const channels = ["Online", "Enterprise Direct", "Channel Partner", "Marketplace"];
const trafficSources = ["Organic Search", "Paid Search", "Direct", "Social Media", "Email", "Referral"];

const salesReps = [
  "Arjun Sharma", "Priya Nair", "Rahul Gupta", "Sneha Reddy", "Vikram Mehta",
  "Anjali Singh", "Kiran Patel", "Deepa Iyer", "Rohan Verma", "Pooja Krishnan",
];

const campaignNames = [
  "Q1 Enterprise Expansion Drive", "Diwali SaaS Acceleration", "South India Market Push Q2",
  "Mid-Year Revenue Drive", "BFSI Vertical Campaign", "Healthcare Digital Transformation",
  "Q3 Partner Channel Enablement", "Back-to-Business September", "Festive Season Bundle",
  "Year-End License Renewal Push", "Product Launch: AI Insights", "Tier-2 Cities Outreach",
];

const campaignChannels = ["Email", "Paid Search", "Social Media", "Display", "Content Marketing", "Webinar"];

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting DataPulse seed...\n");

  // Clean up existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.dashboardLayout.deleteMany();
  await prisma.dataset.deleteMany();
  await prisma.report.deleteMany();
  await prisma.analyticsRecord.deleteMany();
  await prisma.salesRecord.deleteMany();
  await prisma.marketingCampaign.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log("✓ Cleared existing data");

  // ── Organizations ──
  const orgs = await Promise.all(
    organizations.map((org) =>
      prisma.organization.create({ data: org })
    )
  );
  console.log(`✓ Created ${orgs.length} organizations`);

  // ── Users ──
  const adminHash = await bcrypt.hash("Admin@123!", SALT_ROUNDS);
  const analystHash = await bcrypt.hash("Analyst@123!", SALT_ROUNDS);
  const viewerHash = await bcrypt.hash("Viewer@123!", SALT_ROUNDS);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@datapulse.io",
      name: "Ziya Khan",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
      jobTitle: "VP of Analytics",
      department: "Data & Intelligence",
      organizationId: orgs[0].id,
      lastLoginAt: new Date(),
    },
  });

  const analystUser = await prisma.user.create({
    data: {
      email: "analyst@datapulse.io",
      name: "Arjun Sharma",
      passwordHash: analystHash,
      role: UserRole.ANALYST,
      emailVerified: new Date(),
      jobTitle: "Senior Data Analyst",
      department: "Revenue Operations",
      organizationId: orgs[0].id,
      lastLoginAt: addDays(new Date(), -1),
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      email: "viewer@datapulse.io",
      name: "Priya Nair",
      passwordHash: viewerHash,
      role: UserRole.VIEWER,
      emailVerified: new Date(),
      jobTitle: "Regional Sales Director",
      department: "Sales",
      organizationId: orgs[0].id,
      lastLoginAt: addDays(new Date(), -3),
    },
  });

  // Extra users for the admin panel
  const extraUsers = await Promise.all([
    prisma.user.create({ data: { email: "r.gupta@datapulse.io", name: "Rahul Gupta", passwordHash: analystHash, role: UserRole.ANALYST, emailVerified: new Date(), jobTitle: "Business Intelligence Engineer", department: "Analytics", organizationId: orgs[0].id } }),
    prisma.user.create({ data: { email: "s.reddy@datapulse.io", name: "Sneha Reddy", passwordHash: viewerHash, role: UserRole.VIEWER, emailVerified: new Date(), jobTitle: "Marketing Manager", department: "Marketing", organizationId: orgs[0].id } }),
    prisma.user.create({ data: { email: "v.mehta@datapulse.io", name: "Vikram Mehta", passwordHash: viewerHash, role: UserRole.VIEWER, emailVerified: new Date(), jobTitle: "Sales Executive", department: "Sales", organizationId: orgs[1].id } }),
    prisma.user.create({ data: { email: "a.singh@datapulse.io", name: "Anjali Singh", passwordHash: analystHash, role: UserRole.ANALYST, emailVerified: new Date(), jobTitle: "Data Scientist", department: "Product", organizationId: orgs[1].id } }),
    prisma.user.create({ data: { email: "k.patel@datapulse.io", name: "Kiran Patel", passwordHash: viewerHash, role: UserRole.VIEWER, isActive: false, jobTitle: "Operations Manager", department: "Ops", organizationId: orgs[2].id } }),
  ]);

  console.log(`✓ Created ${3 + extraUsers.length} users`);

  // ── Analytics Records (2 years of daily data) ──
  const endDate = new Date();
  const startDate = addDays(endDate, -730); // 2 years
  const dates = dateRange(startDate, endDate);

  const analyticsRecords: any[] = [];
  let baseRevenue = 3500000; // ₹35 Lakhs/day base
  let baseUsers = 1200;
  let baseSessions = 8500;

  for (const date of dates) {
    // Progressive growth trend
    const dayIndex = dates.indexOf(date);
    const growthFactor = 1 + (dayIndex / dates.length) * 0.8; // up to 80% growth over period
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const weekendMultiplier = isWeekend ? 0.6 : 1;
    const seasonalMultiplier = 1 + 0.2 * Math.sin((date.getMonth() / 12) * 2 * Math.PI);
    const noise = () => 1 + (Math.random() - 0.5) * 0.15;

    // Revenue
    analyticsRecords.push({
      date, metric: "revenue",
      value: Math.round(baseRevenue * growthFactor * weekendMultiplier * seasonalMultiplier * noise()),
      category: "overall",
    });

    // Active Users
    analyticsRecords.push({
      date, metric: "active_users",
      value: Math.round(baseUsers * growthFactor * weekendMultiplier * noise()),
      category: "overall",
    });

    // Sessions
    analyticsRecords.push({
      date, metric: "sessions",
      value: Math.round(baseSessions * growthFactor * weekendMultiplier * noise()),
      category: "overall",
    });

    // Conversions
    analyticsRecords.push({
      date, metric: "conversions",
      value: Math.round(randomBetween(12, 45) * growthFactor * weekendMultiplier * noise()),
      category: "overall",
    });

    // Bounce rate (should decrease over time - improvement)
    analyticsRecords.push({
      date, metric: "bounce_rate",
      value: Math.max(25, Math.round((68 - dayIndex * 0.02) * noise() * 10) / 10),
      category: "overall",
    });

    // Avg session duration (seconds)
    analyticsRecords.push({
      date, metric: "avg_session_duration",
      value: Math.round(randomBetween(180, 340) * noise()),
      category: "overall",
    });

    // Traffic by source
    for (const source of trafficSources) {
      const sourceWeights: Record<string, number> = {
        "Organic Search": 0.38,
        "Paid Search": 0.22,
        "Direct": 0.18,
        "Social Media": 0.12,
        "Email": 0.06,
        "Referral": 0.04,
      };
      analyticsRecords.push({
        date, metric: "sessions",
        value: Math.round(baseSessions * growthFactor * weekendMultiplier * (sourceWeights[source] || 0.1) * noise()),
        category: "channel",
        source,
      });
    }
  }

  // Batch insert analytics
  const batchSize = 500;
  for (let i = 0; i < analyticsRecords.length; i += batchSize) {
    await prisma.analyticsRecord.createMany({
      data: analyticsRecords.slice(i, i + batchSize),
    });
  }
  console.log(`✓ Created ${analyticsRecords.length} analytics records`);

  // ── Sales Records ──
  const salesRecords: any[] = [];
  const salesDates = dateRange(addDays(endDate, -365), endDate); // 1 year of sales

  for (const date of salesDates) {
    const numSales = randomInt(3, 12);
    for (let i = 0; i < numSales; i++) {
      const product = products[randomInt(0, products.length - 1)];
      const region = regions[randomInt(0, regions.length - 1)];
      const countryList = countries[region];
      const country = countryList[randomInt(0, countryList.length - 1)];
      const channel = channels[randomInt(0, channels.length - 1)];
      const units = randomInt(1, 10);
      const revenueVariance = 1 + (Math.random() - 0.3) * 0.3;
      const revenue = Math.round(product.baseRevenue * units * revenueVariance);
      const cogs = Math.round(product.cogs * units);
      const margin = Math.round(((revenue - cogs) / revenue) * 100 * 10) / 10;

      salesRecords.push({
        date,
        product: product.name,
        sku: product.sku,
        category: product.category,
        revenue,
        units,
        cogs,
        margin,
        region,
        country,
        channel,
        salesRep: salesReps[randomInt(0, salesReps.length - 1)],
        customerId: `CUST-${String(randomInt(1000, 9999))}`,
      });
    }
  }

  for (let i = 0; i < salesRecords.length; i += batchSize) {
    await prisma.salesRecord.createMany({ data: salesRecords.slice(i, i + batchSize) });
  }
  console.log(`✓ Created ${salesRecords.length} sales records`);

  // ── Marketing Campaigns ──
  const campaigns: any[] = [];
  for (let i = 0; i < campaignNames.length; i++) {
    const budget = randomBetween(15000, 120000);
    const spend = budget * randomBetween(0.6, 1.05);
    const impressions = randomInt(50000, 800000);
    const clicks = Math.round(impressions * randomBetween(0.015, 0.065));
    const conversions = Math.round(clicks * randomBetween(0.02, 0.12));
    const revenue = conversions * randomBetween(800, 4500);
    const startDate = addDays(endDate, -randomInt(30, 365));

    campaigns.push({
      name: campaignNames[i],
      channel: campaignChannels[i % campaignChannels.length],
      status: i < 4 ? "active" : i < 8 ? "completed" : i < 11 ? "paused" : "draft",
      startDate,
      endDate: addDays(startDate, randomInt(30, 90)),
      budget: Math.round(budget),
      spend: Math.round(spend),
      impressions,
      clicks,
      conversions,
      revenue: Math.round(revenue),
      ctr: Math.round((clicks / impressions) * 10000) / 100,
      cpc: Math.round((spend / clicks) * 100) / 100,
      roas: Math.round((revenue / spend) * 100) / 100,
      region: regions[randomInt(0, regions.length - 1)],
    });
  }

  await prisma.marketingCampaign.createMany({ data: campaigns });
  console.log(`✓ Created ${campaigns.length} marketing campaigns`);

  // ── Reports ──
  const reports = [
    { name: "Q2 2025 Revenue Summary", type: "revenue", status: ReportStatus.PUBLISHED, config: { metrics: ["revenue", "mrr", "arr"], dateRange: "last_quarter", groupBy: "month" }, isScheduled: false, viewCount: 47 },
    { name: "Monthly Active Users Report", type: "users", status: ReportStatus.PUBLISHED, config: { metrics: ["active_users", "new_users", "churn"], dateRange: "last_30_days" }, isScheduled: true, scheduleFreq: "monthly", viewCount: 134 },
    { name: "Enterprise Sales Performance", type: "sales", status: ReportStatus.PUBLISHED, config: { metrics: ["revenue", "units", "margin"], filters: { channel: "Enterprise Direct" }, groupBy: "product" }, isScheduled: false, viewCount: 89 },
    { name: "APAC Regional Analysis", type: "regional", status: ReportStatus.DRAFT, config: { region: "Asia Pacific", metrics: ["revenue", "conversions"], groupBy: "country" }, isScheduled: false, viewCount: 12 },
    { name: "Campaign ROI Dashboard", type: "marketing", status: ReportStatus.PUBLISHED, config: { metrics: ["roas", "ctr", "conversions", "revenue"], groupBy: "channel" }, isScheduled: true, scheduleFreq: "weekly", viewCount: 203 },
    { name: "Product Performance YTD", type: "products", status: ReportStatus.PUBLISHED, config: { metrics: ["revenue", "units", "margin", "growth"], dateRange: "year_to_date", groupBy: "category" }, isScheduled: false, viewCount: 67 },
    { name: "Weekly Executive Summary", type: "custom", status: ReportStatus.PUBLISHED, config: { sections: ["revenue", "users", "sales", "marketing"], dateRange: "last_7_days" }, isScheduled: true, scheduleFreq: "weekly", viewCount: 312 },
  ];

  for (const report of reports) {
    await prisma.report.create({
      data: { ...report, createdById: adminUser.id, organizationId: orgs[0].id },
    });
  }
  console.log(`✓ Created ${reports.length} reports`);

  // ── Dashboard Layout ──
  await prisma.dashboardLayout.create({
    data: {
      userId: adminUser.id,
      config: {
        widgets: [
          { id: "kpi-revenue", type: "kpi", position: { x: 0, y: 0, w: 3, h: 2 }, props: { metric: "revenue" } },
          { id: "kpi-users", type: "kpi", position: { x: 3, y: 0, w: 3, h: 2 }, props: { metric: "active_users" } },
          { id: "kpi-conversions", type: "kpi", position: { x: 6, y: 0, w: 3, h: 2 }, props: { metric: "conversions" } },
          { id: "kpi-sessions", type: "kpi", position: { x: 9, y: 0, w: 3, h: 2 }, props: { metric: "sessions" } },
          { id: "chart-revenue", type: "area_chart", position: { x: 0, y: 2, w: 8, h: 4 }, props: { metric: "revenue", title: "Revenue Trend" } },
          { id: "chart-sources", type: "donut_chart", position: { x: 8, y: 2, w: 4, h: 4 }, props: { metric: "sessions_by_source", title: "Traffic Sources" } },
        ],
      },
    },
  });

  // ── API Keys ──
  await prisma.apiKey.create({
    data: {
      name: "Production Integration",
      key: "dp_live_k7x9mq2nr4p8v3wz6y1ts5aj0eublfc",
      prefix: "dp_live_k",
      userId: adminUser.id,
      lastUsedAt: addDays(new Date(), -2),
    },
  });
  await prisma.apiKey.create({
    data: {
      name: "Staging / Testing",
      key: "dp_test_r2m8nq5xt1p4v7wz3y6aj0eublkfc9s",
      prefix: "dp_test_r",
      userId: adminUser.id,
      lastUsedAt: addDays(new Date(), -7),
    },
  });

  // ── Activity Logs ──
  const allUsers = [adminUser, analystUser, viewerUser, ...extraUsers];
  const activityActions = [
    { action: ActivityAction.VIEW, entity: "report", entityName: "Q2 Revenue Summary" },
    { action: ActivityAction.EXPORT, entity: "report", entityName: "Enterprise Sales Performance" },
    { action: ActivityAction.CREATE, entity: "report", entityName: "APAC Regional Analysis" },
    { action: ActivityAction.LOGIN, entity: "user", entityName: "Session started" },
    { action: ActivityAction.UPDATE, entity: "setting", entityName: "Notification preferences" },
    { action: ActivityAction.IMPORT, entity: "dataset", entityName: "Q3_sales_data.csv" },
    { action: ActivityAction.VIEW, entity: "analytics", entityName: "Revenue Analytics" },
    { action: ActivityAction.EXPORT, entity: "analytics", entityName: "User Engagement CSV" },
    { action: ActivityAction.UPDATE, entity: "user", entityName: "Role changed to Analyst" },
    { action: ActivityAction.DELETE, entity: "report", entityName: "Deprecated Weekly Report" },
  ];

  const activityLogs: any[] = [];
  for (let i = 0; i < 80; i++) {
    const user = allUsers[randomInt(0, allUsers.length - 1)];
    const activity = activityActions[randomInt(0, activityActions.length - 1)];
    activityLogs.push({
      userId: user.id,
      action: activity.action,
      entity: activity.entity,
      entityName: activity.entityName,
      ip: `${randomInt(10, 200)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`,
      createdAt: addDays(new Date(), -randomInt(0, 30)),
    });
  }
  await prisma.activityLog.createMany({ data: activityLogs });
  console.log(`✓ Created ${activityLogs.length} activity logs`);

  // ── Notifications ──
  const notifs = [
    { title: "Weekly Report Ready", body: "Your Weekly Executive Summary for this week has been generated and is ready for review.", type: NotificationType.SUCCESS, read: false, link: "/reports" },
    { title: "Revenue Milestone Reached", body: "Congratulations! Your organization crossed $2M in monthly recurring revenue.", type: NotificationType.SUCCESS, read: false },
    { title: "Data Import Complete", body: "Q3_sales_data.csv has been processed. 2,847 rows imported successfully.", type: NotificationType.INFO, read: true, link: "/data" },
    { title: "Scheduled Report Failed", body: "The monthly user report failed to generate. Please check your configuration.", type: NotificationType.ERROR, read: false, link: "/reports" },
    { title: "New Team Member Added", body: "Sofia Lindqvist has been added to your organization with Analyst permissions.", type: NotificationType.INFO, read: true },
    { title: "System Maintenance Scheduled", body: "DataPulse will undergo routine maintenance on Saturday, June 7 from 2:00–4:00 AM UTC.", type: NotificationType.WARNING, read: false },
    { title: "API Usage Alert", body: "Your API usage has reached 80% of the monthly limit. Consider upgrading your plan.", type: NotificationType.WARNING, read: true },
    { title: "Campaign Performance Alert", body: "APAC Market Penetration campaign has exceeded ROAS target by 42%.", type: NotificationType.SUCCESS, read: false, link: "/analytics/marketing" },
  ];

  for (const notif of notifs) {
    await prisma.notification.create({ data: { ...notif, userId: adminUser.id } });
  }
  // Analyst notifications
  await prisma.notification.create({ data: { title: "Report Shared With You", body: "Alexandra Reid shared 'Q2 Revenue Summary' with your team.", type: NotificationType.INFO, read: false, userId: analystUser.id, link: "/reports" } });
  await prisma.notification.create({ data: { title: "Analysis Complete", body: "Your cohort retention analysis has finished processing.", type: NotificationType.SUCCESS, read: false, userId: analystUser.id } });

  console.log(`✓ Created notifications`);

  // ── Datasets ──
  await prisma.dataset.createMany({
    data: [
      { name: "Q3 Sales Data", filename: "q3_sales_data_2025.csv", originalName: "Q3_sales_data.csv", mimeType: "text/csv", size: 1847392, rows: 2847, status: DatasetStatus.READY, uploadedById: adminUser.id, organizationId: orgs[0].id, columns: [{ name: "date", type: "date" }, { name: "product", type: "string" }, { name: "revenue", type: "number" }, { name: "units", type: "number" }, { name: "region", type: "string" }] },
      { name: "Customer Cohort Export", filename: "customer_cohort_aug2025.csv", originalName: "customer_cohort_aug2025.csv", mimeType: "text/csv", size: 523411, rows: 841, status: DatasetStatus.READY, uploadedById: analystUser.id, organizationId: orgs[0].id, columns: [{ name: "customer_id", type: "string" }, { name: "cohort_month", type: "date" }, { name: "ltv", type: "number" }, { name: "churn_date", type: "date" }] },
      { name: "Marketing Attribution", filename: "marketing_attribution_q2.csv", originalName: "marketing_q2_attribution.csv", mimeType: "text/csv", size: 298744, rows: 1203, status: DatasetStatus.READY, uploadedById: adminUser.id, organizationId: orgs[0].id, columns: [{ name: "campaign", type: "string" }, { name: "channel", type: "string" }, { name: "spend", type: "number" }, { name: "revenue", type: "number" }, { name: "roas", type: "number" }] },
      { name: "Product Inventory Sync", filename: "inventory_sync_sept.csv", originalName: "inventory_sept_2025.csv", mimeType: "text/csv", size: 91230, rows: 156, status: DatasetStatus.PROCESSING, uploadedById: analystUser.id, organizationId: orgs[0].id },
      { name: "Legacy CRM Export (Error)", filename: "crm_export_legacy.csv", originalName: "crm_full_export.csv", mimeType: "text/csv", size: 8234192, rows: 0, status: DatasetStatus.ERROR, errorMessage: "Column mismatch: expected 'customer_id' but found 'cust_ID'. Please check your CSV headers.", uploadedById: adminUser.id, organizationId: orgs[0].id },
    ],
  });
  console.log(`✓ Created datasets`);

  console.log("\n✅ Seed completed successfully!\n");
  console.log("Demo Accounts:");
  console.log("  Admin    → admin@datapulse.io    / Admin@123!");
  console.log("  Analyst  → analyst@datapulse.io  / Analyst@123!");
  console.log("  Viewer   → viewer@datapulse.io   / Viewer@123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

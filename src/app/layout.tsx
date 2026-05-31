import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DataPulse — Business Intelligence Dashboard",
    template: "%s | DataPulse",
  },
  description:
    "DataPulse is an enterprise-grade analytics and business intelligence platform. Track revenue, users, sales performance, and marketing ROI in real time.",
  keywords: ["analytics", "business intelligence", "dashboard", "data", "SaaS"],
  authors: [{ name: "DataPulse Team" }],
  creator: "DataPulse",
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            classNames: {
              toast:
                "!bg-card !border-border !text-foreground !shadow-lg",
              title: "!font-medium !text-sm",
              description: "!text-muted-foreground !text-xs",
              actionButton: "!bg-primary !text-primary-foreground",
              cancelButton: "!bg-muted !text-muted-foreground",
              closeButton: "!bg-card !border-border",
            },
          }}
        />
      </body>
    </html>
  );
}

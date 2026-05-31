import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Decorative gradient background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(258 90% 66% / 0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 100%, hsl(280 90% 66% / 0.08) 0%, transparent 60%)",
        }}
      />
      <div className="fixed inset-0 -z-10 bg-[url('/grid.svg')] bg-center opacity-[0.02] dark:opacity-[0.04]" />
      {children}
    </div>
  );
}

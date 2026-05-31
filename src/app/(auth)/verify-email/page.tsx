import Link from "next/link";
import { BarChart3, Mail, ArrowRight } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6 animate-in">
        <div className="inline-flex items-center gap-2.5 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand shadow-lg shadow-primary/20">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">DataPulse</span>
        </div>

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-10 w-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Verify your email</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We&apos;ve sent a verification link to your email address. Click the link to activate your DataPulse account.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 text-left space-y-3">
          <p className="text-sm font-medium">What happens next?</p>
          {[
            "Check your inbox (and spam folder)",
            "Click the verification link in the email",
            "You'll be redirected to set up your workspace",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg gradient-brand text-white px-5 py-2.5 text-sm font-semibold shadow-md shadow-primary/20 hover:opacity-90 transition-all"
          >
            Continue to sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive anything?{" "}
            <button className="text-primary hover:underline">Resend verification email</button>
          </p>
        </div>
      </div>
    </div>
  );
}

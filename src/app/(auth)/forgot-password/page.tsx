"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, BarChart3, ArrowLeft, Mail } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500)); // simulate API call
    setIsLoading(false);
    setSent(true);
    toast.success("Reset link sent", { description: `Check ${data.email} for instructions.` });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand shadow-lg shadow-primary/20">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">DataPulse</span>
          </div>
          {!sent ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
              <p className="text-sm text-muted-foreground">
                Enter your email and we&apos;ll send a reset link.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 mb-4">
                <Mail className="h-6 w-6 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">
                We sent a reset link to <strong>{getValues("email")}</strong>. It expires in 15 minutes.
              </p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 shadow-sm">
          {!sent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="fp-email">Email address</label>
                <input
                  {...register("email")}
                  id="fp-email"
                  type="email"
                  placeholder="you@company.com"
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-all",
                    "placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                    errors.email ? "border-destructive" : "border-input"
                  )}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold",
                  "gradient-brand text-white shadow-md shadow-primary/20",
                  "hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                )}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => setSent(false)}
                className="w-full rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                Try a different email
              </button>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

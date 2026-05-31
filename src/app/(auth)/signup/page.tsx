"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, BarChart3, ArrowRight, Check } from "lucide-react";
import { signupSchema, type SignupInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const password = watch("password", "");

  const passwordChecks = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "One uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "One number", pass: /[0-9]/.test(password) },
    { label: "One special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json();

      if (!res.ok) {
        toast.error(body.error || "Registration failed");
        return;
      }

      toast.success("Account created!", {
        description: "Please check your email to verify your account.",
      });
      router.push("/verify-email");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Start your 14-day free trial. No credit card required.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium" htmlFor="name">Full name</label>
                <input
                  {...register("name")}
                  id="name"
                  placeholder="Alexandra Reid"
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-all",
                    "placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                    errors.name ? "border-destructive" : "border-input"
                  )}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium" htmlFor="signup-email">Work email</label>
                <input
                  {...register("email")}
                  id="signup-email"
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

              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium" htmlFor="org">Organization (optional)</label>
                <input
                  {...register("organizationName")}
                  id="org"
                  placeholder="Acme Corp"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="signup-password">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2.5 pr-10 text-sm outline-none transition-all",
                    "placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                    errors.password ? "border-destructive" : "border-input"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength checks */}
              {password && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-1.5">
                      <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full transition-colors",
                        check.pass ? "bg-emerald-500" : "bg-muted"
                      )}>
                        {check.pass && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span className={cn(
                        "text-xs transition-colors",
                        check.pass ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="confirmPassword">Confirm password</label>
              <input
                {...register("confirmPassword")}
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-all",
                  "placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                  errors.confirmPassword ? "border-destructive" : "border-input"
                )}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold",
                "gradient-brand text-white shadow-md shadow-primary/20",
                "hover:opacity-90 active:scale-[0.98] transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><span>Create account</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              By creating an account you agree to our{" "}
              <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>{" "}
              and{" "}
              <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

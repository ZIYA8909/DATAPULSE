"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, BarChart3, ArrowRight, Sparkles } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

// ── Particle Canvas ──────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const PARTICLE_COUNT = 120;
    const MAX_DIST = 140;
    const mouse = { x: W / 2, y: H / 2 };

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      r: number; opacity: number;
    }

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    const onMouse = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        // Gentle mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.vx += (dx / dist) * 0.03;
          p.vy += (dy / dist) * 0.03;
        }

        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            const alpha = (1 - d / MAX_DIST) * 0.25;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ── Login Page ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials", {
          description: "Please check your email and password.",
        });
        return;
      }

      toast.success("Welcome back!", { description: "Redirecting to your dashboard..." });
      router.push("/overview");
      router.refresh();
    } catch {
      toast.error("Something went wrong", { description: "Please try again later." });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role: "admin" | "analyst" | "viewer") => {
    const creds = {
      admin: { email: "admin@datapulse.io", password: "Admin@123!" },
      analyst: { email: "analyst@datapulse.io", password: "Analyst@123!" },
      viewer: { email: "viewer@datapulse.io", password: "Viewer@123!" },
    };
    setValue("email", creds[role].email);
    setValue("password", creds[role].password);
    setActiveRole(role);
  };

  const roles = [
    { key: "admin" as const, label: "Admin", emoji: "👑", color: "from-violet-500 to-purple-600" },
    { key: "analyst" as const, label: "Analyst", emoji: "📊", color: "from-blue-500 to-cyan-600" },
    { key: "viewer" as const, label: "Viewer", emoji: "👁️", color: "from-emerald-500 to-teal-600" },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0f]">
      {/* Particle background */}
      <ParticleCanvas />

      {/* Radial glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div style={{
          position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "15%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
        }} />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md px-4" style={{ zIndex: 10 }}>
        {/* Floating badge */}
        <div className="flex justify-center mb-6">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 999,
            background: "rgba(139,92,246,0.15)",
            border: "1px solid rgba(139,92,246,0.3)",
            fontSize: 12, color: "#a78bfa",
            backdropFilter: "blur(8px)",
          }}>
            <Sparkles size={12} />
            DataPulse Analytics Platform
          </div>
        </div>

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 16, marginBottom: 16,
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            boxShadow: "0 0 32px rgba(124,58,237,0.4)",
          }}>
            <BarChart3 size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#f1f5f9", marginBottom: 6, letterSpacing: -0.5 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: "#64748b" }}>Sign in to your analytics workspace</p>
        </div>

        {/* Demo role buttons */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "14px 16px", marginBottom: 20,
          backdropFilter: "blur(12px)",
        }}>
          <p style={{ fontSize: 11, color: "#475569", marginBottom: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.8 }}>
            Quick demo access
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {roles.map((r) => (
              <button
                key={r.key}
                onClick={() => fillDemo(r.key)}
                style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10,
                  border: activeRole === r.key ? "1px solid rgba(139,92,246,0.6)" : "1px solid rgba(255,255,255,0.08)",
                  background: activeRole === r.key ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                  color: activeRole === r.key ? "#c4b5fd" : "#94a3b8",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                }}
              >
                <span style={{ fontSize: 16 }}>{r.emoji}</span>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20, padding: "28px 28px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#cbd5e1", marginBottom: 6 }}>
                Email address
              </label>
              <input
                {...register("email")}
                id="login-email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
                  background: "rgba(255,255,255,0.05)",
                  border: errors.email ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.12)",
                  color: "#f1f5f9", outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.email ? "#ef4444" : "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              {errors.email && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#cbd5e1" }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: "#7c3aed", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  {...register("password")}
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: "100%", padding: "11px 42px 11px 14px", borderRadius: 10, fontSize: 14,
                    background: "rgba(255,255,255,0.05)",
                    border: errors.password ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.12)",
                    color: "#f1f5f9", outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = errors.password ? "#ef4444" : "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0,
                    display: "flex", alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                background: isLoading ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "white", border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                transition: "all 0.2s ease", marginTop: 4,
              }}
              onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,58,237,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.4)"; }}
            >
              {isLoading ? (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "#475569", marginTop: 20 }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "#7c3aed", fontWeight: 500, textDecoration: "none" }}>
            Create one
          </Link>
        </p>

        {/* Footer stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 32 }}>
          {[["₹42Cr+", "Revenue Tracked"], ["2M+", "Data Points"], ["99.9%", "Uptime"]].map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#a78bfa" }}>{val}</div>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Terminal,
  ArrowRight,
  Lock,
  Mail,
  User,
  Building2,
  Sparkles,
  ShieldCheck,
  Cpu,
  Zap,
  Globe,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  apiKeyPrefix: string;
}

interface AuthViewProps {
  onSuccess: (user: SessionUser) => void;
}

export default function AuthView({ onSuccess }: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("daniel@vortex.sh");
  const [password, setPassword] = useState("demo1234");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          email,
          password,
          name,
          organization,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }
      onSuccess(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demo" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demo login failed");
      onSuccess(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (target: "login" | "register") => {
    setError(null);
    setMode(target);
    if (target === "register") {
      setEmail("");
      setPassword("");
      setName("");
      setOrganization("");
    } else {
      setEmail("daniel@vortex.sh");
      setPassword("demo1234");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col justify-between relative overflow-hidden bg-grid-pattern">
      {/* Ambient radial spotlight */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(800px circle at 50% 0%, rgba(255,255,255,0.06), transparent 70%)",
        }}
      />

      {/* Top Minimal Header */}
      <header className="relative z-10 border-b border-white/[0.08] bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center font-mono font-bold text-sm tracking-tighter shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              ▲
            </div>
            <span className="font-semibold tracking-tight text-sm text-white">
              VORTEX
            </span>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="font-mono text-xs text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded">
              v4.2-tensor-edge
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-400 font-mono">
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ALL REGIONS OPERATIONAL (18ms GLOBAL P95)</span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="text-zinc-200 hover:text-white border border-white/[0.12] hover:border-white/30 bg-white/[0.03] px-3 py-1.5 rounded transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant Founder Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Showcase + Auth Card */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Silicon Valley Architecture Pitch */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.09] text-xs font-mono text-zinc-300">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
              NEW
            </span>
            <span>Blackwell B200 NVLink Clusters Now General Availability</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.06] bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent">
              Deploy frontier AI at the speed of thought.
            </h1>
            <p className="text-zinc-400 text-base sm:text-lg max-w-xl leading-relaxed font-normal">
              Zero-cold-start serverless GPU orchestration. Provision dedicated{" "}
              <span className="text-zinc-200 font-mono text-sm">H100-80GB</span> and{" "}
              <span className="text-zinc-200 font-mono text-sm">B200</span> endpoints across 4 global edge fabrics with a single API call.
            </p>
          </div>

          {/* Interactive Live CLI Preview Box */}
          <div className="specular-card rounded-xl overflow-hidden max-w-xl">
            <div className="px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="ml-2 font-mono text-[11px] text-zinc-400">
                  vortex-cli — deployprod.sh
                </span>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                FP8 QUANTIZED
              </span>
            </div>
            <div className="p-4 font-mono text-xs space-y-2 text-zinc-300 bg-[#070709]">
              <div className="flex items-center gap-2">
                <span className="text-zinc-600">$</span>
                <span className="text-white">
                  vortex deploy meta-llama/Llama-3.3-70B-Instruct --gpus H100:4 --region iad-1
                </span>
              </div>
              <div className="text-zinc-500">
                ⠋ Mounting weight shards from NVMe fabric (138.4 GB @ 42 GB/s)...
              </div>
              <div className="text-zinc-500">
                ✓ FlashInfer FP8 KV-cache initialized across 4x H100 SXM5 nodes
              </div>
              <div className="flex items-center justify-between pt-1 text-emerald-400">
                <span>
                  ✓ Live Endpoint: https://llama-3-3-70b-prod.vortex.sh/v1
                </span>
                <span className="text-zinc-400 text-[11px]">2.4s</span>
              </div>
            </div>
          </div>

          {/* Architectural Pillars */}
          <div className="grid grid-cols-3 gap-4 max-w-xl pt-2">
            <div className="p-3.5 rounded-lg border border-white/[0.06] bg-white/[0.015]">
              <div className="flex items-center gap-2 text-zinc-200 font-medium text-xs mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sub-25ms TTFT</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Speculative decoding & custom CUDA graph capture out of the box.
              </p>
            </div>
            <div className="p-3.5 rounded-lg border border-white/[0.06] bg-white/[0.015]">
              <div className="flex items-center gap-2 text-zinc-200 font-medium text-xs mb-1">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span>Scale-to-Zero</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Hibernate idle clusters automatically and wake in 1.8 seconds.
              </p>
            </div>
            <div className="p-3.5 rounded-lg border border-white/[0.06] bg-white/[0.015]">
              <div className="flex items-center gap-2 text-zinc-200 font-medium text-xs mb-1">
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                <span>Anycast Routing</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Multi-region failover across US-East, EU-Central, and Tokyo.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Register / Login Control Card */}
        <div className="lg:col-span-5">
          <div className="specular-card rounded-2xl p-6 sm:p-8 relative overflow-hidden bg-[#0A0A0D]/90 backdrop-blur-xl">
            {/* Top Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-lg bg-black border border-white/[0.08] mb-6">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`py-2 text-xs font-medium rounded-md transition-all ${
                  mode === "login"
                    ? "bg-white text-black shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Sign In to Console
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`py-2 text-xs font-medium rounded-md transition-all ${
                  mode === "register"
                    ? "bg-white text-black shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                {mode === "login"
                  ? "Authenticate to Control Plane"
                  : "Provision Your Organization"}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {mode === "login"
                  ? "Enter your workspace credentials or use the pre-filled founder session."
                  : "Includes $500.00 in complimentary H100/B200 serverless compute credits."}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-200 font-mono ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ada Lovelace"
                        className="w-full bg-black/80 border border-white/[0.1] focus:border-white/40 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                      Organization / Lab Name
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Anthropic / Hyperion Labs"
                        className="w-full bg-black/80 border border-white/[0.1] focus:border-white/40 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@company.ai"
                    className="w-full bg-black/80 border border-white/[0.1] focus:border-white/40 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    Password
                  </label>
                  {mode === "login" && (
                    <span className="text-[11px] font-mono text-emerald-400">
                      Demo pre-filled
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-black/80 border border-white/[0.1] focus:border-white/40 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-medium text-sm py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.2)]"
              >
                <span>
                  {loading
                    ? "Authenticating..."
                    : mode === "login"
                    ? "Continue to Control Plane"
                    : "Create Workspace & Deploy"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase font-mono">
                <span className="bg-[#0A0A0D] px-3 text-zinc-500">
                  Or Instant Reviewer Access
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg border border-white/[0.12] hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-mono text-zinc-200 transition flex items-center justify-center gap-2"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>One-Click Sign In as Daniel Gyorfi (Founder Session)</span>
            </button>

            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                SOC2 Type II & HIPAA Ready
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                TLS 1.3 mTLS Mesh
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Minimalist Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-4 px-6 text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>VORTEX COMPUTE INC. // SAN FRANCISCO — ZÜRICH — TOKYO</div>
          <div className="flex items-center gap-4">
            <span>STATUS: 99.99% SLA</span>
            <span>•</span>
            <span>BGP ANYCAST ACTIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

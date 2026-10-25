"use client";

import React, { useState, useMemo } from "react";
import { Deployment, DeploymentStatus, ComputeTier } from "@/lib/db";
import { SessionUser } from "./AuthView";
import DeploymentModal from "./DeploymentModal";
import InspectorDrawer from "./InspectorDrawer";
import {
  Plus,
  Search,
  Cpu,
  Activity,
  DollarSign,
  Zap,
  Globe,
  Terminal,
  Edit3,
  Trash2,
  Power,
  LogOut,
  RotateCcw,
  Key,
  Copy,
  Check,
  ArrowUpRight,
  Layers,
  SlidersHorizontal,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface DashboardViewProps {
  user: SessionUser;
  deployments: Deployment[];
  onRefresh: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export default function DashboardView({
  user,
  deployments,
  onRefresh,
  onLogout,
}: DashboardViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | DeploymentStatus>("ALL");
  const [regionFilter, setRegionFilter] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDep, setEditingDep] = useState<Deployment | null>(null);
  const [inspectedDep, setInspectedDep] = useState<Deployment | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [trendingModels, setTrendingModels] = useState<
    Array<{
      id: string;
      downloads: number;
      likes: number;
      recommendedCompute: ComputeTier;
    }>
  >([]);

  React.useEffect(() => {
    let active = true;
    fetch("/api/hf-models?limit=4")
      .then((r) => r.json())
      .then((data) => {
        if (active && data.models) {
          setTrendingModels(data.models.slice(0, 4));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Filtered list (Read + Search + Filter)
  const filteredDeployments = useMemo(() => {
    return deployments.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.model.toLowerCase().includes(search.toLowerCase()) ||
        d.compute.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
      const matchesRegion = regionFilter === "ALL" || d.region === regionFilter;
      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [deployments, search, statusFilter, regionFilter]);

  // Fleet Aggregate Metrics
  const stats = useMemo(() => {
    const liveDeps = deployments.filter((d) => d.status === "LIVE");
    const totalGpus = deployments.reduce((acc, d) => acc + d.replicas, 0);
    const avgTps =
      liveDeps.length > 0
        ? (
            liveDeps.reduce((acc, d) => acc + d.tokensPerSec, 0) / liveDeps.length
          ).toFixed(1)
        : "0.0";
    const avgLatency =
      liveDeps.length > 0
        ? Math.round(
            liveDeps.reduce((acc, d) => acc + d.latencyP95Ms, 0) / liveDeps.length
          )
        : 0;
    const hourlyBurn = deployments
      .reduce((acc, d) => acc + d.costPerHour, 0)
      .toFixed(2);
    const totalRequests = deployments.reduce((acc, d) => acc + d.requests24h, 0);

    return {
      liveCount: liveDeps.length,
      totalCount: deployments.length,
      totalGpus,
      avgTps,
      avgLatency,
      hourlyBurn,
      totalRequests,
    };
  }, [deployments]);

  // CRUD Handlers
  const handleCreateOrUpdate = async (payload: Partial<Deployment>) => {
    if (editingDep) {
      const res = await fetch(`/api/deployments/${editingDep.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update deployment");
      }
      const { deployment: updated } = await res.json();
      if (inspectedDep?.id === updated.id) {
        setInspectedDep(updated);
      }
      showToast(`Updated configuration for ${updated.name}`);
    } else {
      const res = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create deployment");
      }
      const { deployment: created } = await res.json();
      showToast(`Provisioned ${created.name} on ${created.compute}`);
    }
    await onRefresh();
  };

  const handleToggleHibernate = async (dep: Deployment) => {
    setBusyId(dep.id);
    try {
      const nextStatus: DeploymentStatus =
        dep.status === "HIBERNATED" ? "LIVE" : "HIBERNATED";
      const nextReplicas = nextStatus === "LIVE" ? Math.max(dep.replicas, 2) : 0;

      const res = await fetch(`/api/deployments/${dep.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          replicas: nextReplicas,
        }),
      });
      if (res.ok) {
        const { deployment: updated } = await res.json();
        if (inspectedDep?.id === updated.id) {
          setInspectedDep(updated);
        }
        showToast(
          nextStatus === "LIVE"
            ? `Woke ${dep.name} (${nextReplicas}x ${dep.compute} active)`
            : `Hibernated ${dep.name} (Scale-to-zero $0.00/hr)`
        );
        await onRefresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickScale = async (dep: Deployment, delta: number) => {
    const nextReplicas = Math.max(0, Math.min(16, dep.replicas + delta));
    const nextStatus: DeploymentStatus =
      nextReplicas === 0 ? "HIBERNATED" : "LIVE";
    setBusyId(dep.id);
    try {
      const res = await fetch(`/api/deployments/${dep.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replicas: nextReplicas,
          status: nextStatus,
        }),
      });
      if (res.ok) {
        const { deployment: updated } = await res.json();
        if (inspectedDep?.id === updated.id) {
          setInspectedDep(updated);
        }
        showToast(`Scaled ${dep.name} to ${nextReplicas}x GPU replicas`);
        await onRefresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (dep: Deployment) => {
    setBusyId(dep.id);
    try {
      const res = await fetch(`/api/deployments/${dep.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (inspectedDep?.id === dep.id) {
          setInspectedDep(null);
        }
        showToast(`Decommissioned endpoint ${dep.name}`);
        await onRefresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleResetDemo = async () => {
    const res = await fetch("/api/deployments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    if (res.ok) {
      showToast("Restored default frontier GPU fleet");
      await onRefresh();
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(`${user.apiKeyPrefix}_9f82b71c4e0019a2`);
    setCopiedKey(true);
    showToast("Copied production Bearer API token to clipboard");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col bg-grid-pattern relative">
      {/* Top Ambient Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(900px circle at 50% -10%, rgba(255,255,255,0.055), transparent 65%)",
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-white text-black font-mono text-xs font-medium shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center gap-2 border border-white">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Navigation Bar (Vercel / Linear inspired) */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#050505]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand + Breadcrumb */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center font-mono font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.35)]">
              ▲
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold tracking-tight text-white">
                {user.organization}
              </span>
              <span className="text-zinc-600 font-mono">/</span>
              <span className="font-mono text-xs text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded">
                inference-fleet-prod
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                NVLINK MESH HEALTHY
              </span>
            </div>
          </div>

          {/* Right Controls: API Key, User Badge, Logout */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={copyApiKey}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-mono text-zinc-300 transition"
              title="Copy VORTEX_API_KEY"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{user.apiKeyPrefix}••••</span>
              {copiedKey ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>

            <div className="h-5 w-[1px] bg-white/[0.08] hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="text-right hidden md:block">
                <div className="text-xs font-medium text-white leading-none">
                  {user.name}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 mt-1">
                  {user.email}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-lg border border-white/[0.08] hover:border-white/20 bg-white/[0.02] text-zinc-400 hover:text-white transition flex items-center gap-1.5 text-xs font-mono"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Top Action Hero Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>GLOBAL SERVERLESS INFERENCE CONTROL PLANE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Dedicated GPU Endpoints & Model Routing
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetDemo}
              className="px-3.5 py-2 rounded-lg border border-white/[0.1] hover:border-white/25 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-mono text-zinc-300 transition flex items-center gap-1.5"
              title="Reset seed deployments"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Seed Fleet</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingDep(null);
                setModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-medium text-xs transition flex items-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.25)]"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy Model Endpoint</span>
            </button>
          </div>
        </div>

        {/* 4 Bento Telemetry KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="specular-card rounded-xl p-5 bg-[#09090C]/90">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3">
              <span>ACTIVE GPU ALLOCATION</span>
              <Cpu className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-mono font-semibold text-white">
                {stats.totalGpus} <span className="text-xs font-normal text-zinc-400">Nodes</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                {stats.liveCount}/{stats.totalCount} LIVE
              </span>
            </div>
            <div className="mt-3 text-[11px] font-mono text-zinc-500">
              H100 / B200 NVLink 900GB/s fabric
            </div>
          </div>

          <div className="specular-card rounded-xl p-5 bg-[#09090C]/90">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3">
              <span>FLEET TOKEN VELOCITY</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-mono font-semibold text-white">
                {stats.avgTps}{" "}
                <span className="text-xs font-normal text-zinc-400">tok/s</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                +14.2%
              </span>
            </div>
            <div className="mt-3 text-[11px] font-mono text-zinc-500">
              FP8 FlashInfer speculative decoding
            </div>
          </div>

          <div className="specular-card rounded-xl p-5 bg-[#09090C]/90">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3">
              <span>GLOBAL P95 TTFT LATENCY</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-mono font-semibold text-white">
                {stats.avgLatency}{" "}
                <span className="text-xs font-normal text-zinc-400">ms</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-300 bg-white/[0.05] px-2 py-0.5 rounded">
                {(stats.totalRequests / 1000).toFixed(1)}k req/24h
              </span>
            </div>
            <div className="mt-3 text-[11px] font-mono text-zinc-500">
              Anycast edge routing across 4 regions
            </div>
          </div>

          <div className="specular-card rounded-xl p-5 bg-[#09090C]/90">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3">
              <span>REAL-TIME COMPUTE BURN</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-mono font-semibold text-white">
                ${stats.hourlyBurn}
                <span className="text-xs font-normal text-zinc-400">/hr</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                Auto-Hibernation ON
              </span>
            </div>
            <div className="mt-3 text-[11px] font-mono text-zinc-500">
              Per-millisecond serverless billing
            </div>
          </div>
        </div>

        {/* Live Hugging Face Public API Feed Strip */}
        {trendingModels.length > 0 && (
          <div className="specular-card rounded-xl p-4 bg-[#09090C]/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                  Live Hugging Face Hub API // Trending Open-Weights
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded">
                  GET https://huggingface.co/api/models
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Click any model to 1-click deploy to SQLite fleet
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {trendingModels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    const shortSlug = (m.id.split("/").pop() || "model")
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "");
                    setEditingDep(null);
                    handleCreateOrUpdate({
                      name: `${shortSlug}-edge`,
                      model: m.id,
                      compute: m.recommendedCompute || "H100-80GB",
                      region: "iad-1",
                      status: "LIVE",
                      replicas: 2,
                      maxBatchSize: 256,
                      quantization: "FP8",
                      envVars: [
                        { key: "HF_HUB_ENABLE_HF_TRANSFER", value: "1" },
                        { key: "VLLM_ATTENTION_BACKEND", value: "FLASHINFER" },
                      ],
                    });
                  }}
                  className="p-3 rounded-lg bg-black/70 border border-white/[0.07] hover:border-white/25 text-left transition group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-zinc-100 group-hover:text-emerald-300 truncate">
                      {m.id}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white shrink-0" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>{(m.downloads / 1000).toFixed(0)}k pulls</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-sky-300 border border-white/[0.06]">
                      {m.recommendedCompute}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter & Search Command Bar */}
        <div className="specular-card rounded-xl p-3 bg-[#09090C]/90 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter endpoints by slug, HuggingFace model, GPU tier (e.g. B200, Llama, DeepSeek)..."
              className="w-full bg-black border border-white/[0.08] focus:border-white/30 rounded-lg pl-10 pr-4 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none transition"
            />
          </div>

          {/* Status & Region Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-black p-1 rounded-lg border border-white/[0.08]">
              {(["ALL", "LIVE", "HIBERNATED", "PROVISIONING"] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                      statusFilter === st
                        ? "bg-white text-black font-semibold"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-black px-3 py-1.5 rounded-lg border border-white/[0.08]">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="bg-transparent text-[11px] font-mono text-zinc-200 focus:outline-none"
              >
                <option value="ALL" className="bg-zinc-950">
                  ALL REGIONS
                </option>
                <option value="iad-1" className="bg-zinc-950">
                  IAD-1 (US-East)
                </option>
                <option value="sfo-1" className="bg-zinc-950">
                  SFO-1 (Silicon Valley)
                </option>
                <option value="fra-1" className="bg-zinc-950">
                  FRA-1 (Frankfurt)
                </option>
                <option value="hnd-1" className="bg-zinc-950">
                  HND-1 (Tokyo)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Deployments List / Cards (Core CRUD Table) */}
        {filteredDeployments.length === 0 ? (
          <div className="specular-card rounded-2xl p-12 text-center space-y-4">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.1] mx-auto flex items-center justify-center text-zinc-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                No matching GPU deployments found
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                Adjust your search query or deploy a new frontier model endpoint in seconds.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setRegionFilter("ALL");
                }}
                className="px-3.5 py-1.5 rounded-lg border border-white/[0.1] text-xs font-mono text-zinc-300 hover:text-white"
              >
                Clear Filters
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingDep(null);
                  setModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-mono font-semibold"
              >
                + New Deployment
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDeployments.map((dep) => {
              const isLive = dep.status === "LIVE";
              const isHibernated = dep.status === "HIBERNATED";
              const isBusy = busyId === dep.id;

              return (
                <div
                  key={dep.id}
                  className="specular-card rounded-xl p-5 bg-[#09090C]/95 transition group hover:border-white/20"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left: Endpoint Identity & Model Metadata */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider uppercase border ${
                            isLive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                              : isHibernated
                              ? "bg-zinc-800/70 text-zinc-400 border-white/[0.08]"
                              : "bg-amber-500/10 text-amber-300 border-amber-500/25"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isLive
                                ? "bg-emerald-400 animate-pulse"
                                : isHibernated
                                ? "bg-zinc-500"
                                : "bg-amber-400 animate-ping"
                            }`}
                          />
                          {dep.status}
                        </span>

                        {/* Clickable Endpoint Name */}
                        <button
                          type="button"
                          onClick={() => setInspectedDep(dep)}
                          className="text-base font-semibold text-white hover:text-emerald-300 transition flex items-center gap-1 font-mono truncate"
                        >
                          <span>{dep.name}</span>
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition" />
                        </button>

                        {/* Hardware & Precision Pills */}
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-sky-300">
                          {dep.compute}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.07] text-[10px] font-mono text-zinc-400">
                          {dep.quantization}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.07] text-[10px] font-mono text-purple-300 uppercase">
                          {dep.region}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-zinc-400">
                        <span className="text-zinc-300 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-zinc-500" />
                          {dep.model}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">
                          https://{dep.slug}.vortex.sh/v1
                        </span>
                      </div>
                    </div>

                    {/* Center: Mini Telemetry Sparkline + Metrics */}
                    <div className="flex items-center gap-6 border-t lg:border-t-0 pt-3 lg:pt-0 border-white/[0.06]">
                      {/* SVG Mini Sparkline */}
                      <div className="hidden sm:flex flex-col items-end">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">
                          Throughput (12m)
                        </div>
                        <div className="flex items-end gap-1 h-7">
                          {dep.telemetryHistory.map((val, idx) => {
                            const max = Math.max(...dep.telemetryHistory, 100);
                            const heightPct = isHibernated
                              ? 12
                              : Math.max(18, Math.round((val / max) * 100));
                            return (
                              <div
                                key={idx}
                                style={{ height: `${heightPct}%` }}
                                className={`w-1.5 rounded-t transition-all ${
                                  isLive
                                    ? idx === dep.telemetryHistory.length - 1
                                      ? "bg-emerald-400"
                                      : "bg-emerald-500/40"
                                    : "bg-zinc-800"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Key Readouts */}
                      <div className="grid grid-cols-3 gap-4 min-w-[230px] text-right font-mono">
                        <div>
                          <div className="text-[10px] text-zinc-500 uppercase">
                            Velocity
                          </div>
                          <div className="text-xs font-semibold text-white mt-0.5">
                            {dep.tokensPerSec}{" "}
                            <span className="text-[10px] text-zinc-500 font-normal">
                              t/s
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-zinc-500 uppercase">
                            P95 TTFT
                          </div>
                          <div className="text-xs font-semibold text-white mt-0.5">
                            {dep.latencyP95Ms}
                            <span className="text-[10px] text-zinc-500 font-normal">
                              ms
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-zinc-500 uppercase">
                            Burn
                          </div>
                          <div className="text-xs font-semibold text-emerald-400 mt-0.5">
                            ${dep.costPerHour.toFixed(2)}
                            <span className="text-[10px] text-zinc-500 font-normal">
                              /h
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive CRUD Controls */}
                      <div className="flex items-center gap-1.5 pl-2 border-l border-white/[0.08]">
                        {/* Quick Replica Scaler */}
                        <div className="flex items-center bg-black rounded-lg border border-white/[0.08] px-1 py-0.5 mr-1">
                          <button
                            type="button"
                            disabled={isBusy || dep.replicas <= 0}
                            onClick={() => handleQuickScale(dep, -1)}
                            className="px-1.5 py-0.5 text-xs font-mono text-zinc-400 hover:text-white disabled:opacity-30"
                            title="Scale down replica"
                          >
                            -
                          </button>
                          <span className="px-1.5 text-[11px] font-mono text-white">
                            {dep.replicas}x
                          </span>
                          <button
                            type="button"
                            disabled={isBusy || dep.replicas >= 16}
                            onClick={() => handleQuickScale(dep, 1)}
                            className="px-1.5 py-0.5 text-xs font-mono text-zinc-400 hover:text-white disabled:opacity-30"
                            title="Scale up replica"
                          >
                            +
                          </button>
                        </div>

                        {/* Test / Playground Drawer Button */}
                        <button
                          type="button"
                          onClick={() => setInspectedDep(dep)}
                          className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition"
                          title="Open Inference Sandbox & cURL Inspector"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDep(dep);
                            setModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition"
                          title="Edit Deployment Hardware & Env Vars"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Hibernate / Wake Toggle */}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleHibernate(dep)}
                          className={`p-2 rounded-lg border transition ${
                            isHibernated
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-amber-300 hover:border-amber-500/30"
                          }`}
                          title={
                            isHibernated
                              ? "Wake Cluster to LIVE"
                              : "Hibernate Cluster (Scale to Zero)"
                          }
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDelete(dep)}
                          className="p-2 rounded-lg bg-white/[0.03] hover:bg-red-500/15 border border-white/[0.08] hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition"
                          title="Decommission Endpoint"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      <DeploymentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingDep(null);
        }}
        onSave={handleCreateOrUpdate}
        initialData={editingDep}
      />

      {/* Live Inference Sandbox & Telemetry Drawer */}
      <InspectorDrawer
        deployment={inspectedDep}
        onClose={() => setInspectedDep(null)}
        onEdit={(dep) => {
          setInspectedDep(null);
          setEditingDep(dep);
          setModalOpen(true);
        }}
        onToggleStatus={handleToggleHibernate}
        onDelete={handleDelete}
      />
    </div>
  );
}

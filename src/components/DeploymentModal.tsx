"use client";

import React, { useState, useEffect } from "react";
import {
  Deployment,
  ComputeTier,
  RegionCode,
  DeploymentStatus,
  EnvVar,
} from "@/lib/db";
import { HuggingFaceModelResult } from "@/app/api/hf-models/route";
import {
  X,
  Cpu,
  Globe,
  Layers,
  Plus,
  Trash2,
  Sparkles,
  DollarSign,
  Zap,
  Check,
  Search,
  Download,
  Heart,
  RefreshCw,
} from "lucide-react";

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: Partial<Deployment>) => Promise<void>;
  initialData?: Deployment | null;
}

const PRESET_MODELS = [
  {
    label: "Llama-3.3-70B-Instruct",
    model: "meta-llama/Llama-3.3-70B-Instruct",
    recommendedCompute: "H100-80GB" as ComputeTier,
  },
  {
    label: "DeepSeek-R1-Distill-32B",
    model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    recommendedCompute: "B200-192GB" as ComputeTier,
  },
  {
    label: "Qwen-2.5-Coder-32B",
    model: "Qwen/Qwen2.5-Coder-32B-Instruct",
    recommendedCompute: "H100-80GB" as ComputeTier,
  },
  {
    label: "FLUX.1-dev Image Synth",
    model: "black-forest-labs/FLUX.1-dev",
    recommendedCompute: "A100-80GB" as ComputeTier,
  },
  {
    label: "Whisper-Large-v3-Turbo",
    model: "openai/whisper-large-v3-turbo",
    recommendedCompute: "L40S-48GB" as ComputeTier,
  },
];

const COMPUTE_TIERS: {
  id: ComputeTier;
  name: string;
  vram: string;
  bandwidth: string;
  pricePerHr: number;
  badge: string;
}[] = [
  {
    id: "B200-192GB",
    name: "NVIDIA Blackwell B200",
    vram: "192 GB HBM3e",
    bandwidth: "8.0 TB/s",
    pricePerHr: 5.7,
    badge: "EXTREME",
  },
  {
    id: "H100-80GB",
    name: "NVIDIA Hopper H100 SXM",
    vram: "80 GB HBM3",
    bandwidth: "3.35 TB/s",
    pricePerHr: 3.45,
    badge: "POPULAR",
  },
  {
    id: "A100-80GB",
    name: "NVIDIA A100 SXM4",
    vram: "80 GB HBM2e",
    bandwidth: "2.0 TB/s",
    pricePerHr: 2.4,
    badge: "BALANCED",
  },
  {
    id: "L40S-48GB",
    name: "NVIDIA L40S Ada",
    vram: "48 GB GDDR6",
    bandwidth: "864 GB/s",
    pricePerHr: 1.8,
    badge: "AUDIO/VISION",
  },
];

const REGIONS: { code: RegionCode; name: string; location: string; latency: string }[] = [
  { code: "iad-1", name: "US-East (Virginia)", location: "Ashburn, VA", latency: "12ms" },
  { code: "sfo-1", name: "US-West (Silicon Valley)", location: "San Jose, CA", latency: "9ms" },
  { code: "fra-1", name: "EU-Central (Frankfurt)", location: "Frankfurt, DE", latency: "19ms" },
  { code: "hnd-1", name: "AP-East (Tokyo)", location: "Tokyo, JP", latency: "24ms" },
];

export default function DeploymentModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: DeploymentModalProps) {
  const [name, setName] = useState("");
  const [model, setModel] = useState("meta-llama/Llama-3.3-70B-Instruct");
  const [compute, setCompute] = useState<ComputeTier>("H100-80GB");
  const [region, setRegion] = useState<RegionCode>("iad-1");
  const [status, setStatus] = useState<DeploymentStatus>("LIVE");
  const [replicas, setReplicas] = useState(2);
  const [maxBatchSize, setMaxBatchSize] = useState(256);
  const [quantization, setQuantization] = useState<"FP16" | "FP8" | "INT4-AWQ">("FP8");
  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { key: "VLLM_ATTENTION_BACKEND", value: "FLASHINFER" },
    { key: "KV_CACHE_DTYPE", value: "fp8_e4m3" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Public Hugging Face API Search state
  const [hfQuery, setHfQuery] = useState("");
  const [hfResults, setHfResults] = useState<HuggingFaceModelResult[]>([]);
  const [hfLoading, setHfLoading] = useState(false);
  const [hfSource, setHfSource] = useState<string>("huggingface-live-api");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setModel(initialData.model);
      setCompute(initialData.compute);
      setRegion(initialData.region);
      setStatus(initialData.status);
      setReplicas(initialData.replicas || 1);
      setMaxBatchSize(initialData.maxBatchSize || 256);
      setQuantization(initialData.quantization || "FP8");
      setEnvVars(
        initialData.envVars?.length
          ? initialData.envVars
          : [{ key: "VLLM_ATTENTION_BACKEND", value: "FLASHINFER" }]
      );
    } else {
      setName("llama-3.3-70b-edge-prod");
      setModel("meta-llama/Llama-3.3-70B-Instruct");
      setCompute("H100-80GB");
      setRegion("iad-1");
      setStatus("LIVE");
      setReplicas(2);
      setMaxBatchSize(256);
      setQuantization("FP8");
      setEnvVars([
        { key: "VLLM_ATTENTION_BACKEND", value: "FLASHINFER" },
        { key: "MAX_MODEL_LEN", value: "32768" },
      ]);
    }
    setError(null);
  }, [initialData, isOpen]);

  // Fetch live models from Hugging Face Hub API when modal opens or query changes
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setHfLoading(true);
      try {
        const res = await fetch(
          `/api/hf-models?q=${encodeURIComponent(hfQuery)}&limit=6`
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setHfResults(data.models || []);
          setHfSource(data.source || "huggingface-live-api");
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setHfLoading(false);
      }
    }, 260);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hfQuery, isOpen]);

  if (!isOpen) return null;

  const selectedTier = COMPUTE_TIERS.find((t) => t.id === compute) || COMPUTE_TIERS[1];
  const estimatedHourly =
    status === "HIBERNATED" ? 0 : (selectedTier.pricePerHr * replicas).toFixed(2);

  const handleSelectHfModel = (item: HuggingFaceModelResult) => {
    setModel(item.id);
    setCompute(item.recommendedCompute);
    setQuantization(item.suggestedQuantization);
    if (!initialData) {
      const shortName = item.id.split("/").pop() || item.id;
      const cleanSlug = shortName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setName(`${cleanSlug}-prod`);
    }
  };

  const handleAddEnv = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const handleRemoveEnv = (idx: number) => {
    setEnvVars(envVars.filter((_, i) => i !== idx));
  };

  const handleEnvChange = (idx: number, field: "key" | "value", val: string) => {
    const next = [...envVars];
    next[idx] = { ...next[idx], [field]: val };
    setEnvVars(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !model.trim()) {
      setError("Endpoint name and model weight identifier are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const cleanedEnv = envVars.filter((ev) => ev.key.trim() !== "");
      await onSave({
        name: name.trim(),
        model: model.trim(),
        compute,
        region,
        status,
        replicas: status === "HIBERNATED" ? 0 : replicas,
        maxBatchSize,
        quantization,
        envVars: cleanedEnv,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save deployment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="specular-card w-full max-w-2xl rounded-2xl bg-[#09090C] border border-white/[0.12] overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-white text-black flex items-center justify-center font-mono text-xs font-bold">
              ▲
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {initialData
                  ? `Reconfigure Deployment // ${initialData.name}`
                  : "Provision Serverless GPU Endpoint"}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Backed by SQLite WAL persistence & live Hugging Face Hub API discovery
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* LIVE HUGGING FACE HUB PUBLIC API EXPLORER */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.09] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                  Hugging Face Hub Live Model Registry
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                {hfLoading && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                {hfSource === "huggingface-live-api"
                  ? "PUBLIC API CONNECTED"
                  : "CACHED CATALOG"}
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hfQuery}
                onChange={(e) => setHfQuery(e.target.value)}
                placeholder="Query live Hugging Face Hub API (e.g. mistral, llama-3, qwen, deepseek, phi-4)..."
                className="w-full bg-black border border-white/[0.1] focus:border-white/35 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {hfResults.map((item) => {
                const isSelected = model === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectHfModel(item)}
                    className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? "bg-white text-black border-white"
                        : "bg-black/70 border-white/[0.07] hover:border-white/25 text-zinc-200"
                    }`}
                  >
                    <div className="font-mono text-[11px] font-semibold truncate">
                      {item.id}
                    </div>
                    <div
                      className={`mt-1.5 flex items-center justify-between text-[10px] font-mono ${
                        isSelected ? "text-zinc-700" : "text-zinc-500"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5">
                          <Download className="w-2.5 h-2.5" />
                          {(item.downloads / 1000).toFixed(0)}k
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <Heart className="w-2.5 h-2.5" />
                          {item.likes}
                        </span>
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded ${
                          isSelected
                            ? "bg-black/10 text-black font-semibold"
                            : "bg-white/[0.05] text-zinc-400"
                        }`}
                      >
                        {item.recommendedCompute}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Curated Blueprints */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Or Pick Verified Production Blueprint
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_MODELS.map((preset) => {
                const active = model === preset.model;
                return (
                  <button
                    key={preset.model}
                    type="button"
                    onClick={() => {
                      setModel(preset.model);
                      setCompute(preset.recommendedCompute);
                      if (!initialData) {
                        const slugBase = preset.label
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-");
                        setName(`${slugBase}-prod`);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition border ${
                      active
                        ? "bg-white text-black border-white font-medium"
                        : "bg-white/[0.03] text-zinc-300 border-white/[0.08] hover:border-white/25"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Endpoint Name & HuggingFace / OCI Weight ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Endpoint Slug / Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="llama-3-70b-production"
                className="w-full bg-black border border-white/[0.1] focus:border-white/40 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Model Weights Identifier (HF / S3)
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="meta-llama/Llama-3.3-70B-Instruct"
                className="w-full bg-black border border-white/[0.1] focus:border-white/40 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Compute Accelerator Selection */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>Dedicated GPU Tensor Architecture</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COMPUTE_TIERS.map((tier) => {
                const isSelected = compute === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setCompute(tier.id)}
                    className={`p-3 rounded-xl border text-left transition relative ${
                      isSelected
                        ? "bg-white/[0.07] border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                        : "bg-black/60 border-white/[0.08] text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-semibold text-white">
                        {tier.id}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300">
                        ${tier.pricePerHr.toFixed(2)}/hr
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{tier.name}</div>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                      <span>{tier.vram}</span>
                      <span>•</span>
                      <span>{tier.bandwidth}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region & Operational State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                <span>Edge Fabric Region</span>
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as RegionCode)}
                className="w-full bg-black border border-white/[0.1] focus:border-white/40 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
              >
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code} className="bg-zinc-950">
                    {r.code.toUpperCase()} — {r.name} ({r.latency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Target Lifecycle State</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeploymentStatus)}
                className="w-full bg-black border border-white/[0.1] focus:border-white/40 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
              >
                <option value="LIVE" className="bg-zinc-950">
                  LIVE — Active Hot Tensor Pool
                </option>
                <option value="PROVISIONING" className="bg-zinc-950">
                  PROVISIONING — Warming Shards
                </option>
                <option value="HIBERNATED" className="bg-zinc-950">
                  HIBERNATED — Scale-to-Zero ($0/hr)
                </option>
                <option value="DEGRADED" className="bg-zinc-950">
                  DEGRADED — Canary Throttled
                </option>
              </select>
            </div>
          </div>

          {/* Replicas, Quantization, Max Batch Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.07]">
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1.5">
                <span className="text-zinc-400">GPU REPLICAS</span>
                <span className="text-white font-semibold">{replicas}x Nodes</span>
              </div>
              <input
                type="range"
                min={1}
                max={16}
                value={replicas}
                onChange={(e) => setReplicas(Number(e.target.value))}
                disabled={status === "HIBERNATED"}
                className="w-full accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
                <span>1x</span>
                <span>8x</span>
                <span>16x</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                WEIGHT PRECISION
              </label>
              <div className="grid grid-cols-3 gap-1 bg-black p-1 rounded-lg border border-white/[0.08]">
                {(["FP8", "FP16", "INT4-AWQ"] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantization(q)}
                    className={`py-1 rounded text-[10px] font-mono transition ${
                      quantization === q
                        ? "bg-white text-black font-semibold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                MAX CONCURRENT BATCH
              </label>
              <select
                value={maxBatchSize}
                onChange={(e) => setMaxBatchSize(Number(e.target.value))}
                className="w-full bg-black border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
              >
                <option value={64}>64 sequences</option>
                <option value={128}>128 sequences</option>
                <option value={256}>256 sequences</option>
                <option value={512}>512 sequences</option>
                <option value={1024}>1024 sequences</option>
              </select>
            </div>
          </div>

          {/* Runtime Environment Variables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>vLLM / TensorRT-LLM Runtime Flags</span>
              </label>
              <button
                type="button"
                onClick={handleAddEnv}
                className="text-[11px] font-mono text-zinc-300 hover:text-white flex items-center gap-1 bg-white/[0.04] px-2 py-1 rounded border border-white/[0.08]"
              >
                <Plus className="w-3 h-3" />
                <span>Add Flag</span>
              </button>
            </div>
            <div className="space-y-2">
              {envVars.map((ev, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ev.key}
                    onChange={(e) => handleEnvChange(i, "key", e.target.value)}
                    placeholder="ENV_KEY"
                    className="w-1/2 bg-black border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-white/30"
                  />
                  <input
                    type="text"
                    value={ev.value}
                    onChange={(e) => handleEnvChange(i, "value", e.target.value)}
                    placeholder="VALUE"
                    className="flex-1 bg-black border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEnv(i)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Cost Summary & Submit */}
          <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-mono text-zinc-400">
                  ESTIMATED COMPUTE BURN
                </div>
                <div className="text-sm font-mono font-semibold text-white">
                  ${estimatedHourly} <span className="text-xs text-zinc-500 font-normal">/ hour</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-white/[0.1] text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-medium text-xs transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {saving
                    ? "Writing to SQLite..."
                    : initialData
                    ? "Apply Configuration"
                    : "Deploy Endpoint"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

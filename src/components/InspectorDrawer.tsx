"use client";

import React, { useState } from "react";
import { Deployment } from "@/lib/db";
import {
  X,
  Terminal,
  Play,
  Copy,
  Check,
  Activity,
  Cpu,
  Globe,
  Sliders,
  Sparkles,
  Power,
  Edit3,
  Trash2,
} from "lucide-react";

interface InspectorDrawerProps {
  deployment: Deployment | null;
  onClose: () => void;
  onEdit: (dep: Deployment) => void;
  onToggleStatus: (dep: Deployment) => void;
  onDelete: (dep: Deployment) => void;
}

export default function InspectorDrawer({
  deployment,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
}: InspectorDrawerProps) {
  const [prompt, setPrompt] = useState(
    "Explain why FP8 speculative decoding on NVIDIA B200 reduces P95 tail latency by 42%."
  );
  const [simOutput, setSimOutput] = useState<string>(
    "// Ready for tensor execution. Click 'Run Inference Benchmark' to stream live tokens from this deployment."
  );
  const [runningSim, setRunningSim] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  if (!deployment) return null;

  const curlSnippet = `curl https://${deployment.slug}.vortex.sh/v1/chat/completions \\
  -H "Authorization: Bearer $VORTEX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${deployment.model}",
    "messages": [{"role": "user", "content": "${prompt.slice(0, 60)}..."}],
    "temperature": 0.2,
    "stream": true
  }'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleRunInference = () => {
    if (deployment.status === "HIBERNATED") {
      setSimOutput(
        `[COLD-START WAKE] Endpoint ${deployment.slug} is currently HIBERNATED.\nWake the endpoint or scale replicas >= 1 to stream live inference.`
      );
      return;
    }
    setRunningSim(true);
    setSimOutput("");
    const sampleResponse = `[VORTEX EDGE ROUTER // ${deployment.region.toUpperCase()} // ${deployment.compute}]\n` +
      `TTFT: ${deployment.latencyP95Ms}ms | Precision: ${deployment.quantization} | Replicas: ${deployment.replicas}x\n\n` +
      `1. Tensor Core Utilization: FP8 (E4M3) halves memory bandwidth pressure across HBM3e compared to BF16, allowing KV-cache blocks to remain L2-resident during autoregressive decoding.\n` +
      `2. Draft-Verify Pipeline: Speculative decoding verifies 5 draft tokens in a single forward pass with zero accuracy degradation.\n\n` +
      `[COMPLETE // 118 tokens generated @ ${deployment.tokensPerSec} tok/s]`;

    let idx = 0;
    const interval = setInterval(() => {
      idx += 12;
      setSimOutput(sampleResponse.slice(0, idx));
      if (idx >= sampleResponse.length) {
        clearInterval(interval);
        setRunningSim(false);
      }
    }, 25);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#08080B] border-l border-white/[0.1] h-full flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                deployment.status === "LIVE"
                  ? "bg-emerald-400 shadow-[0_0_10px_#34d399]"
                  : deployment.status === "HIBERNATED"
                  ? "bg-zinc-600"
                  : "bg-amber-400 animate-pulse"
              }`}
            />
            <div>
              <h3 className="text-sm font-mono font-semibold text-white">
                {deployment.name}
              </h3>
              <p className="text-[11px] font-mono text-zinc-400">
                ID: {deployment.id} • {deployment.region.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(deployment)}
              className="px-2.5 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/20 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Quick Telemetry Strip */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.07]">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">
                Throughput
              </div>
              <div className="text-sm font-mono font-semibold text-emerald-400 mt-0.5">
                {deployment.tokensPerSec} <span className="text-[10px]">t/s</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.07]">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">
                P95 TTFT
              </div>
              <div className="text-sm font-mono font-semibold text-white mt-0.5">
                {deployment.latencyP95Ms} <span className="text-[10px]">ms</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.07]">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">
                Replicas
              </div>
              <div className="text-sm font-mono font-semibold text-sky-400 mt-0.5">
                {deployment.replicas}x <span className="text-[10px]">{deployment.compute.split("-")[0]}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.07]">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">
                Burn Rate
              </div>
              <div className="text-sm font-mono font-semibold text-white mt-0.5">
                ${deployment.costPerHour.toFixed(2)}<span className="text-[10px]">/hr</span>
              </div>
            </div>
          </div>

          {/* Interactive Live Inference Playground */}
          <div className="rounded-xl border border-white/[0.1] bg-[#050507] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interactive Endpoint Sandbox</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {deployment.model}
              </span>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                  Input Prompt Payload
                </label>
                <textarea
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-black border border-white/[0.08] rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-500">
                  Max Batch: {deployment.maxBatchSize} • Quantization: {deployment.quantization}
                </span>
                <button
                  type="button"
                  onClick={handleRunInference}
                  disabled={runningSim}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-mono font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <Play className="w-3 h-3 fill-black" />
                  <span>{runningSim ? "Streaming..." : "Run Inference Benchmark"}</span>
                </button>
              </div>

              <pre className="p-3 rounded-lg bg-black/90 border border-white/[0.06] font-mono text-[11px] text-emerald-300/90 whitespace-pre-wrap leading-relaxed min-h-[120px]">
                {simOutput}
              </pre>
            </div>
          </div>

          {/* cURL Integration Snippet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span>Production cURL Request</span>
              </span>
              <button
                type="button"
                onClick={handleCopyCurl}
                className="text-[11px] font-mono text-zinc-300 hover:text-white flex items-center gap-1 bg-white/[0.04] px-2 py-1 rounded border border-white/[0.08]"
              >
                {copiedCurl ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy cURL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-black border border-white/[0.08] font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
              {curlSnippet}
            </pre>
          </div>

          {/* Environment Variables & Hardware Spec */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
              <span>Injected Engine Flags ({deployment.envVars.length})</span>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/60 divide-y divide-white/[0.06]">
              {deployment.envVars.length === 0 ? (
                <div className="p-3 text-xs font-mono text-zinc-500">
                  Default vLLM runtime flags active.
                </div>
              ) : (
                deployment.envVars.map((ev, i) => (
                  <div
                    key={i}
                    className="px-3.5 py-2 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-zinc-400">{ev.key}</span>
                    <span className="text-emerald-400">{ev.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-white/[0.015] flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDelete(deployment)}
            className="px-3 py-2 rounded-lg border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-mono flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Decommission Endpoint</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleStatus(deployment)}
            className="px-4 py-2 rounded-lg border border-white/[0.14] hover:border-white/30 bg-white/[0.05] text-white text-xs font-mono flex items-center gap-1.5 transition"
          >
            <Power className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {deployment.status === "HIBERNATED"
                ? "Wake Cluster to LIVE"
                : "Hibernate Cluster ($0/hr)"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

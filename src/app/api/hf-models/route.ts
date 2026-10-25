import { NextResponse } from "next/server";
import { ComputeTier } from "@/lib/db";

export interface HuggingFaceModelResult {
  id: string;
  downloads: number;
  likes: number;
  pipelineTag: string;
  libraryName: string;
  recommendedCompute: ComputeTier;
  suggestedQuantization: "FP8" | "FP16" | "INT4-AWQ";
}

function inferHardwareForModel(modelId: string): {
  compute: ComputeTier;
  quant: "FP8" | "FP16" | "INT4-AWQ";
} {
  const lower = modelId.toLowerCase();
  if (lower.includes("405b") || lower.includes("671b") || lower.includes("r1") || lower.includes("72b")) {
    return { compute: "B200-192GB", quant: "FP8" };
  }
  if (lower.includes("70b") || lower.includes("32b") || lower.includes("34b") || lower.includes("mixtral")) {
    return { compute: "H100-80GB", quant: "FP8" };
  }
  if (lower.includes("whisper") || lower.includes("tts") || lower.includes("audio") || lower.includes("embed")) {
    return { compute: "L40S-48GB", quant: "FP16" };
  }
  if (lower.includes("flux") || lower.includes("sdxl") || lower.includes("diffusion")) {
    return { compute: "A100-80GB", quant: "FP8" };
  }
  if (lower.includes("awq") || lower.includes("int4") || lower.includes("gptq")) {
    return { compute: "H100-80GB", quant: "INT4-AWQ" };
  }
  return { compute: "H100-80GB", quant: "FP8" };
}

const FALLBACK_MODELS: HuggingFaceModelResult[] = [
  {
    id: "meta-llama/Llama-3.3-70B-Instruct",
    downloads: 4820190,
    likes: 3410,
    pipelineTag: "text-generation",
    libraryName: "transformers",
    recommendedCompute: "H100-80GB",
    suggestedQuantization: "FP8",
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    downloads: 6190440,
    likes: 5890,
    pipelineTag: "text-generation",
    libraryName: "vllm",
    recommendedCompute: "B200-192GB",
    suggestedQuantization: "FP8",
  },
  {
    id: "Qwen/Qwen2.5-Coder-32B-Instruct",
    downloads: 2910400,
    likes: 2740,
    pipelineTag: "text-generation",
    libraryName: "transformers",
    recommendedCompute: "H100-80GB",
    suggestedQuantization: "INT4-AWQ",
  },
  {
    id: "mistralai/Mistral-Small-24B-Instruct-2501",
    downloads: 1420900,
    likes: 1680,
    pipelineTag: "text-generation",
    libraryName: "vllm",
    recommendedCompute: "H100-80GB",
    suggestedQuantization: "FP8",
  },
  {
    id: "black-forest-labs/FLUX.1-dev",
    downloads: 3890120,
    likes: 7120,
    pipelineTag: "text-to-image",
    libraryName: "diffusers",
    recommendedCompute: "A100-80GB",
    suggestedQuantization: "FP8",
  },
  {
    id: "openai/whisper-large-v3-turbo",
    downloads: 5120330,
    likes: 2980,
    pipelineTag: "automatic-speech-recognition",
    libraryName: "transformers",
    recommendedCompute: "L40S-48GB",
    suggestedQuantization: "FP16",
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit") || 8), 16);

  try {
    const hfUrl = new URL("https://huggingface.co/api/models");
    if (query) {
      hfUrl.searchParams.set("search", query);
    } else {
      hfUrl.searchParams.set("filter", "text-generation");
    }
    hfUrl.searchParams.set("sort", "downloads");
    hfUrl.searchParams.set("direction", "-1");
    hfUrl.searchParams.set("limit", String(limit));

    const res = await fetch(hfUrl.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 120 },
    });

    if (!res.ok) {
      throw new Error(`Hugging Face API returned ${res.status}`);
    }

    const rawModels = (await res.json()) as Array<{
      id?: string;
      modelId?: string;
      downloads?: number;
      likes?: number;
      pipeline_tag?: string;
      library_name?: string;
    }>;

    const models: HuggingFaceModelResult[] = rawModels.map((item) => {
      const id = item.id || item.modelId || "unknown/model";
      const hw = inferHardwareForModel(id);
      return {
        id,
        downloads: item.downloads ?? 0,
        likes: item.likes ?? 0,
        pipelineTag: item.pipeline_tag || "text-generation",
        libraryName: item.library_name || "safetensors",
        recommendedCompute: hw.compute,
        suggestedQuantization: hw.quant,
      };
    });

    return NextResponse.json({
      source: "huggingface-live-api",
      models,
    });
  } catch {
    // Graceful fallback if offline
    const filtered = query
      ? FALLBACK_MODELS.filter((m) => m.id.toLowerCase().includes(query.toLowerCase()))
      : FALLBACK_MODELS;
    return NextResponse.json({
      source: "cached-catalog",
      models: filtered.slice(0, limit),
    });
  }
}

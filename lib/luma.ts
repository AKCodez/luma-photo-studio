import type {
  AspectRatio,
  LumaCharacterRef,
  LumaCreateImageRequest,
  LumaGeneration,
  LumaModifyImageRef,
} from "./types";

const LUMA_BASE = "https://api.lumalabs.ai/dream-machine/v1";

function apiKey(): string {
  const key = process.env.LUMA_API_KEY;
  if (!key) throw new Error("LUMA_API_KEY missing from environment");
  return key;
}

function authHeaders() {
  return {
    accept: "application/json",
    authorization: `Bearer ${apiKey()}`,
    "content-type": "application/json",
  } as const;
}

let workingModel: string | null = null;
const MODEL_CANDIDATES = ["photon-1", "uni-1"];

export interface CreateImageOpts {
  prompt: string;
  aspectRatio: AspectRatio;
  characterRef?: LumaCharacterRef;
  modifyImageRef?: LumaModifyImageRef;
}

export async function createImageGeneration(
  opts: CreateImageOpts
): Promise<LumaGeneration> {
  const candidates = workingModel ? [workingModel] : MODEL_CANDIDATES;
  let lastErr: unknown = null;
  for (const model of candidates) {
    const body: LumaCreateImageRequest = {
      prompt: opts.prompt,
      aspect_ratio: opts.aspectRatio,
      model,
      generation_type: "image",
      format: "jpg",
    };
    if (opts.characterRef) body.character_ref = opts.characterRef;
    if (opts.modifyImageRef) body.modify_image_ref = opts.modifyImageRef;

    try {
      const res = await fetch(`${LUMA_BASE}/generations/image`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        if (res.status === 400 || res.status === 422) {
          lastErr = new Error(`Luma ${res.status}: ${text}`);
          continue;
        }
        throw new Error(`Luma error ${res.status}: ${text}`);
      }

      workingModel = model;
      return (await res.json()) as LumaGeneration;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("All Luma model candidates failed");
}

export async function getGeneration(id: string): Promise<LumaGeneration> {
  const res = await fetch(`${LUMA_BASE}/generations/${id}`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Luma get error ${res.status}: ${text}`);
  }
  return (await res.json()) as LumaGeneration;
}

export interface PollOpts {
  intervalMs?: number;
  timeoutMs?: number;
  onUpdate?: (gen: LumaGeneration) => void;
}

export async function pollGeneration(
  id: string,
  opts: PollOpts = {}
): Promise<LumaGeneration> {
  const intervalMs = opts.intervalMs ?? 1500;
  const timeoutMs = opts.timeoutMs ?? 5 * 60 * 1000;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const gen = await getGeneration(id);
    opts.onUpdate?.(gen);
    if (gen.state === "completed" || gen.state === "failed") return gen;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Generation ${id} timed out after ${timeoutMs}ms`);
}

export async function downloadImage(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  return res.arrayBuffer();
}

import type {
  AspectRatio,
  LumaCharacterRef,
  LumaCreateImageRequest,
  LumaGeneration,
  LumaModifyImageRef,
} from "./types";

const LUMA_BASE = "https://api.lumalabs.ai/dream-machine/v1";

export class LumaError extends Error {
  status: number;
  body: string;
  code: "moderation" | "rate_limit" | "auth" | "bad_request" | "server" | "unknown";

  constructor(status: number, body: string) {
    let code: LumaError["code"] = "unknown";
    if (status === 401 || status === 403) code = "auth";
    else if (status === 429) code = "rate_limit";
    else if (status >= 500) code = "server";
    else if (status === 400 || status === 422) code = "bad_request";
    if (/moderate|moderation|nsfw|safety/i.test(body)) code = "moderation";

    super(prettyMessage(code, status, body));
    this.name = "LumaError";
    this.status = status;
    this.body = body;
    this.code = code;
  }
}

function prettyMessage(
  code: LumaError["code"],
  status: number,
  body: string
): string {
  const snippet = body.length > 240 ? body.slice(0, 240) + "…" : body;
  switch (code) {
    case "moderation":
      return "Reference or scene was flagged by safety filters. Try a different reference photo or rephrase the scene.";
    case "rate_limit":
      return "Hit Luma rate limit. Try again in a moment.";
    case "auth":
      return "Luma rejected the API key. Verify LUMA_API_KEY in env.";
    case "server":
      return `Luma server error (${status}). ${snippet}`;
    case "bad_request":
      return `Luma rejected the request (${status}). ${snippet}`;
    default:
      return `Luma error ${status}: ${snippet}`;
  }
}

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

    let res: Response;
    try {
      res = await fetch(`${LUMA_BASE}/generations/image`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
    } catch (err) {
      lastErr = err;
      continue;
    }

    if (res.ok) {
      workingModel = model;
      return (await res.json()) as LumaGeneration;
    }

    const text = await res.text();
    const lumaErr = new LumaError(res.status, text);

    if (lumaErr.code === "bad_request" && model !== candidates[candidates.length - 1]) {
      lastErr = lumaErr;
      continue;
    }
    throw lumaErr;
  }
  if (lastErr instanceof Error) throw lastErr;
  throw new Error("All Luma model candidates failed");
}

export async function getGeneration(id: string): Promise<LumaGeneration> {
  const res = await fetch(`${LUMA_BASE}/generations/${id}`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new LumaError(res.status, await res.text());
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
  const timeoutMs = opts.timeoutMs ?? 4 * 60 * 1000;
  const start = Date.now();
  let lastErr: unknown = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const gen = await getGeneration(id);
      opts.onUpdate?.(gen);
      if (gen.state === "completed" || gen.state === "failed") return gen;
      lastErr = null;
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  if (lastErr instanceof Error) throw lastErr;
  throw new Error(`Generation ${id} timed out after ${timeoutMs}ms`);
}

export async function downloadImage(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to download image (${res.status})`);
  return res.arrayBuffer();
}

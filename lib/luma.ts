import type {
  AspectRatio,
  LumaCreateRequest,
  LumaGeneration,
  LumaImageRef,
} from "./types";

const LUMA_BASE = "https://agents.lumalabs.ai/v1";

export class LumaError extends Error {
  status: number;
  body: string;
  failureCode: string | null;
  retryAfter: number | null;
  code: "moderation" | "rate_limit" | "auth" | "bad_request" | "server" | "unknown";

  constructor(
    status: number,
    body: string,
    failureCode: string | null = null,
    retryAfter: number | null = null
  ) {
    let code: LumaError["code"] = "unknown";
    if (status === 401 || status === 403) code = "auth";
    else if (status === 429) code = "rate_limit";
    else if (status >= 500) code = "server";
    else if (status === 400 || status === 422) code = "bad_request";
    if (/moderate|moderation|nsfw|safety|policy/i.test(body)) code = "moderation";

    super(prettyMessage(code, status, body, failureCode));
    this.name = "LumaError";
    this.status = status;
    this.body = body;
    this.failureCode = failureCode;
    this.retryAfter = retryAfter;
    this.code = code;
  }
}

function prettyMessage(
  code: LumaError["code"],
  status: number,
  body: string,
  failureCode: string | null
): string {
  const snippet = body.length > 240 ? body.slice(0, 240) + "…" : body;
  switch (code) {
    case "moderation":
      return "Reference or scene was flagged by safety filters. Try a different reference photo or rephrase the scene.";
    case "rate_limit":
      return "Hit Luma rate limit. Try again in a moment.";
    case "auth":
      return "Luma rejected the API key. Verify LUMA_AGENTS_API_KEY in env.";
    case "server":
      return `Luma server error (${status}). ${snippet}`;
    case "bad_request":
      return `Luma rejected the request (${status})${
        failureCode ? ` [${failureCode}]` : ""
      }. ${snippet}`;
    default:
      return `Luma error ${status}: ${snippet}`;
  }
}

function apiKey(): string {
  const key = process.env.LUMA_AGENTS_API_KEY ?? process.env.LUMA_API_KEY;
  if (!key)
    throw new Error(
      "LUMA_AGENTS_API_KEY (or LUMA_API_KEY) missing from environment"
    );
  return key;
}

function authHeaders() {
  return {
    accept: "application/json",
    authorization: `Bearer ${apiKey()}`,
    "content-type": "application/json",
  } as const;
}

export interface CreateImageOpts {
  prompt: string;
  aspectRatio: AspectRatio;
  imageRefs?: string[];
  source?: string;
  style?: "auto" | "manga";
  webSearch?: boolean;
}

export async function createImageGeneration(
  opts: CreateImageOpts
): Promise<LumaGeneration> {
  const body: LumaCreateRequest = {
    prompt: opts.prompt,
    aspect_ratio: opts.aspectRatio,
    type: opts.source ? "image_edit" : "image",
    output_format: "jpeg",
  };
  if (opts.style) body.style = opts.style;
  if (opts.webSearch) body.web_search = opts.webSearch;

  const refs = (opts.imageRefs ?? []).filter(Boolean).slice(0, 9);
  if (refs.length > 0) {
    body.image_ref = refs.map<LumaImageRef>((url) => ({ url }));
  }
  if (opts.source) {
    body.source = { url: opts.source };
  }

  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`${LUMA_BASE}/generations`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    if (res.ok) return (await res.json()) as LumaGeneration;

    const text = await res.text();
    const retryAfterHdr = res.headers.get("retry-after");
    const retryAfter = retryAfterHdr ? Number(retryAfterHdr) : null;

    if (res.status === 429 && attempt < maxAttempts) {
      const baseWait = retryAfter && Number.isFinite(retryAfter) ? retryAfter : 8;
      const jitter = Math.floor(Math.random() * 1500);
      const waitMs = baseWait * 1000 + jitter;
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    const transientUpstream =
      res.status === 422 &&
      /(S3 upload failed|failed to fetch|fetch URL|timed out|timeout|temporarily)/i.test(
        text
      );
    if ((res.status >= 500 || transientUpstream) && attempt < maxAttempts) {
      const wait = Math.min(2000 * attempt, 10_000) + Math.floor(Math.random() * 800);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    throw new LumaError(res.status, text, null, retryAfter);
  }
  throw new LumaError(429, "Rate limit retries exhausted", null, null);
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
  const baseInterval = opts.intervalMs ?? 2000;
  const timeoutMs = opts.timeoutMs ?? 270 * 1000;
  const start = Date.now();
  let interval = baseInterval;
  let lastErr: unknown = null;

  while (Date.now() - start < timeoutMs) {
    try {
      const gen = await getGeneration(id);
      opts.onUpdate?.(gen);
      if (gen.state === "completed" || gen.state === "failed") {
        if (gen.state === "failed") {
          throw new LumaError(
            422,
            gen.failure_reason ?? "Generation failed",
            gen.failure_code
          );
        }
        return gen;
      }
      lastErr = null;
    } catch (err) {
      if (err instanceof LumaError && err.status === 422) throw err;
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, interval));
    interval = Math.min(Math.round(interval * 1.3), 5000);
  }
  if (lastErr instanceof Error) throw lastErr;
  throw new Error(`Generation ${id} timed out after ${timeoutMs}ms`);
}

export async function downloadImage(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to download image (${res.status})`);
  return res.arrayBuffer();
}

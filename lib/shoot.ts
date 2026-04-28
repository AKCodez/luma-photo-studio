import type { AspectRatio, PackStyle } from "./types";
import { createImageGeneration } from "./luma";

export interface BuildPayloadOpts {
  prompt: string;
  aspectRatio: AspectRatio;
  referenceUrls?: string[];
  sourceUrl?: string;
  style?: PackStyle;
}

export async function startSceneGeneration(opts: BuildPayloadOpts) {
  const refs = (opts.referenceUrls ?? []).filter(Boolean);
  return createImageGeneration({
    prompt: opts.prompt,
    aspectRatio: opts.aspectRatio,
    imageRefs: refs.length > 0 ? refs : undefined,
    source: opts.sourceUrl,
  });
}

export function toAbsoluteUrl(req: Request, publicPath: string): string {
  if (publicPath.startsWith("http")) return publicPath;
  const url = new URL(req.url);
  const proto =
    req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  return `${proto}://${host}${publicPath}`;
}

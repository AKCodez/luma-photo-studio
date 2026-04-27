import type {
  AspectRatio,
  LumaCharacterRef,
  LumaModifyImageRef,
} from "./types";
import { createImageGeneration } from "./luma";

export interface BuildPayloadOpts {
  prompt: string;
  aspectRatio: AspectRatio;
  referenceUrl?: string;
  modifyImageUrl?: string;
  characterWeight?: number;
  modifyWeight?: number;
}

export function buildCharacterRef(
  url: string,
  weight = 0.85
): LumaCharacterRef {
  return { identity0: { images: [url], weight } };
}

export function buildModifyRef(url: string, weight = 0.05): LumaModifyImageRef {
  return { url, weight };
}

export async function startSceneGeneration(opts: BuildPayloadOpts) {
  return createImageGeneration({
    prompt: opts.prompt,
    aspectRatio: opts.aspectRatio,
    characterRef: opts.referenceUrl
      ? buildCharacterRef(opts.referenceUrl, opts.characterWeight)
      : undefined,
    modifyImageRef: opts.modifyImageUrl
      ? buildModifyRef(opts.modifyImageUrl, opts.modifyWeight)
      : undefined,
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

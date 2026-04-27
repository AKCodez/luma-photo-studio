import type {
  AspectRatio,
  LumaCharacterRef,
  LumaModifyImageRef,
  PackStyle,
} from "./types";
import { createImageGeneration } from "./luma";

export interface BuildPayloadOpts {
  prompt: string;
  aspectRatio: AspectRatio;
  referenceUrls?: string[];
  modifyImageUrl?: string;
  characterWeight?: number;
  modifyWeight?: number;
  enrich?: boolean;
  style?: PackStyle;
}

export function buildCharacterRef(
  urls: string[],
  weight = 0.95
): LumaCharacterRef {
  const images = urls.filter(Boolean).slice(0, 4);
  return { identity0: { images, weight } };
}

export function buildModifyRef(url: string, weight = 0.05): LumaModifyImageRef {
  return { url, weight };
}

export async function startSceneGeneration(opts: BuildPayloadOpts) {
  const refs = (opts.referenceUrls ?? []).filter(Boolean);
  return createImageGeneration({
    prompt: opts.prompt,
    aspectRatio: opts.aspectRatio,
    characterRef:
      refs.length > 0 ? buildCharacterRef(refs, opts.characterWeight) : undefined,
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

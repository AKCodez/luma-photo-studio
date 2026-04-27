import type {
  AspectRatio,
  LumaCharacterRef,
  LumaModifyImageRef,
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
}

const IDENTITY_PRESERVE =
  "Subject's face must match the reference photo exactly — same exact facial structure, eye shape, eye colour, eyebrow shape, nose, lips, chin, hairline and skin tone. Photorealistic likeness, sharp focus on eyes.";

const AESTHETIC_FLATTER =
  "Athletic toned physique, lean and slim build, defined jawline, clear skin, healthy glow, confident posture, flattering pose and camera angle, magazine-grade composition, subtle natural smile if appropriate.";

export function formatScenePrompt(scene: string): string {
  const trimmed = scene.trim().replace(/\s+/g, " ");
  return `${trimmed} ${AESTHETIC_FLATTER} ${IDENTITY_PRESERVE}`;
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
  const prompt = opts.enrich === false ? opts.prompt : formatScenePrompt(opts.prompt);
  return createImageGeneration({
    prompt,
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

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

const IDENTITY_PHOTO =
  "Subject's face must match the reference photo exactly — same facial structure, eye shape and colour, eyebrows, nose, lips, jawline, hairline and skin tone. Sharp focus on the eyes.";

const IDENTITY_ILLUSTRATION =
  "Subject is fully integrated into the scene's illustration style — drawn with the exact same line weight, palette, shading and level of stylization as the rest of the image. The subject's face is a stylized cartoon/illustrated version of the reference photo, recognisable by hair, eye shape, eyebrows, nose, jawline and any beard, but rendered in the scene's art style. NOT photorealistic and NOT a photo of a real person pasted into a cartoon — the subject is drawn, not photographed.";

const AESTHETIC_FLATTER =
  "Athletic toned physique, lean slim build, defined jawline, clear skin, healthy glow, confident posture, flattering pose and camera angle, magazine-grade composition.";

export function formatScenePrompt(
  scene: string,
  style: PackStyle = "photo"
): string {
  const trimmed = scene.trim().replace(/\s+/g, " ");
  if (style === "illustration") {
    return `${trimmed} ${IDENTITY_ILLUSTRATION}`;
  }
  return `${trimmed} ${AESTHETIC_FLATTER} ${IDENTITY_PHOTO}`;
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
  const prompt =
    opts.enrich === false
      ? opts.prompt
      : formatScenePrompt(opts.prompt, opts.style ?? "photo");
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

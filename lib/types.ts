export type AspectRatio = "9:16" | "3:4" | "1:1" | "4:3" | "16:9";

export const ASPECT_RATIOS: AspectRatio[] = ["9:16", "3:4", "1:1", "4:3", "16:9"];

export type ShootMode = "pack" | "surprise" | "custom";

export type GenerationState = "queued" | "dreaming" | "completed" | "failed";

export interface Scene {
  index: number;
  prompt: string;
}

export interface ShootImage {
  index: number;
  prompt: string;
  generationId: string | null;
  state: GenerationState;
  url: string | null;
  cdnUrl?: string | null;
  failureReason?: string | null;
  variants: ShootImageVariant[];
}

export interface ShootImageVariant {
  index: number;
  prompt: string;
  generationId: string | null;
  state: GenerationState;
  url: string | null;
  cdnUrl?: string | null;
  parentVariant?: number | null;
  createdAt: string;
}

export interface ShootManifest {
  id: string;
  createdAt: string;
  mode: ShootMode;
  packId?: string | null;
  surpriseTheme?: string | null;
  aspectRatio: AspectRatio;
  referenceUrl: string;
  referenceCdnUrl?: string | null;
  referenceFileName: string;
  images: ShootImage[];
}

export interface Pack {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accentColor: string;
  scenes: string[];
  defaultAspectRatio?: AspectRatio;
}

export interface LumaCharacterRef {
  identity0: { images: string[]; weight?: number };
}

export interface LumaImageRef {
  url: string;
  weight?: number;
}

export interface LumaModifyImageRef {
  url: string;
  weight?: number;
}

export interface LumaCreateImageRequest {
  prompt: string;
  aspect_ratio?: AspectRatio;
  model?: string;
  generation_type?: "image";
  format?: "jpg" | "png";
  callback_url?: string;
  image_ref?: LumaImageRef[];
  style_ref?: LumaImageRef[];
  character_ref?: LumaCharacterRef;
  modify_image_ref?: LumaModifyImageRef;
}

export interface LumaGeneration {
  id: string;
  type: "image";
  state: "queued" | "dreaming" | "completed" | "failed";
  failure_reason: string | null;
  created_at: string;
  assets: { image: string | null; video: string | null } | null;
  model: string;
  request: unknown;
}

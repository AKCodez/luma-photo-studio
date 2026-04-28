export type AspectRatio =
  | "3:1"
  | "2:1"
  | "16:9"
  | "3:2"
  | "1:1"
  | "2:3"
  | "9:16"
  | "1:2"
  | "1:3";

export const ASPECT_RATIOS: AspectRatio[] = [
  "9:16",
  "2:3",
  "1:1",
  "3:2",
  "16:9",
];

export type ShootMode = "pack" | "surprise" | "custom";

export type GenerationState = "queued" | "processing" | "completed" | "failed";

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
  referenceUrls: string[];
  referenceFileNames: string[];
  images: ShootImage[];
}

export type PackStyle = "photo" | "illustration";

export interface Pack {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accentColor: string;
  scenes: string[];
  defaultAspectRatio?: AspectRatio;
  style?: PackStyle;
}

export interface LumaImageRef {
  url?: string;
  data?: string;
  media_type?: string;
}

export type LumaGenerationType = "image" | "image_edit";

export interface LumaCreateRequest {
  prompt: string;
  type?: LumaGenerationType;
  model?: string;
  aspect_ratio?: AspectRatio | null;
  style?: "auto" | "manga";
  output_format?: "png" | "jpeg" | null;
  web_search?: boolean;
  image_ref?: LumaImageRef[];
  source?: LumaImageRef;
}

export interface LumaOutputAsset {
  type: "image";
  url: string;
}

export interface LumaGeneration {
  id: string;
  type: LumaGenerationType;
  state: GenerationState;
  model: string;
  created_at: string;
  output: LumaOutputAsset[];
  failure_reason: string | null;
  failure_code: string | null;
}

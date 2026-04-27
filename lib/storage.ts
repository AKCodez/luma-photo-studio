import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put, head } from "@vercel/blob";
import type {
  AspectRatio,
  GenerationState,
  ShootImage,
  ShootImageVariant,
  ShootManifest,
  ShootMode,
} from "./types";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const SHOOTS_DIR = path.join(DATA_DIR, "shoots");
const PUBLIC_DIR = path.join(ROOT, "public");
const PUBLIC_UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const PUBLIC_SHOOTS_DIR = path.join(PUBLIC_DIR, "shoots");

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export interface ShootBase {
  id: string;
  createdAt: string;
  mode: ShootMode;
  packId?: string | null;
  surpriseTheme?: string | null;
  aspectRatio: AspectRatio;
  referenceUrl: string;
  referenceFileName: string;
  prompts: string[];
}

export interface ImageState {
  index: number;
  generationId: string | null;
  state: GenerationState;
  url: string | null;
  cdnUrl: string | null;
  failureReason?: string | null;
  variants: ShootImageVariant[];
}

async function ensureDirs() {
  if (useBlob) return;
  await fs.mkdir(SHOOTS_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_UPLOADS_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_SHOOTS_DIR, { recursive: true });
}

function basePath(shootId: string) {
  return `shoots/${shootId}/base.json`;
}
function imagePath(shootId: string, index: number) {
  return `shoots/${shootId}/image-${index}.json`;
}

export async function saveUpload(
  bytes: ArrayBuffer | Uint8Array,
  ext: string,
  contentType?: string
): Promise<{ refId: string; publicPath: string }> {
  await ensureDirs();
  const refId = randomUUID();
  const safeExt =
    ext.replace(/^\./, "").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const fileName = `${refId}.${safeExt}`;
  const buf = Buffer.from(
    bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  );

  if (useBlob) {
    const blob = await put(`uploads/${fileName}`, buf, {
      access: "public",
      addRandomSuffix: false,
      contentType: contentType ?? `image/${safeExt === "jpg" ? "jpeg" : safeExt}`,
    });
    return { refId, publicPath: blob.url };
  }

  const absolutePath = path.join(PUBLIC_UPLOADS_DIR, fileName);
  await fs.writeFile(absolutePath, buf);
  return { refId, publicPath: `/uploads/${fileName}` };
}

export async function writeBase(base: ShootBase): Promise<void> {
  await ensureDirs();
  const json = JSON.stringify(base, null, 2);
  if (useBlob) {
    await put(basePath(base.id), json, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      allowOverwrite: true,
    });
    return;
  }
  const dir = path.join(SHOOTS_DIR, base.id);
  await fs.mkdir(dir, { recursive: true });
  await fs.mkdir(path.join(PUBLIC_SHOOTS_DIR, base.id), { recursive: true });
  await fs.writeFile(path.join(dir, "base.json"), json, "utf8");
}

export async function readBase(shootId: string): Promise<ShootBase | null> {
  if (useBlob) {
    try {
      const meta = await head(basePath(shootId));
      const res = await fetch(meta.url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as ShootBase;
    } catch {
      return null;
    }
  }
  try {
    const file = path.join(SHOOTS_DIR, shootId, "base.json");
    const text = await fs.readFile(file, "utf8");
    return JSON.parse(text) as ShootBase;
  } catch {
    return null;
  }
}

export async function writeImageState(
  shootId: string,
  state: ImageState
): Promise<void> {
  await ensureDirs();
  const json = JSON.stringify(state, null, 2);
  if (useBlob) {
    await put(imagePath(shootId, state.index), json, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      allowOverwrite: true,
    });
    return;
  }
  const dir = path.join(SHOOTS_DIR, shootId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, `image-${state.index}.json`),
    json,
    "utf8"
  );
}

export async function readImageState(
  shootId: string,
  index: number
): Promise<ImageState | null> {
  if (useBlob) {
    try {
      const meta = await head(imagePath(shootId, index));
      const res = await fetch(meta.url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as ImageState;
    } catch {
      return null;
    }
  }
  try {
    const file = path.join(SHOOTS_DIR, shootId, `image-${index}.json`);
    const text = await fs.readFile(file, "utf8");
    return JSON.parse(text) as ImageState;
  } catch {
    return null;
  }
}

export async function readManifest(
  shootId: string
): Promise<ShootManifest | null> {
  const base = await readBase(shootId);
  if (!base) return null;

  const states = await Promise.all(
    base.prompts.map((_, i) => readImageState(shootId, i))
  );

  const images: ShootImage[] = base.prompts.map((prompt, i) => {
    const s = states[i];
    if (s) {
      return {
        index: i,
        prompt,
        generationId: s.generationId,
        state: s.state,
        url: s.url,
        cdnUrl: s.cdnUrl,
        failureReason: s.failureReason,
        variants: s.variants ?? [],
      };
    }
    return {
      index: i,
      prompt,
      generationId: null,
      state: "queued",
      url: null,
      cdnUrl: null,
      variants: [],
    };
  });

  return {
    id: base.id,
    createdAt: base.createdAt,
    mode: base.mode,
    packId: base.packId,
    surpriseTheme: base.surpriseTheme,
    aspectRatio: base.aspectRatio,
    referenceUrl: base.referenceUrl,
    referenceFileName: base.referenceFileName,
    images,
  };
}

export async function saveImage(
  shootId: string,
  imageIdx: number,
  variantIdx: number | null,
  bytes: ArrayBuffer | Uint8Array
): Promise<string> {
  const buf = Buffer.from(
    bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  );
  const fileName =
    variantIdx === null
      ? `${imageIdx}.jpg`
      : `${imageIdx}-edit-${variantIdx}.jpg`;

  if (useBlob) {
    const blob = await put(`shoots/${shootId}/${fileName}`, buf, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/jpeg",
      allowOverwrite: true,
    });
    return blob.url;
  }

  const dir = path.join(PUBLIC_SHOOTS_DIR, shootId);
  await fs.mkdir(dir, { recursive: true });
  const absolutePath = path.join(dir, fileName);
  await fs.writeFile(absolutePath, buf);
  return `/shoots/${shootId}/${fileName}`;
}

export function newShootId(): string {
  return randomUUID();
}

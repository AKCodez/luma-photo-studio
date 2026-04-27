import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put, head } from "@vercel/blob";
import type { ShootManifest } from "./types";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const SHOOTS_DIR = path.join(DATA_DIR, "shoots");
const PUBLIC_DIR = path.join(ROOT, "public");
const PUBLIC_UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const PUBLIC_SHOOTS_DIR = path.join(PUBLIC_DIR, "shoots");

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

async function ensureDirs() {
  if (useBlob) return;
  await fs.mkdir(SHOOTS_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_UPLOADS_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_SHOOTS_DIR, { recursive: true });
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
  const buf = Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));

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

export async function createShoot(manifest: ShootManifest): Promise<void> {
  await ensureDirs();
  if (useBlob) {
    await writeManifest(manifest);
    return;
  }
  const dir = path.join(SHOOTS_DIR, manifest.id);
  await fs.mkdir(dir, { recursive: true });
  await fs.mkdir(path.join(PUBLIC_SHOOTS_DIR, manifest.id), { recursive: true });
  await writeManifest(manifest);
}

export async function writeManifest(manifest: ShootManifest): Promise<void> {
  if (useBlob) {
    await put(`shoots/${manifest.id}/manifest.json`, JSON.stringify(manifest, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      allowOverwrite: true,
    });
    return;
  }
  const file = path.join(SHOOTS_DIR, manifest.id, "manifest.json");
  await fs.writeFile(file, JSON.stringify(manifest, null, 2), "utf8");
}

export async function readManifest(shootId: string): Promise<ShootManifest | null> {
  if (useBlob) {
    try {
      const meta = await head(`shoots/${shootId}/manifest.json`);
      const res = await fetch(meta.url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as ShootManifest;
    } catch {
      return null;
    }
  }
  try {
    const file = path.join(SHOOTS_DIR, shootId, "manifest.json");
    const text = await fs.readFile(file, "utf8");
    return JSON.parse(text) as ShootManifest;
  } catch {
    return null;
  }
}

export async function saveImage(
  shootId: string,
  imageIdx: number,
  variantIdx: number | null,
  bytes: ArrayBuffer | Uint8Array
): Promise<string> {
  const buf = Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
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

import { NextRequest, NextResponse } from "next/server";
import { newShootId, createShoot, writeManifest, saveImage } from "@/lib/storage";
import { startSceneGeneration, toAbsoluteUrl } from "@/lib/shoot";
import { pollGeneration, downloadImage } from "@/lib/luma";
import type { AspectRatio, ShootImage, ShootManifest, ShootMode } from "@/lib/types";
import { getPack } from "@/lib/packs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface CreateShootBody {
  mode: ShootMode;
  packId?: string;
  surpriseTheme?: string;
  scenes?: string[];
  aspectRatio: AspectRatio;
  referenceUrl: string;
  referenceFileName: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateShootBody;
    if (!body.referenceUrl) {
      return NextResponse.json({ error: "Missing referenceUrl" }, { status: 400 });
    }

    let scenes: string[] = body.scenes ?? [];
    if (body.mode === "pack" && body.packId) {
      const pack = getPack(body.packId);
      if (!pack) return NextResponse.json({ error: "Unknown pack" }, { status: 400 });
      scenes = pack.scenes;
    }
    scenes = scenes.map((s) => s.trim()).filter(Boolean).slice(0, 12);
    if (scenes.length === 0) {
      return NextResponse.json({ error: "No scenes provided" }, { status: 400 });
    }

    const id = newShootId();
    const referenceAbsoluteUrl = toAbsoluteUrl(req, body.referenceUrl);

    const manifest: ShootManifest = {
      id,
      createdAt: new Date().toISOString(),
      mode: body.mode,
      packId: body.packId ?? null,
      surpriseTheme: body.surpriseTheme ?? null,
      aspectRatio: body.aspectRatio,
      referenceUrl: body.referenceUrl,
      referenceFileName: body.referenceFileName,
      images: scenes.map<ShootImage>((prompt, index) => ({
        index,
        prompt,
        generationId: null,
        state: "queued",
        url: null,
        cdnUrl: null,
        variants: [],
      })),
    };

    await createShoot(manifest);

    void runGenerations(manifest, referenceAbsoluteUrl);

    return NextResponse.json({ id, count: scenes.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create shoot";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function runGenerations(
  manifest: ShootManifest,
  referenceAbsoluteUrl: string
) {
  const concurrency = 6;
  const queue = [...manifest.images];
  const inFlight = new Set<Promise<void>>();

  async function processOne(image: ShootImage) {
    try {
      const gen = await startSceneGeneration({
        prompt: image.prompt,
        aspectRatio: manifest.aspectRatio,
        referenceUrl: referenceAbsoluteUrl,
      });
      image.generationId = gen.id;
      image.state = "dreaming";
      await writeManifest(manifest);

      const final = await pollGeneration(gen.id);
      if (final.state === "completed" && final.assets?.image) {
        const buf = await downloadImage(final.assets.image);
        const localUrl = await saveImage(manifest.id, image.index, null, buf);
        image.url = localUrl;
        image.cdnUrl = final.assets.image;
        image.state = "completed";
      } else {
        image.state = "failed";
        image.failureReason = final.failure_reason ?? "Generation failed";
      }
    } catch (err) {
      image.state = "failed";
      image.failureReason = err instanceof Error ? err.message : String(err);
    }
    await writeManifest(manifest);
  }

  while (queue.length > 0 || inFlight.size > 0) {
    while (queue.length > 0 && inFlight.size < concurrency) {
      const next = queue.shift()!;
      const p = processOne(next).finally(() => {
        inFlight.delete(p);
      });
      inFlight.add(p);
    }
    if (inFlight.size > 0) await Promise.race(inFlight);
  }
}

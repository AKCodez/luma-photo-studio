import { NextRequest, NextResponse } from "next/server";
import { readManifest, writeManifest, saveImage } from "@/lib/storage";
import { startSceneGeneration, toAbsoluteUrl } from "@/lib/shoot";
import { pollGeneration, downloadImage } from "@/lib/luma";
import type { ShootImageVariant } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface EditBody {
  shootId: string;
  imageIndex: number;
  prompt: string;
  variantParent?: number | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EditBody;
    const manifest = await readManifest(body.shootId);
    if (!manifest) {
      return NextResponse.json({ error: "Shoot not found" }, { status: 404 });
    }
    const image = manifest.images[body.imageIndex];
    if (!image || !image.url) {
      return NextResponse.json({ error: "Image not ready" }, { status: 400 });
    }

    const sourceUrl =
      typeof body.variantParent === "number"
        ? image.variants[body.variantParent]?.url ?? image.url
        : image.url;

    const sourceAbsolute = toAbsoluteUrl(req, sourceUrl);
    const referenceAbsolute = toAbsoluteUrl(req, manifest.referenceUrl);
    const editPrompt = body.prompt.trim();
    if (!editPrompt) {
      return NextResponse.json({ error: "Empty prompt" }, { status: 400 });
    }

    const gen = await startSceneGeneration({
      prompt: editPrompt,
      aspectRatio: manifest.aspectRatio,
      referenceUrl: referenceAbsolute,
      modifyImageUrl: sourceAbsolute,
      modifyWeight: 0.05,
    });

    const variantIndex = image.variants.length;
    const variant: ShootImageVariant = {
      index: variantIndex,
      prompt: editPrompt,
      generationId: gen.id,
      state: "dreaming",
      url: null,
      parentVariant: body.variantParent ?? null,
      createdAt: new Date().toISOString(),
    };
    image.variants.push(variant);
    await writeManifest(manifest);

    const final = await pollGeneration(gen.id);
    if (final.state === "completed" && final.assets?.image) {
      const buf = await downloadImage(final.assets.image);
      const localUrl = await saveImage(
        manifest.id,
        image.index,
        variantIndex,
        buf
      );
      variant.url = localUrl;
      variant.state = "completed";
    } else {
      variant.state = "failed";
    }
    await writeManifest(manifest);

    return NextResponse.json({ variant, manifest });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Edit failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

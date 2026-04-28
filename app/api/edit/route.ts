import { NextRequest, NextResponse } from "next/server";
import {
  readBase,
  readImageState,
  readManifest,
  writeImageState,
  saveImage,
} from "@/lib/storage";
import { startSceneGeneration } from "@/lib/shoot";
import { pollGeneration, downloadImage, LumaError } from "@/lib/luma";
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
  let body: EditBody;
  try {
    body = (await req.json()) as EditBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.shootId !== "string" || typeof body.imageIndex !== "number") {
    return NextResponse.json({ error: "Missing shootId or imageIndex" }, { status: 400 });
  }
  const editPrompt = (body.prompt ?? "").trim();
  if (!editPrompt) {
    return NextResponse.json({ error: "Empty prompt" }, { status: 400 });
  }

  const base = await readBase(body.shootId);
  if (!base) {
    return NextResponse.json({ error: "Shoot not found" }, { status: 404 });
  }
  const image = await readImageState(body.shootId, body.imageIndex);
  if (!image || image.state !== "completed" || !image.cdnUrl) {
    return NextResponse.json(
      { error: "Image not ready for editing yet" },
      { status: 400 }
    );
  }

  const sourceUrl =
    typeof body.variantParent === "number" && image.variants[body.variantParent]
      ? image.variants[body.variantParent].cdnUrl ??
        image.variants[body.variantParent].url
      : image.cdnUrl;

  if (!sourceUrl) {
    return NextResponse.json(
      { error: "Source image URL missing" },
      { status: 400 }
    );
  }

  const variantIndex = image.variants.length;
  const variant: ShootImageVariant = {
    index: variantIndex,
    prompt: editPrompt,
    generationId: null,
    state: "queued",
    url: null,
    cdnUrl: null,
    parentVariant: body.variantParent ?? null,
    createdAt: new Date().toISOString(),
  };

  try {
    const gen = await startSceneGeneration({
      prompt: editPrompt,
      aspectRatio: base.aspectRatio,
      referenceUrls: base.referenceUrls,
      sourceUrl,
    });
    variant.generationId = gen.id;
    variant.state = "processing";

    const fresh = (await readImageState(body.shootId, body.imageIndex)) ?? image;
    fresh.variants = [...(fresh.variants ?? []), variant];
    await writeImageState(body.shootId, fresh);

    const final = await pollGeneration(gen.id);
    const firstAsset = final.output?.[0]?.url;
    if (final.state === "completed" && firstAsset) {
      const buf = await downloadImage(firstAsset);
      const localUrl = await saveImage(
        body.shootId,
        body.imageIndex,
        variantIndex,
        buf
      );
      variant.url = localUrl;
      variant.cdnUrl = firstAsset;
      variant.state = "completed";
    } else {
      variant.state = "failed";
    }

    const fresh2 = (await readImageState(body.shootId, body.imageIndex)) ?? fresh;
    fresh2.variants = (fresh2.variants ?? []).map((v) =>
      v.index === variantIndex ? variant : v
    );
    await writeImageState(body.shootId, fresh2);

    const manifest = await readManifest(body.shootId);
    return NextResponse.json({ variant, image: fresh2, manifest });
  } catch (err) {
    const msg =
      err instanceof LumaError
        ? err.message
        : err instanceof Error
        ? err.message
        : "Edit failed";
    variant.state = "failed";
    try {
      const fresh = (await readImageState(body.shootId, body.imageIndex)) ?? image;
      fresh.variants = [...(fresh.variants ?? []).filter((v) => v.index !== variantIndex), variant];
      await writeImageState(body.shootId, fresh);
    } catch {
      // ignore
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  readBase,
  readImageState,
  writeImageState,
  saveImage,
} from "@/lib/storage";
import { startSceneGeneration } from "@/lib/shoot";
import { pollGeneration, downloadImage, LumaError } from "@/lib/luma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; index: string }> }
) {
  const { id, index: indexStr } = await ctx.params;
  const index = Number(indexStr);
  if (!Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "Bad index" }, { status: 400 });
  }

  const base = await readBase(id);
  if (!base) {
    return NextResponse.json({ error: "Shoot not found" }, { status: 404 });
  }
  const prompt = base.prompts[index];
  if (!prompt) {
    return NextResponse.json({ error: "No prompt at index" }, { status: 400 });
  }

  const existing = await readImageState(id, index);
  if (existing && existing.state === "completed" && existing.url) {
    return NextResponse.json({ image: existing, skipped: true });
  }

  try {
    const gen = await startSceneGeneration({
      prompt,
      aspectRatio: base.aspectRatio,
      referenceUrls: base.referenceUrls,
    });

    await writeImageState(id, {
      index,
      generationId: gen.id,
      state: "dreaming",
      url: null,
      cdnUrl: null,
      variants: [],
    });

    const final = await pollGeneration(gen.id);

    if (final.state === "completed" && final.assets?.image) {
      const buf = await downloadImage(final.assets.image);
      const localUrl = await saveImage(id, index, null, buf);
      const completed = {
        index,
        generationId: gen.id,
        state: "completed" as const,
        url: localUrl,
        cdnUrl: final.assets.image,
        variants: [],
      };
      await writeImageState(id, completed);
      return NextResponse.json({ image: completed });
    }

    const failed = {
      index,
      generationId: gen.id,
      state: "failed" as const,
      url: null,
      cdnUrl: null,
      failureReason: final.failure_reason ?? "Generation failed",
      variants: [],
    };
    await writeImageState(id, failed);
    return NextResponse.json({ image: failed });
  } catch (err) {
    const msg =
      err instanceof LumaError
        ? err.message
        : err instanceof Error
        ? err.message
        : "Generation error";
    const status = err instanceof LumaError ? err.status : 500;
    await writeImageState(id, {
      index,
      generationId: null,
      state: "failed",
      url: null,
      cdnUrl: null,
      failureReason: msg,
      variants: [],
    });
    return NextResponse.json({ error: msg }, { status });
  }
}

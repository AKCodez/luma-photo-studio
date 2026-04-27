import { NextRequest, NextResponse } from "next/server";
import { newShootId, writeBase, writeImageState, type ShootBase } from "@/lib/storage";
import type { AspectRatio, ShootMode } from "@/lib/types";
import { getPack } from "@/lib/packs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface CreateShootBody {
  mode: ShootMode;
  packId?: string;
  surpriseTheme?: string;
  scenes?: string[];
  aspectRatio: AspectRatio;
  referenceUrls: string[];
  referenceFileNames: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateShootBody;
    const refs = (body.referenceUrls ?? []).filter(Boolean).slice(0, 3);
    if (refs.length === 0) {
      return NextResponse.json(
        { error: "At least one reference image is required" },
        { status: 400 }
      );
    }

    let scenes: string[] = body.scenes ?? [];
    let packStyle: "photo" | "illustration" | undefined;
    if (body.mode === "pack" && body.packId) {
      const pack = getPack(body.packId);
      if (!pack) return NextResponse.json({ error: "Unknown pack" }, { status: 400 });
      scenes = pack.scenes;
      packStyle = pack.style;
    }
    scenes = scenes.map((s) => s.trim()).filter(Boolean).slice(0, 12);
    if (scenes.length === 0) {
      return NextResponse.json({ error: "No scenes provided" }, { status: 400 });
    }

    const id = newShootId();
    const base: ShootBase = {
      id,
      createdAt: new Date().toISOString(),
      mode: body.mode,
      packId: body.packId ?? null,
      surpriseTheme: body.surpriseTheme ?? null,
      aspectRatio: body.aspectRatio,
      referenceUrls: refs,
      referenceFileNames: (body.referenceFileNames ?? []).slice(0, refs.length),
      prompts: scenes,
      style: packStyle,
    };

    await writeBase(base);
    await Promise.all(
      scenes.map((_, i) =>
        writeImageState(id, {
          index: i,
          generationId: null,
          state: "queued",
          url: null,
          cdnUrl: null,
          variants: [],
        })
      )
    );

    return NextResponse.json({ id, count: scenes.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create shoot";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

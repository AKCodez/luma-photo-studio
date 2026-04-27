import { NextRequest, NextResponse } from "next/server";
import { readManifest } from "@/lib/storage";

export const fetchCache = "force-no-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const manifest = await readManifest(id);
  if (!manifest) {
    return NextResponse.json({ error: "Shoot not found" }, { status: 404 });
  }
  return NextResponse.json(manifest);
}

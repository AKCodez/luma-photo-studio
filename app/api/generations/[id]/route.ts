import { NextRequest, NextResponse } from "next/server";
import { getGeneration } from "@/lib/luma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  try {
    const gen = await getGeneration(id);
    return NextResponse.json(gen);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch generation";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { saveUpload } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large (>10MB)" }, { status: 400 });
    }
    const ext = file.name.split(".").pop() ?? file.type.split("/")[1] ?? "jpg";
    const bytes = await file.arrayBuffer();
    const saved = await saveUpload(bytes, ext, file.type);
    return NextResponse.json({
      refId: saved.refId,
      publicPath: saved.publicPath,
      fileName: file.name,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

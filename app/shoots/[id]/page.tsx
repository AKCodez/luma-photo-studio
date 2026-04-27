import { notFound } from "next/navigation";
import { readManifest } from "@/lib/storage";
import { Stage } from "@/components/studio/Stage";

export const dynamic = "force-dynamic";

export default async function ShootPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const manifest = await readManifest(id);
  if (!manifest) notFound();
  return <Stage initialManifest={manifest} />;
}

import Link from "next/link";
import { ArrowRight, ArrowLeft, ImageOff } from "lucide-react";
import { listShoots } from "@/lib/storage";
import { Header } from "@/components/studio/Header";
import { getPack } from "@/lib/packs";
import type { AspectRatio } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ASPECT_CLASS: Record<AspectRatio, string> = {
  "9:16": "aspect-[9/16]",
  "2:3": "aspect-[2/3]",
  "1:1": "aspect-square",
  "3:2": "aspect-[3/2]",
  "16:9": "aspect-[16/9]",
  "1:2": "aspect-[1/2]",
  "1:3": "aspect-[1/3]",
  "2:1": "aspect-[2/1]",
  "3:1": "aspect-[3/1]",
};

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function shootLabel(entry: {
  mode: string;
  packId: string | null;
  surpriseTheme: string | null;
}): string {
  if (entry.mode === "pack" && entry.packId) {
    return getPack(entry.packId)?.name ?? entry.packId;
  }
  if (entry.mode === "surprise") {
    return entry.surpriseTheme ? `“${entry.surpriseTheme}”` : "Surprise";
  }
  return "Custom";
}

export default async function HistoryPage() {
  const shoots = await listShoots();

  return (
    <div className="relative min-h-screen pb-24">
      <Header />
      <div className="mx-auto w-full max-w-7xl px-5 md:px-10 py-10 md:py-14">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="cap text-ember">History</span>
            <h1 className="font-display text-5xl md:text-6xl tracking-tightest text-paper">
              Past shoots
            </h1>
            <p className="text-sm text-paper-mute max-w-md">
              Every shoot you've kicked off, sorted by newest. Click any tile to
              jump back into it and edit.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-ink-800/60 px-4 py-2 text-[12px] text-paper-mute transition hover:text-paper hover:border-paper/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> new shoot
          </Link>
        </div>

        {shoots.length === 0 ? (
          <div className="grid place-items-center rounded-3xl border border-dashed border-[var(--line-strong)] bg-ink-800/30 px-6 py-24 text-center">
            <div className="space-y-3">
              <ImageOff className="mx-auto h-6 w-6 text-paper-mute" />
              <p className="font-display text-2xl text-paper tracking-tightest">
                No shoots yet.
              </p>
              <p className="text-[13px] text-paper-mute max-w-xs mx-auto">
                Drop a face and pick a pack — your past shoots will pile up here.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-ember px-5 py-2.5 text-sm font-medium text-ink-900 transition hover:bg-ember-light"
              >
                Start a shoot <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:gap-4">
            {shoots.map((s) => (
              <Link
                key={s.id}
                href={`/shoots/${s.id}`}
                className="group relative overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-ink-800 transition hover:border-ember/40"
              >
                <div className={`relative ${ASPECT_CLASS[s.aspectRatio]}`}>
                  {s.thumbUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={s.thumbUrl}
                      alt={shootLabel(s)}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <ImageOff className="h-5 w-5 text-paper-mute" />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/95 via-ink-900/40 to-transparent p-3">
                    <div className="flex items-end justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="cap !text-[9px] text-ember">
                          {s.mode === "pack"
                            ? "Pack"
                            : s.mode === "surprise"
                            ? "Surprise"
                            : "Custom"}
                        </p>
                        <p className="font-display text-[15px] tracking-tightest text-paper line-clamp-1">
                          {shootLabel(s)}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-paper-mute shrink-0">
                        {s.completedCount}/{s.totalCount}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--line)] px-3 py-2">
                  <span className="font-mono text-[10px] text-paper-mute">
                    {formatRelative(s.createdAt)}
                  </span>
                  <ArrowRight className="h-3 w-3 text-paper-mute transition group-hover:translate-x-0.5 group-hover:text-paper" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

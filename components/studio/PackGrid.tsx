"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PACKS } from "@/lib/packs";
import type { Pack } from "@/lib/types";

interface Props {
  onChoose: (pack: Pack) => void;
}

export function PackGrid({ onChoose }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [openPack, setOpenPack] = useState<Pack | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {PACKS.map((pack, i) => (
          <motion.div
            key={pack.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: i * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
            onMouseEnter={() => setHovered(pack.id)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-ink-800/60 p-5 transition-all",
              "hover:border-ember/40 hover:bg-ink-700/60"
            )}
            onClick={() => setOpenPack(pack)}
          >
            <div
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{
                background: `linear-gradient(90deg, transparent, ${pack.accentColor}, transparent)`,
                opacity: hovered === pack.id ? 1 : 0.35,
              }}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <h4 className="font-display text-xl text-paper tracking-tightest">
                  {pack.name}
                </h4>
                <p className="cap !text-[9px] text-paper-mute">
                  {pack.tagline}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-paper-mute transition-transform group-hover:translate-x-0.5" />
            </div>

            <p className="mt-3 text-[12px] leading-relaxed text-paper-mute line-clamp-2">
              {pack.description}
            </p>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] text-paper-mute font-mono">
                4 scenes
              </span>
              <span className="text-[11px] text-paper-mute opacity-0 transition group-hover:opacity-100">
                Preview
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog
        open={!!openPack}
        onOpenChange={(o) => {
          if (!o) setOpenPack(null);
        }}
      >
        {openPack && (
          <DialogContent className="!p-0 !max-w-[min(96vw,900px)]">
            <DialogTitle className="sr-only">{openPack.name} pack</DialogTitle>
            <DialogDescription className="sr-only">
              {openPack.description}
            </DialogDescription>

            <div
              className="relative h-1 w-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${openPack.accentColor}, transparent)`,
              }}
            />

            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-6 py-4 md:px-8">
              <button
                onClick={() => setOpenPack(null)}
                className="flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-ink-700/60 px-3 py-1.5 text-[11px] text-paper-mute transition hover:text-paper hover:border-paper/30"
              >
                <ArrowLeft className="h-3 w-3" /> back to packs
              </button>
              <span className="cap !text-[9px]">4 scenes · preview</span>
            </div>

            <div className="max-h-[78vh] overflow-y-auto p-6 md:p-8 scrollbar-pretty">
              <div className="mb-6 space-y-2">
                <p
                  className="cap"
                  style={{ color: openPack.accentColor }}
                >
                  {openPack.tagline}
                </p>
                <h3 className="font-display text-4xl md:text-5xl text-paper tracking-tightest">
                  {openPack.name}
                </h3>
                <p className="max-w-xl pt-1 text-sm text-paper-dim leading-relaxed">
                  {openPack.description}
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {openPack.scenes.map((s, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[var(--line)] bg-ink-900/40 p-3 text-[12px] leading-relaxed text-paper-dim"
                  >
                    <span className="font-mono text-paper-mute">
                      {String(idx + 1).padStart(2, "0")}
                    </span>{" "}
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-[var(--line)] bg-ink-800/95 px-6 py-4 backdrop-blur md:px-8">
              <span className="text-[12px] text-paper-mute hidden md:block">
                Hit run to fan out 4 generations in parallel.
              </span>
              <button
                onClick={() => {
                  const pack = openPack;
                  setOpenPack(null);
                  onChoose(pack);
                }}
                className="flex shrink-0 items-center gap-2 rounded-full bg-ember px-6 py-3 text-sm font-medium text-ink-900 transition hover:bg-ember-light"
              >
                Run this pack <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

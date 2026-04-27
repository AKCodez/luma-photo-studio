"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PACKS } from "@/lib/packs";
import type { Pack } from "@/lib/types";

interface Props {
  onChoose: (pack: Pack) => void;
}

export function PackGrid({ onChoose }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
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
            onClick={() => setOpenId(openId === pack.id ? null : pack.id)}
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
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-paper-mute transition-transform",
                  openId === pack.id && "rotate-90"
                )}
              />
            </div>

            <p className="mt-3 text-[12px] leading-relaxed text-paper-mute line-clamp-2">
              {pack.description}
            </p>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] text-paper-mute font-mono">
                12 scenes
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChoose(pack);
                }}
                className="flex items-center gap-1 text-[11px] text-paper opacity-0 transition group-hover:opacity-100"
              >
                Use pack <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {openId && (
          <motion.div
            key={openId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-3xl border border-[var(--line-strong)] bg-ink-800/40"
          >
            <PackPeek
              pack={PACKS.find((p) => p.id === openId)!}
              onChoose={onChoose}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PackPeek({
  pack,
  onChoose,
}: {
  pack: Pack;
  onChoose: (p: Pack) => void;
}) {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <p className="cap text-ember">{pack.tagline}</p>
          <h3 className="font-display text-4xl text-paper tracking-tightest mt-2">
            {pack.name}
          </h3>
          <p className="mt-2 max-w-md text-sm text-paper-dim">
            {pack.description}
          </p>
        </div>
        <button
          onClick={() => onChoose(pack)}
          className="flex shrink-0 items-center gap-2 rounded-full bg-ember px-6 py-3 text-sm font-medium text-ink-900 transition hover:bg-ember-light"
        >
          Run this pack <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {pack.scenes.map((s, idx) => (
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
  );
}

"use client";

import { motion } from "framer-motion";
import { Sparkles, Wand2, Pencil, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShootMode } from "@/lib/types";

interface Props {
  onSelect: (mode: ShootMode) => void;
}

const MODES: {
  id: ShootMode;
  title: string;
  tagline: string;
  blurb: string;
  Icon: React.ComponentType<{ className?: string }>;
  number: string;
}[] = [
  {
    id: "pack",
    title: "Packs",
    tagline: "Curated bundles",
    blurb: "Eleven aesthetics. Each pack auto-fills twelve scenes — Cinematic, Editorial, Dating Profile, more. Start with one click.",
    Icon: Sparkles,
    number: "01",
  },
  {
    id: "surprise",
    title: "Surprise me",
    tagline: "One word. Twelve scenes.",
    blurb: "Type a vibe — \"hacker,\" \"tokyo at 3am,\" \"art forger.\" Claude composes twelve distinct shots, all on theme, none alike.",
    Icon: Wand2,
    number: "02",
  },
  {
    id: "custom",
    title: "Custom",
    tagline: "Your own scenes",
    blurb: "Write up to twelve scene prompts yourself. Total control. Empty rows are skipped.",
    Icon: Pencil,
    number: "03",
  },
];

export function ModePicker({ onSelect }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {MODES.map((m, i) => (
        <motion.button
          key={m.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: i * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          whileHover={{ y: -4 }}
          onClick={() => onSelect(m.id)}
          className={cn(
            "group relative flex flex-col gap-6 rounded-3xl border border-[var(--line-strong)] bg-ink-800/60 p-7 text-left transition-all",
            "hover:border-ember/40 hover:bg-ink-700/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/40"
          )}
        >
          <div className="flex items-start justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ember/10 ring-1 ring-ember/25 transition group-hover:bg-ember/20">
              <m.Icon className="h-5 w-5 text-ember" />
            </span>
            <span className="cap text-paper-mute/60">{m.number}</span>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-3xl tracking-tightest text-paper">
              {m.title}
            </h3>
            <p className="cap !text-[10px] text-ember/80">{m.tagline}</p>
          </div>

          <p className="text-[14px] leading-relaxed text-paper-dim">{m.blurb}</p>

          <div className="mt-auto flex items-center gap-2 text-paper transition group-hover:gap-3">
            <span className="text-sm">Begin</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </div>
        </motion.button>
      ))}
    </div>
  );
}

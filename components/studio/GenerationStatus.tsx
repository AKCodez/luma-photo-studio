"use client";

import { motion } from "framer-motion";
import type { ShootImage } from "@/lib/types";

interface Props {
  images: ShootImage[];
}

export function GenerationStatus({ images }: Props) {
  const total = images.length;
  const done = images.filter((i) => i.state === "completed").length;
  const failed = images.filter((i) => i.state === "failed").length;
  const pct = total > 0 ? (done + failed) / total : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center gap-3 rounded-full border border-[var(--line-strong)] bg-ink-800/60 px-4 py-2 backdrop-blur-md"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 rounded-full bg-ember animate-ping opacity-50" />
        <span className="relative h-2 w-2 rounded-full bg-ember" />
      </span>
      <span className="font-mono text-[11px] text-paper-mute">
        <span className="text-paper">{done}</span>
        <span className="opacity-50"> / </span>
        <span>{total}</span>
        {failed > 0 && (
          <span className="ml-2 text-red-400/80">{failed} failed</span>
        )}
      </span>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-ink-700">
        <motion.div
          className="h-full bg-ember"
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
}

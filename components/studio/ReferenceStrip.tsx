"use client";

import { motion } from "framer-motion";
import { Pencil } from "lucide-react";

interface Props {
  references: { publicPath: string; fileName: string }[];
  onChange?: () => void;
}

export function ReferenceStrip({ references, onChange }: Props) {
  if (references.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3 rounded-full border border-[var(--line-strong)] bg-ink-800/60 px-2 py-1.5 backdrop-blur-md"
    >
      <span className="cap pl-2 !text-[9px]">Reference</span>
      <div className="flex items-center -space-x-2">
        {references.map((r) => (
          <div
            key={r.publicPath}
            className="h-8 w-8 overflow-hidden rounded-full border-2 border-ink-800 ring-1 ring-[var(--line-strong)]"
            title={r.fileName}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.publicPath}
              alt={r.fileName}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
      <span className="font-mono text-[10px] text-paper-mute pr-1">
        {references.length} of 3
      </span>
      {onChange && (
        <button
          onClick={onChange}
          className="ml-1 mr-1 inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2 py-1 text-[10px] text-paper-mute transition hover:text-paper hover:border-paper/30"
        >
          <Pencil className="h-2.5 w-2.5" /> change
        </button>
      )}
    </motion.div>
  );
}

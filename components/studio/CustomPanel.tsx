"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, ClipboardPaste } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
  onSubmit: (scenes: string[]) => void;
}

const ROW_COUNT = 12;

export function CustomPanel({ onSubmit }: Props) {
  const [rows, setRows] = useState<string[]>(() => Array(ROW_COUNT).fill(""));

  const filledCount = rows.filter((r) => r.trim()).length;

  function update(i: number, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, ROW_COUNT);
      const next = Array(ROW_COUNT).fill("");
      lines.forEach((l, i) => (next[i] = l));
      setRows(next);
    } catch {
      // ignore clipboard rejection
    }
  }

  function clearAll() {
    setRows(Array(ROW_COUNT).fill(""));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="cap inline-flex items-center gap-2 text-ember">
            <Pencil className="h-3 w-3" /> Custom scenes
          </span>
          <h2 className="font-display text-3xl md:text-4xl tracking-tightest text-paper">
            Your scenes, your shoot.
          </h2>
          <p className="text-sm text-paper-mute">
            Up to 12 prompts. Empty rows are skipped. Each ≤ ~280 chars works best.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={pasteFromClipboard}
            className="flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] bg-ink-800/60 px-3 py-1.5 text-[11px] text-paper-mute transition hover:text-paper"
          >
            <ClipboardPaste className="h-3 w-3" /> Paste
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] bg-ink-800/60 px-3 py-1.5 text-[11px] text-paper-mute transition hover:text-paper"
          >
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              delay: i * 0.025,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-ink-800/40 p-3 transition focus-within:border-ember/40"
          >
            <span className="mt-2 w-6 shrink-0 text-center font-mono text-[11px] text-paper-mute">
              {String(i + 1).padStart(2, "0")}
            </span>
            <Textarea
              rows={2}
              value={row}
              onChange={(e) => update(i, e.target.value)}
              placeholder={i === 0 ? "Subject in a sunlit kitchen, laughing mid-stir, 35mm…" : ""}
              className="min-h-[44px] !rounded-xl !border-0 !bg-transparent !p-1 focus:!ring-0"
            />
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-[11px] text-paper-mute">
          <span className="text-paper">{filledCount}</span> of {ROW_COUNT} scenes filled
        </p>
        <Button
          variant="ember"
          size="lg"
          disabled={filledCount === 0}
          onClick={() => onSubmit(rows.map((r) => r.trim()).filter(Boolean))}
        >
          Run shoot
        </Button>
      </div>
    </div>
  );
}

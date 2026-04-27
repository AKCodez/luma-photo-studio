"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wand2, Sparkles, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const HINTS = [
  "hacker",
  "tokyo at 3am",
  "art forger",
  "cowboy on mars",
  "secret garden",
  "underwater symphony",
  "1970s diplomat",
  "midnight librarian",
  "cyberpunk monk",
  "vintage rockstar",
];

interface Props {
  onScenes: (theme: string, scenes: string[]) => void;
}

export function SurprisePanel({ onScenes }: Props) {
  const [theme, setTheme] = useState("");
  const [busy, setBusy] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHintIdx((i) => (i + 1) % HINTS.length), 2200);
    return () => clearInterval(t);
  }, []);

  async function generate() {
    const t = theme.trim();
    if (!t) {
      toast.error("Type a vibe first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/surprise", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme: t }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to invent scenes");
      }
      const data = (await res.json()) as { scenes: string[] };
      onScenes(t, data.scenes);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Surprise failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7 text-center">
      <div className="space-y-3">
        <span className="cap inline-flex items-center gap-2 text-ember">
          <Sparkles className="h-3 w-3" /> Surprise me
        </span>
        <h2 className="font-display text-4xl md:text-5xl tracking-tightest text-paper">
          One word. Twelve scenes.
        </h2>
        <p className="text-sm text-paper-mute">
          Type a vibe. Claude will compose twelve distinct shots — each with its own
          lighting, framing, and environment, all unified by your theme.
        </p>
      </div>

      <div className="relative mx-auto flex w-full max-w-xl items-center gap-2">
        <div className="relative flex-1">
          <Input
            autoFocus
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder=""
            className="h-14 rounded-full pl-12 pr-5 text-base"
            maxLength={80}
          />
          <Wand2 className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-ember" />
          {!theme && (
            <motion.div
              key={hintIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 0.6, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.4 }}
              className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 text-base text-paper-mute"
            >
              {HINTS[hintIdx]}
            </motion.div>
          )}
        </div>
        <Button
          variant="ember"
          size="xl"
          onClick={generate}
          disabled={busy || !theme.trim()}
          className="!h-14 !px-7"
        >
          {busy ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Composing
            </>
          ) : (
            <>Invent 12</>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
        {HINTS.slice(0, 6).map((h) => (
          <button
            key={h}
            onClick={() => setTheme(h)}
            className="rounded-full border border-[var(--line)] bg-ink-800/40 px-3 py-1.5 text-[11px] text-paper-mute transition hover:text-paper hover:border-paper/30"
          >
            {h}
          </button>
        ))}
      </div>
    </div>
  );
}

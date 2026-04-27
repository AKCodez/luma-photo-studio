"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil, RefreshCw, Download, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ShootImage, ShootImageVariant, AspectRatio } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  shootId: string;
  image: ShootImage | null;
  aspectRatio: AspectRatio;
  onUpdate: (image: ShootImage) => void;
}

const ASPECT_CLASS: Record<AspectRatio, string> = {
  "9:16": "aspect-[9/16]",
  "3:4": "aspect-[3/4]",
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "16:9": "aspect-[16/9]",
};

const QUICK_EDITS = [
  "make it black and white",
  "warmer light",
  "remove the background distractions",
  "change the wardrobe to all black",
  "add light snowfall",
  "softer expression",
];

export function EditModal({
  open,
  onClose,
  shootId,
  image,
  aspectRatio,
  onUpdate,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeVariant, setActiveVariant] = useState<number | null>(null);

  if (!image) return null;

  const visible = (() => {
    if (activeVariant === null) {
      return { url: image.url, label: "Original" };
    }
    const v = image.variants[activeVariant];
    return { url: v?.url, label: `Edit ${activeVariant + 1}` };
  })();

  async function submit() {
    if (!image) return;
    const text = prompt.trim();
    if (!text) {
      toast.error("Tell me what to change.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shootId,
          imageIndex: image.index,
          prompt: text,
          variantParent: activeVariant,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Edit failed");
      }
      const data = (await res.json()) as {
        variant: ShootImageVariant;
        manifest: { images: ShootImage[] };
      };
      const updated = data.manifest.images.find((i) => i.index === image.index);
      if (updated) onUpdate(updated);
      setPrompt("");
      setActiveVariant(updated ? updated.variants.length - 1 : null);
      toast.success("Edit ready.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Edit failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setActiveVariant(null);
          setPrompt("");
        }
      }}
    >
      <DialogContent className="!p-0">
        <DialogTitle className="sr-only">Edit image {image.index + 1}</DialogTitle>
        <DialogDescription className="sr-only">{image.prompt}</DialogDescription>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr]">
          <div className="relative bg-ink-900 p-5 lg:p-7">
            <div
              className={cn(
                "relative mx-auto overflow-hidden rounded-2xl bg-ink-800",
                ASPECT_CLASS[aspectRatio],
                "max-h-[72vh]"
              )}
              style={{ width: "100%" }}
            >
              <AnimatePresence mode="wait">
                {visible.url ? (
                  <motion.img
                    key={visible.url}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    src={visible.url}
                    alt={image.prompt}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 shimmer" />
                )}
              </AnimatePresence>
              <span className="absolute left-3 top-3 rounded-full bg-ink-900/70 px-2.5 py-1 font-mono text-[10px] text-paper-mute backdrop-blur-md">
                {visible.label}
              </span>
              {visible.url && (
                <a
                  href={visible.url}
                  download={`luma-${shootId}-${image.index}-${visible.label}.jpg`}
                  className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-ink-900/70 text-paper-dim backdrop-blur-md transition hover:text-paper"
                  aria-label="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            {(image.variants.length > 0 || image.url) && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-pretty">
                <Thumb
                  url={image.url}
                  active={activeVariant === null}
                  onClick={() => setActiveVariant(null)}
                  label="orig"
                />
                {image.variants.map((v, i) => (
                  <Thumb
                    key={i}
                    url={v.url}
                    state={v.state}
                    active={activeVariant === i}
                    onClick={() => setActiveVariant(i)}
                    label={`v${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5 border-t border-[var(--line)] bg-ink-800/40 p-6 lg:border-l lg:border-t-0 lg:p-7">
            <div className="space-y-1.5">
              <span className="cap inline-flex items-center gap-2 text-ember">
                <Pencil className="h-3 w-3" /> Edit
              </span>
              <h3 className="font-display text-2xl tracking-tightest text-paper">
                What do you want to change?
              </h3>
              <p className="text-[12px] text-paper-mute leading-relaxed">
                Plain English. The rest of the image stays put — only what you ask
                will move.
              </p>
            </div>

            <div className="space-y-2">
              <Textarea
                rows={4}
                placeholder="Make the jacket cherry red. Add light snow in the background."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
                className="text-sm"
              />
              <div className="flex items-center justify-between text-[10px] text-paper-mute">
                <span>⌘ + Enter to submit</span>
                <span>{prompt.length} chars</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="cap !text-[9px]">Quick ideas</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EDITS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setPrompt(q)}
                    className="rounded-full border border-[var(--line)] bg-ink-800/40 px-2.5 py-1 text-[10px] text-paper-mute transition hover:text-paper hover:border-paper/30"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-3 border-t border-[var(--line)] pt-4">
              <Button
                variant="ember"
                size="lg"
                disabled={busy || !prompt.trim()}
                onClick={submit}
                className="w-full"
              >
                {busy ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Editing
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate edit
                  </>
                )}
              </Button>
              <p className="text-[11px] text-paper-mute leading-relaxed">
                <span className="text-paper-dim">Source prompt: </span>
                {image.prompt}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Thumb({
  url,
  active,
  onClick,
  label,
  state,
}: {
  url: string | null | undefined;
  active: boolean;
  onClick: () => void;
  label: string;
  state?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition",
        active
          ? "border-ember"
          : "border-transparent hover:border-paper-mute/40"
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div className={cn("h-full w-full", state === "failed" ? "bg-red-900/30" : "shimmer")} />
      )}
      <span className="absolute inset-x-0 bottom-0 bg-ink-900/80 px-1 py-0.5 text-center font-mono text-[9px] text-paper-mute">
        {label}
      </span>
    </button>
  );
}

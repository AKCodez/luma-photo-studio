"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Download, RefreshCw, AlertCircle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AspectRatio, ShootImage } from "@/lib/types";

interface Props {
  image: ShootImage;
  aspectRatio: AspectRatio;
  index: number;
  onClick: (image: ShootImage) => void;
  onRetry?: (image: ShootImage) => void;
  retrying?: boolean;
}

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

export function ShootCard({
  image,
  aspectRatio,
  index,
  onClick,
  onRetry,
  retrying,
}: Props) {
  const [hover, setHover] = useState(false);
  const isReady = image.state === "completed" && image.url;
  const isFailed = image.state === "failed";

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.04 * (index % 12),
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => isReady && onClick(image)}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-ink-800",
        ASPECT_CLASS[aspectRatio],
        isReady ? "cursor-zoom-in" : "cursor-default"
      )}
    >
      {!isReady && !isFailed && (
        <div className="absolute inset-0 shimmer" />
      )}
      {isFailed && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          <div className="space-y-3">
            <AlertCircle className="mx-auto h-5 w-5 text-red-400/80" />
            <p className="text-[11px] text-paper-mute leading-relaxed">
              {image.failureReason ?? "Generation failed"}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!retrying) onRetry(image);
                }}
                disabled={retrying}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] bg-ink-700/60 px-3 py-1.5 text-[11px] text-paper transition hover:border-paper/40 hover:bg-ink-600 disabled:opacity-50"
              >
                {retrying ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" /> retrying
                  </>
                ) : (
                  <>
                    <RotateCw className="h-3 w-3" /> retry
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
      {isReady && (
        <motion.img
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          src={image.url!}
          alt={image.prompt}
          className="h-full w-full object-cover"
        />
      )}

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink-900/70 px-2 py-1 font-mono text-[10px] text-paper-mute backdrop-blur-md">
        {String(index + 1).padStart(2, "0")}
      </span>

      {image.variants.length > 0 && (
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-ember/90 px-2 py-1 font-mono text-[10px] text-ink-900">
          +{image.variants.length}
        </span>
      )}

      {isReady && (
        <>
          <span
            className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-paper/90 px-2.5 py-1 text-[10px] font-medium text-ink-900 shadow-sm md:opacity-0 md:transition md:group-hover:opacity-100"
          >
            <Pencil className="h-2.5 w-2.5" /> Edit
          </span>
          <motion.div
            animate={{ opacity: hover ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute inset-x-0 bottom-0 hidden md:flex flex-col gap-2 bg-gradient-to-t from-ink-900/90 via-ink-900/50 to-transparent p-3 pt-10"
          >
            <p className="line-clamp-2 text-left text-[11px] text-paper-dim leading-relaxed">
              {image.prompt}
            </p>
          </motion.div>
        </>
      )}

      {!isReady && !isFailed && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
          <p className="line-clamp-2 text-left text-[11px] text-paper-mute leading-relaxed">
            {image.prompt}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-paper-mute font-mono">
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
            generating
          </p>
        </div>
      )}
    </motion.button>
  );
}

export function downloadImage(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

export { Download };

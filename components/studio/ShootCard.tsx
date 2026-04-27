"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Download, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AspectRatio, ShootImage } from "@/lib/types";

interface Props {
  image: ShootImage;
  aspectRatio: AspectRatio;
  index: number;
  onClick: (image: ShootImage) => void;
}

const ASPECT_CLASS: Record<AspectRatio, string> = {
  "9:16": "aspect-[9/16]",
  "3:4": "aspect-[3/4]",
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
  "16:9": "aspect-[16/9]",
};

export function ShootCard({ image, aspectRatio, index, onClick }: Props) {
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
          <div className="space-y-2">
            <AlertCircle className="mx-auto h-5 w-5 text-red-400/80" />
            <p className="text-[11px] text-paper-mute">
              {image.failureReason ?? "Generation failed"}
            </p>
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
        <motion.div
          animate={{ opacity: hover ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-ink-900/90 via-ink-900/50 to-transparent p-3 pt-10"
        >
          <p className="line-clamp-2 text-left text-[11px] text-paper-dim leading-relaxed">
            {image.prompt}
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-paper/90 px-3 py-1.5 text-[11px] font-medium text-ink-900">
              <Pencil className="h-3 w-3" /> Edit
            </span>
          </div>
        </motion.div>
      )}

      {!isReady && !isFailed && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
          <p className="line-clamp-2 text-left text-[11px] text-paper-mute leading-relaxed">
            {image.prompt}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-paper-mute font-mono">
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
            dreaming
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

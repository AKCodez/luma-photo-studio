"use client";

import { ASPECT_RATIOS, type AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value: AspectRatio;
  onChange: (v: AspectRatio) => void;
}

const HINTS: Record<AspectRatio, string> = {
  "9:16": "Phone",
  "3:4": "Editorial",
  "1:1": "Square",
  "4:3": "Classic",
  "16:9": "Cinema",
};

const SHAPES: Record<AspectRatio, string> = {
  "9:16": "h-5 w-[11px]",
  "3:4": "h-5 w-[15px]",
  "1:1": "h-4 w-4",
  "4:3": "h-3.5 w-[19px]",
  "16:9": "h-3 w-[22px]",
};

export function AspectControl({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--line-strong)] bg-ink-800/60 p-1">
      {ASPECT_RATIOS.map((ratio) => {
        const active = ratio === value;
        return (
          <button
            key={ratio}
            onClick={() => onChange(ratio)}
            className={cn(
              "group relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs transition-all",
              active
                ? "bg-paper text-ink-900"
                : "text-paper-mute hover:text-paper"
            )}
          >
            <span
              className={cn(
                "block rounded-[2px] transition-colors",
                SHAPES[ratio],
                active ? "bg-ink-900" : "bg-paper-mute group-hover:bg-paper"
              )}
            />
            <span className="font-mono text-[11px]">{ratio}</span>
            <span className="hidden md:inline cap !text-[9px] !tracking-cap !normal-case">
              · {HINTS[ratio]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

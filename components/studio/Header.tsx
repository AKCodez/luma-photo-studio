"use client";

import Link from "next/link";
import { Aperture } from "lucide-react";

export function Header({ onReset }: { onReset?: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 md:px-10 backdrop-blur-md bg-ink-900/60 border-b border-[var(--line)]">
      <Link
        href="/"
        onClick={(e) => {
          if (onReset) {
            e.preventDefault();
            onReset();
          }
        }}
        className="group flex items-center gap-2.5"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ember/15 ring-1 ring-ember/30 transition group-hover:bg-ember/25">
          <Aperture className="h-3.5 w-3.5 text-ember" />
        </span>
        <span className="font-display text-[19px] tracking-tightest text-paper">
          Luma Studio
        </span>
      </Link>
      <span className="cap hidden md:block">Photoshoot · Uni-1</span>
    </header>
  );
}

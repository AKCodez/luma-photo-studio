"use client";

import { ShootCard } from "./ShootCard";
import type { AspectRatio, ShootImage } from "@/lib/types";

interface Props {
  images: ShootImage[];
  aspectRatio: AspectRatio;
  onSelect: (image: ShootImage) => void;
  onRetry?: (image: ShootImage) => void;
  retryingIndices?: Set<number>;
}

export function ShootGrid({
  images,
  aspectRatio,
  onSelect,
  onRetry,
  retryingIndices,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:gap-5">
      {images.map((img) => (
        <ShootCard
          key={img.index}
          image={img}
          aspectRatio={aspectRatio}
          index={img.index}
          onClick={onSelect}
          onRetry={onRetry}
          retrying={retryingIndices?.has(img.index)}
        />
      ))}
    </div>
  );
}

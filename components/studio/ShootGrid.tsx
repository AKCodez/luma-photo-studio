"use client";

import { ShootCard } from "./ShootCard";
import type { AspectRatio, ShootImage } from "@/lib/types";

interface Props {
  images: ShootImage[];
  aspectRatio: AspectRatio;
  onSelect: (image: ShootImage) => void;
}

export function ShootGrid({ images, aspectRatio, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:gap-4">
      {images.map((img) => (
        <ShootCard
          key={img.index}
          image={img}
          aspectRatio={aspectRatio}
          index={img.index}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}

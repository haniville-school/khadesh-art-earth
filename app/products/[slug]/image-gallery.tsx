"use client";

import { useState } from "react";
import Image from "next/image";

export default function ImageGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
    return <div className="aspect-square rounded-sm bg-[var(--color-line)]" />;
  }

  return (
    <div>
      <div className="aspect-square rounded-sm overflow-hidden relative bg-[var(--color-line)] mb-3">
        <Image src={images[active]} alt={title} fill className="object-cover" />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => setActive(i)}
              className={`w-16 h-16 rounded-sm overflow-hidden relative border-2 transition-colors ${
                i === active ? "border-[var(--color-moss)]" : "border-transparent"
              }`}
            >
              <Image src={img} alt={`${title} photo ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
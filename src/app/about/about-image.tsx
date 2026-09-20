"use client";

import Image, { type StaticImageData } from "next/image";
import { useT } from "@/components/language-provider";

/**
 * Figure on the About page. The alt text comes from the dictionary (alt is a
 * plain string attribute, so it can't use <T>), and next/image serves a
 * resized, modern-format version of the source PNG.
 */
export function AboutImage({
  src,
  altKey,
  className = "h-auto w-full",
  priority = false,
  sizes = "(max-width: 896px) 100vw, 896px",
}: {
  src: StaticImageData;
  /** Dictionary key for the alt text; "" marks the image as decorative. */
  altKey: string;
  className?: string;
  priority?: boolean;
  /** Rendered width hint, so the browser fetches a right-sized variant. */
  sizes?: string;
}) {
  const t = useT();
  return (
    <Image
      src={src}
      alt={altKey ? t(altKey) : ""}
      sizes={sizes}
      placeholder="blur"
      priority={priority}
      className={className}
    />
  );
}

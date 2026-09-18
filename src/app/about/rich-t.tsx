"use client";

import { Fragment, type ReactNode } from "react";
import { useT } from "@/components/language-provider";

/**
 * Translated sentence with inline elements: `{name}` placeholders in the
 * dictionary string are replaced by the matching node in `parts`, so each
 * language can order the sentence naturally while markup stays out of the
 * dictionary.
 */
export function RichT({
  k,
  parts,
}: {
  k: string;
  parts: Record<string, ReactNode>;
}) {
  const t = useT();
  const pieces = t(k).split(/\{(\w+)\}/);
  return (
    <>
      {pieces.map((piece, i) =>
        i % 2 === 1 ? (
          <Fragment key={i}>{piece in parts ? parts[piece] : `{${piece}}`}</Fragment>
        ) : (
          <Fragment key={i}>{piece}</Fragment>
        )
      )}
    </>
  );
}

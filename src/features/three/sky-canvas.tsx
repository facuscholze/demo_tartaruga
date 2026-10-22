"use client";

/** Punto de montaje del cielo WebGL (chunk aparte, import dinámico). */
import { Stage } from "./stage";
import { SkyMesh } from "./sky-mesh";
import type { Quality } from "@/features/quality/tiers";

export function SkyCanvas({ quality }: { quality: Quality }) {
  return (
    <Stage
      quality={quality}
      className="absolute inset-0 h-full w-full"
      camera={{ position: [0, 0, 1] }}
    >
      <SkyMesh quality={quality} />
    </Stage>
  );
}

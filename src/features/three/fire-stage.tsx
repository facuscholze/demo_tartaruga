"use client";

/**
 * Escena del fuego: cámara fija, grupo con las partículas y un observador que
 * DESMONTA el canvas cuando la sección sale de pantalla (ahí el CSS sigue
 * soplando las brasas). Se carga con `dynamic import` desde `fire-canvas.tsx`.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FireParticles } from "./fire-particles";
import { skyBus } from "@/features/sky/bus";
import type { Quality } from "@/features/quality/tiers";

export function FireStage({ quality }: { quality: Quality }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = hostRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      {
        rootMargin: "60px",
      },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!inView) return null;

  return (
    <div ref={hostRef} className="absolute inset-0 h-full w-full">
      <Canvas
        dpr={quality === "high" ? Math.min(2, window.devicePixelRatio || 1) : 1.3}
        frameloop="always"
        flat
        camera={{ position: [0, 0.15, 2.2], fov: 42 }}
        gl={{
          alpha: true,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: "high-performance",
        }}
      >
        <FireRig quality={quality} />
      </Canvas>
    </div>
  );
}

function FireRig({ quality }: { quality: Quality }) {
  const intensity = useRef(0);
  const { size } = useThree();

  useFrame(() => {
    // 0..1 según qué tan abajo scrolleamos: el fuego crece hacia la noche.
    intensity.current = THREE.MathUtils.lerp(intensity.current, skyBus.scrollT, 0.08);
  });

  return (
    <group scale={[Math.max(1, size.width / 900), 1, 1]}>
      <FireParticles quality={quality === "low" ? "medium" : quality} intensityRef={intensity} />
    </group>
  );
}

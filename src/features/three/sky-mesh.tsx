"use client";

/**
 * Malla del cielo: un quad a pantalla completa, 1 draw call.
 *
 * Lee `skyInputs` (lo que calculó `SkyRoot` con la hora REAL de Punta Colorada)
 * y por frame solo suma lo que cambia rápido: puntero, scroll y audio. Por eso
 * el shader puede ser rico sin re-renderizar React nunca.
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { SKY_FRAGMENT, SKY_VERTEX } from "./shaders/sky.glsl";
import { skyBus, skyInputs } from "@/features/sky/bus";
import { clamp, lerp } from "@/lib/utils";

const QUALITY_VALUE = { high: 3, medium: 2, low: 1 } as const;

type SkyUniforms = {
  uSkyTop: { value: THREE.Color };
  uSkyMid: { value: THREE.Color };
  uSkyLow: { value: THREE.Color };
  uSkyHorizon: { value: THREE.Color };
  uSunColor: { value: THREE.Color };
  uSeaColor: { value: THREE.Color };
  uSunPos: { value: THREE.Vector2 };
  uSunSize: { value: number };
  uStars: { value: number };
  uWarm: { value: number };
  uFire: { value: number };
  uScrollT: { value: number };
  uAudio: { value: number };
  uPointer: { value: THREE.Vector2 };
  uTime: { value: number };
  uAspect: { value: number };
  uQuality: { value: number };
};

export function SkyMesh({ quality }: { quality: "high" | "medium" | "low" }) {
  const smoothed = useRef({ pointerX: 0.5, pointerY: 0.5, scrollT: 0, audio: 0 });

  const uniforms = useMemo<SkyUniforms>(
    () => ({
      uSkyTop: { value: new THREE.Color("#1b2a55") },
      uSkyMid: { value: new THREE.Color("#b4432e") },
      uSkyLow: { value: new THREE.Color("#e4703a") },
      uSkyHorizon: { value: new THREE.Color("#f5a94b") },
      uSunColor: { value: new THREE.Color("#ffe7b8") },
      uSeaColor: { value: new THREE.Color("#7a3350") },
      uSunPos: { value: new THREE.Vector2(0.62, 0.4) },
      uSunSize: { value: 0.08 },
      uStars: { value: 0.05 },
      uWarm: { value: 0.9 },
      uFire: { value: 0.4 },
      uScrollT: { value: 0 },
      uAudio: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
      uAspect: { value: 1.6 },
      uQuality: { value: QUALITY_VALUE[quality] },
    }),
    [quality],
  );

  useFrame((state) => {
    const inputs = skyInputs.uniforms;

    if (inputs) {
      uniforms.uSkyTop.value.setRGB(inputs.uSkyTop[0], inputs.uSkyTop[1], inputs.uSkyTop[2]);
      uniforms.uSkyMid.value.setRGB(inputs.uSkyMid[0], inputs.uSkyMid[1], inputs.uSkyMid[2]);
      uniforms.uSkyLow.value.setRGB(inputs.uSkyLow[0], inputs.uSkyLow[1], inputs.uSkyLow[2]);
      uniforms.uSkyHorizon.value.setRGB(
        inputs.uSkyHorizon[0],
        inputs.uSkyHorizon[1],
        inputs.uSkyHorizon[2],
      );
      uniforms.uSunColor.value.setRGB(
        inputs.uSunColor[0],
        inputs.uSunColor[1],
        inputs.uSunColor[2],
      );
      uniforms.uSeaColor.value.setRGB(
        inputs.uSeaColor[0],
        inputs.uSeaColor[1],
        inputs.uSeaColor[2],
      );
      uniforms.uSunSize.value = inputs.uSunSize;
      uniforms.uStars.value = inputs.uStars;
      uniforms.uWarm.value = inputs.uWarm;
      uniforms.uFire.value = inputs.uFire;
    }

    // Suavizado: el mar no reacciona de golpe (lerp en vez de valor directo).
    const s = smoothed.current;
    s.pointerX = lerp(s.pointerX, skyBus.pointerX, 0.06);
    s.pointerY = lerp(s.pointerY, 1 - skyBus.pointerY, 0.06);
    s.scrollT = lerp(s.scrollT, skyBus.scrollT, 0.12);
    s.audio = lerp(s.audio, skyBus.audioLevel, 0.18);

    const baseX = inputs?.uSunPos[0] ?? 0.62;
    const baseY = inputs?.uSunPos[1] ?? 0.4;
    uniforms.uSunPos.value.set(
      clamp(baseX + (s.pointerX - 0.5) * 0.05, -0.1, 1.1),
      baseY + (s.pointerY - 0.5) * 0.02,
    );
    uniforms.uPointer.value.set(s.pointerX, s.pointerY);
    uniforms.uScrollT.value = s.scrollT;
    uniforms.uAudio.value = s.audio;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uAspect.value = state.size.width / Math.max(1, state.size.height);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2, 1, 1]} />
      <shaderMaterial
        vertexShader={SKY_VERTEX}
        fragmentShader={SKY_FRAGMENT}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

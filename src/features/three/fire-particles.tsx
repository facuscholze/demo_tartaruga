"use client";

/**
 * Brasas y llamas: `THREE.Points` con posiciones calculadas en el vertex shader.
 * Cero subidas de buffers por frame. La intensidad la maneja el scroll
 * (crece al bajar hacia la sección de fuego) y el audio ambiente (late).
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { FIRE_VERTEX, FIRE_FRAGMENT, EMBER_GLOW_FRAGMENT } from "./shaders/fire.glsl";
import { skyBus, skyInputs } from "@/features/sky/bus";
import { lerp } from "@/lib/utils";

const COUNT = { high: 1400, medium: 600, low: 0 } as const;

export function FireParticles({
  quality,
  intensityRef,
}: {
  quality: keyof typeof COUNT;
  /** `pointer` con el progreso de scroll 0..1 de la sección. */
  intensityRef?: React.RefObject<number>;
}) {
  const count = COUNT[quality];
  const pointsRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const smoothed = useRef({ audio: 0, scrollT: 0 });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let index = 0; index < count; index += 1) {
      seeds[index] = Math.random();
      sizes[index] = 4 + Math.random() * 16;
      positions[index * 3] = (Math.random() - 0.5) * 0.4;
      positions[index * 3 + 1] = -0.3 + Math.random() * 0.4;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.2, 0), 2);
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uIntensity: { value: 0.55 },
      uAudio: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uAspect: { value: 1.5 },
      uSparks: { value: 1 },
    }),
    [],
  );

  const glowUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0.5 },
      uColor: { value: new THREE.Color("#f5a94b") },
    }),
    [],
  );

  useFrame((state) => {
    const fire = skyInputs.uniforms?.uFire ?? 0.5;
    const scroll = intensityRef ? (intensityRef.current ?? 0) : skyBus.scrollT;
    const intensity = THREE.MathUtils.clamp(0.32 + fire * 0.45 + scroll * 0.4, 0.1, 1.15);

    smoothed.current.audio = lerp(smoothed.current.audio, skyBus.audioLevel, 0.14);
    smoothed.current.scrollT = lerp(smoothed.current.scrollT, scroll, 0.1);

    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uIntensity.value = intensity;
    uniforms.uAudio.value = smoothed.current.audio;
    uniforms.uPixelRatio.value = state.viewport.dpr;
    uniforms.uPointer.value.set(skyBus.pointerX, skyBus.pointerY);
    uniforms.uSparks.value = state.pointer && window.matchMedia("(pointer: fine)").matches ? 1 : 0;
    uniforms.uAspect.value = state.size.width / Math.max(1, state.size.height);

    glowUniforms.uTime.value = state.clock.elapsedTime;
    glowUniforms.uIntensity.value = intensity * 0.85;

    if (pointsRef.current) pointsRef.current.visible = count > 0;
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.9) * 0.02 + smoothed.current.audio * 0.06;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Resplandor sobre la madera */}
      <mesh ref={glowRef} position={[0, -0.22, 0.1]} scale={[2.6, 1.5, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);}"}
          fragmentShader={EMBER_GLOW_FRAGMENT}
          uniforms={glowUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {count > 0 ? (
        <points ref={pointsRef} geometry={geometry}>
          <shaderMaterial
            vertexShader={FIRE_VERTEX}
            fragmentShader={FIRE_FRAGMENT}
            uniforms={uniforms}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      ) : null}
    </group>
  );
}

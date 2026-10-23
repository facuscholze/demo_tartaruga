/**
 * Fuego en partículas GPU (un solo `THREE.Points`, 1 draw call).
 * Todo el movimiento se calcula en el vertex shader a partir de un `aSeed`
 * estático: no hay actualización de buffers por frame (eso es lo que suele
 * romper el render en celulares). Las chispas de más arriba son atraídas por el
 * cursor en desktop; en móvil el campo queda centrado en la hoguera.
 */

export const FIRE_VERTEX = /* glsl */ `
precision highp float;

attribute float aSeed;
attribute float aSize;

uniform float uTime;
uniform float uPixelRatio;
uniform float uIntensity;   // 0..1: crece al scrollear hacia la noche
uniform float uAudio;       // latido suave desde el analizador
uniform vec2  uPointer;     // 0..1 (en uv del canvas)
uniform float uAspect;
uniform float uSparks;      // 0/1: atracción por puntero

varying float vLife;
varying float vSeed;
varying float vHeat;

float hash11(float p) {
  return fract(sin(p * 127.1) * 43758.5453123);
}

void main() {
  float seed = aSeed;
  vSeed = seed;

  // Ciclo de vida 0..1 (cada partícula desfasada).
  float speed = 0.26 + hash11(seed * 3.7) * 0.34;
  float life = fract(uTime * speed + seed);
  vLife = life;

  // Nacimiento: anillo de la base del brasero.
  float angle = seed * 6.28318 * 3.0;
  float ring = 0.16 + hash11(seed * 11.0) * 0.10;
  vec3 pos;
  pos.x = cos(angle) * ring;
  pos.z = sin(angle) * ring * 0.45;
  pos.y = -0.34 + life * (0.75 + uIntensity * 0.9);

  // Turbulencia: dos senos a distinta frecuencia (curl barato y estable).
  float t = uTime * (0.8 + seed * 0.6);
  pos.x += sin(t + life * 7.0 + seed * 6.28) * 0.055 * (0.35 + life);
  pos.z += cos(t * 1.3 + life * 5.0) * 0.030 * (0.35 + life);

  // Chispas: las semillas altas suben más rápido y más rectas.
  float spark = step(0.86, hash11(seed * 5.3));
  pos.y += spark * life * 0.55;

  // Atracción al cursor para las chispas (desktop).
  if (uSparks > 0.5 && spark > 0.5) {
    vec2 target = (uPointer - 0.5) * vec2(1.6, 1.1);
    pos.xy = mix(pos.xy, vec2(target.x, -0.1 + target.y), 0.42 * smoothstep(0.15, 1.0, life));
  }

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  vHeat = mix(1.0, 0.35, smoothstep(0.45, 1.0, life)) * (uIntensity * 0.75 + 0.25);

  float grow = smoothstep(0.0, 0.08, life);
  float shrink = 1.0 - smoothstep(0.55, 1.0, life);
  float size = aSize * (0.7 + uAudio * 0.5) * grow * shrink;
  size *= mix(1.0, 2.1, spark);
  gl_PointSize = max(1.0, size * uPixelRatio * (1.0 / max(0.0001, -mv.z * 0.55 + 1.0)));
}
`;

export const FIRE_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uIntensity;

varying float vLife;
varying float vSeed;
varying float vHeat;

void main() {
  // Sprite suave (sin textura): círculo con decaimiento exponencial.
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float core = pow(max(0.0, 1.0 - d * 2.0), 2.4);

  // Rampas de temperatura: núcleo paja → brasa naranja → rojo óxido → humo.
  vec3 flame = mix(vec3(1.00, 0.86, 0.55), vec3(0.94, 0.45, 0.16), smoothstep(0.05, 0.55, vLife));
  flame = mix(flame, vec3(0.60, 0.18, 0.10), smoothstep(0.5, 0.95, vLife));
  float flicker = 0.86 + 0.14 * sin(uTime * (7.0 + vSeed * 9.0) + vSeed * 33.0);
  float alpha = core * (1.0 - smoothstep(0.62, 1.0, vLife)) * vHeat * flicker;

  vec3 color = flame * (0.8 + core * 0.9) * uIntensity;
  gl_FragColor = vec4(color, alpha * 0.9);
}
`;

/** Resplandor del brasero sobre la madera (mismo material, sin partículas). */
export const EMBER_GLOW_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColor;

void main() {
  float d = length((vUv - vec2(0.5, 0.42)) * vec2(1.25, 1.0));
  float glow = pow(max(0.0, 1.0 - d * 1.7), 2.2);
  float pulse = 0.9 + 0.1 * sin(uTime * 1.3) + 0.05 * sin(uTime * 2.7);
  gl_FragColor = vec4(uColor * glow * uIntensity * pulse, glow * 0.85 * uIntensity);
}
`;

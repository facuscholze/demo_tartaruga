/**
 * Shader del cielo (quad a pantalla completa). Vive como string tipado para no
 * sumar un loader de `.glsl` al build.
 *
 * Hace TODO el trabajo atmosférico en un solo programa:
 *   degradé por keyframes + disco solar + halo + nubes ruidosas + mar con
 *   reflejo del sol y olas + estrellas + "tint" por scroll (atardecer→noche)
 *   + latido por audio. ~140 líneas de GLSL, 1 draw call.
 */

export const SKY_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const SKY_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;

uniform vec3  uSkyTop;
uniform vec3  uSkyMid;
uniform vec3  uSkyLow;
uniform vec3  uSkyHorizon;
uniform vec3  uSunColor;
uniform vec3  uSeaColor;
uniform vec2  uSunPos;      // 0..1 en pantalla
uniform float uSunSize;
uniform float uStars;
uniform float uWarm;
uniform float uFire;        // 0..1, cuánto fuego hay que sembrar
uniform float uScrollT;     // 0..1 progreso hero→fuego
uniform float uAudio;       // 0..1 nivel del ambiente
uniform vec2  uPointer;     // 0..1
uniform float uTime;
uniform float uAspect;
uniform float uQuality;     // 1 = low (menos octavas), 2 = medium, 3 = high

const float HORIZON = 0.34;   // altura del horizonte en uv.y
const float PI = 3.14159265;

float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  int octaves = uQuality < 1.5 ? 2 : (uQuality < 2.5 ? 3 : 5);
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    v += a * vnoise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

// Ocaso/noche: el cielo se enfría y baja de brillo.
vec3 nightShift(vec3 color, float t) {
  vec3 cool = color * vec3(0.42, 0.52, 0.86);
  return mix(color, mix(cool, vec3(0.03, 0.05, 0.10), 0.42), t);
}

void main() {
  vec2 uv = vUv;
  // Ligero desplazamiento por puntero/giroscopio: el sol "respira" con vos.
  vec2 par = (uPointer - 0.5);
  vec2 suv = uv + vec2(par.x * 0.03, par.y * 0.018);
  float scroll = clamp(uScrollT, 0.0, 1.0);
  float heat = clamp(uAudio * 0.55 + uFire * 0.12, 0.0, 0.6);

  // --- Degradé del cielo (4 keyframes, suavizados) -----------------------
  float y = clamp(suv.y, 0.0, 1.0);
  vec3 sky = mix(uSkyHorizon, uSkyLow, smoothstep(HORIZON, HORIZON + 0.10, y));
  sky = mix(sky, uSkyMid, smoothstep(HORIZON + 0.05, 0.66, y));
  sky = mix(sky, uSkyTop, smoothstep(0.60, 1.0, y));

  // --- Nubes / bruma (solo sobre el horizonte, como en la costa) ---------
  vec2 cloudP = vec2(suv.x * uAspect * 2.1 + uTime * 0.010, suv.y * 3.0 - uTime * 0.004);
  float cloud = fbm(cloudP);
  float cloudBand = smoothstep(0.30, 0.52, y) * (1.0 - smoothstep(0.62, 0.95, y));
  sky = mix(sky, mix(uSkyHorizon, vec3(1.0), 0.22), cloud * cloudBand * (0.20 + uWarm * 0.26));

  // --- Sol: disco + halo cálido, achatado cerca del horizonte ------------
  vec2 sunAspect = vec2(uAspect, 1.0);
  vec2 sp = (suv - uSunPos) * sunAspect;
  float d = length(sp);
  float radius = max(uSunSize, 0.0001);
  float disc = smoothstep(radius * 1.04, radius * 0.86, d);
  float halo = pow(max(0.0, 1.0 - d / (radius * 9.0)), 2.6);
  float glow = pow(max(0.0, 1.0 - d / (radius * 30.0)), 1.7);
  sky += uSunColor * (disc * (0.85 + heat * 0.3) + halo * 0.30 + glow * 0.14);

  // --- Mar: reflejo del sol, olas y línea de costa ----------------------
  float below = HORIZON - y;
  if (below > 0.0) {
    float depth = clamp(below / HORIZON, 0.0, 1.0);
    vec3 sea = mix(mix(uSkyHorizon, uSeaColor, 0.55), uSeaColor * 0.62, depth);

    // olas: dos ruidos estirados horizontalmente, más suaves al alejarse
    float waveY = below * 8.0 + depth * 3.0;
    float w1 = fbm(vec2(suv.x * uAspect * 7.0 + uTime * 0.16, waveY * 2.6 - uTime * 0.55));
    float w2 = fbm(vec2(suv.x * uAspect * 15.0 - uTime * 0.22, waveY * 6.0 + uTime * 1.05));
    float waves = w1 * 0.6 + w2 * 0.4;

    // franja de reflejo del sol sobre el agua
    float refl = exp(-pow(sp.x / (radius * 3.2 + depth * 0.10), 2.0));
    float shimmer = smoothstep(0.42, 0.78, waves);
    sea += uSunColor * refl * shimmer * (0.55 + heat * 0.5) * (1.0 - depth * 0.55);
    sea += uSkyHorizon * (waves - 0.5) * 0.16 * (1.0 - depth);

    // orilla: línea clara en el horizonte
    float edge = smoothstep(0.012, 0.0, below);
    sea = mix(sea, mix(uSkyHorizon, vec3(1.0), 0.4), edge * 0.5);
    sky = sea;
  }

  // --- Estrellas (solo de noche, parpadeo suave, sin strobe) -----------
  float stars = uStars * smoothstep(HORIZON + 0.02, 0.9, y);
  if (stars > 0.001) {
    vec2 grid = floor(suv * vec2(150.0 * uAspect, 150.0));
    float r = hash21(grid);
    float twinkle = 0.65 + 0.35 * sin(uTime * (0.7 + r * 1.6) + r * 20.0);
    float star = step(0.9965, r) * twinkle;
    sky += vec3(star) * stars * 0.9;
  }

  // --- Scroll hacia la noche + grano fino --------------------------------
  sky = nightShift(sky, scroll * 0.85);
  float grain = (hash21(suv * 900.0 + uTime) - 0.5) * 0.022;
  sky += grain;

  gl_FragColor = vec4(clamp(sky, 0.0, 1.0), 1.0);
}
`;

# Sistema de diseño (para que otra persona lo mantenga)

Todo vive en CSS, no en componentes: `src/styles/tokens.css` (paleta, tipografía,
motion) y `src/styles/textures.css` (grano, papel, brasas, filtros), con las
utilidades de `src/app/globals.css`. Tailwind 4 se usa por `@theme inline` para
mapear tokens a clases, no para hardcodear colores.

## Paleta

| Token                   | Hex                   | Uso                                                        |
| ----------------------- | --------------------- | ---------------------------------------------------------- |
| `--c-night`             | `#0E1526`             | fondo general (no negro puro: el negro puro mata el grano) |
| `--c-navy`              | `#16213F`             | superficie elevada, intro                                  |
| `--c-abyss`             | `#080D18`             | pie de página, cielo nocturno profundo                     |
| `--c-haze`              | `#1E2A4A`             | tarjetas, bruma                                            |
| `--c-sand` / `--c-bone` | `#EFE3D0` / `#F6F0E6` | modo papel (carta, artesanal) y tinta clara                |
| `--c-sand-wet`          | `#D9C6A8`             | arena mojada, bordes de foto                               |
| `--c-sunset`            | `#E4703A`             | **CTA de reserva** (el único naranja de acción)            |
| `--c-rust`              | `#A9422A`             | tinta sobre papel, links en modo claro                     |
| `--c-ember`             | `#F5A94B`             | fuego, sellos “a confirmar”                                |
| `--c-spark`             | `#FFCE7A`             | chispas, highlights, etiquetas sobre oscuro                |
| `--c-cactus`            | `#7F9A70`             | pet friendly (área total < 2% del sitio)                   |

Nada de azul “club de neón” ni verde saturado: la referencia es el atardecer de
Punta Colorada, rústico-chic. El verde está casi vetado por eso.

## Tipografía

- **Fraunces** (display): serif editorial con ejes `SOFT`/`WONK`; el carácter
  tallado a mano que pide la marca. Títulos y nombres de plato.
- **Courier Prime** (etiquetas, precios, horarios): máquina de escribir real,
  coherente con los highlights del Instagram. Tabular por naturaleza, así los
  precios alinean.
- **Instrument Sans** (texto corrido): sans legible y cálida, sin ser Inter.

Self-hosted con `next/font/local` desde `@fontsource*`: cero pedidos a un CDN,
subset latin. `--text-*` son `clamp()` fluidos; los tamaños no se hardcodean en
componentes salvo en micro-etiquetas.

## Motion

- Curvas: `--ease-sea cubic-bezier(.16,.84,.24,1)` (entradas),
  `--ease-swell cubic-bezier(.62,0,.12,1)` (revelados grandes),
  `--ease-ember cubic-bezier(.3,.7,.2,1.02)` (fuego/latidos). Las mismas curvas
  están registradas en GSAP como `sea`/`swell`/`ember` (`src/lib/gsap-core.ts`) para
  que CSS y JS se sientan idénticos.
- Duraciones: `--d-1…5` = 180/380/720/1100/1800 ms.
- Reveal de imagen: `clip-path inset(100% 0 0 0 → 0)` + `y 8%` + `scale 1.06→1`.
- Texto: SplitText por palabras, stagger 35 ms, `start: "top 82%"`, `scrub: .6`.
- Regla: si una animación no se puede explicar en una frase (“la foto sube desde
  el agua”, “el sol se pone”), no va. Y si `prefers-reduced-motion` está prendido,
  **no se importa GSAP**: se sale antes.

## El cielo como sistema

Una sola variable de estado: la **elevación solar** del lugar. `SKY_KEYFRAMES`
(8 nodos de −20° a 62°) se interpola en luz lineal y alimenta tres salidas con
los mismos números: variables CSS (`.sky-gradient`), uniforms del shader GLSL y
el tinte de las tarjetas de experiencia. Por eso el sitio nunca se “desincroniza”
entre lo que dice el texto (“se pone a las 19:12”) y lo que se ve.

Con `--sky-luma > 0.6` el layout pone `data-sky-bright="true"`: el header pasa a
tinta oscura con halo para seguir siendo legible sobre un cielo claro.

## Texturas

Grano SVG (`feTurbulence`, baseFreq .85, opacity .055, `mix-blend-mode:
soft-light`), papel (`--paper-url`), brasas que respiran (`--audio-level` las
mueve cuando el ambiente está prendido), viñeta cálida, borde de sello dentado,
desplazamiento de agua/aire con filtros SVG (`#tart-water`, `#tart-turbulence`).

## Tiers

|                     | High         | Medium        | Low            |
| ------------------- | ------------ | ------------- | -------------- |
| WebGL (cielo/fuego) | sí (DPR ≤ 2) | sí (DPR 1.35) | no             |
| Partículas de fuego | 900          | 380           | 0 (brasas CSS) |
| Distorsión de fotos | sí           | no            | no             |
| Grano / parallax    | sí / sí      | sí / sí       | no / no        |
| Analizador de audio | sí           | no            | no             |
| FPS objetivo        | 60           | 60            | 30             |

Se elige con `detect-gpu` + `hardwareConcurrency` + `deviceMemory` + **FPS real**
medido al arrancar, se persiste en `localStorage` y en `<html data-quality>`, y el
usuario lo puede forzar con _Efectos: Max / Normal / Mínimo_. Primer render:
Medium (nunca sobre-cargar un gama media por un flagship en otro lado).

# CLAUDE.md · mapa para mantener este repo

Leo este archivo antes de tocar nada. Si cambio una convención, **actualizo este
archivo en el mismo commit**.

## Qué es

Demo comercial del sitio de **Tartaruga Sea-Bar** (mar-bar frente al mar, Faro de
Punta Colorada, Maldonado, Uruguay). Concepto: _el último rayo de sol_. Objetivo
de negocio: que el visitante piense “quiero estar ahí al atardecer” y reserve por
WhatsApp o teléfono. Mobile-first, y convertible en sitio real **sin rehacer nada**.

## Comandos

```bash
pnpm dev | build | start | verify        # verify = format:check+lint+typecheck+test+content:check+build
pnpm content:check | optimize | placeholders | sync-images
pnpm add:dish | add:photo | add:promo    # alta guiada (admite respuestas por caño, testeable)
pnpm test | lint | lint:fix | format | typecheck | analyze
```

Antes de cerrar cualquier tarea: `pnpm verify` en verde. Si toqué contenido,
además `pnpm content:check`.

## Arquitectura

```
src/app/[locale]/layout.tsx   NextIntlClientProvider → SiteProvider → QualityProvider
                              → SkyRoot → LenisProvider → Intro/SvgDefs/CustomCursor/
                              ScrollFx/AudioVisualLink/WaveTransition/Header/main/Footer/
                              MobileReserveBar/SoundGlobalToggle/JsonLd
src/app/[locale]/page.tsx     composición de secciones (todas Server Components)
src/app/proxy.ts?  → src/proxy.ts   next-intl (es|en|pt, default es, as-needed)
src/app/og/[locale]/route.tsx imagen social 1200×630 (fuera de [locale] a propósito)
src/app/api/booking/route.ts  valida con Zod + reenvía a BOOKING_WEBHOOK_URL (no persiste)
src/features/content/         schema.ts (Zod) · load.ts (cache + resolución) ·
                              images.ts (server-only) · l10n.ts · format.ts
src/features/sky/             palettes.ts (motor de cielos, puro y testeado) · sun.ts
                              (SunCalc) · store.ts · bus.ts (señales fuera de React) ·
                              sky-root.tsx (escribe CSS vars y uniforms)
src/features/quality/         tiers.ts (settings) · store.ts (zustand) · provider.tsx (detectors)
src/features/three/           stage/sky-canvas/sky-mesh/fire-* + shaders/*.glsl.ts (lazy)
src/features/audio/           engine.ts (síntesis Web Audio) · store.ts
src/features/site/links.ts    helpers PUROS de WhatsApp/tel/maps (los usa el server y el cliente)
src/features/booking/         schema.ts (Zod, único) · message.ts (arma el texto de WhatsApp)
src/components/{shell,sections,controls,fx,ui,brand,seo}/
src/hooks/                    use-lenis (Lenis+ScrollTrigger sincronizados) ·
                              use-pointer-sky · use-raf-scroll · use-drag-scroll
src/lib/                      fonts.ts · gsap-core.ts / gsap.ts (registro único, núcleo vs plugins) · utils.ts ·
                              naming.ts (contrato de nombres de archivo) · og-fonts.ts
content/*.json                fuente de verdad del contenido
public/images/<módulo>/       fotos (el JSON solo guarda el NOMBRE de archivo)
scripts/                      content-check, optimize-images, sync-images,
                              generate-placeholders, add-dish/photo/promo + lib/
tests/                        vitest (naming, sky, booking, content) + stubs/server-only.ts
docs/                         contenido, deploy, diseño, a-confirmar, checklist, credits
```

## Contrato de secciones (cómo agrego una)

1. `src/components/sections/<x>.tsx` = **Server Component**: lee
   `await getSiteContent()`, formatea precios/fechas/textos con `pickText`, y pasa
   props **serializables** al cliente. Nunca `await` dentro de un cliente para
   leer contenido.
2. Declaro comportamiento con atributos de datos (los consume `fx/scroll-fx.tsx`):
   `data-reveal="mask|words|fade"`, `data-parallax="0.12"`, `data-pin`,
   `data-scroll-to`, `data-cursor="ver|arrastrar|reservar"`, `data-paw-trail`,
   `data-lenis-prevent` (scroll interno que Lenis no debe robar).
3. El CTA de reserva llega ya resuelto (`reserveHref`) o se arma con
   `whatsappHref/ buildWhatsappHref`. **No paso funciones como props** a un Client
   Component (React lo prohíbe): paso datos y el cliente importa el helper puro.
4. La monto en `src/app/[locale]/page.tsx` en el orden narrativo
   (atardecer → fuego → carta → lugar → sunset → experiencias → artesanal →
   mascotas → beneficios → reservar).

## Reglas de contenido (no negociables)

- **Solo el nombre de archivo** en los JSON, jamás rutas: se resuelve contra la
  carpeta del módulo (`imageModuleDir`). Si falta la foto → `MediaFallback`
  (degradé de atardecer + caracola), nunca un hueco blanco.
- `id` → imagen por convención (`<id>.jpg`), `image` explícito gana.
- `price`: número entero en la moneda de `site.json`; `0`/ausente = “Consultar”.
  Nunca `"$4.500"` (el checker lo frena).
- Textos bilingües `{es, en}`; falta `en` → se muestra `es` + aviso.
- Nombres: `kebab-case`, ASCII, sin espacios/tildes/mayúsculas
  (`src/lib/naming.ts` es la única autoridad).
- `available: false` oculta, `featured: true` destaca, `order` manda (si no, la
  posición en el JSON), `validUntil` pasado saca la promo del HTML.
- **No inventar datos del local.** Platos reales, horarios, días de apertura,
  temporada, capacidad, política de mascotas, historia, dueños, premios, cifras,
  citas: todo con `confirmed:false` / `pending:true` y etiqueta visible. Si una
  idea visual compromete legibilidad de reservas/horarios/ubicación o
  accesibilidad → **gana lo segundo**.
- Demo visible: `site.json: demo:true` pinta sellos en carta, pie y experiencias.

## Reglas de performance y calidad

- **Three/R3F nunca en el bundle inicial**: solo `dynamic import`/`lazy` desde la
  sección que lo necesita (`features/three/fire-stage`, `sky-canvas`). Misma
  regla para GSAP en componentes que no lo usan siempre.
- Cada librería tiene que tener **propósito documentado acá**; si dejo de usarla,
  la borro (con su fila de la tabla de pesos).
- Pausar WebGL fuera de viewport y con la pestaña oculta. Nada de loops
  `requestAnimationFrame` permanentes sin consumidor visible.
- Fuentes e imágenes **self-hosted**: ningún pedido a un CDN de terceros (CSP
  estricta, LCP, funciona en el VPS).
- Presupuesto: JS inicial ≤ ~185 KB gzip, LCP < 2.5 s, 60 fps en gama media en
  Medium. Contenido esencial legible sin JS.

## GSAP vs Motion

- **GSAP**: scroll (ScrollTrigger), coreografías, SplitText, Flip, DrawSVG,
  Observer, CustomEase. Núcleo en `src/lib/gsap-core.ts` (`setupGsapCore`, lo que
  usa Lenis) y plugins en `src/lib/gsap.ts` (`setupGsap`): el primer chunk no
  paga SplitText/Flip. MorphSVG está afuera porque no lo usa ninguna animación; easings `sea | swell | ember` espejados en `--ease-*`.
- **Motion**: no está. La regla era "solo layout/gestos", y terminó sin uso
  (Radix + CSS resuelven mejor los diálogos y los tabs). Lo saqué con
  `pnpm remove motion` para no pagar 70 KB gzip en el bundle inicial. Si alguien
  lo vuelve a agregar, que justifique qué hace que Motion no pueda hacer CSS.
- Siempre dentro de `gsap.context()` y con cleanup; nada de animaciones si
  `prefers-reduced-motion` (se sale **antes** de importar GSAP).

## Accesibilidad

Foco visible en todo lo interactivo, teclado completo en tabs/accordion/dialog,
`aria-live` en reloj solar y estado del form, `alt` obligatorio en galería,
headings jerárquicos, sin strobes, overlays que no bajan el contraste del
texto, audio siempre opt-in con mute global.

## Trampas ya conocidas (no las repitas)

- `next/font/local`: `path` **literal** en el fuente (una función o template
  rompe Turbopack con `data did not match any variant of untagged enum SrcRequest`)
  y relativo **al archivo** (`src/lib/fonts.ts` → `"../../node_modules/…"`).
- `eslint-config-next` 16 exporta flat configs nativas; con `FlatCompat` de
  `@eslint/eslintrc` muere con _Converting circular structure to JSON_.
- `next-intl` + Next 16: wrapper `NextIntlClientProvider` requerido y
  `getRequestConfig` devuelve `locale` explícito. El archivo es `proxy.ts`, no
  `middleware.ts`.
- Imagen social: si vive en `src/app/[locale]/opengraph-image.tsx`, el proxy de
  next-intl la redirige (`/es/…` → `/`) y el `og:image` responde 307/404. Por eso
  está en `/og/[locale]` y `og` está excluido del `matcher`.
- `ImageResponse` (satori) **no lee woff2** ni variables bien: se descomprimen
  con `wawoff2` y se usan las fuentes **estáticas** (`@fontsource/fraunces`,
  devDependency solo para la OG).
- Zod 4: `z.number({ error: "string" })` va; `{error:{invalid_type:…}}` revienta
  (`def.error is not a function`) y `.optional({error})` se ignora.
- `detect-gpu@5` exporta `getGPUTier()` (async), no `detectGPU()`.
- `@types/suncalc`: named imports (`getTimes`, `getPosition`), no hay `getPos`;
  anclar al día calendario a 12:00Z para que el DST no corra la medianoche.
- TS 5.9 + DOM: `getByteTimeDomainData` pide `Uint8Array<ArrayBuffer>`.
- `noUncheckedIndexedAccess`: en R3F, tener el objeto `uniforms` propio y
  mutarlo (no leer `material.uniforms.x`) para que TS no lo vea `undefined`.
- Vitest + `server-only`: alias a `tests/stubs/server-only.ts` en
  `vitest.config.ts`; sin eso, importar `load.ts` desde un test explota.
- Los auxiliares puros no pueden vivir en un módulo `"use client"` si los llama
  un Server Component (`site/links.ts` puro + `site/context.tsx` re-exporta).
- `readline` con stdin de caño nunca resuelve: los `add-*` aceptan flags.
- En esta demo **no hay CDN**: nada de Google Fonts ni audio de terceros.
- No hotlinkear fotos/video/audio del Instagram del local ni de terceros; los
  placeholders son propios o generados, y `docs/credits.md` lo dice.

## Contenido técnico

- `content:check` es el portero y corre en `prebuild` y en CI: errores frenan,
  avisos no. Sus mensajes dicen **qué campo, en qué archivo y cómo arreglarlo**
  (con sugerencia de nombre cuando es un typo de archivo).
- `/api/booking` no persiste nada; sin `BOOKING_WEBHOOK_URL` responde OK.
- Los secrets no van al repo: ver `.env.example`.

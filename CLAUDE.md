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
pnpm dev | build | serve | verify        # verify = format:check+lint+typecheck+test+content:check+build
pnpm build                               # orquestador: optimize+check+variantes+OG+export+index/404 → out/
pnpm build:server                        # misma pipeline pero output:"standalone" (Vercel/Docker)
pnpm images:build                        # AVIF/WebP 640/960/1440 + src/generated/image-variants.ts
pnpm og:build                            # public/og/<locale>.png (1200×630, ImageResponse en build)
pnpm pages:build                         # out/index.html (selector de idioma) + out/404.html (tortuga)
pnpm serve                               # npx serve out (preview local del export, puerto 3000)
pnpm content:check | optimize | placeholders | sync-images
pnpm add:dish | add:photo | add:promo    # alta guiada (admite respuestas por caño, testeable)
pnpm test | lint | lint:fix | format | typecheck | analyze
```

`pnpm images:build` tarda ~2 min (codifica AVIF); en local se puede iterionar con
es incremental por default (cada variante se saltea si ya está al día
por `mtime`); `FORCE_IMAGES=1 pnpm images:build` re-codifica todo desde cero. El mapa `src/generated/image-variants.ts` está **commiteado** a
propósito: sin generar nada, `lint`/`typecheck`/`test` igual pasan.

Antes de cerrar cualquier tarea: `pnpm verify` en verde. Si toqué contenido,
además `pnpm content:check`.

## Arquitectura

```
src/app/[locale]/layout.tsx   NextIntlClientProvider → SiteProvider → QualityProvider
                              → SkyRoot → LenisProvider → Intro/SvgDefs/CustomCursor/
                              ScrollFx/AudioVisualLink/WaveTransition/Header/main/Footer/
                              MobileReserveBar/SoundGlobalToggle/JsonLd
src/app/[locale]/page.tsx     composición de secciones (todas Server Components)
src/app/{manifest,robots,sitemap}.ts  se materializan a archivos estáticos en el export
src/i18n/                     routing.ts (es|en|pt, default es, localePrefix:"always",
                              localeDetection:false) · navigation.ts · use-local-pathname.ts
src/lib/base.ts               basePath/withBase/withBaseSrcset/absoluteUrl/siteOrigin
                              (ÚNICA fuente del prefijo de despliegue)
src/lib/csp.ts                cspMeta() → <meta http-equiv> (Pages no permite headers)
src/generated/image-variants.ts  mapa srcset generado por `images:build` (commiteado)
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
                              naming.ts (contrato de nombres de archivo) · og-fonts.ts · base.ts · csp.ts
content/*.json                fuente de verdad del contenido
public/images/<módulo>/       fotos (el JSON solo guarda el NOMBRE de archivo)
scripts/                      content-check, optimize-images, sync-images,
                              generate-placeholders, build-image-variants, generate-og.tsx,
                              pages-static.ts, pages-build.ts (orquestador), add-dish/photo/promo + lib/
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
- **Ni el prefijo del despliegue va en el contenido**: `NEXT_PUBLIC_BASE_PATH` se
  aplica SIEMPRE en código con `withBase()` (o `withBaseSrcset()` para `srcset`).
  En CSS inline nada de `url(/…)` sin helper. `tests/base-paths.test.ts` audita el
  fuente y `pnpm lint` lo exige; un `/images/x.jpg` pelado en Pages es un 404.
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

## Deploy: GitHub Pages (destino principal)

`next.config.ts` usa `output: "export"` por default (con `SITE_OUTPUT=server` pasa a
`standalone` para Vercel/Docker), `trailingSlash: true`, `images.unoptimized`, y
`basePath`/`assetPrefix` desde `NEXT_PUBLIC_BASE_PATH`. **Nunca hardcodear el nombre
del repo**: el prefijo lo decide el workflow (vacío si hay `public/CNAME` o si el repo
es `<usuario>.github.io`, si no `/<repo>`) y lo consume `src/lib/base.ts`.

Lo que **no se puede** en Pages (y por lo tanto no existe en este repo): route
handlers/API, `middleware`/`proxy.ts`, `headers()`/`redirects()` de next.config,
ISR/`revalidate`, `cookies()`/`headers()` dinámicos, OG dibujada en runtime, search
params server-side, imágenes optimizadas on-demand. Si una feature los necesita, el
destino pasa a ser Vercel o el VPS con Docker (`pnpm build:server`).

El deploy real es `.github/workflows/deploy.yml` (push a `main` + `workflow_dispatch`),
que deja `out/` arriba, y `.github/workflows/ci.yml` solo corre en PRs.
Detalle en `docs/deploy.md`; la decisión y sus alternativas, en `docs/DECISIONES.md`.

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
  `getRequestConfig` devuelve `locale` explícito. En Next 16 el archivo es
  `proxy.ts` (no `middleware.ts`) — **y acá ya no existe ninguno**: Pages no ejecuta
  middleware, así que `localePrefix: "always"` + `generateStaticParams` hacen todo
  el trabajo y la detección de idioma vive en `out/index.html`.
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
- **`metadataBase` + `output: "export"` revienta en Next 16**: resolver las URLs
  relativas de metadata lee el pathname de la request y en el prerender no hay
  request → `Cannot read properties of null (reading 'pathname')` al generar `/es`.
  Solución: no usar `metadataBase` y escribir canonical/hreflang/OG absolutos con
  `absoluteUrl()` (origen + base). Mismo motivo por el que `usePathname()` de
  next-intl/`next/navigation` se reemplazó por `useLocalPathname()`
  (`useSyncExternalStore`, snapshot de server `null`).
- **`app/not-found.tsx`/`app/page.tsx` globales no se pueden usar**: el root
  layout con `<html>` es `src/app/[locale]/layout.tsx`, y un segundo layout con
  `<html>` es HTML inválido. Por eso `out/index.html` y `out/404.html` se escriben
  post-build con `scripts/pages-static.ts` (con `<link>` relativos al CSS ya
  compilado, así funcionan con o sin basePath).
- `next/image` con `images.unoptimized` en export devuelve un `<img>` sin
  variantes: por eso `ui/media.tsx` arma `<picture>` a mano y la regla de ESLint
  `@next/next/no-img-element` está apagada con nota.
- `withBase` es **idempotente** a propósito: se aplica en el resolvedor de
  contenido y otra vez en el render; sin el short-circuit sale `/repo/repo/images/…`.
- `ImageResponse` en `scripts/generate-og.tsx` funciona con `tsx` (Node puro),
  pero los scripts NO pueden importar `@/features/content/load` (trae
  `server-only` y lanza): leen el JSON con `readFileSync` + `siteSchema.parse`.
- `manifest.ts`/`robots.ts`/`sitemap.ts` necesitan `export const dynamic =
"force-static"` con `output: "export"` (si no, Next los trata de dinámicos y la
  build falla en la recolección de rutas).
- En esta demo **no hay CDN**: nada de Google Fonts ni audio de terceros.
- No hotlinkear fotos/video/audio del Instagram del local ni de terceros; los
  placeholders son propios o generados, y `docs/credits.md` lo dice.

## Contenido técnico

- `content:check` es el portero y corre en `prebuild` y en CI: errores frenan,
  avisos no. Sus mensajes dicen **qué campo, en qué archivo y cómo arreglarlo**
  (con sugerencia de nombre cuando es un typo de archivo).
- No hay `/api/booking`: en Pages no corre Node. El formulario arma el mensaje y
  abre `wa.me`; si existe `NEXT_PUBLIC_BOOKING_WEBHOOK_URL` (endpoint público con
  CORS, tipo Slack/Make/n8n) el navegador además hace un `POST` ahí. Sin esa
  variable, **cero llamadas de red**. En Pages no se guarda ninguna reserva.
- Los secrets no van al repo, y **nunca** en una variable `NEXT_PUBLIC_*`: se
  embute en el bundle y lo lee cualquiera. Ver `.env.example`.

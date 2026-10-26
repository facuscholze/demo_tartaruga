# Decisiones

Registro corto de las decisiones que cambian cómo se mantiene el repo: **contexto →
opciones → qué se eligió → qué se sacrificó**. No es un changelog; si una decisión
se revierte, se anota acá y se actualiza `CLAUDE.md`.

---

## 2025-10 · El despliegue principal pasa a ser GitHub Pages (export estático)

**Contexto.** Es una demo de un negocio local: tiene que ser pública, barata,
robusta y actualizable por el cliente con un commit de JSON. Vercel funciona, pero
ata el proyecto a una cuenta de terceros y a un runtime de Node que el sitio no
necesita. Pages sirve el repo, sin costo, y sobrevive a que se vaya el que lo montó.

**Opciones.**

1. Pages con `output: "export"` (lo elegido).
2. Pages con un `gh-pages` a mano y Next fuera del loop (se perdería App Router,
   next-intl y los metadata routes: no).
3. Cloudflare Pages (mismo problema que Vercel: cuenta de terceros).
4. Quedarse en Vercel y aceptar la dependencia.

**Decisión.** `output: "export"` + `trailingSlash: true` + `images.unoptimized`, con
`basePath`/`assetPrefix` alimentados por `NEXT_PUBLIC_BASE_PATH` (nunca el nombre del
repo hardcodeado). `pnpm build` (orquestado en `scripts/pages-build.ts`) deja `out/`
completo; `pnpm build:server` conserva el camino con servidor para Vercel/Coolify.

**Lo que se sacrificó (y dónde se notó):**

| Se sacó                                             | Por qué en Pages es imposible      | Reemplazo                                                                                                                                                 |
| --------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/booking/route.ts`                      | no corre Node                      | el form arma el mensaje y abre `wa.me`; `NEXT_PUBLIC_BOOKING_WEBHOOK_URL` opcional llamado desde el cliente (CORS a cargo del endpoint)                   |
| `src/app/og/[locale]/route.tsx`                     | `ImageResponse` necesita runtime   | `scripts/generate-og.tsx` escribe `public/og/<idioma>.png` en build (mismo `next/og`, mismo `wawoff2`)                                                    |
| `src/proxy.ts` + `localeDetection`                  | no hay middleware                  | `localePrefix: "always"` + `generateStaticParams`; `out/index.html` detecta con `navigator.language` (con `<meta refresh>` y links visibles si no hay JS) |
| `headers()` de next.config (CSP, X-Frame-Options…)  | Pages no deja setear cabeceras     | `<meta http-equiv="Content-Security-Policy">` desde `src/lib/csp.ts`; se pierde `frame-ancestors` (no aplica en `<meta>`)                                 |
| ISR / `revalidate` / `cookies()`                    | no hay servidor                    | contenido nuevo = push y rebuild (2-3 min)                                                                                                                |
| optimización de imágenes on-demand (`/_next/image`) | no hay optimizador                 | `pnpm images:build` con sharp: AVIF+WebP en 640/960/1440 + blur del manifiesto, servidos con `<picture>`/`srcset` desde `ui/media.tsx`                    |
| `Cache-Control` custom                              | lo decide Pages                    | assets de `/_next/**` llevan hash; las fotos cambian de nombre con el contenido                                                                           |
| `src/app/[locale]/[...rest]` (404 por ruta)         | una catch-all no se puede exportar | `out/404.html` generado post-build (la tortuga), con `<link>` relativos para funcionar con o sin `basePath`                                               |

**A cambio:** costo cero, sin cuenta de terceros, sin superficie de servidor que
parchear, el mismo build sirve para `usuario.github.io/repo` y para el dominio
propio, y el control de versionado del contenido pasa a ser literalmente el repo.

**Consecuencias que hay que respetar:**

- Toda ruta de asset que Next no toca pasa por `withBase()` / `withBaseSrcset()`
  (`src/lib/base.ts`). Los JSON de contenido guardan **solo el nombre de archivo** y
  jamás el prefijo. Lo audita `tests/base-paths.test.ts`.
- Nada de `url(/…)` en estilos inline ni `fetch("/…")` sin helper.
- Un secreto **nunca** va en `NEXT_PUBLIC_*`: en Pages queda en el bundle público.

---

## 2025-10 · `out/index.html` y `out/404.html` se escriben post-build (no son rutas de App Router)

**Contexto.** El root layout con `<html>` es `src/app/[locale]/layout.tsx`. Para una
raíz `/` o un 404 global de App Router haría falta `src/app/layout.tsx`, y dos
layouts emitiendo `<html>` es HTML inválido (Next lo detecta y/o rompe la
hidratación). `app.notFound()` tampoco puede ser la tortuga bajo un `basePath` si
necesita rutas absolutas.

**Decisión.** `scripts/pages-static.ts` (paso `pages:build`, después de `next build`)
genera los dos archivos con HTML autocontenido: CSS enlazado **relativo** desde
`out/_next/static/css/*.css` (así funciona con o sin prefijo), la tortuga en SVG
inline dibujada con `stroke-dasharray` (no espera un chunk de JS), y sin dependencias
de runtime.

**Sacrificio:** el 404 no comparte los tokens de `globals.css` por clase, solo los
enlaza; si alguien cambia la paleta, el 404 se ve con la paleta nueva igual (usa las
mismas variables CSS) pero hay que acordarse de que el markup está en un script.

---

## 2025-10 · `useLocalPathname()` en vez de `usePathname()`, y `metadataBase` afuera

**Contexto.** Con `output: "export"`, Next 16.4.2 rompe al prerenderar:
`TypeError: Cannot read properties of null (reading 'pathname')`. Dos causas
distintas, ambas por leer el pathname de la request en un build donde no hay request:

1. `usePathname()` (el de `next/navigation` y el de `createNavigation` de next-intl)
   devuelve el contexto de enrutador, que en el prerender estático viene `null`.
2. Si `generateMetadata` define `metadataBase`, Next resuelve las URLs relativas de
   `alternates.canonical`/`languages` contra el pathname de la request → mismo crash.

**Decisión.**

- `src/i18n/use-local-pathname.ts`: `useSyncExternalStore` con snapshot de server
  `null` y `stripBaseAndLocale()` en el cliente (quita `basePath` y el prefijo de
  idioma). Los consumidores eligen su fallback: `locale-switch` usa `"/"`, y
  `scroll-fx` directamente ya no depende de la ruta (en un sitio multi-documento no
  hay navegación cliente→cliente que re-sincronizar).
- `generateMetadata` **sin** `metadataBase`: canonical, `hreflang`, `og:url` e
  `og:image` se arman absolutos con `absoluteUrl()` (origen + base + ruta). Es lo
  mismo que haría `metadataBase`, sin el bug, y funciona igual en project pages que
  en dominio propio.

**Sacrificio:** si mañana aparece una segunda página con rutas anidadas, el selector
de idioma va a necesitar que `stripBaseAndLocale` se pruebe con más casos (ya tiene
tests). Y `metadataBase` queda fuera: hay que acordarse de pasar URLs absolutas en
toda metadata nueva.

---

## 2025-10 · Las variantes de imagen se generan con sharp en build y el mapa queda commiteado

**Contexto.** En Pages no existe `/_next/image`, así que `next/image` con
`images.unoptimized` termina en un `<img>` con el JPEG original de 1.5 MB en un
teléfono. El sitio es mayormente fotos: sin `srcset` real, el LCP móvil se cae.

**Opciones.** (a) `pnpm images:build` con sharp y un archivo generado commiteado
(elegida); (b) generar en el postbuild y no commitear (rompe `pnpm lint`/`typecheck`
en un checkout limpio sin correr el script); (c) optimizar en el workflow sin
commitear el mapa (el desarrollador local no puede reproducir el `<img>` del build).

**Decisión.** `scripts/build-image-variants.ts` escribe
`public/images/_generated/<módulo>/<nombre>/<ancho>.{avif,webp,jpg}` (gitignoreado) y
reescribe `src/generated/image-variants.ts` (commiteado) con claves
`images/<módulo>/<archivo>.jpg` y rutas **sin** `basePath` (el prefijo lo pone
`withBaseSrcset` al render, así el mismo mapa sirve para localhost, Pages y dominio).
`ui/media.tsx` arma `<picture>` con `sizes` configurable y el blur del manifiesto como
`background-image`. Falta el mapa o una variante → cae al original, nunca a un hueco.

**Sacrificio:** `images:build` tarda ~2 min (AVIF), y el repo carga con un mapa
generado que hay que mantener commiteado cuando entran fotos nuevas. El script es
incremental por default (compara `mtime` contra la fuente y reconcilia las carpetas
huérfanas), y `FORCE_IMAGES=1` fuerza la re-codificación completa.
A cambio: 0 dependencias de servidor y 0 sorpresas en el despliegue.

---

## 2025-10 · La reserva no valida en el servidor (a propósito)

**Contexto.** Con Pages no hay dónde validar ni persistir. Podríamos haber dejado
`/api/booking` "para cuando haya servidor", y tener código muerto que da falsa
sensación de que algo se guarda.

**Decisión.** El formulario valida con **el mismo** Zod (`src/features/booking/schema.ts`)
en el cliente, arma el texto con `buildWhatsappHref` y abre WhatsApp. Si el local
configura `NEXT_PUBLIC_BOOKING_WEBHOOK_URL`, el navegador hace un `POST` fire-and-forget
a ese endpoint externo (Slack/Make/n8n/Worker). Sin la variable, **cero llamadas**: el
botón de WhatsApp no depende de que exista un registro.

**Sacrificio y advertencia explícita:** en Pages **no se guarda ninguna reserva**; no
hay anti-spam, ni rate limit, ni dedupe, ni validación real (un cliente modificado
puede mandar lo que quiera al webhook). El único registro que existe es la
conversación de WhatsApp del local. Si el día de mañana hay que guardar reservas o
mandar confirmaciones, el destino cambia a Vercel o al VPS (`pnpm build:server`) y
se devuelve el route handler, con la validación de servidor otra vez.

---

## 2025-10 · (contexto previo) Keystatic descartado; `motion` desinstalado

Dos decisiones que ya venían de antes y que esta migración respeta:

- **Keystatic/CMS visual**: se descarta. El cliente edita JSON y `pnpm content:check`
  es el portero con mensajes en español; los `add-*` de terminal hacen el alta guiada.
  Un CMS sumaría un build de admin y más superficie sin resolver el problema real
  (que el contenido quede validado). Es un upgrade **opcional**, no una falta.
- **`motion` (la librería)**: afuera, 70 KB gzip sin uso; Radix + CSS resuelven
  diálogos y tabs, y GSAP lo demás. `pnpm remove motion`.

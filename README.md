# Tartaruga Sea-Bar · demo de sitio

Demo comercial (sitio de muestra) para **Tartaruga Sea-Bar**, el mar-bar frente al
mar del Faro de Punta Colorada, Maldonado, Uruguay. Reemplaza la dupla
Instagram + WhatsApp por un sitio que vende la experiencia y convierte en un toque.

> ⚠️ **Esto es una demo.** No hay un solo dato inventado del local: los platos,
> fotos, horarios, teléfono de WhatsApp y beneficios están marcados como
> **muestra / a confirmar** en la propia UI y en `content/*.json`
> (`demo: true`, `confirmed: false`, `pending: true`). La lista completa de lo que
> falta validar está en [`docs/a-confirmar.md`](docs/a-confirmar.md).

**Concepto rector:** _el último rayo de sol_. Todo el sitio se ordena alrededor
del atardecer real de Punta Colorada: el cielo del hero se calcula con la hora
local del visitante, el fuego crece a medida que se baja hacia la noche, y la
reserva está siempre a un toque.

---

## Levantar el proyecto

```bash
pnpm install
cp .env.example .env.local     # opcional en dev: sin env el sitio igual corre
pnpm dev                       # http://localhost:3000
```

Node 20.11+ (probado en 22) y pnpm 9. Sin `pnpm`: `npm i -g pnpm@9`.

### Comandos

| Comando                                     | Qué hace                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `pnpm dev`                                  | Servidor de desarrollo (Turbopack).                                                      |
| `pnpm build`                                | `content:check` + build de producción. **Si la carta está mal escrita, la build falla.** |
| `pnpm start`                                | Sirve la build (usa `output: standalone`).                                               |
| `pnpm verify`                               | format:check + lint + typecheck + test + content:check + build. Lo mismo que corre CI.   |
| `pnpm content:check`                        | Validación de contenido con errores y avisos **en español**.                             |
| `pnpm content:optimize`                     | Optimiza fotos y escribe `public/images/_manifest.json` (dimensiones + blur).            |
| `pnpm content:placeholders`                 | Genera placeholders pintones (degradé de atardecer + caracola) para fotos que faltan.    |
| `pnpm content:sync-images`                  | Deduce qué JSON quiere cada foto del disco y avisa las huérfanas.                        |
| `pnpm add:dish` / `add:photo` / `add:promo` | Alta guiada por terminal (2 minutos, sin abrir el JSON).                                 |
| `pnpm test`                                 | Vitest: esquema de contenido, naming, cielo/sol, reservas, formato de precios.           |
| `pnpm analyze`                              | Bundle analyzer (`ANALYZE=1`).                                                           |

---

## Editar contenido sin tocar código

El local edita **solo `content/*.json` + soltar archivos en `public/images/…`**.
Nunca rutas: en el JSON va **el nombre de archivo** (`"pulpo-parrilla.jpg"`) y el
sitio lo busca en la carpeta del módulo. Guía paso a paso con ejemplos:
[`docs/agregar-contenido.md`](docs/agregar-contenido.md).

```
content/
  site.json          # datos del local: dirección, teléfono, horarios, links, SEO, moneda
  menu.json          # carta: categorías, platos, precios, tags, destacados
  gallery.json       # fotos del lugar (con `alt` obligatorio en español)
  experiences.json   # sunset / fuego-noche / brunch / eventos
  promos.json        # beneficios y promos (se autocomponen por fecha)
  faq.json           # preguntas frecuentes
public/images/
  hero/  menu/  gallery/  experiences/  promos/  icons/  brand/
```

Reglas que el sistema hace cumplir:

- **Un plato se ve solo si tiene foto.** `available: false` lo esconde.
- **`price` es un número** (`4500`). `0` o ausente → se muestra **“Consultar”**.
  El símbolo de la moneda sale de `site.json`, así cambiar de moneda no toca la carta.
- Textos bilingües `{ "es": "…", "en": "…" }`. Si falta `en`, se muestra `es` y
  `content:check` lo avisa (no rompe).
- `id` único → si no declarás `image`, se busca `<id>.jpg` por convención.
- Nombres de archivo: `kebab-case`, sin espacios, sin tildes, sin mayúsculas.
  Si escribís `Pulpo a la Parrilla.JPG`, el checker te sugiere el correcto.
- Soporta `jpg jpeg png webp avif svg`; las fotos > 500 KB o < 800 px de ancho
  generan aviso con el comando para arreglarlo.

### `content:check` (el portero)

Frena la build con errores cuando: un JSON es inválido o no valida el esquema,
falta un campo obligatorio, un precio no es número, hay `id` duplicado, la imagen
declarada no existe en disco (con sugerencia del nombre más parecido), un `alt`
brilla por su ausencia en una foto de galería, o un horario/no tiene formato `HH:MM`.
Avisa (sin frenar) de: fotos huérfanas, pesos extremos, imágenes sin foto,
textos sin traducción. Termina con un resumen (categorías, productos, fotos
usadas/huérfanas).

---

## Decisiones de producto y diseño

- **Hero "Atardecer en vivo".** El cielo se pinta con la **elevación solar real**
  de Punta Colorada (`SunCalc`, zona `America/Montevideo`): 8 keyframes
  interpolados en luz lineal alimentan a la vez variables CSS y uniforms del
  shader. Bajo el título: _"Hoy el sol se pone a las HH:MM"_ en vivo, y selector
  Mañana / Tarde / Atardecer / Noche (para el que llega a las 11 de la mañana y
  quiere saber cómo se ve a las 19:30).
- **Fuego.** Partículas GPU (`Three` + `@react-three/fiber`) que crecen con el
  scroll y siguen el cursor; en tier bajo son dos brasas CSS que respiran.
- **Audio opt-in, siempre.** La intro pregunta _¿Entrar con sonido o sin sonido?_
  Si el usuario no elige, no suena nada. Olas/fuego/brisa se sintetizan con
  Web Audio API (0 KB, 0 licencia) y se suspenden si la pestaña pasa a segundo
  plano. `public/audio/*.mp3` reemplaza la síntesis si el local graba ambiente.
- **Carta** con tabs accesibles (Radix), categorías con caracolas grabadas,
  revelado de foto por máscara + distorsión de agua al hover (solo en tier high),
  botón “Descargar carta PDF” **deshabilitado con explicación** mientras no haya PDF.
- **Lugar y atardecer**: tira horizontal con inercia + tilt, visor con GSAP Flip
  (vuela desde la miniatura) y swipe con Observer; mapa del lugar dibujado a mano
  en SVG (**sin API key ni trackers**), y el link de precisión lo deja a Google Maps.
- **Experiencias** con el cielo de su hora y WhatsApp pre-armado por tarjeta.
- **Beneficios** desde `promos.json`: una promo vencida **no se renderiza**, y si
  no hay vigentes la sección desaparece del HTML.
- **Preguntas frecuentes** desde `faq.json`: acordeón de Radix (teclado y
  `aria-expanded` gratis) con sello “a confirmar” por pregunta sin validar.
- **Reserva** = formulario con vista previa del mensaje + `POST /api/booking`
  (que reenvía a `BOOKING_WEBHOOK_URL` si existe). El canal real sigue siendo
  WhatsApp; el teléfono fijo **4432 18 31** está visible para llamar.
- **Easter eggs** que no estorban: cursor propio que cambia de verbo según el
  contexto (`ver / arrastrar / reservar`), 404 con la tortuga varada en la arena,
  botón “Hora del día”, transición _ola_ entre rutas e `h / k / j` para el cielo.

**Calidad adaptativa.** `detect-gpu` + `hardwareConcurrency` + `deviceMemory` +
**FPS real medido** deciden High / Medium / Low; se guarda en `localStorage` y en
`<html data-quality>`. El usuario puede forzar _Efectos: Max / Normal / Mínimo_.
Fuera del viewport o con la pestaña oculta, los canvases se pausan. Presupuesto:
contenido esencial visible sin JS ni WebGL, LCP < 2.5 s, 60 fps en un gama media
en Medium.

**Accesibilidad (no negociable).** Sin strobes ni flashes, todo respeta
`prefers-reduced-motion`, foco visible y navegación por teclado completa en
tabs/acordeón/diálogo, `aria-live` en el reloj del sol y en el estado del
formulario, `alt` obligatorio en galería con contrato de sentido, jerarquía de
headings, contraste verificado con overlays (los gradientes nunca tapan texto),
y skip-link. Header con `X-Frame-Options`, CSP, `Referrer-Policy`,
`rel="noopener noreferrer"` en todo link externo.

---

## Deploy

Guía completa (Vercel, Docker/Coolify, variables, dominio):
[`docs/deploy.md`](docs/deploy.md). Resumen:

```bash
# Vercel
vercel link && vercel env add NEXT_PUBLIC_SITE_URL production
vercel deploy --prod

# Docker (Coolify, Railway, un VPS)
docker build -t tartaruga .
docker run -p 3000:3000 --env-file .env.production tartaruga
```

---

## Documentación

| Archivo                                                    | Para quién                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| [`docs/agregar-contenido.md`](docs/agregar-contenido.md)   | El local: 5 pasos para plato / fotos / promo / horario / teléfono. |
| [`docs/deploy.md`](docs/deploy.md)                         | Quien despliega: Vercel y Docker/Coolify paso a paso.              |
| [`docs/a-confirmar.md`](docs/a-confirmar.md)               | Cliente: lista de datos que la demo **no** inventó.                |
| [`docs/checklist-material.md`](docs/checklist-material.md) | Proyecto: lo que hay que conseguir para pasar de demo a real.      |
| [`docs/diseno.md`](docs/diseno.md)                         | Diseño: paleta, tipografía, motion, tiers de calidad.              |
| [`docs/credits.md`](docs/credits.md)                       | Licencias de fuentes, audio, íconos y fotos de muestra.            |
| [`CLAUDE.md`](CLAUDE.md)                                   | IA/mantenedor: arquitectura, convenciones, trampas ya conocidas.   |

## Stack

Next 16 (App Router, `output: standalone`) · React 19 · TypeScript estricto ·
Tailwind 4 con tokens CSS · next-intl (ES/EN, PT listo) · GSAP 3.15 (ScrollTrigger, SplitText,
Flip, DrawSVG, CustomEase, Observer; los plugins se cargan aparte del núcleo) ·
Lenis · Three + R3F + drei (lazy, nunca en el bundle
inicial) · Zustand · Zod · SunCalc · detect-gpu · Radix (dialog/tabs/accordion) ·
Vitest · tsx · sharp · ESLint 9 + Prettier · GitHub Actions.

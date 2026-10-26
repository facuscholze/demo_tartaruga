# Checklist: de demo a sitio real

Marcar lo que ya está; lo que falta es la lista de compras del proyecto. El
objetivo es que **nada de esto requiera tocar código**: es contenido y archivos.

## Material

- [ ] **Logo en vector** (`.svg` + `.ai/.eps`), versiones monocroma y a 1 tinta,
      y el isotipo solo (la tortuga). → reemplazar `public/images/brand/logo-tortuga.svg`
      y `src/components/brand/turtle.tsx` (dibujado propio para la demo).
- [ ] **Fotos del lugar en alta** (mínimo 2400 px de lado, JPG o AVIF, sin marca
      de agua): 8–12 de atardecer/noche, 6 del deck y las mesas, 4 del entorno
      (faro, médanos, rambla). Se sueltan en `public/images/gallery/` y se
      registran en `content/gallery.json`.
- [ ] **Fotos de cada plato** (mínimo 1200 px, misma luz y mismo fondo para que la
      carta se vea pareja) → `public/images/menu/`.
- [ ] **Video corto del atardecer** (10–20 s, vertical y horizontal, con audio
      ambiente limpio) para el hero en desktop; hoy el hero es WebGL + CSS y no
      necesita video, así que es un upgrade opcional.
- [ ] **Grabaciones propias de ambiente** (olas, fuego, brisa; loops de 20–60 s,
      -18 dBFS pico) → `public/audio/{olas,fuego,brisa}.mp3`. Sin estos archivos
      sigue sonando la síntesis Web Audio (0 KB, sin licencia).
- [ ] **Carta en PDF** accesible (texto real, no escaneo) → `public/docs/carta-tartaruga.pdf`
      y `site.json → links.menuPdf`.
- [ ] Fotografía para OG propia, si quieren que el card sea una foto y no la
      composición generada (hoy se dibuja sola con `pnpm og:build` → `public/og/<idioma>.png`, en build y sin servidor).

## Datos (ver `docs/a-confirmar.md`)

- [ ] Horarios confirmados por temporada, con `confirmed: true`.
- [ ] Teléfono/WhatsApp confirmados (`contact.whatsapp.confirmed: true`).
- [ ] Precios reales, en UYU, como números.
- [ ] Política de mascotas redactada por el local.
- [ ] Historia/copy de “artesanal” escrito por el local (hoy está marcado provisorio).
- [ ] Promos y beneficios con fecha, banco, tope y términos → `content/promos.json`.
- [ ] Descripción SEO final en `site.json → seo` (y `servesCuisine` / `priceRange`
      para el JSON-LD, que hoy se omiten a propósito).
- [ ] `demo: false` en `site.json`, `menu.json`, `gallery.json` y
      `experiences.json` (los sellos de la UI dependen de ese flag).

## Antes de publicar

- [ ] `pnpm verify` en verde (formato, lint, typecheck, tests, `content:check`, build).
- [ ] `pnpm content:optimize` después de cada tanda de fotos nuevas.
- [ ] Probar en un teléfono real: carta, galería con el visor, formulario de
      reserva → que WhatsApp abra con el mensaje completo, y el 404.
- [ ] Lighthouse mobile > 90 en Performance y 100 en Accessibility/Best Practices
      (presupuesto del proyecto: LCP < 2.5 s, 60 fps en gama media en tier Medium).
- [ ] Con `prefers-reduced-motion` prendido: que nada se mueva y todo se lea.
- [ ] Sin JavaScript: la carta, los horarios, la dirección y el teléfono visibles.
- [ ] Card social validado (OpenGraph.xyz) en `/`, `/en`, `/pt`.
- [ ] Search Console: sitemap enviado, 3 idiomas indexados con `hreflang`.
- [ ] Variables de entorno del entorno productivo cargadas
      (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_PHONE`, `BOOKING_WEBHOOK_URL`).
- [ ] Test del webhook con una reserva real (llega mensaje, no se guarda nada en el sitio).
- [ ] Avisar al cliente cómo se edita la carta: `docs/agregar-contenido.md`
      (5 pasos) o el asistente `pnpm add:dish`.

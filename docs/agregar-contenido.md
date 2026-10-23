# Editar el contenido en 5 pasos

Todo acá se hace sobre archivos en `content/` y fotos en `public/images/`. No se
toca código, no se toca el diseño, y si algo queda mal escrito el comando
`pnpm content:check` te lo dice en español **antes** de publicar.

Si tenés terminal a mano, los tres asistentes te ahorran abrir el JSON:

```bash
pnpm add:dish        # alta de un plato: te pregunta categoría, nombre, precio, foto
pnpm add:photo       # copia una foto a la carpeta correcta con nombre normalizado
pnpm add:promo       # alta de una promo/beneficio con su fecha de vencimiento
```

Corren en la terminal y te van preguntando. Si preferís automatizar (un script del
local, un CI), aceptan las respuestas por caño, en el mismo orden en que se preguntan:

```bash
printf "2\nChorizo de mar\n\n0\nAlmejas del puerto a la brasa.\n\n\nn\n" | pnpm add:dish
```

---

## 1 · Agregar un plato

```bash
pnpm add:dish
```

O a mano: abrir `content/menu.json`, buscar la categoría y agregar una entrada a
su `items`:

```jsonc
{
  "id": "salmide-a-la-brasa", // único, sin espacios, sin tildes
  "name": { "es": "Salmide a la brasa", "en": "Grilled bay scallop" },
  "description": { "es": "Con mantequilla de ajo y limón de la huerta." },
  "price": 5200, // solo números. 0 o "consultar": poner 0
  "tags": ["brasa", "para-compartir"],
  "featured": true, // lo destaca en la carta
  "available": true, // false = no se muestra (temporada baja)
  "order": 3, // ordena la lista; si no va, el del archivo
}
```

Guardá la foto como `public/images/menu/salmide-a-la-brasa.jpg`
(mismo nombre que el `id`, en minúscula, `kebab-case`). **No hay que decirle a
ningún archivo dónde está la foto**: se resuelve por convención. Si un día la
sacás, el plato sigue apareciendo con un fondo pintón en vez de un hueco blanco.

> Si el plato se llama distinto del archivo, escribí `"image": "otra-foto.jpg"`
> en el JSON. Siempre **solo el nombre**, nunca `public/images/...`.

Corré el chequeo:

```bash
pnpm content:check
```

## 2 · Subir fotos del lugar (galería)

1. Copiá las imágenes a `public/images/gallery/` con nombre descriptivo en
   minúsculas: `faro-atardecer.jpg`, `mesa-larga-noche.jpg`.
2. Regистраlas en `content/gallery.json`:

```jsonc
{
  "image": "faro-atardecer.jpg",
  "alt": { "es": "El faro de Punta Colorada al atardecer desde el deck" },
  "section": "sunset", // lugar | sunset | noche | deck | fuego
  "caption": { "es": "19:12, el último rayo sobre el faro" },
  "weight": 3, // 0..3: qué tan grande se ve en la tira
  "order": 1,
}
```

`alt` en español **es obligatorio** y tiene que describir la foto (lo usan
lectoras de pantalla y Google Images).

3. Optimizá y actualizá el manifiesto de dimensiones (esto es lo que hace que el
   layout no salte y que aparezca el blur de carga):

```bash
pnpm content:optimize
pnpm content:check
```

Si subís una foto que ningún JSON pide, `content:check` la lista como _huérfana_
(y `content:sync-images` te dice en qué archivo la esperabas).

## 3 · Cargar una promo o beneficio

```bash
pnpm add:promo
```

o en `content/promos.json`:

```jsonc
{
  "id": "scotiabank-10",
  "title": { "es": "10% con Scotiabank", "en": "10% with Scotiabank" },
  "details": { "es": "Válido los martes y miércoles, de 19 a 22 h." },
  "validFrom": "2026-11-01",
  "validUntil": "2026-12-31",
  "active": true,
  "pending": true, // true → se ve con sello "a confirmar"
  "terms": { "es": "No acumulable con otras promociones." },
  "image": "promo-scotiabank.jpg",
}
```

- Pasado `validUntil`, la promo **desaparece sola** (la fecha se lee en la zona
  horaria del local, no en la del visitante). Si no queda ninguna, la sección
  Beneficios no se renderiza.
- `active: false` la apaga sin borrarla del archivo.

## 4 · Cambiar horarios (y que se crea el cliente)

En `content/site.json`, bloque `hours`:

```jsonc
{
  "id": "temporada-alta",
  "label": { "es": "Temporada alta" },
  "days": ["jue", "vie", "sab", "dom"],
  "open": "19:00",
  "close": "01:00",
  "note": { "es": "Cocina hasta las 23:30." },
  "confirmed": true, // false → el sitio muestra "a confirmar"
}
```

Mientras `confirmed` sea `false`, el frente muestra **“a confirmar”** en vez de
horarios: el sitio nunca le dice a un cliente un horario que el local no validó.
`days: []` (como está hoy) = “todavía sin días cargados”.

## 5 · Teléfono, WhatsApp y links

También en `content/site.json`:

```jsonc
"contact": {
  "phoneDisplay": "4432 18 31",
  "phoneE164": "+59844321831",
  "whatsapp": { "phoneE164": "+598…", "shortLink": "https://wa.me/message/…", "confirmed": true }
},
"links": {
  "instagram": "https://www.instagram.com/tartaruga.puntacolorada/",
  "instagramHandle": "@tartaruga.puntacolorada",
  "maps": "https://www.google.com/maps/search/?api=1&query=…",
  "menuPdf": "/docs/carta-tartaruga.pdf"   // si está vacío, el botón sale deshabilitado
}
```

El número de WhatsApp también se puede fijar sin tocar contenido con
`NEXT_PUBLIC_WHATSAPP_PHONE` en el entorno (gana sobre el JSON). Si el local deja
de usar el formulario y solo quiere WhatsApp, se puede ocultar la sección de
reserva sin más que borrar su línea en `src/app/[locale]/page.tsx`.

### Carta en PDF (opcional)

Subí el archivo a `public/docs/carta-tartaruga.pdf` y poné esa ruta relativa en
`site.json → links.menuPdf`. Hasta entonces el botón aparece deshabilitado con
un tooltip que explica por qué (mejor eso que un link muerto).

---

## Cuando algo no anda

```bash
pnpm content:check
```

Ejemplos reales de lo que vas a leer:

```
✖ [menu.json] postres › "price"
  el precio tiene que ser un número entero en la moneda de site.json
  (ej. 4500), sin "$" ni texto; 0 o ausente muestra "Consultar"
✖ [gallery.json] items[4] › "image"
  no existe "sunset-01.JPG" en public/images/gallery/
  → ¿quisiste decir "sunset-01.jpg"?
▲ [menu.json] mar › pulpo-parrilla
  no tiene foto: se va a usar el fallback visual (degradé + caracola)
```

Los `✖` frenan la build; los `▲` son avisos. Después de tocar fotos, corré
`pnpm content:optimize` para que se regenere el manifiesto.

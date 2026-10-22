# Deploy

El destino principal es **GitHub Pages** sirviendo el export estático de Next
(`out/`). Vercel y Docker/Coolify siguen funcionando, pero son opcionales: para
eso está `pnpm build:server`.

| Ruta           | Runtime          | Cache headers    | Reservas server-side              | Ideal para                     |
| -------------- | ---------------- | ---------------- | --------------------------------- | ------------------------------ |
| **Pages**      | estático (HTML)  | fijos            | no                                | demo, costo cero, repo público |
| Vercel         | Next standalone  | sí (vercel.json) | sí (`/api/booking` si lo agregás) | dominio propio sin servidor    |
| Docker/Coolify | `node server.js` | los que pongas   | igual que arriba                  | VPS propio, datos en tu infra  |

---

## A · GitHub Pages (recomendado)

### 1 · Activarlo una sola vez

Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
No hay que tocar nada más: el workflow hace el build y sube el artefacto.
Si en cambio elegís "Deploy from a branch", **no va a funcionar**: la rama no
tiene `out/` compilado.

### 2 · Dónde va a vivir (esto define el `basePath`)

El workflow lo calcula solo, en este orden:

1. `public/CNAME` existe y tiene contenido → dominio propio, **`basePath` vacío**.
2. El repo se llama `<usuario>.github.io` → **`basePath` vacío**.
3. Cualquier otro repo → **`basePath = /<nombre-del-repo>`**
   (`https://facuscholze.github.io/demo_tartaruga/`).

**Nada de esto hardcodea el nombre del repo en el código**: `basePath` y
`assetPrefix` salen de `NEXT_PUBLIC_BASE_PATH`, y todo asset pasa por
`withBase()` (`src/lib/base.ts`). Por el mismo motivo el build es portable: con
`NEXT_PUBLIC_BASE_PATH=""` el mismo `out/` sirve en la raíz de un dominio propio.

### 3 · Dominio propio (opcional)

```bash
echo tartarugapuntacolorada.com > public/CNAME    # commit + push
```

Y en el DNS del dominio: `CNAME` → `facuscholze.github.io` (si es el ápice, o
los `A` `185.199.108.153 … .111.153` que da GitHub). Pages pide el certificado
solo; tarda unos minutos y hay que marcar "Enforce HTTPS". Con `CNAME` el
`basePath` pasa a vacío y `NEXT_PUBLIC_SITE_URL` pasa a ser `https://el-dominio`.

### 4 · Variables (todas de **build**, no de runtime)

| Variable                          | Para qué                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`            | canonical, `hreflang`, `og:image`, `sitemap.xml`, `robots.txt`, JSON-LD. Sin barra final. |
| `NEXT_PUBLIC_BASE_PATH`           | `""` o `/demo_tartaruga`. Lo pone el workflow; en local solo para probar.                 |
| `NEXT_PUBLIC_WHATSAPP_PHONE`      | número de reserva (gana sobre `content/site.json`).                                       |
| `NEXT_PUBLIC_WHATSAPP_LINK`       | link corto `wa.me/message/…`, si el local lo tiene.                                       |
| `NEXT_PUBLIC_BOOKING_WEBHOOK_URL` | opcional: endpoint **público** donde el navegador copia la reserva.                       |

`NEXT_PUBLIC_*` se **inlinan en el bundle**: cambiarlas exige re-deployar (no
alcanza con editar el entorno). Y por el mismo motivo: **jamás un secreto en una
variable `NEXT_PUBLIC_*`**, en Pages queda legible en el HTML/JS público.

### 5 · Probar el export en local, como lo vería Pages

```bash
pnpm build                     # deja out/ completo (~2,5 min la primera vez)
pnpm serve                     # http://localhost:3000  (sin dependencias, scripts/serve.ts)
```

`pnpm serve` es un servidor de 90 líneas que replica lo que hace Pages: sirve
`index.html` de cada carpeta (por `trailingSlash: true`) y responde el contenido de
`out/404.html` con status 404 para lo que no existe. Si además le pasás el prefijo,
monta el sitio ahí — que es exactamente la situación de un repo que no es
`<usuario>.github.io`:

```bash
NEXT_PUBLIC_BASE_PATH=/demo_tartaruga pnpm build          # build CON prefijo
NEXT_PUBLIC_BASE_PATH=/demo_tartaruga pnpm serve          # http://localhost:3000/demo_tartaruga/
curl -fsS localhost:3000/demo_tartaruga/es/ | grep -c tartaruga
curl -fsS -o /dev/null -w '%{http_code}\n' localhost:3000/demo_tartaruga/no-hay/   # 404
```

Con `npx serve out` también se puede (no hace falta instalar nada, y para el caso
con prefijo se simula con un symlink al export):

```bash
npx serve out
mkdir -p /tmp/root && ln -sfn "$PWD/out" /tmp/root/demo_tartaruga
(cd /tmp/root && python3 -m http.server 8099)   # http://localhost:8099/demo_tartaruga/es/
```

Lo mínimo que hay que ver: las 3 fotos del `<picture>` cargando en AVIF (DevTools →
Network → `image/avif`), el audio con el toggle (no autoplay), el cambio de idioma
desde el header, y `/demo_tartaruga/no-hay/` mostrando la tortuga del 404.

Checklist mínimo después de un deploy: `/`, `/es/`, `/en/`, `/pt/` (el selector de
idioma y los 3 idiomas), una foto de la carta en el `<picture>` (que no dé 404 en
DevTools → Network), el audio con el toggle, y una URL inventada
(`/demo_tartaruga/no-existe/`) para ver la tortuga del 404.

### 6 · Lo que Pages **no** puede hacer (y por qué no está en el repo)

Todo esto se sacó en la migración; si alguna vez hace falta, el destino pasa a
ser Vercel o el VPS con `pnpm build:server`:

- **Route handlers / `/api/booking`**: no corre Node. El formulario arma el mensaje
  y abre `wa.me`; si querés registro, `NEXT_PUBLIC_BOOKING_WEBHOOK_URL` apunta a un
  endpoint externo con CORS (Slack, Make, n8n, Cloudflare Worker) y lo llama el
  navegador. Sin la variable, no se hace ningún pedido. **En Pages no se guarda
  ninguna reserva**: no hay dónde.
- **`middleware.ts`/`proxy.ts`**: no existe. El enrutado de idiomas es estático
  (`localePrefix: "always"`, `localeDetection: false`) y la detección de idioma vive
  en `out/index.html`, que se genera post-build con `navigator.language`.
- **`headers()` y `redirects()` de `next.config.ts`**: no se pueden usar. La CSP va
  como `<meta http-equiv="Content-Security-Policy">` (`src/lib/csp.ts`), con la
  limitación de que `frame-ancestors` no aplica en `<meta>` (para eso haría falta un
  proxy delante).
- **Cache custom**: Pages manda sus propios `Cache-Control`. Como ventaja, los
  assets de `/_next/static/**` ya vienen con hash en el nombre; las fotos cambian
  de nombre cuando cambia el contenido, así que no dependemos de headers largos.
- **ISR / `revalidate` / `cookies()` / `headers()`**: la build prerendera los 3
  idiomas con `generateStaticParams` + `setRequestLocale`; nada se revalida solo.
  Publicar contenido nuevo = push (el workflow reconstruye).
- **OG en runtime** (`/og/[locale]`): se genera en build a `public/og/<locale>.png`
  con `pnpm og:build` (`next/og` vía `tsx`, same ImageResponse, sin servidor).
- **Imágenes optimizadas on-demand** (`/_next/image`): no hay optimizador, por eso
  `images: { unoptimized: true }` y las variantes se generan con `pnpm images:build`
  (AVIF + WebP en 640/960/1440 + blur del manifiesto) y se sirven con `srcset`
  desde `ui/media.tsx`.
- **`publicPath` / `output: export` + `next dev`**: en dev el `basePath` se respeta
  para los assets de Next pero el prefijo de `withBase` depende del env; si ves 404
  de imágenes en `pnpm dev`, chequejá que `NEXT_PUBLIC_BASE_PATH` esté vacío en
  `.env.local`.

### 7 · El 404 y la página raíz

`out/404.html` es la tortuga varada: Pages la sirve para cualquier ruta inexistente
(deep links de campaña, typos). Se escribe post-build (`scripts/pages-static.ts`)
porque el root layout con `<html>` vive en `src/app/[locale]/layout.tsx` y un
`app/not-found.tsx` global exigiría un segundo `<html>`. Sus `<link>` son
**relativos**, así que funciona igual con o sin `basePath`. Lo mismo aplica a
`out/index.html`, que además lleva el redirector por `navigator.language`
(`location.replace` + `<meta http-equiv="refresh">` + links visibles si no hay JS).

---

## B · Vercel (opcional)

```bash
npm i -g vercel
vercel link && vercel env add NEXT_PUBLIC_SITE_URL production
vercel deploy --prod
```

Sin CLI: importá el repo en `vercel.com/new`, framework **Next.js**, build command
`pnpm build:server` (ya está en `vercel.json`, junto con la región `gru1` y el
`Cache-Control` de `/images/*` que en Pages no podemos poner). `NEXT_PUBLIC_BASE_PATH`
se queda vacío: Vercel sirve en la raíz.

## C · Docker en Coolify / un VPS (opcional)

```bash
docker build -t tartaruga .          # adentro corre pnpm build:server
docker run -d --name tartaruga -p 3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://dominio.com \
  -e NEXT_PUBLIC_WHATSAPP_PHONE=5984321831 \
  --restart unless-stopped tartaruga
```

Coolify: _New Resource → Dockerfile_, `Context: .`, puerto 3000, dominio en
_Domains_. Con servidor propio sí podés agregar `middleware`/route handlers de
nuevo (el `Dockerfile` ya usa `build:server` para eso).

### Reverse proxy + HTTPS (VPS propio)

```nginx
server {
  listen 443 ssl http2;
  server_name dominio.com www.dominio.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_http_version 1.1;
  }
}
```

Los headers de seguridad los pone la app en `<meta>` (CSP) y en `next.config.ts`
en modo server; no hace falta duplicarlos en nginx.

---

## D · Dominio y SEO de arranque

1. `NEXT_PUBLIC_SITE_URL` exacto (sin `/` final, con `https://`). Si el sitio vive
   bajo `/repo`, **no** lo pongas con el `/repo`: el prefijo lo agrega
   `absoluteUrl()`.
2. Search Console → _Add property_ (Domain) → verificar con el TXT que da Google.
3. Submit de `https://<dominio>/sitemap.xml` (en Pages:
   `https://usuario.github.io/repo/sitemap.xml`, que es lo que ya escribe el build).
4. En 1-2 semanas revisar que las 3 versiones (`/es/`, `/en/`, `/pt/`) indexen con
   su `hreflang` (lo emite el layout, con URLs absolutas incluyendo el prefijo).

## E · Publicar cambios de contenido

El flujo normal no es un deploy de código, es un commit de JSON:

```bash
git add content public/images && git commit -m "content: carta de verano"
git push        # Pages: el workflow reconstruye el export
```

`pnpm build` corre `content:check` antes de compilar: si un JSON quedó mal, **el
deploy falla y no se publica**, que es lo que queremos. Después de agregar fotos
nuevas conviene commitear también `src/generated/image-variants.ts` (el mapa de
variantes) para que el repo quede consistente sin generar nada.

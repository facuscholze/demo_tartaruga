# Deploy

Dos caminos, mismo artefacto: la app se compila con `output: "standalone"`, así
que serve un `node server.js` y no depende de `node_modules` completos.

---

## A · Vercel (recomendado para empezar)

Cero infraestructura, HTTPS, dominio propio, cache de imágenes y preview por PR.

```bash
npm i -g vercel
vercel link                       # elegí el equipo y el proyecto
vercel                            # preview (dev.plataforma.app)
vercel env add NEXT_PUBLIC_SITE_URL production       # https://dominio.com
vercel env add NEXT_PUBLIC_WHATSAPP_PHONE production # 59844321831
vercel env add BOOKING_WEBHOOK_URL production        # opcional
vercel deploy --prod
```

Sin CLI: importá el repo en `vercel.com/new`, framework **Next.js**, build
command `pnpm build`, y cargá las tres variables en *Settings → Environment
Variables*.

Qué ya viene listo en el repo:
`vercel.json` con región `gru1` (São Paulo: menos latencia desde Uruguay),
`installCommand: pnpm install --frozen-lockfile` y `Cache-Control` de 1 año para
`/images/*` (los nombres de archivo cambian cuando el contenido cambia).

**Después del deploy:** abrí `https://dominio.com/og/es` (tiene que dar PNG
1200×630), pegá el link en [wa.me](https://wa.me) o en
[OpenGraph.xyz](https://www.opengraph.xyz) y mirá el card. Si el card sale sin
imagen, casi siempre es `NEXT_PUBLIC_SITE_URL` mal puesto (con `/` al final o con
`http://`).

---

## B · Docker en Coolify / un VPS

```bash
docker build -t tartaruga .
docker run -d --name tartaruga -p 3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://dominio.com \
  -e NEXT_PUBLIC_WHATSAPP_PHONE=59844321831 \
  --restart unless-stopped tartaruga
```

Coolify: *New Resource → Docker Compose* (o *Dockerfile*), y en Build Settings
`Context: .`, `Dockerfile: Dockerfile`. Puente de puerto 3000, dominio en
*Domains*, y Let's Encrypt con *Auto Let's Encrypt Check*.

`docker-compose.yml` mínimo si preferís declarativo:

```yaml
services:
  web:
    build: .
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_SITE_URL: https://dominio.com
      NEXT_PUBLIC_WHATSAPP_PHONE: "59844321831"
      BOOKING_WEBHOOK_URL: ""
    restart: unless-stopped
```

### Variables

| Variable | Dónde | Si no la ponés |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | build **y** runtime | canonical, OG, sitemap y robots salen con el dominio de ejemplo |
| `NEXT_PUBLIC_WHATSAPP_PHONE` | runtime | usa `contact.whatsapp.phoneE164` de `content/site.json` |
| `NEXT_PUBLIC_WHATSAPP_LINK` | runtime | usa `contact.whatsapp.shortLink`, o `wa.me/<teléfono>` |
| `BOOKING_WEBHOOK_URL` | runtime | `/api/booking` responde OK y no reenvía (el formulario igual abre WhatsApp) |

`NEXT_PUBLIC_*` se **inlinan en la build**: si las cambiás, hay que reconstruir la
imagen (en Vercel: redeploy).

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
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Los headers de seguridad (CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`) los
pone la app en `next.config.ts`; no hace falta duplicarlos en nginx (y si los
ponés en los dos lados, se pegan dos veces).

---

## C · Dominio y SEO de arranque

1. `A`/`CNAME` del dominio al proveedor, y `NEXT_PUBLIC_SITE_URL` exacto
   (sin `/` final, con `https://`).
2. Search Console → *Add property* (Domain) → verificar con el TXT que da Google.
3. Submit de `https://dominio.com/sitemap.xml`.
4. Revisar en 1-2 semanas que las 3 versiones (`/`, `/en`, `/pt`) indexen con su
   `hreflang` (el tag ya lo emite el layout).

## D · Publicar cambios de contenido

El flujo normal no es un deploy de código, es un commit de JSON:

```bash
git add content public/images && git commit -m "content: carta de verano"
git push                          # Vercel/Coolify hacen el deploy solos
```

`pnpm build` corre `content:check` antes de compilar: si un JSON quedó mal,
**el deploy falla y no se publica**, que es lo que queremos.

# Imagen standalone para Coolify / un VPS con Docker.
# Next 16 + `output: "standalone"`: la build copia solo lo que el server usa,
# así la imagen final pesa ~200 MB en vez de ~1.5 GB con node_modules enteros.
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# pnpm se instala explícito, sin corepack: la imagen node:22-alpine lo trae pero
# está deprecado (y en Node 25 se va), y `corepack enable pnpm@9.15.0` — que es
# como estaba antes — ni siquiera es sintaxis válida: `enable` solo acepta nombres
# de paquete, así que la build de la imagen moría con
# "Only 'npm', 'pnpm', 'yarn' … are supported". La misma versión (9.15.0) que usa
# `pnpm/action-setup` en CI, para que el lockfile se resuelva igual.
RUN npm i -g pnpm@9.15.0 && pnpm --version

# ---- deps -------------------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# ---- build ------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `build:server` (no `build`): adentro de un contenedor SÍ hay runtime de Node,
# así que conviene `output: "standalone"` en vez del export estático. El
# orquestador igual corre content:check + variantes de imagen + OG antes.
# `content:check` frena la build si un JSON está mal (mejor fallar acá que
# publicar un sitio con la carta rota).
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_SITE_URL=""
ARG NEXT_PUBLIC_WHATSAPP_PHONE=""
ARG NEXT_PUBLIC_WHATSAPP_LINK=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_WHATSAPP_PHONE=$NEXT_PUBLIC_WHATSAPP_PHONE
ENV NEXT_PUBLIC_WHATSAPP_LINK=$NEXT_PUBLIC_WHATSAPP_LINK
RUN pnpm build:server

# ---- run --------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]

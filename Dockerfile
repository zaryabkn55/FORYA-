# FORYA — production image.
#
# One container serves both halves of the product: the Express API and the built web app,
# on one origin. That means no CORS to misconfigure, one TLS certificate, one deploy that
# can't drift out of step with itself, and one service to pay for.
#
# Build from the repository root:
#   docker build -t forya .
#   docker run -p 4000:4000 --env-file .env forya

# ── 1 · the web app ───────────────────────────────────────────────────────────
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Relative /api paths in the client mean the bundle doesn't need to know its own hostname.
RUN npm run build

# ── 2 · the API ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS api
WORKDIR /api
RUN apk add --no-cache openssl libc6-compat
COPY backend/package*.json ./
RUN npm ci
COPY backend/prisma ./prisma/
RUN npx prisma generate
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npx tsc

# ── 3 · runtime ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat tini

ENV NODE_ENV=production
ENV PORT=4000
# Where app.ts looks for the web build.
ENV WEB_ROOT=/app/public

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# The generated Prisma client is a build artifact, not something npm installs.
COPY --from=api /api/node_modules/.prisma ./node_modules/.prisma
COPY --from=api /api/dist ./dist
COPY backend/prisma ./prisma
COPY --from=web /web/dist ./public
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Run as the unprivileged user the base image already provides.
RUN chown -R node:node /app
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1

# tini reaps zombies and forwards SIGTERM, so the graceful shutdown in index.ts actually runs.
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]

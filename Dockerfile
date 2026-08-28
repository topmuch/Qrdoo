# QR Domotik - Optimized Multi-Stage Dockerfile for Coolify

# ── Stage 1: Dependencies ──
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat sqlite
RUN npm install -g bun
WORKDIR /app
COPY package.json bun.lock* package-lock* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

# ── Stage 2: Build ──
FROM deps AS builder
COPY prisma ./prisma/
COPY scripts ./scripts/
COPY public ./public/
COPY next.config.ts .
COPY tsconfig.json .
COPY postcss.config.mjs .
COPY tailwind.config.ts .
COPY components.json .
COPY src ./src/
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/qrdomotik.db
RUN npx prisma generate
RUN bun run build

# ── Stage 3: Production (minimal) ──
FROM node:20-alpine AS runner
RUN apk add --no-cache sqlite

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrdomotik.db

# Copy standalone output + static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# CRITICAL: Remove .env from standalone output!
# The standalone copies the project's .env (with LOCAL db path),
# which overrides the Docker DATABASE_URL env var in Prisma's lazy loading.
RUN rm -f .env && echo 'DATABASE_URL=file:/app/data/qrdomotik.db' > .env

# Copy prisma runtime (generated client)
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy schema.sql for db-init.ts to read at startup
COPY --from=builder /app/scripts/schema.sql ./scripts/schema.sql

RUN mkdir -p /app/data
EXPOSE 3000

# DB init + seeding runs inside Next.js via instrumentation.ts
CMD ["node", "server.js"]

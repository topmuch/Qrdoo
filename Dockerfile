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

# ── Stage 3: Production ──
FROM node:20-alpine AS runner
RUN apk add --no-cache sqlite && sqlite3 --version

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

# Remove project .env (has LOCAL db path) and write Docker-specific one
RUN rm -f .env && echo 'DATABASE_URL=file:/app/data/qrdomotik.db' > .env

# Copy prisma runtime (generated client)
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy SQL files for init
COPY --from=builder /app/scripts/schema.sql ./scripts/schema.sql
COPY --from=builder /app/scripts/seed-users.sql ./scripts/seed-users.sql

RUN mkdir -p /app/data
EXPOSE 3000

# 1) Create all tables with sqlite3 CLI (zero Prisma dependency)
# 2) Seed admin + demo users with sqlite3 CLI (pre-hashed passwords)
# 3) Start Next.js
CMD ["sh", "-c", "sqlite3 /app/data/qrdomotik.db < scripts/schema.sql && echo '[init] Schema OK' && sqlite3 /app/data/qrdomotik.db < scripts/seed-users.sql && echo '[init] Users seeded' && exec node server.js"]

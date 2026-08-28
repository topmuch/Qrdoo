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
# Use Node.js directly (not bun) so NODE_OPTIONS memory limit works
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npx prisma generate
RUN npx next build

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

# Ensure data directory exists, then copy SQL files
RUN mkdir -p /app/data
COPY --from=builder /app/scripts/schema.sql /app/data/schema.sql
COPY --from=builder /app/scripts/seed-users.sql /app/data/seed-users.sql

# Verify SQL files and sqlite3 CLI are present
RUN echo "--- Container pre-flight ---" \
  && echo "sqlite3: $(which sqlite3)" \
  && sqlite3 --version \
  && echo "schema.sql: $(wc -l < /app/data/schema.sql) lines" \
  && echo "seed-users.sql: $(wc -l < /app/data/seed-users.sql) lines" \
  && echo "--- End pre-flight ---"
EXPOSE 3000

# instrumentation.ts (inside Next.js process) runs sqlite3 CLI.
# CMD is simple - Coolify may override it, but can't override instrumentation.
CMD ["node", "server.js"]

# ==================== Dependencies ====================
FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ==================== Build ====================
FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (these are baked into the Next.js bundle)
# Pass actual values via --build-arg or docker-compose
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

ENV NEXT_OUTPUT_STANDALONE=true
# lib/db.ts requires DATABASE_URL at import; build only loads modules (never
# connects for real), so a placeholder suffices. Real value comes at runtime.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build

# ==================== Production ====================
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

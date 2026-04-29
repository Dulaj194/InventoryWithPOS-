# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web-next/package.json apps/web-next/package.json
COPY apps/api-nest/package.json apps/api-nest/package.json
COPY packages/db-prisma/package.json packages/db-prisma/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/config/package.json packages/config/package.json

RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment to production for build
ENV NODE_ENV=production
RUN npm run build --workspace=@mypos/web

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/apps/web-next/public ./apps/web-next/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-next/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-next/.next/static ./apps/web-next/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web-next/server.js"]

# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api-nest/package.json apps/api-nest/package.json
COPY apps/web-next/package.json apps/web-next/package.json
COPY packages/db-prisma/package.json packages/db-prisma/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/config/package.json packages/config/package.json

RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run db:generate
RUN npm run build --workspace=@mypos/api
RUN test -f /app/apps/api-nest/dist/main.js

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy only necessary files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/apps/api-nest/package.json ./apps/api-nest/package.json
COPY --from=builder /app/packages/db-prisma/package.json ./packages/db-prisma/package.json
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/package.json

# Install production dependencies only
RUN npm ci --omit=dev

# Copy build artifacts
COPY --from=builder /app/apps/api-nest/dist ./apps/api-nest/dist
COPY --from=builder /app/packages/db-prisma/prisma ./packages/db-prisma/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN test -f /app/apps/api-nest/dist/main.js

USER nestjs
WORKDIR /app/apps/api-nest

EXPOSE 4000

CMD ["node", "dist/main.js"]

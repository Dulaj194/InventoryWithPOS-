FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web-next/package.json apps/web-next/package.json
COPY apps/api-nest/package.json apps/api-nest/package.json
COPY packages/db-prisma/package.json packages/db-prisma/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

RUN npm ci

COPY . .

RUN npm run build --workspace=@mypos/web

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=@mypos/web"]

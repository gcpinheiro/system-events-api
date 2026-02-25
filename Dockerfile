FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
RUN DATABASE_URL=$DATABASE_URL npx prisma generate

COPY . .
RUN npm run build


FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

CMD ["node", "dist/src/main.js"]
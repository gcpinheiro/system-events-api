FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# (opcional) Se você usa prisma:
# COPY --from=builder /app/prisma ./prisma
# RUN npx prisma generate

CMD ["node", "dist/main.js"]

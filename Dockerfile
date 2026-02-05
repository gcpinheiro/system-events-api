FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Prisma precisa de DATABASE_URL presente no generate (não conecta)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate --schema prisma/schema.prisma

RUN npm run build


FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

CMD ["npm", "run", "start:prod"]

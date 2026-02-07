FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Prisma precisa de DATABASE_URL presente no generate (não conecta)
ENV DATABASE_URL="postgresql://neondb_owner:npg_wHzetxu1Eq2U@ep-green-dust-aijnmkk7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
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

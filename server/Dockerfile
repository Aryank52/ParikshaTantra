FROM node:26-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parikshatantra?schema=public"
ENV DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parikshatantra?schema=public"

RUN npx prisma generate
RUN npm run build

FROM node:26-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000

CMD ["node", "dist/index.js"]

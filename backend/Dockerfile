FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
COPY nest-cli.json tsconfig.json tsconfig.build.json eslint.config.mjs ./
COPY src ./src

RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/dist ./dist

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start:prod"]
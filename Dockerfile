FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci

COPY index.html vite.config.js ./
COPY server ./server
COPY src ./src
COPY public ./public

RUN npm run prisma:generate && npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "npm run prisma:deploy && node server/index.js"]

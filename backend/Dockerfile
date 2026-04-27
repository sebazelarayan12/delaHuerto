FROM node:20-alpine

WORKDIR /app

ARG CACHEBUST=2
COPY backend/package*.json ./
RUN npm ci

COPY backend/prisma ./prisma/
RUN npx prisma generate

COPY backend/ .
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]

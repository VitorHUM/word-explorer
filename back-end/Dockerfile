# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV CI=true
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

FROM base AS builder
ENV DATABASE_URL=postgresql://word_explorer:word_explorer@localhost:5432/word_explorer?schema=public
RUN npm ci
COPY nest-cli.json tsconfig*.json ./
COPY src ./src
RUN npm run build && npm run prisma:generate

FROM base AS prod-deps
ENV NODE_ENV=production
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=node:node /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --chown=node:node package*.json ./

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||3001;const req=http.request({host:'127.0.0.1',port,path:'/health',timeout:3000},res=>process.exit(res.statusCode===200?0:1));req.on('error',()=>process.exit(1));req.on('timeout',()=>{req.destroy();process.exit(1)});req.end();"

CMD ["node", "dist/src/main.js"]

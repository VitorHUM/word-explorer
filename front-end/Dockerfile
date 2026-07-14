# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV CI=true
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./

FROM base AS deps
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY eslint.config.mjs next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const http=require('http');const port=process.env.PORT||3000;const req=http.request({host:'127.0.0.1',port,path:'/',timeout:3000},res=>process.exit(res.statusCode<500?0:1));req.on('error',()=>process.exit(1));req.on('timeout',()=>{req.destroy();process.exit(1)});req.end();"

CMD ["node", "server.js"]

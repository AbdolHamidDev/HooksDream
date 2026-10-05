# ---------- Dependencies stage ----------
# Tách riêng để Docker cache được layer cài đặt, chỉ đổi khi package.json thay đổi.
FROM node:22-alpine AS deps

WORKDIR /app
COPY package*.json ./

# Cài toàn bộ dependencies (bao gồm dev) — dùng cho cả dev lẫn build.
RUN npm ci

# ---------- Development stage ----------
# Dùng cho docker compose (hot-reload). Không dùng khi deploy production.
FROM node:22-alpine AS development

WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---------- Production stage ----------
# Bản deploy thật: chỉ production dependencies, chạy bằng non-root.
FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# dumb-init giúp xử lý tín hiệu (SIGTERM) để graceful shutdown hoạt động đúng.
RUN apk add --no-cache dumb-init

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
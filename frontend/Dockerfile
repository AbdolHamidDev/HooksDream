# ---------- Dependencies stage ----------
FROM node:22-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---------- Development stage ----------
# Dùng cho docker compose (hot-reload).
FROM node:22-alpine AS development

WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---------- Build stage ----------
FROM node:22-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build giao diện tĩnh (biến môi trường được nạp lúc build)
RUN npm run build

# ---------- Production stage ----------
# Phục vụ file tĩnh bằng nginx, không cần Node.js runtime.
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
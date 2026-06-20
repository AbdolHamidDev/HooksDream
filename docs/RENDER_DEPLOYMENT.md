
# Render Deployment Guide for HooksDream

Hướng dẫn deploy HooksDream lên Render (thay thế Railway).

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Yêu cầu](#yêu-cầu)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Environment Variables](#environment-variables)
- [Security Best Practices](#security-best-practices)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Tổng quan

HooksDream sử dụng kiến trúc microservices với 3 services:

```
┌─────────────────────────────────────────┐
│         Frontend (Vercel)              │
│  https://hooksdream.vercel.app         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Backend API (Render)              │
│  https://hooksdream.onrender.com       │
│  - Node.js + Express                   │
│  - MongoDB Connection                  │
│  - Socket.IO Server                    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   Python Backend (Render)              │
│  - FastAPI                             │
│  - Bot Service                         │
│  - Unsplash Integration                │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   MongoDB Atlas (Cloud Database)       │
└─────────────────────────────────────────┘
```

---

## Yêu cầu

### Trước khi bắt đầu:
- [ ] Account Render (https://render.com)
- [ ] Account Vercel (https://vercel.com) - cho frontend
- [ ] MongoDB Atlas account
- [ ] Cloudinary account
- [ ] Git repository đã push lên GitHub

### Thông tin cần chuẩn bị:
- MongoDB URI
- JWT Secret key
- Cloudinary URL
- Unsplash API key (optional)

---

## Backend Deployment

### Bước 1: Tạo Web Service trên Render

1. **Login vào Render Dashboard**
   - Truy cập https://dashboard.render.com
   - Click **"New +"** → **"Web Service"**

2. **Connect Repository**
   - Chọn **"Build and deploy from a Git repository"**
   - Connect GitHub account
   - Select repository: `AbdolHamidDev/HooksDream`

3. **Configure Service**

   **Basic Settings:**
   ```
   Name: hooksdream-api
   Region: Singapore (hoặc gần bạn nhất)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

   **Instance Type:**
   - Free tier: `Free`
   - Production: `Starter` ($7/month) - recommended

4. **Environment Variables**

   Click **"Advanced"** → **"Add Environment Variable"**:

   ```env
   # Required
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_super_secret_jwt_key_here
   CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
   
   # CORS Configuration
   FRONTEND_URL=https://hooksdream.vercel.app
   
   # Optional
   JWT_EXPIRE=7d
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

   **⚠️ Security Note:**
   - `JWT_SECRET` phải là chuỗi ngẫu nhiên, mạnh (ít nhất 32 ký tự)
   - Không commit các giá trị này vào Git
   - Sử dụng Render's environment variables để bảo vệ secrets

5. **Deploy**
   - Click **"Create Web Service"**
   - Đợi build hoàn thành (~2-3 phút)
   - URL sẽ là: `https://hooksdream-api.onrender.com`

### Bước 2: Verify Backend Deployment

Test các endpoints:

```bash
# Health check
curl https://hooksdream-api.onrender.com/api/health

# Expected response:
# {
#   "status": "ok",
#   "platform": "render",
#   "db": "connected",
#   ...
# }
```

---

## Python Backend Deployment (Optional)

Nếu bạn cần AI/Bot features:

1. **Tạo Web Service mới**
   - Name: `hooksdream-pybackend`
   - Root Directory: `pyBackend`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **Environment Variables:**
   ```env
   NODE_BACKEND_URL=https://hooksdream-api.onrender.com
   UNSPLASH_ACCESS_KEY=your_unsplash_key
   BOT_ENABLED=true
   ENVIRONMENT=production
   ```

---

## Frontend Deployment

### Bước 1: Build Configuration

Frontend sẽ được deploy lên **Vercel** (recommended) hoặc Render.

#### Option A: Deploy trên Vercel (Recommended)

1. **Push code lên GitHub** (đã có)

2. **Import vào Vercel:**
   - Truy cập https://vercel.com
   - Click **"Add New..."** → **"Project"**
   - Import `HooksDream` repository
   - Root Directory: `frontend`

3. **Configure Build:**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Environment Variables:**

   Click **"Environment Variables"** và thêm:
   
   ```env
   # Production API URL
   VITE_API_BASE_URL=https://hooksdream-api.onrender.com
   VITE_SOCKET_URL=https://hooksdream-api.onrender.com
   
   # Optional: Override API URL
   VITE_API_URL=https://hooksdream-api.onrender.com/api
   
   # App Config
   VITE_APP_NAME=HooksDream
   VITE_APP_VERSION=1.0.0
   VITE_NODE_ENV=production
   ```

   **⚠️ Important:**
   - Prefix `VITE_` là bắt buộc để Vite expose biến này
   - Không có `VITE_` prefix → biến không available trong code

5. **Deploy:**
   - Click **"Deploy"**
   - URL sẽ là: `https://hooksdream.vercel.app`

#### Option B: Deploy trên Render

Nếu muốn frontend cũng trên Render:

1. **Tạo Static Site:**
   - Name: `hooksdream-frontend`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

2. **Environment Variables:**
   ```env
   VITE_API_BASE_URL=https://hooksdream-api.onrender.com
   VITE_SOCKET_URL=https://hooksdream-api.onrender.com
   ```

---

## Environment Variables

### Backend (.env) - Set trên Render

```env
# Server
NODE_ENV=production
PORT=10000
HOST=0.0.0.0

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hooksdream?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_very_long_and_random_secret_key_here_at_least_32_chars
JWT_EXPIRE=7d

# Cloudinary (Media Upload)
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz@your_cloud_name

# CORS
FRONTEND_URL=https://hooksdream.vercel.app

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Bot Integration
BOT_API_KEY=your_bot_api_key
BOT_SECRET=your_bot_secret

# Optional: Email
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Frontend (.env) - Set trên Vercel/Render

```env
# API Configuration
VITE_API_BASE_URL=https://hooksdream-api.onrender.com
VITE_SOCKET_URL=https://hooksdream-api.onrender.com
VITE_API_URL=https://hooksdream-api.onrender.com/api

# App Configuration
VITE_APP_NAME=HooksDream
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production

# Optional: Analytics
# VITE_GA_TRACKING_ID=your_google_analytics_id

# Optional: Sentry
# VITE_SENTRY_DSN=your_sentry_dsn
```

### Python Backend (.env) - Set trên Render

```env
NODE_BACKEND_URL=https://hooksdream-api.onrender.com
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
BOT_ENABLED=true
ENVIRONMENT=production
```

---

## Security Best Practices

### 1. **Environment Variables**

❌ **KHÔNG BAO GIỜ**:
- Commit `.env` files vào Git
- Hardcode secrets trong source code
- Share API keys publicly
- Log sensitive data

✅ **LUÔN LÀM**:
- Sử dụng platform's environment variables (Render, Vercel)
- Rotate secrets định kỳ
- Use strong, random secrets (JWT_SECRET, API keys)
- Enable 2FA trên tất cả services

### 2. **CORS Configuration**

Backend đã được config để chỉ cho phép origins được tin tưởng:

```javascript
// backend/server.js
const allowedOrigins = [
  'https://hooksdream.vercel.app',
  'https://hooksdream.netlify.app',
  'https://hooksdream.onrender.com',
  // ... other allowed origins
];
```

### 3. **Rate Limiting**

Đã được implement trong backend để chống DDoS và brute force attacks.

### 4. **HTTPS Only**

Render và Vercel đều tự động cung cấp HTTPS certificates.

### 5. **Security Headers** (Optional - Add to backend)

Thêm vào `backend/server.js`:

```javascript
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
```

---

## Testing

### 1. Test Backend API

```bash
# Health check
curl https://hooksdream-api.onrender.com/api/health

# Expected:
# {
#   "status": "ok",
#   "platform": "render",
#   "db": "connected",
#   "uptime": 123.45
# }

# CORS test
curl -H "Origin: https://hooksdream.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://hooksdream-api.onrender.com/api/cors-test
```

### 2. Test Frontend

1. Truy cập https://hooksdream.vercel.app
2. Mở Developer Tools (F12)
3. Check Console for errors
4. Check Network tab - tất cả requests phải đến `hooksdream-api.onrender.com`
5. Test các tính năng chính:
   - Register/Login
   - Create post
   - Send message
   - View stories

### 3. Test Socket.IO

```javascript
// Mở browser console trên frontend
// Socket.IO phải connect thành công
// Check console log: "🔗 Socket connected"
```

---

## Troubleshooting

### Issue 1: CORS Errors

**Symptoms:**
```
Access to fetch at 'https://hooksdream-api.onrender.com/api/...' 
from origin 'https://hooksdream.vercel.app' has been blocked by CORS policy
```

**Solution:**
1. Kiểm tra `FRONTEND_URL` trong Render backend environment variables
2. Đảm bảo frontend URL được thêm vào CORS allowed origins
3. Redeploy backend sau khi thay đổi

### Issue 2: MongoDB Connection Failed

**Symptoms:**
```
❌ MongoDB connection failed: 
MongoServerError: bad auth
```

**Solution:**
1. Kiểm tra `MONGODB_URI` trong Render
2. Đảm bảo MongoDB Atlas cho phép connections từ Render IPs
3. Trong MongoDB Atlas: Network Access → Add IP → `0.0.0.0/0` (allow all)

### Issue 3: 502 Bad Gateway

**Symptoms:**
```
502 Bad Gateway
```

**Solution:**
1. Kiểm tra backend logs trên Render Dashboard
2. Đảm bảo `npm start` command đúng
3. Kiểm tra PORT environment variable (Render dùng `$PORT`)

### Issue 4: Socket.IO Not Connecting

**Symptoms:**
```
Socket.IO connection failed
```

**Solution:**
1. Kiểm tra `VITE_SOCKET_URL` trong Vercel
2. Đảm bảo Socket.IO server đang chạy trên backend
3. Check CORS config cho Socket.IO

### Issue 5: Environment Variables Not Working

**Symptoms:**
```
undefined or process.env.VARIABLE is undefined
```

**Solution:**
1. Frontend: Đảm bảo biến có prefix `VITE_`
2. Backend: Restart service sau khi thêm env vars
3. Check Render Dashboard → Environment tab

---

## Monitoring & Maintenance

### 1. Render Dashboard

**Monitor:**
- CPU/Memory usage
- Request count
- Response time
- Error rate
- Logs

**Set up alerts:**
- Email notifications cho errors
- Slack/Discord webhooks (optional)

### 2. Health Checks

Backend có endpoint `/api/health`:
```javascript
{
  "status": "ok",
  "platform": "render",
  "uptime": 123456,
  "db": "connected",
  "socketConnections": 5
}
```

### 3. Logs

```bash
# View logs trên Render Dashboard
# Hoặc sử dụng Render CLI:
render logs hooksdream-api --tail
```

---

## Cost Estimation

### Render Pricing:

**Backend (Node.js):**
- Free tier: Limited (sleeps after 15 min inactivity)
- Starter: $7/month (always on, 512MB RAM)
- Standard: $25/month (1GB RAM, better performance)

**Python Backend (Optional):**
- Free tier: Available
- Starter: $7/month

**Total Monthly Cost:**
- Development: $0 (free tiers)
- Production: $7-25/month (backend only)
- Frontend: $0 (Vercel free tier)

---

## Rollback Plan

Nếu có vấn đề với Render:

1. **Quick Rollback:**
   - Render Dashboard → Your Service → Deploys
   - Click "Rollback to" chọn version cũ

2. **Switch back to Railway (nếu cần):**
   ```bash
   # Update frontend URLs
   VITE_API_BASE_URL=https://just-solace-production.up.railway.app
   VITE_SOCKET_URL=https://just-solace-production.up.railway.app
   
   # Redeploy frontend
   ```

---

## Checklist

### Pre-Deployment
- [ ] MongoDB Atlas đã setup và running
- [ ] Cloudinary đã config
- [ ] JWT_SECRET đã generate (mạnh, ngẫu nhiên)
- [ ] Code đã push lên GitHub
- [ ] Tất cả tests pass

### Backend Deployment
- [ ] Tạo Web Service trên Render
- [ ] Set root directory: `backend`
- [ ] Add tất cả environment variables
- [ ] Deploy và verify health check
- [ ] Test API endpoints
- [ ] Verify CORS hoạt động

### Frontend Deployment
- [ ] Deploy lên Vercel
- [ ] Set environment variables (VITE_*)
- [ ] Build thành công
- [ ] Test tất cả features
- [ ] Verify Socket.IO connection
- [ ] Test trên mobile

### Post-Deployment
- [ ] Monitor logs 24h đầu
- [ ] Setup error alerts
- [ ] Test performance
- [ ] Document URLs
- [ ] Update README với production URLs

---

## Production URLs

Sau khi deploy xong, cập nhật các URLs:

```env
# Frontend
VITE_API_BASE_URL=https://hooksdream-api.onrender.com
VITE_SOCKET_URL=https://hooksdream-api.onrender.com

# Backend CORS
FRONTEND_URL=https://hooksdream.vercel.app

# Documentation
# Update README.md, SEO.md, etc.
```

---

## Support

Nếu gặp vấn đề:
1. Check Render logs: https://dashboard.render.com
2. Check Vercel logs: https://vercel.com
3. Review this guide
4. Check MongoDB Atlas logs
5. Open issue trên GitHub

---

**Last Updated**: 2026-06-20  
**Maintained by**: AbdolHamidDev  
**License**: MIT
# 🚀 HooksDream Development with Docker

## Quick Start

```bash
# Start all services (MongoDB + Backend + Frontend)
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Restart a specific service
docker compose restart backend
docker compose restart frontend
```

## Services

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 5000 | http://localhost:5000 |
| MongoDB | 27017 | mongodb://localhost:27017 |

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/hooksdream?authSource=admin
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_URL=cloudinary://your_cloud_name:your_api_key@your_cloud_name
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
MODE=development
```

## Hot Reload

Code changes will automatically reload:
- **Backend**: nodemon watches for `.js` changes
- **Frontend**: Vite HMR (Hot Module Replacement)

## Useful Commands

```bash
# Shell into backend container
docker compose exec backend sh

# Shell into frontend container
docker compose exec frontend sh

# View backend logs
docker compose logs -f backend

# View frontend logs
docker compose logs -f frontend

# Rebuild after dependency changes
docker compose build backend
docker compose up -d backend
```

## Troubleshooting

### Backend not starting?
```bash
# Check logs
docker compose logs backend

# Common issues:
# 1. Missing GOOGLE_CLIENT_ID in .env
# 2. MongoDB not ready yet (wait 10-15 seconds)
```

### Port already in use?
```bash
# Stop all containers
docker compose down

# Or change ports in docker-compose.yml
```

### Frontend can't connect to backend?
- Check `VITE_API_URL` in frontend/.env
- Should be `http://backend:5000` for Docker networking
- Or `http://localhost:5000` for local development

## Development Workflow

1. **Start services**: `docker compose up -d`
2. **Make code changes** - auto-reload enabled
3. **Check logs**: `docker compose logs -f`
4. **Stop when done**: `docker compose down`

## Notes

- MongoDB data persists in Docker volume `mongodb_data`
- `node_modules` are excluded from volume mounts to avoid conflicts
- Backend runs on `npm run dev` with nodemon
- Frontend runs on `npm run dev` with Vite
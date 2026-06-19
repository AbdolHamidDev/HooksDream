# Installation Guide

This guide will help you install and set up HooksDream on your local machine.

## Table of Contents

- [System Requirements](#system-requirements)
- [Quick Installation](#quick-installation)
- [Manual Installation](#manual-installation)
- [Configuration](#configuration)
- [Verification](#verification)
- [Next Steps](#next-steps)

## System Requirements

### Minimum Requirements

- **Node.js** >= 20.x
- **Python** >= 3.9
- **MongoDB** >= 6.0
- **RAM** >= 4GB
- **Disk Space** >= 2GB

### Recommended Requirements

- **Node.js** >= 20.x (LTS)
- **Python** >= 3.11
- **MongoDB** >= 7.0
- **RAM** >= 8GB
- **Disk Space** >= 5GB
- **Docker** & Docker Compose (for containerized setup)

## Quick Installation

### Using Docker Compose (Recommended)

This is the fastest and most reliable way to get HooksDream running.

#### Prerequisites

- Docker >= 20.10
- Docker Compose >= 2.0

#### Steps

1. **Clone the repository**

```bash
git clone https://github.com/AbdolHamidDev/HooksDream.git
cd HooksDream
```

2. **Copy environment files**

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env

# Python Backend
cp pyBackend/.env.example pyBackend/.env
```

3. **Edit environment variables**

Open each `.env` file and update the values:

```bash
# backend/.env
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/hooksdream?authSource=admin
JWT_SECRET=your_secure_jwt_secret_here
CLOUDINARY_URL=cloudinary://your_cloud_name:your_api_key@your_cloud_name

# frontend/.env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# pyBackend/.env
NODE_BACKEND_URL=http://backend:5000
UNSPLASH_ACCESS_KEY=your_unsplash_key
```

4. **Start all services**

```bash
docker-compose up -d
```

5. **Verify installation**

```bash
# Check all containers are running
docker-compose ps

# View logs
docker-compose logs -f
```

6. **Access the application**

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Python Backend: http://localhost:8000
- MongoDB: localhost:27017

## Manual Installation

If you prefer not to use Docker, follow these steps:

### 1. Install MongoDB

#### Windows

1. Download MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Start MongoDB service:
   ```bash
   net start MongoDB
   ```

#### macOS

```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian)

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create source list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Install Backend (Node.js)

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# On Windows: notepad .env
# On macOS/Linux: nano .env

# Start development server
npm run dev
```

The backend will run on http://localhost:5000

### 3. Install Frontend (React)

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration

# Start development server
npm run dev
```

The frontend will run on http://localhost:5173

### 4. Install Python Backend

Open a new terminal:

```bash
cd pyBackend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your configuration

# Start server
python run.py
```

The Python backend will run on http://localhost:8000

## Configuration

### Backend Configuration

Create `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://localhost:27017/hooksdream

# Authentication
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRE=7d

# Cloudinary (for media upload)
CLOUDINARY_URL=cloudinary://your_cloud_name:your_api_key@your_cloud_name

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend Configuration

Create `frontend/.env`:

```env
# API
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# App
VITE_APP_NAME=HooksDream
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
```

### Python Backend Configuration

Create `pyBackend/.env`:

```env
# Server
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development

# Backend URL
NODE_BACKEND_URL=http://localhost:5000

# Unsplash
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Bot
BOT_ENABLED=true
```

## Verification

### 1. Check MongoDB Connection

```bash
# Connect to MongoDB
mongosh

# Switch to database
use hooksdream

# Show collections
show collections
```

### 2. Test Backend API

```bash
# Health check
curl http://localhost:5000/api/health

# CORS test
curl http://localhost:5000/api/cors-test
```

### 3. Test Python Backend

```bash
# Health check
curl http://localhost:8000/health

# Bot status
curl http://localhost:8000/api/bot/status
```

### 4. Test Frontend

Open http://localhost:5173 in your browser. You should see the HooksDream login/register page.

## Common Setup Issues

### MongoDB Connection Failed

**Problem**: `MongoDB connection failed`

**Solutions**:
1. Ensure MongoDB is running: `mongosh` should connect
2. Check `MONGODB_URI` in `.env` is correct
3. Verify MongoDB is listening on the correct port (default: 27017)

### Port Already in Use

**Problem**: `Port 5000 is already in use`

**Solutions**:

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

Or change the port in `.env`:
```env
PORT=5001
```

### CORS Errors

**Problem**: CORS errors in browser console

**Solutions**:
1. Verify `FRONTEND_URL` in backend `.env` matches frontend URL
2. Check `VITE_API_URL` in frontend `.env` is correct
3. Ensure backend server has restarted after `.env` changes

### Module Not Found

**Problem**: `Cannot find module 'xyz'`

**Solutions**:
```bash
# Delete and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For Python
pip install -r requirements.txt --force-reinstall
```

### Python Virtual Environment Issues

**Problem**: Virtual environment not activating

**Solutions**:

```bash
# Windows - may need to bypass execution policy
Set-ExecutionPolicy Bypass -Scope Process -Force

# Then activate
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

## Environment Variables Reference

### Required Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `MONGODB_URI` | Backend | MongoDB connection string |
| `JWT_SECRET` | Backend | Secret key for JWT signing |
| `CLOUDINARY_URL` | Backend | Cloudinary configuration |
| `VITE_API_URL` | Frontend | Backend API URL |
| `VITE_SOCKET_URL` | Frontend | Socket.IO server URL |
| `NODE_BACKEND_URL` | Python | Node.js backend URL |

### Optional Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `UNSPLASH_ACCESS_KEY` | Python | Unsplash API key |
| `BOT_ENABLED` | Python | Enable/disable bot |
| `PORT` | All | Custom port (defaults provided) |
| `NODE_ENV` | Backend | Environment mode |

## Next Steps

After successful installation:

1. Read the [Development Guide](../DEVELOPMENT.md) to understand the codebase
2. Check [CONTRIBUTING.md](../CONTRIBUTING.md) to contribute
3. Review [API Documentation](../docs/api.md)
4. Join our [Discord Community](https://discord.gg/hooksdream)

## Getting Help

If you encounter issues:

1. Check [Troubleshooting Guide](../docs/troubleshooting.md)
2. Search [existing issues](https://github.com/AbdolHamidDev/HooksDream/issues)
3. Ask in [Discussions](https://github.com/AbdolHamidDev/HooksDream/discussions)
4. Join our [Discord](https://discord.gg/hooksdream)
5. Email us at support@hooksdream.dev

---

**Note**: This is an open source project. Feel free to fork, modify, and contribute!
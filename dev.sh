#!/bin/bash

# HooksDream Development Startup Script
# Starts MongoDB, Backend, and Frontend with Docker Compose

echo "🚀 Starting HooksDream Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found. Creating from .env.example..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  frontend/.env not found. Creating from .env.example..."
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
fi

echo ""
echo "📦 Building and starting services..."
echo "   - MongoDB: localhost:27017"
echo "   - Backend: http://localhost:5000"
echo "   - Frontend: http://localhost:5173"
echo ""

# Start services
docker compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Backend is ready"
else
    echo "⚠️  Backend is starting... (may take a few more seconds)"
fi

echo ""
echo "🎉 HooksDream is starting!"
echo ""
echo "📊 Services:"
echo "   - Frontend:  http://localhost:5173"
echo "   - Backend:   http://localhost:5000"
echo "   - MongoDB:   mongodb://localhost:27017"
echo ""
echo "📝 Useful commands:"
echo "   - View logs:     docker compose logs -f"
echo "   - Stop all:      docker compose down"
echo "   - Restart:       docker compose restart"
echo "   - Shell into backend: docker compose exec backend sh"
echo ""
echo "🔄 Code changes will auto-reload (hot-reload enabled)"
echo ""

# Optional: Open browser
if command -v xdg-open > /dev/null 2>&1; then
    echo "🌐 Opening browser..."
    xdg-open http://localhost:5173
elif command -v open > /dev/null 2>&1; then
    echo "🌐 Opening browser..."
    open http://localhost:5173
fi
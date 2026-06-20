# Development Guide

This guide will help you set up your development environment and understand the project structure.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
- [Project Architecture](#project-architecture)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance Tips](#performance-tips)
- [Common Issues](#common-issues)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.x ([Download](https://nodejs.org/))
- **Python** >= 3.9 ([Download](https://www.python.org/downloads/))
- **MongoDB** >= 6.0 ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/downloads/))
- **Docker & Docker Compose** (optional, for containerized development)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

The fastest way to get started:

```bash
# Clone the repository
git clone https://github.com/AbdolHamidDev/HooksDream.git
cd HooksDream

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp pyBackend/.env.example pyBackend/.env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Python Backend: http://localhost:8000
- MongoDB: localhost:27017

### Option 2: Manual Setup

#### 1. Clone and Install

```bash
git clone https://github.com/AbdolHamidDev/HooksDream.git
cd HooksDream
```

#### 2. Setup Backend (Node.js)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

#### 3. Setup Frontend (React)

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

#### 4. Setup Python Backend

```bash
cd pyBackend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python run.py
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

Follow our [Coding Standards](#coding-standards) and [Commit Guidelines](CONTRIBUTING.md#commit-guidelines).

### 3. Test Your Changes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm run lint
npm run build

# Python Backend
cd pyBackend
# Run tests (if configured)
```

### 4. Commit and Push

```bash
git add .
git commit -m "feat(component): description of changes"
git push origin feature/your-feature-name
```

### 5. Create Pull Request

Open a PR on GitHub using our [PR template](.github/PULL_REQUEST_TEMPLATE.md).

## Project Architecture

### Backend (Node.js + Express)

```
backend/
├── server.js              # Entry point
├── routes/                # API routes
│   ├── auth.js           # Authentication
│   ├── users.js          # User management
│   ├── posts.js          # Posts CRUD
│   ├── comments.js       # Comments
│   ├── follow.js         # Follow system
│   ├── chat.js           # Real-time chat
│   ├── notifications.js  # Notifications
│   ├── search.js         # Search functionality
│   ├── storyRoutes.js    # Stories
│   ├── friendDiscovery.js # Friend discovery
│   └── botRoutes.js      # Bot integration
├── controllers/          # Business logic
├── models/               # Mongoose schemas
├── middleware/           # Auth, validation, rate limiting
├── services/             # Background services
├── socket/               # Socket.IO handlers
└── utils/                # Helper functions
```

### Frontend (React + TypeScript)

```
frontend/src/
├── pages/                # Route pages
│   ├── FeedPage.tsx
│   ├── CreatePostPage.tsx
│   ├── ProfilePage.tsx
│   └── ...
├── components/           # Reusable components
│   ├── auth/            # Auth components
│   ├── chat/            # Chat components
│   ├── feed/            # Feed components
│   ├── posts/           # Post components
│   └── ui/              # shadcn/ui components
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── services/             # API services
├── store/                # Zustand stores
├── locales/              # i18n translations
└── utils/                # Utility functions
```

### Python Backend (FastAPI)

```
pyBackend/
├── main.py               # FastAPI app entry
├── config.py             # Configuration
├── routers/
│   └── bot_router.py    # Bot endpoints
├── services/
│   ├── unsplash_service.py  # Unsplash API
│   └── bot_service.py       # Marcin bot
└── data/                 # Data storage
```

## Coding Standards

### General Principles

- **Write clean, readable code** - Your code should be self-documenting
- **Follow the existing style** - Match the patterns in the codebase
- **Keep it simple** - Avoid over-engineering
- **DRY (Don't Repeat Yourself)** - Reuse code when possible
- **Comment complex logic** - Explain "why", not "what"

### JavaScript/TypeScript

```javascript
// ✅ Good
const getUserPosts = async (userId: string) => {
  try {
    const posts = await Post.find({ author: userId });
    return posts;
  } catch (error) {
    console.error('Failed to fetch user posts:', error);
    throw new Error('Unable to fetch posts');
  }
};

// ❌ Bad
const g = async (u) => {
  let p = await Post.find({a: u});
  return p;
};
```

### Python

```python
# ✅ Good
async def get_user_posts(user_id: str) -> List[Post]:
    """Fetch all posts by a specific user."""
    try:
        posts = await post_service.get_by_user(user_id)
        return posts
    except Exception as e:
        logger.error(f"Failed to fetch posts for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Unable to fetch posts")

# ❌ Bad
async def g(u):
    p = await post_service.get_by_user(u)
    return p
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add OTP verification for login
fix(posts): resolve image upload error on mobile
docs: update installation guide
refactor(chat): simplify message controller
```

## Testing

### Backend Testing

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- auth.test.js

# Run with coverage
npm test -- --coverage
```

### Frontend Testing

```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm test -- --coverage

# E2E tests (if configured)
npm run test:e2e
```

### Python Testing

```bash
cd pyBackend

# Run tests with pytest
pytest

# Run with coverage
pytest --cov=.

# Run specific test
pytest tests/test_bot_service.py
```

## Debugging

### Backend Debugging

```javascript
// Use debugger
function debugThis() {
  debugger; // Browser DevTools will pause here
  const data = processData();
  return data;
}

// Or use console.log (remove before committing!)
console.log('Debug:', { data, user });
```

### Frontend Debugging

```typescript
// React DevTools
// Install React DevTools extension for browser

// Debug in component
useEffect(() => {
  console.log('Component mounted', { data });
}, [data]);

// Or use debugger
const handleClick = () => {
  debugger;
  // Your code
};
```

### Python Debugging

```python
# Use logging
import logging
logger = logging.getLogger(__name__)

logger.debug(f"Processing user {user_id}")
logger.info(f"User {user_id} created successfully")
logger.error(f"Failed to process user {user_id}: {error}")

# Or use breakpoint() (Python 3.7+)
def process_data(data):
    breakpoint()  # Debugger will pause here
    return data
```

## Performance Tips

### Backend

- Use database indexes for frequently queried fields
- Implement caching (Redis) for expensive operations
- Use pagination for large datasets
- Compress responses with gzip
- Use connection pooling for MongoDB

### Frontend

- Lazy load routes and components
- Optimize images (use WebP, lazy loading)
- Use React.memo() for expensive components
- Implement virtual scrolling for long lists
- Cache API responses with TanStack Query

### Python Backend

- Use async/await for I/O operations
- Implement caching for frequent API calls
- Use connection pooling for external APIs
- Profile with cProfile to find bottlenecks

## Common Issues

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh

# Start MongoDB (Windows)
net start MongoDB

# Start MongoDB (macOS/Linux)
sudo systemctl start mongod
```

### Port Already in Use

```bash
# Windows - Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Module Not Found

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For Python
pip install -r requirements.txt --force-reinstall
```

### CORS Errors

Ensure your `.env` files have the correct URLs:

```env
# Backend .env
FRONTEND_URL=http://localhost:5173

# Frontend .env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Useful Commands

### Git

```bash
# View changes
git status
git diff

# Stage and commit
git add .
git commit -m "feat: description"

# Push changes
git push origin branch-name

# Pull latest changes
git pull origin main

# View commit history
git log --oneline --graph
```

### Docker

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Rebuild containers
docker-compose build

# Clean up
docker-compose down -v
```

### npm

```bash
# Install dependencies
npm install

# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Audit for vulnerabilities
npm audit
npm audit fix
```

## Getting Help

- 📖 Read the [Documentation](https://docs.hooksdream.dev)
- 💬 Join our [Discord Community](https://discord.gg/hooksdream)
- 🐛 Report bugs via [Issues](https://github.com/AbdolHamidDev/HooksDream/issues)
- 💡 Discuss features in [Discussions](https://github.com/AbdolHamidDev/HooksDream/discussions)
- 📧 Email us at support@hooksdream.dev

## Next Steps

- Read [CONTRIBUTING.md](CONTRIBUTING.md) to learn how to contribute
- Check [SECURITY.md](SECURITY.md) for security guidelines
- Review [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing
- Browse [open issues](https://github.com/AbdolHamidDev/HooksDream/issues) to find something to work on

---

Happy coding! 🚀
<div align="center">
  <img src="./frontend/public/logo.png" alt="HooksDream Logo" width="120">

  # HooksDream

  **Production-grade social media platform** built with microservices architecture. Real-time communication, AI automation, and modern UX.

  [Live Demo](https://hooksdream.vercel.app) • [Documentation](#) • [Report Bug](https://github.com/AbdolHamidDev/HooksDream/issues) • [Request Feature](https://github.com/AbdolHamidDev/HooksDream/issues)
</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Core Features](#core-features)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

HooksDream is a full-stack social media platform demonstrating production-grade software engineering practices. Built with a microservices architecture separating concerns across Node.js (core API), React (frontend), and Python (AI/automation) services.

**Key Characteristics:**
- Microservices architecture with clear service boundaries
- Real-time bidirectional communication via WebSockets
- JWT-based authentication with OTP verification
- Media processing pipeline with Cloudinary + Sharp
- AI-powered automation layer (Python/FastAPI)
- PWA-enabled with offline support
- Internationalization (i18n) ready
- Comprehensive error handling and rate limiting

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  React 18 + TypeScript + Vite + Tailwind CSS + PWA         │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
   │  REST   │    │ WebSocket│   │  Push   │
   │   API   │    │  Socket  │   │Notify   │
   └────┬────┘    └────┬────┘    └─────────┘
        │              │
   ┌────▼──────────────▼────┐
   │   API Gateway Layer    │
   │  (Rate Limit + Auth)   │
   └───────────┬────────────┘
               │
       ┌───────┴───────┐
       │               │
  ┌────▼────┐    ┌────▼──────────┐
  │ Node.js │    │  Python       │
  │ Backend │◄──►│  Backend      │
  │ Express │    │  FastAPI      │
  │ + MongoDB│   │  (AI/Bot)     │
  └─────────┘    └───────────────┘
       │
  ┌────▼────────┐
  │ Cloudinary  │
  │ (Media CDN) │
  └─────────────┘
```

**Design Principles:**
- **Separation of Concerns**: Each service handles a specific domain
- **Stateless Services**: Horizontal scaling ready
- **Event-Driven**: Real-time updates via Socket.IO
- **Async Processing**: Background jobs for media and notifications

---

## Tech Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 18.x |
| TypeScript | Type Safety | 5.8 |
| Vite | Build Tool | Latest |
| Tailwind CSS | Styling | Latest |
| shadcn/ui | Component Library | Latest |
| TanStack Query | Data Fetching & Cache | Latest |
| Zustand | State Management | Latest |
| Socket.IO Client | Real-time Communication | Latest |
| React Hook Form + Zod | Form Management & Validation | Latest |
| i18next | Internationalization | Latest |
| Framer Motion | Animations | Latest |
| Vite PWA Plugin | Progressive Web App | Latest |

### Backend (Node.js)
| Technology | Purpose | Version |
|------------|---------|---------|
| Express.js | Web Framework | 4.x |
| MongoDB + Mongoose | Database & ODM | Latest |
| Socket.IO | Real-time Communication | Latest |
| JWT (jsonwebtoken) | Authentication | Latest |
| Cloudinary + Multer + Sharp | Media Upload & Processing | Latest |
| Node-cron | Scheduled Tasks | Latest |
| Web Push | Push Notifications | Latest |
| Express Rate Limit | API Protection | Latest |
| Cheerio | Web Scraping | Latest |

### Backend (Python)
| Technology | Purpose | Version |
|------------|---------|---------|
| FastAPI | API Framework | Latest |
| AsyncIO | Async Task Scheduling | Latest |
| Unsplash API | Image Sourcing | - |
| Bot Service | Social Media Automation | - |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| MongoDB Atlas | Managed Database |
| Render | Backend Hosting |
| Vercel | Frontend Hosting |
| Cloudinary | Media CDN & Processing |

---

## Project Structure

```
HooksDream/
├── backend/                    # Node.js API Service
│   ├── server.js              # Entry point, server initialization
│   ├── routes/                # REST API routes
│   │   ├── auth.js            # Authentication (register, login, OTP)
│   │   ├── users.js           # User management
│   │   ├── posts.js           # Post CRUD operations
│   │   ├── comments.js        # Comment system
│   │   ├── follow.js          # Follow/unfollow logic
│   │   ├── chat.js            # Messaging endpoints
│   │   ├── notifications.js   # Notification system
│   │   ├── search.js          # Search functionality
│   │   ├── storyRoutes.js     # Stories (ephemeral content)
│   │   ├── friendDiscovery.js # Friend recommendations
│   │   └── botRoutes.js       # Bot integration
│   ├── controllers/           # Business logic layer
│   ├── models/                # Mongoose schemas
│   ├── middleware/            # Auth, validation, rate limiting
│   ├── services/              # Background services
│   ├── socket/                # Socket.IO handlers
│   └── utils/                 # Helper functions
│
├── frontend/                   # React Application
│   ├── src/
│   │   ├── pages/             # Route-level components
│   │   │   ├── FeedPage.tsx
│   │   │   ├── CreatePostPage.tsx
│   │   │   ├── PostDetailPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── EditProfilePage.tsx
│   │   │   ├── StoriesPage.tsx
│   │   │   ├── MessagesPage.tsx
│   │   │   ├── NotificationsPage.tsx
│   │   │   ├── SearchPage.tsx
│   │   │   ├── FriendPageRQ.tsx
│   │   │   ├── MobileFriendPage.tsx
│   │   │   └── TermsOfUse.tsx
│   │   ├── components/        # Reusable UI components
│   │   │   ├── auth/          # Login, Register, OTP
│   │   │   ├── chat/          # Chat interface
│   │   │   ├── comment/       # Comments
│   │   │   ├── createpost/    # Post creation
│   │   │   ├── feed/          # Feed components
│   │   │   ├── layout/        # Layout shell
│   │   │   ├── modals/        # Modal dialogs
│   │   │   ├── navigation/    # Navigation bar
│   │   │   ├── notifications/ # Notification components
│   │   │   ├── posts/         # Post components
│   │   │   ├── profile/       # Profile components
│   │   │   ├── search/        # Search components
│   │   │   ├── story/         # Story components
│   │   │   └── ui/            # shadcn/ui primitives
│   │   ├── contexts/          # React Context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service layer
│   │   ├── store/             # Zustand stores
│   │   ├── locales/           # i18n translations
│   │   └── utils/             # Utility functions
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── pyBackend/                  # Python AI/Automation Service
│   ├── main.py                # FastAPI application entry
│   ├── config.py              # Configuration management
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Container config
│   ├── docker-compose.yml     # Service orchestration
│   ├── routers/
│   │   └── bot_router.py      # Bot API endpoints
│   ├── services/
│   │   ├── unsplash_service.py # Unsplash API integration
│   │   └── bot_service.py      # Marcin bot automation
│   └── data/                  # Data storage
│
├── docs/                      # Documentation
│   ├── CONTRIBUTING.md
│   ├── DEPLOYMENT.md
│   └── SECURITY.md
│
├── Screenshots/               # UI screenshots
├── docker-compose.yml         # Multi-service orchestration
├── LICENSE                    # MIT License
└── README.md                  # This file
```

---

## Core Features

### Social Media Core
- **Authentication & Authorization** — JWT-based auth with OTP verification flow
- **Posts** — Full CRUD with likes, comments, and sharing
- **Stories** — Ephemeral content (24h TTL) with auto-archiving
- **User Profiles** — Editable profiles with avatar and cover images
- **Social Graph** — Follow system with friend request workflow
- **Real-time Chat** — Instant messaging via Socket.IO with typing indicators
- **Notifications** — Real-time alerts for engagement events
- **Search** — Full-text search across users and posts
- **Discovery** — Algorithmic friend suggestions

### Advanced Features
- **Media Pipeline** — Image/video upload with Cloudinary CDN + Sharp processing
- **Push Notifications** — Web Push API integration
- **Internationalization** — Multi-language support via i18next
- **PWA** — Installable with offline capabilities
- **Responsive Design** — Mobile-first, optimized for all viewports
- **Rate Limiting** — API protection against abuse
- **Real-time Updates** — Live feed updates via WebSockets

### AI & Automation (Python Backend)
- **Marcin Bot** — Automated social interactions (likes, follows, comments)
- **Unsplash Integration** — Curated high-quality image sourcing
- **Scheduled Tasks** — Automated posting and interactions
- **Keep-alive Service** — Prevents cold starts on Render

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.x
- **Python** >= 3.9
- **MongoDB** (local or Atlas)
- **Cloudinary** account
- **Unsplash API** key (optional)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/AbdolHamidDev/HooksDream.git
cd HooksDream
```

**2. Start with Docker (Recommended)**
```bash
docker-compose up -d
```

**3. Or manual setup:**

#### Backend (Node.js)
```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Cloudinary credentials

# Start development server
npm run dev
```

#### Frontend (React)
```bash
cd frontend
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_URL and VITE_SOCKET_URL

# Start development server
npm run dev
```

#### Python Backend
```bash
cd pyBackend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Start server
python run.py
# or
uvicorn main:app --reload
```

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/verify-otp` | OTP verification |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update user profile |
| GET | `/api/users/:id/posts` | Get user posts |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | Get feed |
| POST | `/api/posts` | Create post |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/like` | Like/unlike post |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments/:postId` | Get comments |
| POST | `/api/comments` | Add comment |
| DELETE | `/api/comments/:id` | Delete comment |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations` | Get conversations |
| GET | `/api/chat/messages/:userId` | Get messages |
| POST | `/api/chat/send` | Send message |

### Stories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stories` | Get active stories |
| POST | `/api/stories` | Create story |
| DELETE | `/api/stories/:id` | Delete story |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search/users` | Search users |
| GET | `/api/search/posts` | Search posts |

### Bot (Python Backend)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bot/automate` | Run automation |
| GET | `/api/bot/status` | Bot status |
| POST | `/api/bot/schedule` | Schedule task |

---

## Socket.IO Events

### Client → Server
- `join` — Join chat room
- `sendMessage` — Send message
- `typing` — Typing indicator
- `markAsRead` — Mark messages as read

### Server → Client
- `newMessage` — New message received
- `userTyping` — User typing status
- `newNotification` — New notification
- `onlineUsers` — Online users list

---

## Development

### Scripts

**Backend:**
```bash
npm start          # Production server
npm run dev        # Development with nodemon
npm test           # Run test suite
```

**Frontend:**
```bash
npm run dev        # Development server (Vite)
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint check
```

**Python Backend:**
```bash
python run.py      # Production server
uvicorn main:app --reload  # Development with auto-reload
```

### Environment Variables

#### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `CLOUDINARY_URL` | Cloudinary configuration | Yes |
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment | No |

#### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_SOCKET_URL` | Socket.IO server URL | Yes |

#### Python Backend
| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_BACKEND_URL` | Node.js backend URL | Yes |
| `UNSPLASH_ACCESS_KEY` | Unsplash API key | No |
| `BOT_ENABLED` | Enable/disable bot | No |
| `ENVIRONMENT` | Environment | No |

---

## Deployment

### Render (Backend Services)
- **Node.js Backend**: Deploy from `backend/` directory
- **Python Backend**: Deploy from `pyBackend/` directory
- Use provided `Dockerfile` or Render Nixpacks

### Vercel (Frontend)
- Build command: `npm run build`
- Output directory: `dist`
- Configure environment variables for production API URLs

### MongoDB Atlas
- Create cluster and update `MONGODB_URI` in backend environment
- Enable IP whitelist for production

---

## Contributing

Contributions are welcome. Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/your-feature`)
3. **Commit** your changes (`git commit -m 'feat: add feature'`)
4. **Push** to the branch (`git push origin feature/your-feature`)
5. **Open** a Pull Request

**Guidelines:**
- Follow existing code style and conventions
- Write clear, descriptive commit messages (Conventional Commits)
- Update documentation for new features
- Add tests for critical functionality
- Ensure all checks pass before submitting

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

---

## Roadmap

- [x] Core social media features (posts, comments, likes)
- [x] Real-time chat and notifications
- [x] Stories functionality with auto-archive
- [x] Python backend for AI automation
- [x] PWA support
- [x] Docker containerization
- [ ] Dark mode
- [ ] Video calls (WebRTC)
- [ ] Group chat
- [ ] Post scheduling
- [ ] Advanced analytics dashboard
- [ ] Content moderation AI
- [ ] Mobile apps (React Native)
- [ ] GraphQL API layer
- [ ] Comprehensive test coverage

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Support

If you find this project useful, please consider:

- ⭐ **Starring** the repository
- 🍴 **Forking** and contributing
- 🐛 **Reporting** bugs via [Issues](https://github.com/AbdolHamidDev/HooksDream/issues)
- 💬 **Sharing** with the community

---

<div align="center">
  <p>Built with ❤️ by <a href="https://hamid.id.vn">AbdolHamidDev</a></p>
  <p>
    <a href="https://github.com/AbdolHamidDev/HooksDream">GitHub</a> •
    <a href="https://hooksdream.vercel.app">Live Demo</a> •
    <a href="https://buymeacoffee.com/hamidabdol">☕ Buy Me a Coffee</a>
  </p>
</div>
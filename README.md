# WOW - World of Weddings

A full-stack digital platform managing the entire wedding lifecycle: **Matchmaking → Wedding Planning → Event Execution → Honeymoon Travel → Memories**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS (Node.js/TypeScript) |
| Frontend | React.js + Vite + TailwindCSS |
| Database | PostgreSQL + MongoDB + Redis |
| Real-time | Socket.io (WebSockets) |
| Auth | JWT + Passport.js |
| Docs | Swagger/OpenAPI |
| Infra | Docker + Docker Compose |

## Project Structure

```
wow-world-of-weddings/
├── backend/                 # NestJS API
│   └── src/
│       ├── modules/
│       │   ├── auth/        # Authentication & JWT
│       │   ├── users/       # User profiles (MongoDB)
│       │   ├── matchmaking/ # Match engine (PostgreSQL)
│       │   ├── chat/        # Real-time messaging (MongoDB + WebSocket)
│       │   ├── vendors/     # Vendor marketplace (MongoDB)
│       │   ├── planner/     # Wedding planner (PostgreSQL)
│       │   └── notifications/
│       └── common/          # Shared utilities, guards, enums
├── frontend/                # React + Vite
│   └── src/
│       ├── pages/           # Route pages
│       ├── components/      # Shared UI components
│       ├── store/           # Zustand state management
│       └── lib/             # API client, utilities
├── docker/                  # Docker configs
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
└── docs/                    # Documentation
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for databases)
- npm or yarn

### Quick Start (Docker)

```bash
# Start all services (databases + app)
npm run docker:up

# Access:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3000/api
# - Swagger Docs: http://localhost:3000/api/docs
```

### Local Development

```bash
# 1. Start databases only
docker-compose -f docker/docker-compose.yml up postgres mongodb redis -d

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Set up environment
cp .env.example .env

# 4. Start backend
cd backend && npm run start:dev

# 5. Start frontend (new terminal)
cd frontend && npm run dev
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Users
- `POST /api/users/profile` - Create profile
- `GET /api/users/profile` - Get own profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/search` - Search profiles

### Matchmaking
- `POST /api/matches/interest` - Send interest
- `PUT /api/matches/:id/accept` - Accept match
- `PUT /api/matches/:id/reject` - Reject match
- `GET /api/matches/suggestions` - Get suggestions
- `GET /api/matches/accepted` - Get matches

### Chat
- `POST /api/chat/messages` - Send message
- `GET /api/chat/conversations` - List conversations
- `GET /api/chat/messages?userId=` - Get messages
- WebSocket: `/chat` namespace

### Vendors
- `POST /api/vendors` - Register as vendor
- `GET /api/vendors/search` - Search vendors
- `GET /api/vendors/featured` - Featured vendors
- `POST /api/vendors/:id/reviews` - Add review

### Planner
- `POST /api/planner/plan` - Create wedding plan
- `GET /api/planner/timeline` - Get full timeline
- `POST /api/planner/plan/:id/tasks` - Add task
- `PUT /api/planner/tasks/:id/status` - Update task
- `POST /api/planner/plan/:id/events` - Add event

## Architecture

```
Client (React/Mobile)
    ↓
API Gateway (NestJS)
    ↓
┌─────────────────────────────────────────┐
│  Auth  │  Users  │  Match  │  Chat     │
│  Service│ Service │ Service │  Service  │
├─────────────────────────────────────────┤
│  Vendor │ Planner │ Notify  │  AI      │
│  Service│ Service │ Service │  Service  │
└─────────────────────────────────────────┘
    ↓           ↓           ↓
PostgreSQL   MongoDB      Redis
(Transactions)(Content)   (Cache)
```

## MVP Features

- ✅ User registration & authentication (JWT)
- ✅ Profile creation with preferences
- ✅ Matchmaking with filters & interest system
- ✅ Real-time chat (WebSocket)
- ✅ Vendor marketplace with search & reviews
- ✅ Wedding planner with tasks & timeline
- ✅ Role-based access control
- ✅ Swagger API documentation

## Future Roadmap

- [ ] Payment integration (Razorpay)
- [ ] Event management with RSVP
- [ ] Travel & honeymoon module
- [ ] AI-powered recommendations (WOW Genie)
- [ ] Media & memories gallery
- [ ] Push notifications (FCM)
- [ ] Admin dashboard
- [ ] Mobile app (Flutter)

## License

Private - All rights reserved.

# WOW - World of Weddings: Workstation Setup Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v18+ (LTS recommended) | Runtime |
| npm | v9+ (comes with Node) | Package manager |
| Git | Latest | Version control |
| VS Code | Latest (optional) | IDE |

> **Note:** No Docker required. The app uses SQLite for local development.

---

## 1. Clone the Repository

```bash
git clone <your-repo-url> wow-world-of-weddings
cd wow-world-of-weddings
```

---

## 2. Install Dependencies

```bash
# Install all dependencies (root + backend + frontend)
npm install

# If monorepo hoisting doesn't work, install individually:
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## 3. Environment Configuration

Create a `.env` file in the project root:

```env
# Application
NODE_ENV=development
PORT=3000

# JWT Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Database (SQLite for dev - no setup needed)
# For production, switch to PostgreSQL:
# DB_TYPE=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=yourpassword
# DB_NAME=wow_weddings
```

---

## 4. Run the Backend

```bash
cd backend

# Development mode (hot reload)
npx nest start --watch

# Or build and run
npx nest build
node dist/main.js
```

The backend starts at **http://localhost:3000**

- API docs (Swagger): http://localhost:3000/api/docs
- SQLite database file: `backend/wow_dev.db` (auto-created on first run)

---

## 5. Run the Frontend

```bash
cd frontend

# Development mode (hot reload)
npx vite

# Or build for production
npx vite build
```

The frontend starts at **http://localhost:5173**

---

## 6. Verify Everything Works

1. Open http://localhost:5173 — you should see the landing page
2. Register a new account at `/register`
3. Open http://localhost:3000/api/docs — Swagger UI with all API endpoints

---

## Project Structure

```
wow-world-of-weddings/
├── .env                          # Environment variables
├── package.json                  # Root package.json
├── backend/
│   ├── src/
│   │   ├── main.ts              # Entry point (port 3000, Swagger setup)
│   │   ├── app.module.ts        # Root module (imports all feature modules)
│   │   ├── common/
│   │   │   └── enums/index.ts   # Shared enums (roles, statuses)
│   │   └── modules/
│   │       ├── auth/            # JWT authentication (register/login/refresh)
│   │       ├── users/           # User profiles & compatibility preferences
│   │       ├── matchmaking/     # Match suggestions with scoring algorithm
│   │       ├── chat/            # Real-time messaging (Socket.io)
│   │       ├── vendors/         # Vendor listings, search, reviews
│   │       ├── planner/         # Wedding planner with tasks & timeline
│   │       ├── bookings/        # Vendor bookings & payment (escrow)
│   │       ├── events/          # Marriage events, guests, RSVP, seating
│   │       ├── honeymoon/       # Honeymoon packages & trip booking
│   │       ├── finance/         # Budget, expenses, loans, gift registry
│   │       └── notifications/   # Notification service
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # React entry
│   │   ├── App.tsx              # Routes
│   │   ├── components/
│   │   │   └── Layout.tsx       # App shell with navigation
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Matches.tsx
│   │   │   ├── Chat.tsx
│   │   │   ├── Vendors.tsx
│   │   │   ├── Planner.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── Honeymoon.tsx
│   │   │   ├── Finance.tsx
│   │   │   └── Profile.tsx
│   │   ├── store/               # Zustand state management
│   │   └── lib/                 # API client (Axios)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
└── docs/
    └── WORKSTATION-SETUP.md     # This file
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | NestJS 10 |
| Database (Dev) | SQLite (better-sqlite3) via TypeORM |
| Database (Prod) | PostgreSQL (just change config) |
| Auth | JWT + Passport.js + bcrypt |
| Real-time | Socket.io (WebSocket) |
| API Docs | Swagger / OpenAPI |
| Frontend | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | TailwindCSS 3 |
| State | Zustand |
| Data Fetching | TanStack React Query |
| Routing | react-router-dom v6 |
| Icons | Lucide React |

---

## API Modules Overview

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /register | Create account |
| POST | /login | Get JWT tokens |
| POST | /refresh | Refresh access token |
| POST | /logout | Invalidate refresh token |

### Users (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /profile | Create profile |
| GET | /profile | Get my profile |
| GET | /profile/:id | Get user profile |
| PUT | /profile | Update profile |
| GET | /search | Search profiles |

### Matchmaking (`/api/matches`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /interest | Send match interest |
| PUT | /:id/accept | Accept match |
| PUT | /:id/reject | Reject match |
| GET | /received | Received interests |
| GET | /sent | Sent interests |
| GET | /accepted | Mutual matches |
| GET | /suggestions | AI-scored suggestions |

### Chat (`/api/chat`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /messages | Send message |
| GET | /conversations | List conversations |
| GET | /messages | Get messages (query: conversationId) |
| GET | /unread | Unread count |

WebSocket: `ws://localhost:3000/chat` — events: `sendMessage`, `typing`, `markRead`

### Vendors (`/api/vendors`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | / | Register vendor |
| GET | /search | Search (query: category, city, minRating) |
| GET | /featured | Featured vendors |
| GET | /:id | Vendor details |
| PUT | /:id | Update vendor |
| POST | /:id/reviews | Add review |
| GET | /:id/reviews | Get reviews |

### Planner (`/api/planner`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /plan | Create wedding plan |
| GET | /plan | Get my plan |
| PUT | /plan | Update plan |
| GET | /timeline | Timeline with progress % |
| GET | /plan/:planId/tasks | List tasks |
| POST | /plan/:planId/tasks | Add task |
| PUT | /tasks/:taskId/status | Update task status |
| DELETE | /tasks/:taskId | Delete task |

### Bookings & Sales (`/api/bookings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | / | Create booking |
| GET | /my | My bookings |
| GET | /:id | Booking details |
| PUT | /:id/status | Update status (confirm/cancel) |
| POST | /payments/initiate | Start payment |
| PUT | /payments/:id/confirm | Confirm payment |
| PUT | /payments/:id/release-escrow | Release held funds |
| POST | /payments/:id/refund | Process refund |
| GET | /:bookingId/payments | Booking payments |
| GET | /payments/history | All payment history |

### Events (`/api/events`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | / | Create event |
| GET | / | List my events |
| GET | /:id | Event details |
| GET | /:id/summary | Event summary (dietary stats, RSVP) |
| PUT | /:id | Update event |
| DELETE | /:id | Delete event |
| POST | /:id/guests | Add guest |
| POST | /:id/guests/bulk | Bulk add guests |
| GET | /:id/guests | List guests |
| PUT | /guests/:guestId/rsvp | Update RSVP |
| PUT | /guests/:guestId/seat | Assign seat |
| POST | /guests/send-invitations | Mark invitations sent |
| GET | /:id/seating | Seating arrangement |

### Honeymoon (`/api/honeymoon`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /packages | Search packages (filters) |
| GET | /packages/featured | Featured packages |
| GET | /destinations | Popular destinations |
| GET | /packages/:id | Package details |
| POST | /packages | Create package (vendor) |
| POST | /book | Book a package |
| GET | /bookings | My bookings |
| GET | /bookings/:id | Booking details |
| PUT | /bookings/:id/status | Update booking status |
| PUT | /bookings/:id/itinerary | Save itinerary |

### Finance (`/api/finance`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /budget | Create budget |
| GET | /budget | Get budget summary |
| PUT | /budget | Update total budget |
| POST | /budget/items | Add budget item |
| PUT | /budget/items/:id | Update item |
| DELETE | /budget/items/:id | Delete item |
| POST | /expenses | Record expense |
| GET | /expenses | List expenses |
| POST | /loans/apply | Apply for loan |
| GET | /loans | My loan applications |
| GET | /loans/:id | Loan details |
| PUT | /loans/:id/status | Update loan status |
| POST | /gifts | Add to gift registry |
| GET | /gifts | My gift registry |
| GET | /gifts/public/:userId | Public registry |
| PUT | /gifts/:id/reserve | Reserve a gift |
| PUT | /gifts/:id/purchased | Mark as purchased |
| DELETE | /gifts/:id | Remove gift |

---

## Common Commands

```bash
# Backend
cd backend
npx nest start --watch        # Dev with hot-reload
npx nest build                # Build only
npx nest start                # Run built app

# Frontend
cd frontend
npx vite                      # Dev server
npx vite build                # Production build
npx vite preview              # Preview production build

# Type checking
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

---

## Database

### Development (SQLite)
- No setup needed — `wow_dev.db` is auto-created
- Delete `backend/wow_dev.db` to reset all data
- Schema syncs automatically (`synchronize: true`)

### Production (PostgreSQL)
Update `backend/src/app.module.ts` TypeORM config:

```typescript
useFactory: (config: ConfigService) => ({
  type: 'postgres',
  host: config.get('DB_HOST'),
  port: config.get('DB_PORT'),
  username: config.get('DB_USERNAME'),
  password: config.get('DB_PASSWORD'),
  database: config.get('DB_NAME'),
  autoLoadEntities: true,
  synchronize: false, // Use migrations in production!
})
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `node` not found | Add Node.js to PATH or restart terminal |
| Port 3000 in use | Kill process: `npx kill-port 3000` or change PORT in .env |
| Port 5173 in use | Vite auto-picks next port, or `npx kill-port 5173` |
| SQLite errors | Delete `backend/wow_dev.db` and restart |
| Module not found | Run `npm install` in the affected directory |
| CORS errors | Backend already has CORS enabled for localhost:5173 |

---

## Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Switch to PostgreSQL
- [ ] Set `synchronize: false`, use TypeORM migrations
- [ ] Build frontend: `npx vite build` → serve `dist/` from CDN or static host
- [ ] Configure CORS for production domain
- [ ] Set up HTTPS (nginx/cloudflare)
- [ ] Add rate limiting (already scaffolded in NestJS)

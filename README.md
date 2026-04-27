# CWOS — Collaborative Workflow Orchestration System

A production-ready, full-stack MERN SaaS application for modern team workflow management.

---

## Tech Stack

### Frontend
- **React 18** + **Vite** — blazing fast dev/build
- **React Router DOM v6** — client-side routing
- **Tailwind CSS** — utility-first styling
- **Framer Motion** — smooth animations
- **React Hook Form** — performant forms with validation
- **Recharts** — analytics charts
- **Socket.IO Client** — real-time updates
- **Context API + useReducer** — global state (no Redux)
- **Axios** — HTTP client

### Backend
- **Node.js + Express** — REST API
- **MongoDB Atlas + Mongoose** — database + ODM
- **Socket.IO** — WebSocket real-time layer
- **JWT + bcryptjs** — authentication
- **express-validator** — request validation
- **Helmet + CORS + rate-limit** — security

---

## Project Structure

```
cwos/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # Sidebar, AppLayout, ProtectedRoute
│   │   │   ├── tasks/         # KanbanBoard, TaskTable, TaskForm, TaskDetailDrawer
│   │   │   └── ui/            # Button, Card, Modal, Badge, Avatar, Skeleton, etc.
│   │   ├── context/           # AuthContext, AppContext, ToastContext
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # utils.js
│   │   ├── pages/             # All page components
│   │   └── services/          # api.js, socket.js
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── config/            # database.js
    │   ├── controllers/       # authController, projectController, taskController, executionController
    │   ├── middleware/        # auth.js, errorHandler.js, projectAccess.js
    │   ├── models/            # User, Project, Task, TaskVersion, AuditLog, WebhookLog
    │   ├── routes/            # auth, projects, tasks, invites, audit, webhooks
    │   ├── sockets/           # Socket.IO initialization
    │   └── utils/             # auditLogger, cycleDetection, webhook
    ├── __tests__/             # Jest test suite
    └── package.json
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and secrets

# Frontend
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your API URL
```

### 2. Configure Environment Variables

**Backend `.env`:**
```
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/cwos
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
INVITE_TOKEN_SECRET=your_invite_secret_change_this
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:5173`  
Backend runs at: `http://localhost:5000`

### 4. Run Tests

```bash
cd backend
npm test
```

---

## Core Features

### Authentication
- JWT-based auth with bcrypt password hashing
- Persistent login (token in localStorage)
- Protected routes with auto-redirect
- React Hook Form validation on all auth forms

### Project Management
- Create, edit, delete projects
- Color-coded project cards
- Webhook URL per project
- Member management

### Secure Invite System
- JWT-signed invite tokens (30 min expiry)
- One-click join via `/invite/:token`
- Expired/invalid token handling

### Task Management
- Full CRUD with React Hook Form
- Priority levels 1–5, status tracking
- Resource tag for concurrency control
- Dependency selection with cycle detection

### Execution Planner Engine
`POST /projects/:id/compute-execution`
- Topological dependency resolution
- Sort: priority ↓, estimatedHours ↑, createdAt ↑
- Resource tag conflict prevention
- Returns: executionOrder, runnableTasks, blockedTasks

### Daily Simulation Engine
`POST /projects/:id/simulate`
- Greedy hour-based task selection
- Respects dependencies and resource tags
- Input: availableHours, optional failedTaskIds
- Output: executionOrder, selectedTasks, blockedTasks, skippedTasks, totalPriorityScore

### Real-Time Collaboration
- Socket.IO rooms per project (`project:{id}`)
- Events: task:created, task:updated, task:deleted, project:updated, project:member_joined
- Auth middleware on socket connections

### Optimistic Concurrency Control
- versionNumber increments on every task update
- 409 Conflict returned with latest task data
- Frontend shows conflict UI with "Edit latest" option

### Task Version History
- Snapshot saved on every task update
- Timeline UI in TaskDetailDrawer
- Restore to previous version

### Retry & Failure Logic
- Retry only if retryCount < maxRetries
- Failed tasks block dependent tasks
- Visual retry counter

### Webhooks
- Fired on task completion
- 3-attempt retry with exponential backoff
- Full delivery log history

### Audit Logs
- 20+ tracked event types
- Actor, action, entity, metadata, timestamp
- User activity feed + project activity feed

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List user projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project + stats |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| POST | /api/projects/:id/compute-execution | Run execution planner |
| POST | /api/projects/:id/simulate | Run simulation |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks/project/:projectId | List project tasks |
| POST | /api/tasks/project/:projectId | Create task |
| GET | /api/tasks/:id | Get task |
| PUT | /api/tasks/:id | Update task (with OCC) |
| DELETE | /api/tasks/:id | Delete task |
| POST | /api/tasks/:id/duplicate | Duplicate task |
| POST | /api/tasks/:id/retry | Retry failed task |
| GET | /api/tasks/:id/history | Get version history |
| POST | /api/tasks/:id/restore/:version | Restore version |

### Invites
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/invites/project/:id/generate | Generate invite link |
| GET | /api/invites/validate/:token | Validate token |
| POST | /api/invites/accept/:token | Accept invite |

---

## Deployment

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import repo in Vercel
3. Set `VITE_API_URL` and `VITE_SOCKET_URL` env vars
4. Deploy

### Backend → Render or Railway
1. Push `backend/` to GitHub
2. Create new Web Service
3. Set all env vars from `.env.example`
4. Build command: `npm install`
5. Start command: `npm start`

---

## MongoDB Collections & Indexes

| Collection | Key Indexes |
|-----------|-------------|
| users | email (unique) |
| projects | owner, members, text(name,description) |
| tasks | project, status, project+status, text(title) |
| task_versions | task+versionNumber |
| audit_logs | actor, project, action, createdAt |
| webhook_logs | project, task |

---

## Security
- Helmet HTTP headers
- CORS restricted to CLIENT_URL
- Rate limiting: 100 req/15min global, 20 req/15min auth
- JWT token validation on all protected routes
- Project access middleware (owner/member check)
- bcrypt password hashing (salt rounds: 12)

---

## Assumptions
- Users must be authenticated to access any project/task
- Only project owners can delete projects, generate invites, remove members
- Dependency cycles are rejected at the API level
- versionNumber starts at 1 and increments on every update
- Webhook retries use 1s, 2s, 3s delays (exponential-ish)
- Socket.IO rooms are scoped per project for efficiency

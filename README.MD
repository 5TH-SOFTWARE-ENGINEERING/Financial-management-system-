# Financial Management System

Full-stack financial management platform with a FastAPI backend and a Next.js (App Router) frontend. Includes budgeting/forecasting, revenue & expense tracking, approvals, analytics, and RBAC.

## Repository Layout

- `backend/` — FastAPI application (REST API, RBAC, FP&A services)
- `frontend/` — Next.js 16 + React 19 UI
- `DEPLOYMENT.md` — deployment notes
- `RENDER_QUICKSTART.md`, `render.yaml` — Render deployment scaffolding

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- PostgreSQL 15+ (required for backend)
- Redis 7+ (optional, caching)
- Docker & Docker Compose (optional)

## Quick Start (local, two terminals)

1) **Backend**
- `cd backend`
- `cp .env.example .env` and set database/secret values
- Create/upgrade DB: `alembic upgrade head` (or run the SQLAlchemy create_all snippet in the backend README)
- Install deps: `python -m venv venv && source venv/bin/activate` (Windows: `venv\Scripts\activate`) then `pip install -r requirements.txt`
- Run API: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

2) **Frontend**
- In another terminal: `cd frontend`
- Install deps: `npm install`
- Create `.env.local` (set your API URL, e.g. `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` if applicable)
- Run dev server: `npm run dev` (defaults to http://localhost:3000)

## Backend Details (FastAPI)

Key capabilities: revenue/expense CRUD with approvals, budgeting & forecasting (FP&A), analytics, role hierarchy (Super Admin → Admin → Finance Manager → Accountant → Employee), JWT auth, 2FA/IP restriction, reporting, notifications, audit logging.

Common commands:
- Run app: `uvicorn app.main:app --reload --port 8000`
- Migrations: `alembic revision --autogenerate -m "msg"` then `alembic upgrade head`
- Tests: `pytest` (see `backend/README.md` for more)

## Frontend Details (Next.js)

Stack: Next.js 16, React 19, TypeScript, styled-components, TanStack Query, React Hook Form, Zod, lucide-react, Sonner, Zustand, Recharts.

Common commands:
- Dev: `npm run dev`
- Build: `npm run build`
- Start (prod): `npm run start`
- Lint: `npm run lint`
- Unit tests: `npm test`
- E2E (Playwright): `npm run test:e2e`

## Docker Compose

From `backend/` (contains `docker-compose.yml`):
- Start services: `docker-compose up -d`
- Apply migrations: `docker-compose exec backend alembic upgrade head`
- Tail logs: `docker-compose logs -f backend`

## Troubleshooting

- **CORS/auth issues:** ensure frontend `.env.local` points to the running backend and backend `ALLOWED_ORIGINS` includes the frontend URL.
- **DB errors:** confirm `DATABASE_URL` in `backend/.env` and that PostgreSQL is running.
- **Port collisions:** change ports or stop conflicting processes (API: 8000, frontend: 3000).

## Useful Links

- Backend docs: http://localhost:8000/docs (when API is running)
- Backend guide: `backend/README.md`
- FastAPI docs: https://fastapi.tiangolo.com/
- Next.js docs: https://nextjs.org/docs

Alpine — Multi-service Web App (Frontend + Node API + Python FastAPI Agent)

### Overview
This repository contains a small polyglot stack:

- Frontend: React + TypeScript built with Vite
- Backend API (Auth & DB): Node.js + Express (ES Modules) with PostgreSQL
- Agent Service: Python FastAPI providing scraping and agent orchestration endpoints (LangChain/LangGraph + Playwright)

The services can be run locally for development. The frontend currently targets the FastAPI service at `http://localhost:8000` in development. The Node backend exposes authentication endpoints (cookies + JWT) and initializes a PostgreSQL schema.

### Requirements
- Node.js 18+ and npm
- Python 3.10+ and pip (virtualenv recommended)
- PostgreSQL 14+ (local or managed)
- Playwright browsers (installed once after Python deps)

Optional tools:
- Git, curl, Postman/Bruno for API testing

### Project Structure
```
backend/
  agent-service/app/
    api/fastapi_app.py            # FastAPI app (uvicorn entry target: `fastapi_app:app`)
    services/                     # Agent modules (LangChain/LangGraph, scraping)
    requirements.txt              # Python dependencies
    constants/*.json              # Reference data used by agent modules
    main.py                       # Simple placeholder script (not used by FastAPI)

  server/                         # Node.js Express backend (ESM)
    package.json                  # npm scripts, dependencies
    src/
      server.js                   # Express app entry; loads routes and DB init
      routes/auth.routes.js       # Auth endpoints
      controllers/auth.controller.js
      middleware/auth.js          # JWT cookie middleware
      lib/db.js                   # pg Pool using DATABASE_URL
      model/db-init.js            # Creates tables/indexes on startup

frontend/
  src/                            # React app code (TS)
  package.json                    # Vite/React scripts
  vite.config.ts
  README.md                       # Vite template readme (kept for reference)

LICENSE                           # MIT
```

### Services and Entry Points
- Frontend (Vite): `frontend`
  - Scripts: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`
  - Dev server default: Vite (typically http://localhost:5173)
  - Axios base URL (development): `http://localhost:8000` (see `frontend/src/lib/axios.ts`)

- Node Backend API (Auth/DB): `backend/server`
  - Entry: `src/server.js`
  - Script: `npm run dev` (nodemon)
  - Default port: `process.env.PORT || 4000`
  - Health: `GET /health` → `{ ok: true }`
  - Routes (mounted at `/api/auth`):
    - `POST /onboarding` — create company + first admin
    - `POST /signin` — sign in, sets `jwt` httpOnly cookie
    - `POST /signout` — clear cookie
    - `POST /signup` — admin-only create additional user
    - `GET /me` — returns authenticated user (requires cookie)

- Python FastAPI Agent Service: `backend/agent-service/app`
  - App module: `api/fastapi_app.py`
  - Uvicorn target: `fastapi_app:app`
  - Suggested dev command: `uvicorn fastapi_app:app --reload --host 0.0.0.0 --port 8000`
  - Endpoints:
    - `GET /` — service status
    - `POST /scraper/run` — runs `playwright_scraper.py` as a subprocess; returns formatted RFP list from `scraped_rfps_manifest.json`
    - `POST /agent/invoke` — runs LangGraph workflow (see `services/final.py`); returns JSON from `final_rfp_response.json`

### Environment Variables

Node Backend (`backend/server`):
- `PORT` — server port (default 4000)
- `CLIENT_URL` — allowed origin for CORS (e.g., `http://localhost:5173`)
- `DATABASE_URL` — Postgres connection string, e.g. `postgres://user:pass@localhost:5432/dbname`
- `JWT_SECRET` — secret for signing JWTs
- `JWT_EXPIRES_IN` — token TTL, e.g. `8h` (optional; defaults to 8h)
- `NODE_ENV` — `development` or `production` (affects cookie `secure` flag)

FastAPI Agent (`backend/agent-service/app`):
- No required env vars are referenced directly in `fastapi_app.py`. CORS is open to all origins by default.
- TODO: Document any API keys or model settings required by agent modules if/when added.


### Setup

1) Clone and install dependencies
- Frontend
  - `cd frontend`
  - `npm install`

- Node backend
  - `cd backend/server`
  - `npm install`

- Python FastAPI service
  - `cd backend/agent-service/app`
  - Create and activate a virtualenv (recommended)
    - Windows PowerShell:
      - `python -m venv .venv`
      - `.\.venv\Scripts\Activate.ps1`
    - macOS/Linux:
      - `python3 -m venv .venv`
      - `source .venv/bin/activate`
  - Install dependencies:
    - `pip install -r requirements.txt`
  - Install Playwright browsers (one-time):
    - `python -m playwright install`

2) Prepare PostgreSQL (for Node backend)
- Ensure a database exists and set `DATABASE_URL` accordingly.
- On server startup, tables and types are created automatically by `src/model/db-init.js`.

3) Create `.env` files
- `backend/server/.env` example:
```
PORT=4000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgres://postgres:postgres@localhost:5432/alpine
JWT_SECRET=replace-with-a-secure-secret
JWT_EXPIRES_IN=8h
NODE_ENV=development
```
- Frontend: optional `.env` if you add variables (must prefix with `VITE_`).
- FastAPI: none required by default.

### Running Locally

- Start FastAPI Agent (port 8000)
  - In `backend/agent-service/app` (activate venv):
  - `uvicorn fastapi_app:app --reload --host 0.0.0.0 --port 8000`

- Start Node Backend (port 4000)
  - In `backend/server`:
  - `npm run dev`

- Start Frontend (default Vite port, e.g., 5173)
  - In `frontend`:
  - `npm run dev`

Notes:
- The frontend currently calls `http://localhost:8000` (FastAPI) for API requests in development (`axios.ts`). If you intend for the frontend to use the Node backend as well, introduce separate API clients or a proxy.
- CORS in FastAPI is currently `allow_origins=['*']`. In production, narrow this to your frontend origin.

### Useful Scripts

Frontend (`frontend/package.json`):
- `npm run dev` — start Vite dev server
- `npm run build` — type-check and build
- `npm run preview` — preview production build
- `npm run lint` — lint sources

Node backend (`backend/server/package.json`):
- `npm run dev` — start Express with nodemon

Python (FastAPI):
- No script file; run uvicorn as shown above.

### API Quickstart

FastAPI Agent (port 8000):
- Health/root: `GET /`
- Run scraper: `POST /scraper/run`
- Run agent: `POST /agent/invoke`

Node Backend (port 4000):
- `GET /health`
- Auth routes mounted at `/api/auth`:
  - `POST /onboarding`, `POST /signin`, `POST /signout`, `POST /signup`, `GET /me`

### License
This project is licensed under the MIT License. See `LICENSE` for details.

# Fullstack Menu Tree System

A production-ready fullstack application for managing a **hierarchical menu tree** with
unlimited nesting depth, full CRUD, search, and move/reorder — built with a Go (Gin + GORM)
Clean-Architecture backend and a Next.js (App Router) + TypeScript frontend.

## Features

- Hierarchical menu tree with **unlimited depth** and connector lines (├ / └ / │)
- Create / ✏️ Edit / 🗑️ Delete menus (delete **cascades** to children)
- **Move** between parents and **Reorder** among siblings (circular-reference safe)
- Client-side search/filter that preserves hierarchy
- ⬇Expand / collapse (per-node + Expand All / Collapse All)
- Responsive desktop & mobile layout
- Loading skeletons, error states with retry, empty-state CTA
- Toast notifications (Sonner)
- Swagger/OpenAPI documentation
- Dockerized (dev hot reload + production multi-stage)

## Tech Stack

| Layer    | Technology |
| -------- | ---------- |
| Backend  | Go, Gin, GORM, PostgreSQL, Viper, Zap, go-playground/validator, swaggo |
| Frontend | Next.js (App Router), TypeScript, TailwindCSS, Zustand, TanStack-ready Axios, Sonner, Lucide |
| Testing  | Go `testing`, Vitest |
| DevOps   | Docker, Docker Compose |

## Architecture

**Backend — Clean Architecture** (dependencies point inward):

```
handler → service → repository → domain
 (HTTP)   (business)   (data)     (entities + interfaces)
```

- `domain` holds entities and the `MenuRepository` interface (no framework imports).
- `service` owns business rules: validation, **circular-reference prevention**,
  transactions, and recursive **tree building**.
- `repository` is the GORM implementation of the domain interface.
- `handler` binds/validates DTOs and formats the standard response envelope.

**Frontend — feature-organized**:

```
services (axios) → stores (zustand) → components
```

UI never calls Axios directly; it goes through the store so caching, optimistic
expand/select and error handling stay centralized.

## Folder Structure

```
CRUD_operations/
├── backend/
│   ├── cmd/api/            # entrypoint (config→logger→db→migrate→serve)
│   ├── configs/            # Viper loader
│   ├── docs/               # generated Swagger (docs.go, swagger.json/yaml)
│   ├── internal/
│   │   ├── domain/         # Menu entity + repository interface
│   │   ├── dto/            # request/response structs
│   │   ├── repository/     # GORM implementation
│   │   ├── service/        # business logic + tree builder
│   │   ├── handler/        # Gin handlers (+ Swagger annotations)
│   │   ├── middleware/     # CORS
│   │   ├── validator/      # go-playground wrapper
│   │   └── errors/         # typed sentinel errors
│   ├── pkg/                # database, logger, response
│   ├── routes/             # route registration
│   ├── Dockerfile          # production multi-stage
│   ├── Dockerfile.dev      # dev (Air hot reload)
│   └── .air.toml
├── frontend/
│   ├── app/                # App Router pages + layout
│   ├── components/         # menu-tree, menu-node, modal, ui
│   ├── stores/             # zustand (menu + ui)
│   ├── services/           # axios API client
│   ├── lib/                # tree utils, axios, errors
│   ├── types/              # Menu, ApiResponse<T>
│   ├── Dockerfile          # production multi-stage (standalone)
│   └── Dockerfile.dev
├── docs/screenshots/
├── docker-compose.yml       # dev
├── docker-compose.prod.yml  # production
└── .env.example
```

## Database Schema

`menus` (self-referencing tree):

| Column     | Type         | Notes |
| ---------- | ------------ | ----- |
| id         | UUID PK      | `gen_random_uuid()` (pgcrypto) |
| title      | varchar(255) | not null |
| slug       | varchar(255) | not null (auto-derived from title) |
| icon       | varchar(100) | |
| parent_id  | UUID NULL    | FK → `menus.id`, **ON DELETE CASCADE** |
| position   | int          | sibling ordering |
| created_at | timestamp    | |
| updated_at | timestamp    | |

Schema is applied via **GORM AutoMigrate** on startup (ensures `pgcrypto` first).

## API Documentation

Interactive Swagger UI (when the backend is running):

```
http://localhost:8080/swagger/index.html
```

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET    | `/api/menus`            | Tree (optional `?search=`) |
| GET    | `/api/menus/:id`        | Single menu |
| POST   | `/api/menus`            | Create |
| PUT    | `/api/menus/:id`        | Update |
| DELETE | `/api/menus/:id`        | Delete (cascade) |
| PATCH  | `/api/menus/:id/move`   | Move to new parent/position |
| PATCH  | `/api/menus/:id/reorder`| Reorder among siblings |

Regenerate docs after changing annotations:

```bash
cd backend && swag init -g cmd/api/main.go -o docs
```

## Environment Variables

**Backend** (`backend/.env.example`): `APP_ENV`, `APP_PORT`, `DB_HOST`, `DB_PORT`,
`DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSLMODE`, `LOG_LEVEL`, `CORS_ALLOWED_ORIGINS`.

**Frontend** (`frontend/.env.example`): `NEXT_PUBLIC_API_URL`.

**Docker** (root `.env.example`): `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`,
`NEXT_PUBLIC_API_URL`, `CORS_ALLOWED_ORIGINS`.

## Development Setup

Prerequisites: Go 1.25+, Node 20+, PostgreSQL 14+ (or Docker).

```bash
git clone <repo> && cd CRUD_operations
```

### Running Backend

```bash
cd backend
cp .env.example .env          # set DB_PASSWORD etc.
createdb menu_tree            # or use your existing DB
go run ./cmd/api              # boots, migrates, listens on :8080
curl http://localhost:8080/health
```

### Running Frontend

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:8080/api
npm install
npm run dev                   # http://localhost:3000
```

## Docker Setup

### Running Docker (development, hot reload)

```bash
cp .env.example .env
docker compose up --build
# frontend → http://localhost:3000
# backend  → http://localhost:8080  (Swagger at /swagger/index.html)
# postgres → localhost:5432 (named volume "postgres-data")
```

Source is bind-mounted; the backend hot-reloads via Air and the frontend via Next.

## Production Setup

```bash
cp .env.example .env          # set strong DB_PASSWORD, real CORS/API URLs
docker compose -f docker-compose.prod.yml up --build -d
```

Production uses **multi-stage builds** (tiny static Go binary; Next.js standalone
output), `restart: unless-stopped`, and health checks. The database persists in the
`postgres-data` named volume.

## API Examples

```bash
# Create a root menu
curl -X POST localhost:8080/api/menus -H 'Content-Type: application/json' \
  -d '{"title":"system management"}'

# Create a child
curl -X POST localhost:8080/api/menus -H 'Content-Type: application/json' \
  -d '{"title":"Systems","parentId":"<ROOT_ID>"}'

# Move under a new parent
curl -X PATCH localhost:8080/api/menus/<ID>/move -H 'Content-Type: application/json' \
  -d '{"parentId":"<NEW_PARENT_ID>","position":0}'

# Reorder
curl -X PATCH localhost:8080/api/menus/<ID>/reorder -H 'Content-Type: application/json' \
  -d '{"position":2}'
```

Standard response envelope:

```json
{ "success": true, "message": "menu created successfully", "data": { } }
```

## Testing

Backend (pure unit tests run anywhere; integration tests need a DB):

```bash
cd backend
go test ./...                                   # tree-builder + slug unit tests
# Integration (repository + service), serialized to share one DB safely:
export MENU_TEST_DSN="host=localhost port=5432 user=postgres password=postgres dbname=menu_tree_test sslmode=disable"
go test -p 1 ./...
```

Frontend:

```bash
cd frontend
npm test            # Vitest: tree utils + Zustand store
```

## Screenshots

See [`docs/screenshots`](docs/screenshots). Referenced shots: empty state, create
root, create child, edit, delete confirmation, final tree.

## Future Improvements

- Drag-and-drop reordering on the frontend (dnd-kit) backed by the existing
  `/move` and `/reorder` endpoints
- Authentication & per-user menus
- Optimistic UI updates with rollback
- Pagination/virtualization for very large trees
- E2E tests (Playwright) and CI pipeline
```

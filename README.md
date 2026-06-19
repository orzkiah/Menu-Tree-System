# Menu Tree System

A production-ready fullstack application implementing a **hierarchical menu tree** with full CRUD
operations, unlimited nesting depth, and drag-and-drop reordering/reparenting.

> 🚧 Built in phases. This README is a stub — the full documentation (installation, API reference,
> schema, screenshots) is finalized in Phase 12.

## Tech Stack

| Layer    | Technology                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Backend  | Go, Gin, GORM, PostgreSQL, Swagger, go-playground/validator, Viper, Zap    |
| Frontend | Next.js (App Router), TypeScript, TailwindCSS, Zustand, TanStack Query, Axios, dnd-kit, Lucide, Sonner |
| DevOps   | Docker, Docker Compose                                                      |

## Architecture

- **Backend** follows Clean Architecture: `handler → service → repository → domain`.
- **Frontend** is feature-organized: `services → hooks → stores → components`.

```
CRUD_operations/
├── backend/     # Go API (Clean Architecture)
├── frontend/    # Next.js App Router UI
└── docker-compose.yml
```

## Status

- [x] Phase 1 — Project architecture & folder structure
- [ ] Phase 2 — Database schema & migrations
- [ ] Phase 3 — Backend setup
- [ ] Phase 4 — CRUD API
- [ ] Phase 5 — Tree generation
- [ ] Phase 6 — Move & reorder endpoints
- [ ] Phase 7 — Frontend initialization
- [ ] Phase 8 — Menu Tree UI
- [ ] Phase 9 — CRUD integration
- [ ] Phase 10 — Drag and drop
- [ ] Phase 11 — Dockerization
- [ ] Phase 12 — Testing, optimization & final docs
